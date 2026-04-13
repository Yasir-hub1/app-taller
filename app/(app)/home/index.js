import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import OsmLeafletMap from '../../../src/components/map/OsmLeafletMap';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Loading from '../../../src/components/ui/Loading';
import { useLocation } from '../../../src/hooks/useLocation';
import { workshopsApi } from '../../../src/api/workshops.api';
import { incidentsApi } from '../../../src/api/incidents.api';
import { useIncidentStore } from '../../../src/store/incident.store';
import { formatDistance } from '../../../src/utils/format';
import { API_BASE_URL } from '../../../src/constants/api';

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const SERVICE_LABELS = {
  battery: 'Bateria',
  tire: 'Llantas',
  towing: 'Grua',
  engine: 'Motor',
  accident: 'Accidente',
  locksmith: 'Cerrajeria',
  general: 'Mecanica general',
};

function mediaUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http')) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function HomeScreen() {
  const { location, loading: loadingLocation, error: locationError } = useLocation();
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const activeIncident = useIncidentStore((state) => state.activeIncident);

  // Obtener talleres cercanos
  const { data: workshops = [], isLoading: loadingWorkshops } = useQuery({
    queryKey: ['nearby-workshops', location?.latitude, location?.longitude],
    queryFn: async () => {
      if (!location) return [];
      const { data } = await workshopsApi.getNearby(location.latitude, location.longitude, 20);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!location,
    select: (rows) => {
      return rows
        .map((w) => {
          const distanceKm = toFiniteNumber(w.distance_km ?? w.distance);
          const lat = toFiniteNumber(w.latitude);
          const lng = toFiniteNumber(w.longitude);
          return {
            ...w,
            latitude: lat ?? w.latitude,
            longitude: lng ?? w.longitude,
            distance_km: distanceKm,
            rating_avg: toFiniteNumber(w.rating_avg),
            services: Array.isArray(w.services) ? w.services : [],
          };
        })
        .filter((w) => w.latitude != null && w.longitude != null)
        .sort((a, b) => {
          const da = a.distance_km ?? Number.POSITIVE_INFINITY;
          const db = b.distance_km ?? Number.POSITIVE_INFINITY;
          return da - db;
        });
    },
  });

  // Verificar si hay incidente activo
  const { data: activeIncidents } = useQuery({
    queryKey: ['active-incidents'],
    queryFn: async () => {
      const { data } = await incidentsApi.getAll({ status: 'in_progress,assigned,waiting_workshop' });
      return data.results || [];
    },
  });

  useEffect(() => {
    if (activeIncidents && activeIncidents.length > 0) {
      useIncidentStore.getState().setActiveIncident(activeIncidents[0]);
    } else if (activeIncidents && activeIncidents.length === 0) {
      useIncidentStore.getState().setActiveIncident(null);
    }
  }, [activeIncidents]);

  const handleReportEmergency = () => {
    if (!location) {
      Alert.alert(
        'Error',
        'No se pudo obtener tu ubicación. Por favor, activa el GPS.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Guardar ubicación en el store
    useIncidentStore.getState().setDraft({
      draftLatitude: location.latitude,
      draftLongitude: location.longitude,
    });

    router.push('/emergency');
  };

  if (loadingLocation) {
    return <Loading fullScreen message="Obteniendo ubicación..." />;
  }

  if (locationError || !location) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="location-off" size={64} color="#ef4444" />
        <Text className="text-dark-900 font-bold text-xl mt-4 text-center">
          No se pudo obtener tu ubicación
        </Text>
        <Text className="text-dark-600 text-base mt-2 text-center">
          {locationError || 'Por favor, activa el GPS y da permisos a la app'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-dark-100">
        <Text className="text-dark-900 font-bold text-xl">Emergencias Vehiculares</Text>
        <Text className="text-dark-600 text-sm">
          {workshops?.length || 0} talleres encontrados cerca
        </Text>
      </View>

      {/* Banner de incidente activo */}
      {activeIncident && (
        <Card
          onPress={() => router.push(`/emergency/status/${activeIncident.id}`)}
          className="mx-4 mt-3 p-4 bg-amber-50 border-amber-200"
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-amber-500 items-center justify-center mr-3">
              <Ionicons name="alert-circle" size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-dark-900 font-bold">Tienes un incidente en curso</Text>
              <Text className="text-dark-600 text-sm">Toca para ver detalles y estado</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
          </View>
        </Card>
      )}

      {/* Mapa OpenStreetMap (Leaflet + WebView; sin Google Maps / API key) */}
      <View className="flex-1 mt-2">
        <OsmLeafletMap
          style={{ flex: 1 }}
          userLocation={location}
          latitudeDelta={0.05}
          longitudeDelta={0.05}
          circleRadiusMeters={20000}
          workshops={workshops}
          onWorkshopPress={(id) => {
            const ws = workshops.find((w) => w.id === id);
            if (ws) setSelectedWorkshop(ws);
          }}
        />
      </View>

      {/* Botones de acción */}
      <View className="px-4 py-4 bg-white border-t border-dark-100">
        <Button
          title="🚨 REPORTAR EMERGENCIA"
          onPress={handleReportEmergency}
          variant="primary"
          size="lg"
          full
          className="mb-3"
        />
        <Button
          title="Buscar Taller Cercano"
          onPress={() => {
            Toast.show({
              type: 'info',
              text1: 'Talleres',
              text2: `${workshops.length || 0} talleres disponibles`,
            });
          }}
          variant="outline"
          size="md"
          full
          icon="search"
        />
      </View>

      {/* Bottom sheet para taller seleccionado */}
      {selectedWorkshop && (
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg px-4 py-4">
          {(() => {
            const ratingValue = selectedWorkshop.rating_avg;
            const distanceValue = selectedWorkshop.distance_km;
            const logoUri = mediaUrl(selectedWorkshop.logo);
            const serviceLabels = selectedWorkshop.services
              .map((s) => SERVICE_LABELS[s] || s)
              .slice(0, 4);
            return (
              <>
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 flex-row">
              <View className="w-14 h-14 rounded-xl bg-slate-100 items-center justify-center mr-3 overflow-hidden">
                {logoUri ? (
                  <Image source={{ uri: logoUri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Ionicons name="construct" size={22} color="#475569" />
                )}
              </View>
              <View className="flex-1">
              <Text className="text-dark-900 font-bold text-lg">{selectedWorkshop.name}</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text className="text-dark-700 ml-1 mr-3">
                  {ratingValue != null ? ratingValue.toFixed(1) : 'N/A'}
                </Text>
                <Ionicons name="location" size={16} color="#64748b" />
                <Text className="text-dark-600 ml-1">
                  {distanceValue != null ? formatDistance(distanceValue) : 'Distancia no disponible'}
                </Text>
              </View>
            </View>
            </View>
            <Button
              title="Cerrar"
              onPress={() => setSelectedWorkshop(null)}
              variant="ghost"
              size="sm"
              icon="close"
            />
          </View>

          {selectedWorkshop.description && (
            <Text className="text-dark-600 text-sm mb-3" numberOfLines={2}>
              {selectedWorkshop.description}
            </Text>
          )}

          <Text className="text-dark-900 font-semibold text-sm mb-1">Servicios</Text>
          <Text className="text-dark-600 text-sm mb-3">
            {serviceLabels.length ? serviceLabels.join(' · ') : 'Sin servicios registrados'}
          </Text>

          <View className="flex-row items-center">
            <Ionicons name="call" size={16} color="#64748b" />
            <Text className="text-dark-700 ml-2">{selectedWorkshop.phone}</Text>
          </View>
              </>
            );
          })()}
        </View>
      )}
    </SafeAreaView>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import OsmLocationPickerModal from '../../../src/components/map/OsmLocationPickerModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Loading from '../../../src/components/ui/Loading';
import { vehiclesApi } from '../../../src/api/vehicles.api';
import { incidentsApi } from '../../../src/api/incidents.api';
import { useIncidentStore } from '../../../src/store/incident.store';
import { useLocation } from '../../../src/hooks/useLocation';
import { formatApiError } from '../../../src/utils/apiErrors';
import * as Location from 'expo-location';

function roundCoord(n) {
  return Math.round(Number(n) * 1e7) / 1e7;
}

export default function EmergencyStartScreen() {
  const { location, loading: loadingLocation, error: locationError, requestLocation } =
    useLocation(false);

  useFocusEffect(
    useCallback(() => {
      requestLocation();
    }, [requestLocation])
  );
  /** String por compatibilidad con @react-native-picker/picker (Android/iOS). */
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  /** Ubicación elegida manualmente en el mapa OSM (tiene prioridad sobre GPS / borrador del home) */
  const [manualLocation, setManualLocation] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState('');

  const draftLatitude = useIncidentStore((state) => state.draftLatitude);
  const draftLongitude = useIncidentStore((state) => state.draftLongitude);

  // Obtener vehículos del usuario
  const { data: vehiclesData, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await vehiclesApi.getAll();
      return data;
    },
  });

  const vehicles = vehiclesData?.results || vehiclesData || [];

  const draftCoords =
    draftLatitude != null && draftLongitude != null
      ? { latitude: draftLatitude, longitude: draftLongitude }
      : null;

  const effectiveLocation =
    manualLocation || location || draftCoords;

  const mapPickerSeed =
    effectiveLocation ||
    draftCoords ||
    location || { latitude: -16.5, longitude: -68.15 };

  useEffect(() => {
    let mounted = true;
    const currentLocation = effectiveLocation;
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      setResolvedAddress('');
      return;
    }

    (async () => {
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
        if (!mounted) return;
        const p = places?.[0];
        if (!p) {
          setResolvedAddress('');
          return;
        }
        const line = [p.street, p.streetNumber].filter(Boolean).join(' ');
        const zone = [p.district, p.city].filter(Boolean).join(', ');
        setResolvedAddress([line, zone].filter(Boolean).join(' · ') || '');
      } catch {
        if (mounted) setResolvedAddress('');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [effectiveLocation]);

  const handleContinue = async () => {
    const vehicleId = parseInt(selectedVehicleId, 10);
    if (!selectedVehicleId || !Number.isFinite(vehicleId)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor selecciona un vehículo',
      });
      return;
    }

    const currentLocation = effectiveLocation;
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Por favor intenta de nuevo.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        vehicle: vehicleId,
        latitude: roundCoord(currentLocation.latitude),
        longitude: roundCoord(currentLocation.longitude),
        description: description || '',
        address_text: resolvedAddress || '',
      };

      const { data } = await incidentsApi.create(payload);
      const incidentId = data?.id ?? data?.pk;
      if (incidentId == null) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2:
            'El servidor no devolvió el id del incidente. Revisa la API o vuelve a intentar.',
        });
        return;
      }

      useIncidentStore.getState().setDraft({
        draftVehicleId: vehicleId,
        draftLatitude: currentLocation.latitude,
        draftLongitude: currentLocation.longitude,
        draftDescription: description,
      });

      useIncidentStore.getState().setActiveIncident({ ...data, id: incidentId });

      Toast.show({
        type: 'success',
        text1: 'Incidente creado',
        text2: 'Ahora agrega evidencias para ayudarnos',
      });

      router.push(`/emergency/evidence/${incidentId}`);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: formatApiError(error.response?.data) || 'Error al crear el incidente',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingVehicles) {
    return <Loading fullScreen message="Cargando vehículos..." />;
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white px-6 justify-center">
        <Text className="text-dark-900 font-bold text-2xl text-center mb-4">
          No tienes vehículos registrados
        </Text>
        <Text className="text-dark-600 text-base text-center mb-6">
          Necesitas registrar al menos un vehículo para reportar una emergencia
        </Text>
        <Button
          title="Agregar Vehículo"
          onPress={() => router.push('/vehicles/add')}
          icon="add-circle"
          full
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-dark-900 font-bold text-2xl mb-2">
          Reportar Emergencia
        </Text>
        <Text className="text-dark-600 text-base mb-6">
          Paso 1: Selecciona tu vehículo y describe el problema
        </Text>

        {/* Ubicación actual */}
        <Card className="p-4 mb-4 bg-primary-50 border-primary-200">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center mr-3">
              <Ionicons name="location" size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-dark-900 font-semibold">Ubicación del incidente</Text>
              {manualLocation ? (
                <Text className="text-dark-600 text-sm">
                  Elegida en mapa ({manualLocation.latitude.toFixed(5)},{' '}
                  {manualLocation.longitude.toFixed(5)})
                </Text>
              ) : loadingLocation ? (
                <Text className="text-dark-600 text-sm">Obteniendo GPS...</Text>
              ) : locationError ? (
                <Text className="text-red-600 text-sm">{locationError}</Text>
              ) : location ? (
                <Text className="text-dark-600 text-sm">
                  GPS ({location.latitude.toFixed(5)}, {location.longitude.toFixed(5)})
                </Text>
              ) : draftCoords ? (
                <Text className="text-dark-600 text-sm">
                  Ubicación del inicio (mapa) — puedes afinar con “Elegir en mapa”
                </Text>
              ) : (
                <Text className="text-amber-700 text-sm">
                  Sin ubicación. Usa el mapa o reintenta el GPS.
                </Text>
              )}
              {resolvedAddress ? (
                <Text className="text-dark-600 text-xs mt-1">
                  {resolvedAddress}
                </Text>
              ) : null}
            </View>
          </View>
          <View className="flex-row flex-wrap gap-2 mt-3">
            <Button
              title="Elegir en mapa"
              onPress={() => {
                if (!mapPickerSeed?.latitude || !mapPickerSeed?.longitude) {
                  Toast.show({
                    type: 'error',
                    text1: 'Sin referencia',
                    text2: 'Activa el GPS o vuelve al inicio para tener una ubicación base',
                  });
                  return;
                }
                setMapPickerOpen(true);
              }}
              variant="primary"
              size="sm"
              icon="map"
              className="flex-1 min-w-[140px]"
            />
            {manualLocation ? (
              <Button
                title="Usar GPS / inicio"
                onPress={() => setManualLocation(null)}
                variant="outline"
                size="sm"
                icon="navigate"
                className="flex-1 min-w-[140px]"
              />
            ) : null}
            {!loadingLocation && (locationError || (!location && !draftCoords)) ? (
              <Button
                title="Reintentar GPS"
                onPress={() => requestLocation()}
                variant="outline"
                size="sm"
                icon="refresh"
                className="flex-1 min-w-[140px]"
              />
            ) : null}
          </View>
        </Card>

        <OsmLocationPickerModal
          visible={mapPickerOpen}
          onClose={() => setMapPickerOpen(false)}
          initialLatitude={mapPickerSeed.latitude}
          initialLongitude={mapPickerSeed.longitude}
          onConfirm={(coords) => {
            setManualLocation(coords);
            useIncidentStore.getState().setDraft({
              draftLatitude: coords.latitude,
              draftLongitude: coords.longitude,
            });
            Toast.show({
              type: 'success',
              text1: 'Ubicación actualizada',
              text2: 'Se usará el punto elegido en el mapa',
            });
          }}
        />

        {/* Selector de vehículo */}
        <Text className="text-dark-700 font-semibold mb-2 text-sm">
          Selecciona tu vehículo *
        </Text>
        <View className="bg-dark-50 rounded-xl border border-dark-200 mb-4">
          <Picker
            selectedValue={selectedVehicleId}
            onValueChange={(value) => setSelectedVehicleId(value)}
            style={{ height: 50 }}
          >
            <Picker.Item label="-- Selecciona un vehículo --" value="" />
            {vehicles.map((vehicle) => (
              <Picker.Item
                key={vehicle.id}
                label={`${vehicle.brand} ${vehicle.model} (${vehicle.plate})`}
                value={String(vehicle.id)}
              />
            ))}
          </Picker>
        </View>

        <Button
          title="+ Agregar nuevo vehículo"
          onPress={() => router.push('/vehicles/add')}
          variant="ghost"
          size="sm"
          className="mb-4"
        />

        {/* Descripción opcional */}
        <Input
          label="Descripción del problema (opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Ej: El motor no enciende, escucho ruidos extraños..."
          multiline
          numberOfLines={4}
        />

        <Text className="text-dark-500 text-xs mb-6">
          💡 En el siguiente paso podrás agregar fotos y audio para ayudarnos a entender mejor tu problema
        </Text>

        <Button
          title="Continuar →"
          onPress={handleContinue}
          loading={loading}
          full
          size="lg"
          icon="arrow-forward"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

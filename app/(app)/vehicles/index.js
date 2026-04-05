import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { vehiclesApi } from '../../../src/api/vehicles.api';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import Loading from '../../../src/components/ui/Loading';
import Badge from '../../../src/components/ui/Badge';
import { normalizeListResponse } from '../../../src/utils/apiList';
import { resolveMediaUrl } from '../../../src/utils/media';

export default function VehiclesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await vehiclesApi.getAll();
      return normalizeListResponse(data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => vehiclesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      Toast.show({
        type: 'success',
        text1: 'Vehículo eliminado',
        text2: 'El vehículo ha sido eliminado correctamente',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Error al eliminar el vehículo',
      });
    },
  });

  const vehicles = Array.isArray(data) ? data : [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (vehicle) => {
    Alert.alert(
      'Eliminar Vehículo',
      `¿Estás seguro de que deseas eliminar ${vehicle.brand} ${vehicle.model}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(vehicle.id),
        },
      ]
    );
  };

  const getVehicleIcon = (type) => {
    const icons = {
      car: 'car',
      motorcycle: 'bicycle',
      truck: 'bus',
      van: 'car-sport',
      bus: 'bus',
    };
    return icons[type] || 'car';
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-dark-100">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-dark-900 font-bold text-xl">Mis Vehículos</Text>
            <Text className="text-dark-600 text-sm">{vehicles.length} vehículos registrados</Text>
          </View>
          <Button
            title="Agregar"
            onPress={() => router.push('/vehicles/add')}
            variant="primary"
            size="sm"
            icon="add"
          />
        </View>
      </View>

      {/* Lista de vehículos */}
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ef4444']} />
        }
      >
        {isLoading ? (
          <Loading message="Cargando vehículos..." />
        ) : vehicles.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="car-outline" size={64} color="#cbd5e1" />
            <Text className="text-dark-600 text-base mt-4 text-center">
              No tienes vehículos registrados
            </Text>
            <Button
              title="Agregar mi primer vehículo"
              onPress={() => router.push('/vehicles/add')}
              variant="primary"
              size="md"
              icon="add-circle"
              className="mt-4"
            />
          </View>
        ) : (
          vehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              onPress={() => router.push(`/vehicles/${vehicle.id}`)}
              className="p-4 mb-3"
            >
              <View className="flex-row items-start">
                {resolveMediaUrl(vehicle.photo) ? (
                  <Image
                    source={{ uri: resolveMediaUrl(vehicle.photo) }}
                    className="w-14 h-14 rounded-xl bg-dark-100 mr-3"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-xl bg-primary-100 items-center justify-center mr-3">
                    <Ionicons name={getVehicleIcon(vehicle.vehicle_type)} size={28} color="#ef4444" />
                  </View>
                )}

                <View className="flex-1">
                  <Text className="text-dark-900 font-bold text-base">
                    {vehicle.brand} {vehicle.model}
                  </Text>
                  <Text className="text-dark-600 text-sm mt-1">
                    {vehicle.year} • {vehicle.color}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Badge
                      label={vehicle.plate}
                      variant="default"
                      size="sm"
                      icon="clipboard"
                    />
                    {vehicle.is_active && (
                      <Badge
                        label="Activo"
                        variant="success"
                        size="sm"
                        className="ml-2"
                      />
                    )}
                  </View>
                </View>

                <Button
                  title=""
                  onPress={() => handleDelete(vehicle)}
                  variant="ghost"
                  size="sm"
                  icon="trash"
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

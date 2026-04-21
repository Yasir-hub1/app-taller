import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { incidentsApi } from '../../../src/api/incidents.api';
import IncidentCard from '../../../src/components/incident/IncidentCard';
import Loading from '../../../src/components/ui/Loading';
import Button from '../../../src/components/ui/Button';
import { normalizeListResponse } from '../../../src/utils/apiList';

/** Coinciden con IncidentStatus en Django (apps.incidents.models). */
const STATUS_ACTIVE =
  'pending,analyzing,waiting_workshop,assigned,in_progress';

export default function RequestsScreen() {
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['incidents', filter],
    queryFn: async () => {
      const statusByFilter = {
        active: STATUS_ACTIVE,
        completed: 'completed',
        cancelled: 'cancelled',
      };
      const params =
        filter !== 'all' && statusByFilter[filter]
          ? { status: statusByFilter[filter] }
          : {};
      const { data } = await incidentsApi.getAll(params);
      return normalizeListResponse(data);
    },
  });

  const incidents = Array.isArray(data) ? data : [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filters = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'completed', label: 'Completados' },
    { value: 'cancelled', label: 'Cancelados' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-dark-100">
        <Text className="text-dark-900 font-bold text-xl mb-3">Mis Solicitudes</Text>

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {filters.map((f) => (
              <Button
                key={f.value}
                title={f.label}
                onPress={() => setFilter(f.value)}
                variant={filter === f.value ? 'primary' : 'ghost'}
                size="sm"
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Lista de incidentes */}
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ef4444']} />
        }
      >
        {isLoading ? (
          <Loading message="Cargando solicitudes..." />
        ) : incidents.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            <Text className="text-dark-600 text-base mt-4 text-center">
              No tienes solicitudes todavía
            </Text>
          </View>
        ) : (
          incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onPress={() => router.push(`/requests/${incident.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

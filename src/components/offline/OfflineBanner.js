import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OfflineBanner({
  online,
  pendingCount = 0,
  syncing = false,
  lastSyncError,
  onRetrySync,
}) {
  if (online && pendingCount === 0 && !lastSyncError) return null;

  const offline = !online;
  const bg = offline ? 'bg-amber-100 border-amber-300' : 'bg-sky-100 border-sky-300';
  const icon = offline ? 'cloud-offline' : syncing ? 'sync' : pendingCount > 0 ? 'time' : 'warning';
  const title = offline
    ? 'Sin conexión'
    : syncing
      ? 'Sincronizando…'
      : pendingCount > 0
        ? `${pendingCount} emergencia(s) pendiente(s) de envío`
        : 'Error de sincronización';

  const sub = offline
    ? 'Tu emergencia se guardará en el dispositivo y se enviará al recuperar internet.'
    : lastSyncError
      ? lastSyncError
      : pendingCount > 0
        ? 'Se enviarán automáticamente cuando haya red estable.'
        : '';

  return (
    <View className={`mx-4 mt-2 mb-1 p-3 rounded-xl border ${bg}`}>
      <View className="flex-row items-start">
        <Ionicons name={icon} size={22} color={offline ? '#b45309' : '#0369a1'} style={{ marginRight: 8 }} />
        <View className="flex-1">
          <Text className="text-dark-900 font-semibold text-sm">{title}</Text>
          {sub ? <Text className="text-dark-600 text-xs mt-1">{sub}</Text> : null}
          {online && (pendingCount > 0 || lastSyncError) && onRetrySync ? (
            <Pressable onPress={onRetrySync} className="mt-2">
              <Text className="text-primary-600 font-semibold text-xs">Reintentar sincronización</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

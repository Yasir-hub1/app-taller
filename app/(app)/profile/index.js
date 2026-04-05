import React, { useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/store/auth.store';
import { authApi } from '../../../src/api/auth.api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      authApi
        .getProfile()
        .then(({ data }) => {
          if (!cancelled) updateUser(data);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [updateUser])
  );

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person',
      title: 'Editar perfil',
      subtitle: 'Nombre, teléfono, dirección y contacto de emergencia',
      onPress: () => router.push('/profile/edit'),
    },
    {
      icon: 'lock-closed',
      title: 'Cambiar contraseña',
      subtitle: 'Actualiza tu contraseña de acceso',
      onPress: () => router.push('/profile/change-password'),
    },
    {
      icon: 'notifications',
      title: 'Notificaciones',
      subtitle: 'Preferencias (próximamente)',
      onPress: () =>
        Toast.show({
          type: 'info',
          text1: 'Próximamente',
          text2: 'Podrás configurar alertas desde aquí',
        }),
    },
    {
      icon: 'help-circle',
      title: 'Ayuda',
      subtitle: 'Soporte y preguntas frecuentes',
      onPress: () =>
        Toast.show({
          type: 'info',
          text1: 'Ayuda',
          text2: 'Contacta a soporte por los canales oficiales de tu servicio',
        }),
    },
  ];

  const cp = user?.client_profile;
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.username || 'Usuario';

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="items-center py-8 px-4 bg-white border-b border-dark-100">
          <View className="w-24 h-24 rounded-full bg-primary-600 items-center justify-center mb-4">
            <Text className="text-white text-4xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-dark-900 font-bold text-2xl text-center">{displayName}</Text>
          <Text className="text-dark-600 text-base mt-1">{user?.email}</Text>
          <Text className="text-dark-500 text-sm mt-1">@{user?.username}</Text>
        </View>

        <View className="px-4 py-4">
          <Text className="text-dark-800 font-semibold text-sm mb-2 px-1">Resumen de cuenta</Text>
          <Card className="p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="call-outline" size={20} color="#64748b" />
              <Text className="text-dark-700 ml-3 flex-1">{user?.phone || 'Sin teléfono'}</Text>
            </View>
            <View className="flex-row items-start mb-3">
              <Ionicons name="location-outline" size={20} color="#64748b" style={{ marginTop: 2 }} />
              <Text className="text-dark-700 ml-3 flex-1">
                {cp?.address?.trim() ? cp.address : 'Sin dirección registrada'}
              </Text>
            </View>
            {(cp?.emergency_contact_name || cp?.emergency_contact_phone) && (
              <View className="pt-3 border-t border-dark-100">
                <Text className="text-dark-500 text-xs font-semibold mb-2">Emergencias</Text>
                <Text className="text-dark-700 text-sm">
                  {cp.emergency_contact_name || '—'}
                  {cp.emergency_contact_phone ? ` · ${cp.emergency_contact_phone}` : ''}
                </Text>
              </View>
            )}
          </Card>

          <Text className="text-dark-800 font-semibold text-sm mb-2 px-1">Cuenta y seguridad</Text>
          {menuItems.map((item, index) => (
            <Card
              key={index}
              onPress={item.onPress}
              className="p-4 mb-2 flex-row items-center active:bg-dark-50"
            >
              <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center mr-3">
                <Ionicons name={item.icon} size={20} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-dark-900 font-semibold">{item.title}</Text>
                <Text className="text-dark-500 text-sm">{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </Card>
          ))}

          <Card className="p-4 mt-2 flex-row items-center">
            <Ionicons name="information-circle-outline" size={22} color="#64748b" />
            <Text className="text-dark-600 text-sm ml-3 flex-1">Versión 1.0.0</Text>
          </Card>

          <Button
            title="Cerrar sesión"
            onPress={handleLogout}
            variant="danger"
            size="lg"
            full
            icon="log-out"
            className="mt-6"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

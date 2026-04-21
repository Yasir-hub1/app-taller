import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/auth.store';
import Loading from '../../src/components/ui/Loading';

export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return <Loading fullScreen message="Cargando..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === 'technician') {
    return <Redirect href="/(technician)" />;
  }

  const tabPadBottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ef4444',
        tabBarInactiveTintColor: '#64748b',
        /** Oculta la barra al abrir el teclado (listener nativo en @react-navigation/bottom-tabs). */
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          minHeight: 52,
          height: 52 + tabPadBottom,
          paddingBottom: tabPadBottom,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="emergency/index"
        options={{
          title: 'Emergencia',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="warning" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Solicitudes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehículos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      {/* Rutas apiladas: no mostrar en la barra de pestañas */}
      <Tabs.Screen name="emergency/evidence/[id]" options={{ href: null }} />
      <Tabs.Screen name="emergency/status/[id]" options={{ href: null }} />
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
      <Tabs.Screen name="profile/change-password" options={{ href: null }} />
    </Tabs>
  );
}

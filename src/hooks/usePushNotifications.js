import { useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { authApi } from '../api/auth.api';
import { useNotificationStore } from '../store/notification.store';

// Expo Go no incluye el cliente FCM nativo; hace falta dev build (expo run:android).
const isExpoGo = Constants.appOwnership === 'expo';

const EAS_PROJECT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveExpoProjectId() {
  const id =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
  return typeof id === 'string' && EAS_PROJECT_ID_RE.test(id) ? id : null;
}

// Solo configurar el handler si NO estamos en Expo Go
if (!isExpoGo) {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export function usePushNotifications() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const incrementUnread = useNotificationStore((state) => state.incrementUnread);

  useEffect(() => {
    // Si estamos en Expo Go, no hacer nada
    if (isExpoGo) {
      console.warn('⚠️ Push notifications no disponibles en Expo Go. Usa: npx expo run:android');
      return;
    }

    const Notifications = require('expo-notifications');

    registerForPushNotifications(Notifications);

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      incrementUnread();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
    });

    return () => {
      // expo-notifications ≥50: add*Listener devuelve EventSubscription con .remove()
      // (removeNotificationSubscription está deprecado / eliminado)
      notificationListener.current?.remove?.();
      responseListener.current?.remove?.();
    };
  }, []);

  const registerForPushNotifications = async (Notifications) => {
    if (!Device.isDevice) {
      console.warn('Push notifications solo funcionan en dispositivos físicos');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permisos de notificaciones denegados');
        return;
      }

      const projectId = resolveExpoProjectId();
      if (!projectId) {
        console.warn(
          'Push: configura extra.eas.projectId en app.json con el UUID de `eas init` (no uses el slug del proyecto).'
        );
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

      const token = tokenData.data;

      await authApi.updateFcmToken(token).catch((error) => {
        console.error('Error actualizando FCM token:', error);
      });

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#ef4444',
        });
      }
    } catch (error) {
      console.error('Error registrando notificaciones:', error);
    }
  };

  return null;
}
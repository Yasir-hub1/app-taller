import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from 'expo-audio';
import { useAudioRecorder } from '../../../../src/hooks/useAudioRecorder';
import Button from '../../../../src/components/ui/Button';
import Card from '../../../../src/components/ui/Card';
import { incidentsApi } from '../../../../src/api/incidents.api';
import { useIncidentStore } from '../../../../src/store/incident.store';
import { formatApiError } from '../../../../src/utils/apiErrors';
import { resolveIncidentId } from '../../../../src/utils/incidentRoute';

function extFromUri(uri) {
  const base = (uri || '').split('/').pop() || '';
  return base.split('?')[0].split('.').pop() || '';
}

function imageMime(ext) {
  const e = (ext || '').toLowerCase();
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'png') return 'image/png';
  if (e === 'webp') return 'image/webp';
  if (e === 'heic' || e === 'heif') return 'image/heic';
  return `image/${e || 'jpeg'}`;
}

function audioMime(ext) {
  const e = (ext || '').toLowerCase();
  if (e === 'm4a' || e === 'mp4' || e === 'caf') return 'audio/mp4';
  if (e === 'aac') return 'audio/aac';
  if (e === 'wav') return 'audio/wav';
  if (e === 'webm') return 'audio/webm';
  return `audio/${e || 'mpeg'}`;
}

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function LocalAudioPreview({ uri }) {
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);

  const togglePlayback = async () => {
    if (!uri) return;
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {
      /* ignore */
    }
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  if (!uri) return null;

  return (
    <View className="mt-4 w-full">
      <Text className="text-dark-600 text-xs text-center mb-2">
        {status.isLoaded
          ? `${formatTime(status.currentTime)} / ${formatTime(status.duration)}`
          : 'Cargando audio…'}
      </Text>
      <Button
        title={status.playing ? 'Pausa' : 'Escuchar grabación'}
        onPress={togglePlayback}
        variant="primary"
        size="md"
        icon={status.playing ? 'pause' : 'play'}
        full
      />
    </View>
  );
}

export default function EvidenceScreen() {
  const { id: routeId } = useLocalSearchParams();
  const activeIncidentId = useIncidentStore((s) => s.activeIncidentId);
  const activeIncident = useIncidentStore((s) => s.activeIncident);
  const incidentId = resolveIncidentId(routeId, activeIncidentId, activeIncident);

  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const {
    isRecording,
    audioUri,
    startRecording: micStart,
    stopRecording: micStop,
    clearAudio,
  } = useAudioRecorder();

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0]]);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      allowsEditing: false,
    });

    if (!result.canceled) {
      setPhotos([...photos, ...result.assets]);
    }
  };

  const startRecording = async () => {
    const result = await micStart();
    if (!result.success) {
      Alert.alert(
        'Permiso requerido',
        result.error?.includes('denegado')
          ? 'Necesitamos acceso al micrófono para grabar audio.'
          : result.error || 'No se pudo iniciar la grabación'
      );
    }
  };

  const stopRecording = async () => {
    const result = await micStop();
    if (!result.ok) {
      Alert.alert('Error', 'No se pudo detener la grabación');
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!incidentId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se encontró el id del incidente. Vuelve a crear el reporte.',
      });
      return;
    }
    if (photos.length === 0 && !audioUri) {
      Toast.show({
        type: 'error',
        text1: 'Evidencia requerida',
        text2: 'Por favor agrega al menos una foto o grabación de audio',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      photos.forEach((photo, index) => {
        const ext = extFromUri(photo.uri);
        formData.append('photos', {
          uri: photo.uri,
          name: `photo_${index}.${ext || 'jpg'}`,
          type: imageMime(ext),
        });
      });

      if (audioUri) {
        const ext = extFromUri(audioUri);
        formData.append('audio', {
          uri: audioUri,
          name: `audio.${ext || 'm4a'}`,
          type: audioMime(ext),
        });
      }

      await incidentsApi.uploadEvidence(incidentId, formData);

      Toast.show({
        type: 'success',
        text1: 'Evidencia agregada',
        text2: 'Tu incidente está siendo analizado',
      });

      router.replace(`/emergency/status/${incidentId}`);
    } catch (error) {
      const aborted = error?.name === 'AbortError';
      const msg = typeof error?.message === 'string' ? error.message : '';
      const isNetwork =
        aborted ||
        error?.code === 'ERR_NETWORK' ||
        msg === 'Network Error' ||
        msg.includes('Network request failed') ||
        !error?.response;
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: isNetwork
          ? 'No se pudo conectar al servidor. Revisa la IP (EXPO_PUBLIC_API_URL / extra.apiUrl), Wi‑Fi y que el backend escuche en 0.0.0.0.'
          : formatApiError(error.response?.data) || 'Error al subir evidencias',
      });
    } finally {
      setUploading(false);
    }
  };

  const skipEvidence = () => {
    Alert.alert(
      'Omitir Evidencias',
      '¿Estás seguro? Agregar fotos y audio nos ayuda a diagnosticar mejor el problema.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Omitir',
          onPress: () =>
            incidentId
              ? router.replace(`/emergency/status/${incidentId}`)
              : router.replace('/emergency'),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-dark-900 font-bold text-2xl mb-2">
          Agregar Evidencias
        </Text>
        <Text className="text-dark-600 text-base mb-6">
          Paso 2: Toma fotos del daño y describe el problema en audio
        </Text>

        <Text className="text-dark-700 font-semibold mb-3 text-sm">
          Fotos del vehículo ({photos.length})
        </Text>

        <View className="flex-row flex-wrap mb-4">
          {photos.map((photo, index) => (
            <View key={index} className="w-1/3 p-1">
              <Image
                source={{ uri: photo.uri }}
                className="w-full h-24 rounded-lg"
              />
              <Button
                title=""
                onPress={() => removePhoto(index)}
                variant="danger"
                size="sm"
                icon="close-circle"
                className="absolute top-2 right-2"
              />
            </View>
          ))}
        </View>

        <View className="flex-row gap-2 mb-6">
          <Button
            title="Tomar Foto"
            onPress={takePhoto}
            variant="outline"
            size="md"
            icon="camera"
            className="flex-1"
          />
          <Button
            title="Galería"
            onPress={pickImage}
            variant="outline"
            size="md"
            icon="images"
            className="flex-1"
          />
        </View>

        <Text className="text-dark-700 font-semibold mb-3 text-sm">
          Audio descripción {audioUri && '✓'}
        </Text>

        <Card className="p-4 mb-6">
          <View className="items-center">
            {isRecording ? (
              <>
                <View className="w-16 h-16 rounded-full bg-red-500 items-center justify-center mb-3 animate-pulse">
                  <Ionicons name="mic" size={32} color="#fff" />
                </View>
                <Text className="text-dark-700 font-semibold mb-3">
                  Grabando...
                </Text>
                <Button
                  title="Detener Grabación"
                  onPress={stopRecording}
                  variant="danger"
                  size="md"
                  icon="stop-circle"
                />
              </>
            ) : audioUri ? (
              <>
                <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                <Text className="text-dark-700 font-semibold mt-3 mb-3">
                  Audio grabado correctamente
                </Text>
                <LocalAudioPreview uri={audioUri} />
                <Button
                  title="Grabar de nuevo"
                  onPress={() => {
                    clearAudio();
                    startRecording();
                  }}
                  variant="outline"
                  size="sm"
                  icon="refresh"
                  className="mt-4"
                />
              </>
            ) : (
              <>
                <Ionicons name="mic-circle" size={48} color="#64748b" />
                <Text className="text-dark-600 text-sm text-center mt-3 mb-3">
                  Describe el problema con tus palabras. Esto nos ayuda a entender mejor la situación.
                </Text>
                <Button
                  title="Iniciar Grabación"
                  onPress={startRecording}
                  variant="primary"
                  size="md"
                  icon="mic"
                />
              </>
            )}
          </View>
        </Card>

        <Text className="text-dark-500 text-xs mb-6">
          💡 Las fotos y audio nos ayudan a identificar el problema más rápido y encontrar el taller adecuado
        </Text>

        <Button
          title="Continuar →"
          onPress={handleSubmit}
          loading={uploading}
          full
          size="lg"
          icon="arrow-forward"
          className="mb-3"
        />

        <Button
          title="Omitir este paso"
          onPress={skipEvidence}
          variant="ghost"
          size="md"
          full
        />
      </ScrollView>
    </SafeAreaView>
  );
}

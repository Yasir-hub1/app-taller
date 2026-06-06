import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import VoiceReportPanel from '../../../src/components/reports/VoiceReportPanel';
import { clientReportsApi } from '../../../src/api/reports.api';

export default function ClientReportsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-dark-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-dark-900 font-bold text-lg flex-1">Mis reportes</Text>
      </View>

      <VoiceReportPanel
        audience="client"
        accentColor="#ef4444"
        title="Consulta por voz o texto"
        description="Pregunta sobre tus emergencias, solicitudes en curso, servicios completados o cuánto has pagado. Solo verás tus propios datos."
        onTextQuery={(text) => clientReportsApi.voiceQueryText(text)}
        onAudioQuery={(formData) => clientReportsApi.voiceQuery(formData)}
      />
    </SafeAreaView>
  );
}

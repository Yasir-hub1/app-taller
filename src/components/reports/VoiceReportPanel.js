import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { formatApiError } from '../../utils/apiErrors';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-BO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatusChips({ items, accent = '#ef4444' }) {
  if (!items?.length) return null;
  return (
    <View className="flex-row flex-wrap gap-2 mb-3">
      {items.map((s) => (
        <View
          key={s.status || s.incident_type}
          className="px-3 py-2 rounded-lg border border-dark-100 bg-white min-w-[46%] flex-1"
          style={{ opacity: s.count === 0 ? 0.5 : 1 }}
        >
          <Text className="text-dark-500 text-xs" numberOfLines={2}>
            {s.status_label || s.type_label || s.status || s.incident_type}
          </Text>
          <Text className="font-bold text-lg mt-1" style={{ color: accent }}>
            {s.count}
          </Text>
        </View>
      ))}
    </View>
  );
}

function KpiGrid({ items, accent = '#ef4444' }) {
  return (
    <View className="flex-row flex-wrap gap-2 mb-4">
      {items.map((k) => (
        <View key={k.label} className="bg-slate-100 rounded-xl px-3 py-2 min-w-[30%] flex-1">
          <Text className="text-dark-500 text-xs">{k.label}</Text>
          <Text className="font-bold text-base mt-1" style={{ color: accent }}>
            {k.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function VoiceReportPanel({
  audience = 'client',
  accentColor = '#ef4444',
  title = 'Reportes por voz',
  description,
  onTextQuery,
  onAudioQuery,
}) {
  const [loading, setLoading] = useState(false);
  const [textQuery, setTextQuery] = useState('');
  const [result, setResult] = useState(null);
  const { isRecording, audioUri, formattedDuration, startRecording, stopRecording, clearAudio } =
    useAudioRecorder();

  const runQuery = async (exec) => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await exec();
      setResult(data);
      if (data?.transcript) setTextQuery(data.transcript);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: formatApiError(err?.response?.data) || err?.message || 'No se pudo procesar',
      });
    } finally {
      setLoading(false);
    }
  };

  const submitText = () => {
    const text = textQuery.trim();
    if (!text) return;
    runQuery(() => onTextQuery(text));
  };

  const handleStopRecording = async () => {
    const { ok, uri } = await stopRecording();
    if (!ok || !uri) {
      Toast.show({ type: 'error', text1: 'Audio', text2: 'No se guardó la grabación' });
      return;
    }
    const formData = new FormData();
    formData.append('audio', {
      uri,
      type: 'audio/m4a',
      name: 'reporte.m4a',
    });
    runQuery(() => onAudioQuery(formData));
    clearAudio();
  };

  const rep = result?.report;
  const narrative = result?.narrative_summary || rep?.summary?.narrative || result?.intent_summary;

  const clientKpis = rep?.kpis
    ? [
        { label: 'Total', value: rep.kpis.incidents_total },
        { label: 'En curso', value: rep.kpis.incidents_active },
        { label: 'Completados', value: rep.kpis.incidents_completed },
        { label: 'Cancelados', value: rep.kpis.incidents_cancelled },
        { label: 'Pagado Bs.', value: rep.kpis.total_spent },
        { label: 'Pagos pend.', value: rep.kpis.pending_payments },
      ]
    : [];

  const techKpis = rep?.kpis
    ? [
        { label: 'Total órdenes', value: rep.kpis.assignments_total },
        { label: 'Activas', value: rep.kpis.active_services },
        { label: 'Completadas', value: rep.kpis.completed_in_period },
        {
          label: 'Llegada prom.',
          value: rep.kpis.avg_arrival_seconds
            ? `${Math.round(rep.kpis.avg_arrival_seconds / 60)} min`
            : '—',
        },
      ]
    : [];

  const statusBreakdown =
    rep?.charts?.incidents_by_status || rep?.charts?.assignments_by_status || [];
  const typeBreakdown = rep?.charts?.incidents_by_type || [];
  const incidentRows = rep?.tables?.recent_incidents || [];
  const assignmentRows = rep?.tables?.recent_assignments || [];

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
      <Card className="p-4 mb-4 mx-4 mt-4">
        <View className="flex-row items-center mb-2">
          <Ionicons name="mic" size={22} color={accentColor} />
          <Text className="text-dark-900 font-bold text-lg ml-2">{title}</Text>
        </View>
        <Text className="text-dark-600 text-sm mb-4">{description}</Text>

        <View className="flex-row flex-wrap gap-2 items-center mb-3">
          {!isRecording ? (
            <Button
              title="Hablar"
              icon="mic"
              onPress={startRecording}
              disabled={loading}
              className="flex-1"
            />
          ) : (
            <Button
              title={`Detener ${formattedDuration}`}
              icon="stop"
              variant="danger"
              onPress={handleStopRecording}
              className="flex-1"
            />
          )}
          {loading && <ActivityIndicator color={accentColor} />}
        </View>

        <View className="flex-row gap-2 items-center">
          <TextInput
            className="flex-1 border border-dark-200 rounded-xl px-3 py-2.5 text-dark-800 bg-white"
            placeholder='Ej: "mis solicitudes completadas" o "órdenes activas"'
            value={textQuery}
            onChangeText={setTextQuery}
            onSubmitEditing={submitText}
            returnKeyType="search"
          />
          <Button title="Buscar" variant="outline" onPress={submitText} disabled={loading} />
        </View>
      </Card>

      {result && rep && (
        <View className="px-4">
          <Card className="p-4 mb-4" style={{ backgroundColor: audience === 'technician' ? '#ecfdf5' : '#fef2f2' }}>
            <Text className="font-semibold text-dark-800 mb-1">Resumen</Text>
            <Text className="text-dark-700 text-sm leading-5">{narrative}</Text>
            <Text className="text-dark-500 text-xs mt-2">
              Entendí: {result.intent_summary}
            </Text>
            {result.filters?.dates_source === 'default_month' &&
            result.filters?.report_focus === 'general' ? (
              <Text className="text-dark-400 text-xs mt-1">
                Sin fechas en tu frase: se muestran todos los registros.
              </Text>
            ) : (
              <Text className="text-dark-400 text-xs mt-1">
                Período: {result.filters?.date_from} — {result.filters?.date_to}
              </Text>
            )}
          </Card>

          <Text className="text-dark-800 font-semibold mb-2">Por estado</Text>
          <StatusChips items={statusBreakdown} accent={accentColor} />

          {typeBreakdown.length > 0 && (
            <>
              <Text className="text-dark-800 font-semibold mb-2">Por tipo</Text>
              <StatusChips items={typeBreakdown} accent={accentColor} />
            </>
          )}

          <KpiGrid items={audience === 'technician' ? techKpis : clientKpis} accent={accentColor} />

          {audience === 'client' && incidentRows.length > 0 && (
            <>
              <Text className="text-dark-800 font-semibold mb-2">
                Mis solicitudes ({incidentRows.length})
              </Text>
              {incidentRows.map((row) => (
                <Card key={row.id} className="p-3 mb-2">
                  <Text className="font-bold text-dark-900">
                    #{row.id} · {row.status_label || row.status}
                  </Text>
                  <Text className="text-dark-600 text-sm mt-1">
                    {row.incident_type_label || row.incident_type} · {row.vehicle_label}
                  </Text>
                  <Text className="text-dark-500 text-xs mt-1">
                    Taller: {row.workshop_name}
                  </Text>
                  {row.total_amount ? (
                    <Text className="text-dark-600 text-xs mt-1">
                      Pago: Bs. {row.total_amount} ({row.payment_status_label || row.payment_status})
                    </Text>
                  ) : null}
                  <Text className="text-dark-400 text-xs mt-1">
                    Creado: {formatDate(row.created_at)}
                  </Text>
                </Card>
              ))}
            </>
          )}

          {audience === 'technician' && assignmentRows.length > 0 && (
            <>
              <Text className="text-dark-800 font-semibold mb-2">
                Mis órdenes ({assignmentRows.length})
              </Text>
              {assignmentRows.map((row) => (
                <Card key={row.id} className="p-3 mb-2">
                  <Text className="font-bold text-dark-900">
                    Inc. #{row.incident_id} · {row.status_label || row.status}
                  </Text>
                  <Text className="text-dark-600 text-sm mt-1">
                    {row.incident_type_label || row.incident_type} · {row.vehicle_label}
                  </Text>
                  <Text className="text-dark-500 text-xs mt-1" numberOfLines={2}>
                    {row.address || 'Sin dirección'}
                  </Text>
                  <Text className="text-dark-400 text-xs mt-1">
                    Oferta: {formatDate(row.offered_at)}
                    {row.completed_at ? ` · Fin: ${formatDate(row.completed_at)}` : ''}
                  </Text>
                </Card>
              ))}
            </>
          )}

          {incidentRows.length === 0 && assignmentRows.length === 0 && (
            <Card className="p-4 mb-4">
              <Text className="text-dark-500 text-center text-sm">
                No hay registros para los filtros aplicados.
              </Text>
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
}

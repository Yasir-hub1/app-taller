import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import Loading from '../../src/components/ui/Loading';
import { paymentsApi } from '../../src/api/payments.api';
import { assignmentsApi } from '../../src/api/assignments.api';

export default function PaymentScreen() {
  const { assignmentId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { confirmPayment } = useStripe();
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const { data } = await assignmentsApi.getById(assignmentId);
      return data;
    },
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: (data) => paymentsApi.createIntent(data),
  });

  const handlePayment = async () => {
    if (!cardComplete) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor completa la información de tu tarjeta',
      });
      return;
    }

    setProcessing(true);

    try {
      // Crear payment intent
      const { data: intentData } = await createPaymentIntentMutation.mutateAsync({
        assignment_id: assignmentId,
      });

      if (!intentData.client_secret) {
        throw new Error('No se pudo crear el intento de pago');
      }

      // Confirmar pago con Stripe
      const { error, paymentIntent } = await confirmPayment(intentData.client_secret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent?.status === 'Succeeded') {
        // Confirmar pago en el backend
        await paymentsApi.confirm(intentData.payment_id);

        Toast.show({
          type: 'success',
          text1: 'Pago exitoso',
          text2: 'Tu pago ha sido procesado correctamente',
        });

        // Invalidar queries y navegar
        queryClient.invalidateQueries(['assignment', assignmentId]);
        queryClient.invalidateQueries(['incidents']);

        router.back();
      }
    } catch (error) {
      Alert.alert(
        'Error en el pago',
        error.message || 'No se pudo procesar el pago. Por favor intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando información del servicio..." />;
  }

  if (!assignment) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text className="text-dark-900 font-bold text-xl mt-4 text-center">
          Servicio no encontrado
        </Text>
        <Button
          title="Volver"
          onPress={() => router.back()}
          variant="primary"
          size="md"
          className="mt-6"
        />
      </SafeAreaView>
    );
  }

  const totalAmount = assignment.estimated_cost || 0;
  const serviceFee = totalAmount * 0.05; // 5% comisión de plataforma
  const finalAmount = totalAmount + serviceFee;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-dark-900 font-bold text-2xl mb-2">
          Pagar Servicio
        </Text>
        <Text className="text-dark-600 text-base mb-6">
          Completa el pago de tu servicio
        </Text>

        {/* Información del taller */}
        {assignment.workshop && (
          <Card className="p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center mr-3">
                <Ionicons name="construct" size={24} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-dark-900 font-bold text-base">
                  {assignment.workshop.name}
                </Text>
                <Text className="text-dark-600 text-sm">
                  Taller
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Resumen del pago */}
        <Card className="p-4 mb-6">
          <Text className="text-dark-900 font-semibold mb-4 text-lg">
            Resumen del Pago
          </Text>

          <View className="flex-row justify-between mb-3">
            <Text className="text-dark-600">Costo del servicio</Text>
            <Text className="text-dark-900 font-semibold">
              Bs. {totalAmount.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-dark-600">Comisión de plataforma (5%)</Text>
            <Text className="text-dark-900 font-semibold">
              Bs. {serviceFee.toFixed(2)}
            </Text>
          </View>

          <View className="border-t border-dark-200 pt-3 mt-3">
            <View className="flex-row justify-between">
              <Text className="text-dark-900 font-bold text-lg">Total</Text>
              <Text className="text-primary-600 font-bold text-xl">
                Bs. {finalAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Formulario de tarjeta */}
        <Text className="text-dark-700 font-semibold mb-3 text-sm">
          Información de la tarjeta
        </Text>

        <View className="bg-dark-50 rounded-xl border border-dark-200 p-4 mb-6">
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={{
              backgroundColor: '#f8fafc',
              textColor: '#0f172a',
              borderColor: '#e2e8f0',
              borderWidth: 1,
              borderRadius: 8,
            }}
            style={{
              width: '100%',
              height: 50,
            }}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
        </View>

        <View className="flex-row items-start bg-blue-50 rounded-lg p-3 mb-6">
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text className="text-dark-700 text-sm ml-2 flex-1">
            Tu pago es procesado de forma segura a través de Stripe. No almacenamos información de tu tarjeta.
          </Text>
        </View>

        <Button
          title={`Pagar Bs. ${finalAmount.toFixed(2)}`}
          onPress={handlePayment}
          loading={processing}
          disabled={!cardComplete}
          full
          size="lg"
          icon="card"
          className="mb-3"
        />

        <Button
          title="Cancelar"
          onPress={() => router.back()}
          variant="ghost"
          size="md"
          full
        />
      </ScrollView>
    </SafeAreaView>
  );
}

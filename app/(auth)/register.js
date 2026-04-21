import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/auth.store';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    password_confirm: '',
  });
  const [loading, setLoading] = useState(false);

  const register = useAuthStore((state) => state.register);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { first_name, last_name, email, phone, username, password, password_confirm } = formData;

    if (!first_name || !last_name || !email || !phone || !username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor completa todos los campos',
      });
      return false;
    }

    if (password !== password_confirm) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Las contraseñas no coinciden',
      });
      return false;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La contraseña debe tener al menos 6 caracteres',
      });
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      username: formData.username,
      password: formData.password,
      password_confirm: formData.password_confirm,
    };

    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Registro exitoso',
        text2: 'Tu cuenta ha sido creada',
      });
      router.replace('/(app)/home');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Error al registrarse',
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 pt-4">
            {/* Header */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center mb-6"
            >
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
              <Text className="text-dark-900 text-lg font-semibold ml-2">Volver</Text>
            </TouchableOpacity>

            <Text className="text-3xl font-bold text-dark-900 mb-2">
              Crear Cuenta
            </Text>
            <Text className="text-dark-600 text-base mb-2">
              Completa tus datos para registrarte como cliente.
            </Text>
            <Text className="text-amber-800 text-sm mb-8 bg-amber-50 border border-amber-200 rounded-lg p-3">
              ¿Eres técnico de taller? No uses este formulario: tu cuenta la crea el administrador o el dueño
              del taller. Inicia sesión desde la pantalla principal.
            </Text>

            {/* Formulario */}
            <Input
              label="Nombre"
              value={formData.first_name}
              onChangeText={(value) => updateField('first_name', value)}
              placeholder="Tu nombre"
              leftIcon="person"
            />

            <Input
              label="Apellido"
              value={formData.last_name}
              onChangeText={(value) => updateField('last_name', value)}
              placeholder="Tu apellido"
              leftIcon="person"
            />

            <Input
              label="Email"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="tu@email.com"
              leftIcon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Teléfono"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="+591 XXXXXXXX"
              leftIcon="call"
              keyboardType="phone-pad"
            />

            <Input
              label="Usuario"
              value={formData.username}
              onChangeText={(value) => updateField('username', value)}
              placeholder="Nombre de usuario"
              leftIcon="at"
              autoCapitalize="none"
            />

            <Input
              label="Contraseña"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              placeholder="Mínimo 6 caracteres"
              leftIcon="lock-closed"
              secureTextEntry
            />

            <Input
              label="Confirmar Contraseña"
              value={formData.password_confirm}
              onChangeText={(value) => updateField('password_confirm', value)}
              placeholder="Repite tu contraseña"
              leftIcon="lock-closed"
              secureTextEntry
            />

            <Button
              title="Registrarse"
              onPress={handleRegister}
              loading={loading}
              full
              size="lg"
              icon="checkmark-circle"
              className="mt-2"
            />

            <View className="mt-6 items-center">
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-dark-600 text-base">
                  ¿Ya tienes cuenta?{' '}
                  <Text className="text-primary-600 font-bold">Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/auth.store';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor completa todos los campos',
      });
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Bienvenido',
        text2: 'Sesión iniciada correctamente',
      });
      const role = useAuthStore.getState().user?.role;
      router.replace(role === 'technician' ? '/(technician)' : '/(app)/home');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Credenciales incorrectas',
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
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 justify-center">
            {/* Logo y título */}
            <View className="items-center mb-10">
              <Image
                source={require('../../assets/logo1.png')}
                style={{ width: 140, height: 140 }}
                resizeMode="contain"
              />
              <Text className="text-3xl font-bold text-dark-900 mt-4">
                Bienvenido
              </Text>
              <Text className="text-dark-600 text-base mt-2">
                Inicia sesión para continuar en AhoringaLlego
              </Text>
            </View>

            {/* Formulario */}
            <View className="mb-6">
              <Input
                label="Usuario o Email"
                value={username}
                onChangeText={setUsername}
                placeholder="Ingresa tu usuario o email"
                leftIcon="person"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu contraseña"
                leftIcon="lock-closed"
                secureTextEntry
              />
            </View>

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
              full
              size="lg"
              icon="log-in"
            />

            {/* Links adicionales */}
            <View className="mt-6 items-center">
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text className="text-dark-600 text-base text-center">
                  ¿Cliente nuevo?{' '}
                  <Text className="text-primary-600 font-bold">Regístrate aquí</Text>
                </Text>
              </TouchableOpacity>
              <Text className="text-dark-500 text-xs text-center mt-3 px-4">
                Personal de taller (técnicos): solo inicio de sesión, sin registro en la app.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

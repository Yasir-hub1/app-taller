import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Loading({ message = 'Cargando...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#ef4444" />
        <Text className="text-dark-600 mt-4 text-base">{message}</Text>
      </View>
    );
  }

  return (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size="large" color="#ef4444" />
      <Text className="text-dark-600 mt-4 text-base">{message}</Text>
    </View>
  );
}

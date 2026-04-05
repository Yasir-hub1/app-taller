import React from 'react';
import { View } from 'react-native';

export default function Card({ children, className = '', onPress, ...props }) {
  const Component = onPress ? require('react-native').TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      className={`
        bg-white rounded-2xl shadow-sm border border-dark-100
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
}

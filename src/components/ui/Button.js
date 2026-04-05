import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  full = false,
  className = '',
}) {
  const baseStyle = 'rounded-xl flex-row items-center justify-center';

  const variantStyles = {
    primary: 'bg-primary-600 active:bg-primary-700',
    secondary: 'bg-dark-600 active:bg-dark-700',
    outline: 'border-2 border-primary-600 bg-transparent active:bg-primary-50',
    ghost: 'bg-transparent active:bg-dark-100',
    danger: 'bg-red-600 active:bg-red-700',
  };

  const sizeStyles = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const textVariantStyles = {
    primary: 'text-white font-bold',
    secondary: 'text-white font-bold',
    outline: 'text-primary-600 font-bold',
    ghost: 'text-dark-700 font-semibold',
    danger: 'text-white font-bold',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`
        ${baseStyle}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${full ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : ''}
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#ef4444' : '#fff'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={size === 'lg' ? 24 : size === 'sm' ? 16 : 20}
              color={variant === 'outline' || variant === 'ghost' ? '#ef4444' : '#fff'}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            className={`
              ${textVariantStyles[variant]}
              ${textSizeStyles[size]}
            `}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={size === 'lg' ? 24 : size === 'sm' ? 16 : 20}
              color={variant === 'outline' || variant === 'ghost' ? '#ef4444' : '#fff'}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { getTheme, shadow } from '../../theme/theme';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}) => {
  const t = getTheme();
  const styles = createStyles(t);

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button[variant];
    const sizeStyle = styles.size[size];
    const widthStyle = fullWidth ? { flex: 1 } : {};
    
    return {
      ...baseStyle,
      ...sizeStyle,
      ...widthStyle,
      opacity: disabled ? t.opacity.disabled : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle = styles.text[variant];
    const sizeTextStyle = styles.textSize[size];
    
    return {
      ...baseTextStyle,
      ...sizeTextStyle,
    };
  };

  return (
    <Pressable
      style={({ pressed }) => [
        getButtonStyle(),
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && <>{icon}</>}
      <Text style={[getTextStyle(), textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
};

const createStyles = (t: any) => StyleSheet.create({
  button: {
    primary: {
      backgroundColor: t.color.primary,
      ...shadow(t, 'e1'),
    },
    accent: {
      backgroundColor: t.color.accent,
      ...shadow(t, 'e1'),
    },
    secondary: {
      backgroundColor: t.color.surface,
      borderWidth: 1,
      borderColor: t.color.outline,
    },
    danger: {
      backgroundColor: t.color.danger,
      ...shadow(t, 'e1'),
    },
  },
  size: {
    small: {
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      borderRadius: t.radius.md,
    },
    medium: {
      paddingVertical: t.spacing.lg,
      paddingHorizontal: t.spacing.xl,
      borderRadius: t.radius.lg,
    },
    large: {
      paddingVertical: t.spacing.xl,
      paddingHorizontal: t.spacing.xxl,
      borderRadius: t.radius.lg,
    },
  },
  text: {
    primary: {
      color: t.color.onPrimary,
      fontSize: 17,
      fontWeight: '600',
    },
    accent: {
      color: t.color.onAccent,
      fontSize: 17,
      fontWeight: '600',
    },
    secondary: {
      color: t.color.text,
      fontSize: 17,
      fontWeight: '600',
    },
    danger: {
      color: t.color.onPrimary,
      fontSize: 17,
      fontWeight: '600',
    },
  },
  textSize: {
    small: {
      fontSize: 15,
    },
    medium: {
      fontSize: 17,
    },
    large: {
      fontSize: 19,
    },
  },
  pressed: {
    opacity: t.opacity.pressed,
    transform: [{ scale: 0.98 }],
  },
});

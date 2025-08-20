import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { getTheme, shadow } from '../../theme/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  margin = 'medium',
  style,
}) => {
  const t = getTheme();
  const styles = createStyles(t);

  const getCardStyle = (): ViewStyle => {
    const baseStyle = styles.card[variant];
    const paddingStyle = styles.padding[padding];
    const marginStyle = styles.margin[margin];
    
    return {
      ...baseStyle,
      ...paddingStyle,
      ...marginStyle,
    };
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};

const createStyles = (t: any) => StyleSheet.create({
  card: {
    default: {
      backgroundColor: t.color.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.color.outline,
    },
    elevated: {
      backgroundColor: t.color.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.color.outline,
      ...shadow(t, 'e2'),
    },
    outlined: {
      backgroundColor: 'transparent',
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.color.outline,
    },
  },
  padding: {
    small: {
      padding: t.spacing.md,
    },
    medium: {
      padding: t.spacing.xl,
    },
    large: {
      padding: t.spacing.xxl,
    },
  },
  margin: {
    none: {
      margin: 0,
    },
    small: {
      margin: t.spacing.sm,
    },
    medium: {
      margin: t.spacing.md,
    },
    large: {
      margin: t.spacing.lg,
    },
  },
});

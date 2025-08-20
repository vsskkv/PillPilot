import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../../theme/theme';
import { Text as ThemedText } from './Text';

interface GradientAppBarProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  variant?: 'primary' | 'accent';
}

export const GradientAppBar: React.FC<GradientAppBarProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  variant = 'primary',
}) => {
  const t = getTheme();

  const getGradientColors = () => {
    if (variant === 'accent') {
      return [t.color.accent, '#FF826F']; // Coral gradient
    }
    return [t.color.primary, '#3BC5BF']; // Teal gradient
  };

  const getTextColor = () => {
    if (variant === 'accent') {
      return t.color.onAccent;
    }
    return t.color.onPrimary;
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        {leftIcon && (
          <TouchableOpacity
            onPress={onLeftPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={leftIcon} size={24} color={getTextColor()} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <ThemedText
            variant="title"
            size="xl"
            style={[styles.title, { color: getTextColor() }]}
          >
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText
              variant="secondary"
              size="small"
              style={[styles.subtitle, { color: getTextColor() }]}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={rightIcon} size={24} color={getTextColor()} />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 60, // Increased from 54 to 60
    paddingBottom: 20, // Increased from 16 to 20
    minHeight: 120, // Added minHeight for better proportions
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24, // Increased from 20 to 24
    minHeight: 60, // Increased from 44 to 60
    justifyContent: 'space-between', // Better distribution
  },
  iconButton: {
    width: 48, // Increased from 44 to 48
    height: 48, // Increased from 44 to 48
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24, // Added border radius for modern look
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle background
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16, // Added horizontal padding
  },
  title: {
    textAlign: 'center',
    fontWeight: '800', // Increased from 700 to 800
    fontSize: 28, // Added explicit fontSize
    letterSpacing: -0.5, // Added letter spacing for modern look
    marginBottom: 4, // Added margin bottom
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 4, // Increased from 2 to 4
    opacity: 0.95, // Increased from 0.9 to 0.95
    fontSize: 16, // Added explicit fontSize
    fontWeight: '500', // Added font weight
    lineHeight: 20, // Added line height
  },
});

import React from 'react';
import { View, StyleSheet, Image, ViewStyle } from 'react-native';

interface AppIconProps {
  size?: 'small' | 'medium' | 'large' | 'xl';
  style?: ViewStyle;
  showBackground?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({ 
  size = 'medium', 
  style,
  showBackground = false 
}) => {
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 32;
      case 'large':
        return 48;
      case 'xl':
        return 64;
      default:
        return 32;
    }
  };

  const iconSize = getIconSize();

  if (showBackground) {
    return (
      <View style={[styles.container, { width: iconSize + 16, height: iconSize + 16 }, style]}>
        <Image
          source={require('../../../assets/PillApp.png')}
          style={[styles.icon, { width: iconSize, height: iconSize }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <Image
      source={require('../../../assets/PillApp.png')}
      style={[styles.icon, { width: iconSize, height: iconSize }, style]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#12A5A2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    // Size will be set dynamically
  },
});

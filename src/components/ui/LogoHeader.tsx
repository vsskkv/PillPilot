import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTheme } from '../../theme/theme';

interface LogoHeaderProps {
  size?: 'small' | 'medium' | 'large';
  showBackground?: boolean;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({ 
  size = 'medium', 
  showBackground = true 
}) => {
  const t = getTheme();

  const getLogoSize = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 48;
      case 'large':
        return 64;
      default:
        return 48;
    }
  };

  const logoSize = getLogoSize();

  if (showBackground) {
    return (
      <LinearGradient
        colors={[t.color.primary, '#3BC5BF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/PillApp.png')}
            style={[styles.logo, { width: logoSize, height: logoSize }]}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('../../../assets/PillApp.png')}
        style={[styles.logo, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Size will be set dynamically
  },
});

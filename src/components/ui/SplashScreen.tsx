import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTheme } from '../../theme/theme';
import { LogoHeader } from './LogoHeader';

interface SplashScreenProps {
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  message = 'Loading PillPilot...' 
}) => {
  const t = getTheme();

  return (
    <LinearGradient
      colors={[t.color.primary, '#3BC5BF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={require('../../../assets/PillApp.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>PillPilot</Text>
        <Text style={styles.tagline}>Smart Medication Management</Text>
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 40,
    textAlign: 'center',
    opacity: 0.8,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
});

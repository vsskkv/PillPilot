import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/theme';
import { Button, Text, AppIcon } from '../components/ui';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const t = getTheme();

  const features = [
    {
      icon: '🌅',
      title: 'Meal-Based Timing',
      description: 'Schedule medications around your breakfast, lunch, dinner, and snack times'
    },
    {
      icon: '⏰',
      title: 'Smart Reminders',
      description: 'Get notifications at the perfect time based on your daily routine'
    },
    {
      icon: '💊',
      title: 'Medication Tracking',
      description: 'Keep track of all your medications, dosages, and timing rules'
    },
    {
      icon: '📱',
      title: 'Beautiful Design',
      description: 'Clean, trustworthy interface designed for medical use'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[t.color.primary, '#3BC5BF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <AppIcon size="xl" />
          <Text style={styles.appName}>PillPilot</Text>
          <Text style={styles.tagline}>Smart Medication Management</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Why PillPilot?</Text>
          
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>{feature.icon}</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaContainer}>
          <Button
            title="Get Started"
            onPress={onGetStarted}
            variant="primary"
            size="large"
            style={styles.ctaButton}
          />
          
          <Text style={styles.disclaimer}>
            PillPilot is for medication reminders only. Always follow your healthcare provider's instructions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F9',
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
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
  content: {
    flex: 1,
  },
  featuresContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F2C33',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8FAF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F2C33',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#495E5D',
    lineHeight: 20,
  },
  ctaContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  ctaButton: {
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: '#7E9796',
    textAlign: 'center',
    lineHeight: 16,
  },
});

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../types/navigation';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Import screens
import NextPillScreen from '../screens/TodayScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';
import AddRegimenScreen from '../screens/AddRegimenScreen';
import AddConstraintsScreen from '../screens/AddConstraintsScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Fallback icon component in case Ionicons fails
function FallbackIcon({ name, size, color }: { name: string; size: number; color: string }) {
  return (
    <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: 'white', fontSize: size * 0.4, fontWeight: 'bold' }}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

// Custom Tab Bar with Pill-shaped Glass Effect
function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <LinearGradient
          colors={['#12A5A2', '#12A5A2', '#3BC5BF', '#3BC5BF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0, 0.45, 0.55, 1]}
          style={styles.tabBar}
        >
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || options.title || route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            let iconName: keyof typeof Ionicons.glyphMap;
            if (route.name === 'NextPill') {
              iconName = 'home';
            } else if (route.name === 'Medications') {
              iconName = 'list';
            } else if (route.name === 'AddMedication') {
              iconName = 'add';
            } else if (route.name === 'Schedule') {
              iconName = 'calendar';
            } else if (route.name === 'Settings') {
              iconName = 'settings';
            } else {
              iconName = 'help';
            }

            console.log(`Route: ${route.name}, Icon: ${iconName}, Focused: ${isFocused}, IconName type: ${typeof iconName}`);

            // Special styling for Add tab
            if (route.name === 'AddMedication') {
              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  style={styles.addTabItem}
                  activeOpacity={0.8}
                >
                  <View style={styles.addTabIcon}>
                    <View style={styles.addTabIconInner}>
                      <Ionicons name="add" size={28} color="#FF6B35" />
                    </View>
                  </View>
                  <Text style={styles.addTabLabel}>{label}</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={[styles.tabItem, isFocused && styles.activeTabItem]}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={iconName} 
                    size={24} 
                    color={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'} 
                  />
                </View>
                <Text style={[styles.tabLabel, isFocused && styles.activeTabLabel]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </BlurView>
    </View>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen 
        name="NextPill" 
        component={NextPillScreen}
        options={{ title: 'Next Pill' }}
      />
      <Tab.Screen 
        name="Medications" 
        component={MedicationsScreen}
        options={{ title: 'Medications' }}
      />
      <Tab.Screen 
        name="AddMedication" 
        component={AddMedicationScreen}
        options={{ title: 'Add' }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{ title: 'Schedule' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen 
          name="AddMedication" 
          component={AddMedicationScreen}
          options={{ 
            headerShown: true, 
            title: 'Add Medication',
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name="MedicationDetail" 
          component={MedicationDetailScreen}
          options={{ 
            headerShown: true, 
            title: 'Medication Details'
          }}
        />
        <Stack.Screen 
          name="AddRegimen" 
          component={AddRegimenScreen}
          options={{ 
            headerShown: true, 
            title: 'Add Regimen',
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name="AddConstraints" 
          component={AddConstraintsScreen}
          options={{ 
            headerShown: true, 
            title: 'Add Constraints',
            presentation: 'modal'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 90,
  },
  blurContainer: {
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 90,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    minWidth: 50,
  },
  activeTabItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white for active tab
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeTabLabel: {
    color: '#FFFFFF', // White text for active tab
  },
  addTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    minWidth: 50,
  },
  addTabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
    color: '#FFFFFF', // White text for add tab
  },
  addTabIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  addTabIconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});

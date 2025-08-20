import { NavigationProp, RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Root: undefined;
  AddMedication: undefined;
  MedicationDetail: { medicationId: string };
  AddRegimen: { medicationId: string };
  AddConstraints: { medicationId: string };
};

export type RootTabParamList = {
  NextPill: undefined;
  Medications: undefined;
  AddMedication: undefined;
  Schedule: undefined;
  Settings: undefined;
};

export type NavigationProps = NavigationProp<RootStackParamList>;
export type TabNavigationProps = NavigationProp<RootTabParamList>;

export type AddMedicationScreenRouteProp = RouteProp<RootStackParamList, 'AddMedication'>;
export type MedicationDetailScreenRouteProp = RouteProp<RootStackParamList, 'MedicationDetail'>;
export type AddRegimenScreenRouteProp = RouteProp<RootStackParamList, 'AddRegimen'>;

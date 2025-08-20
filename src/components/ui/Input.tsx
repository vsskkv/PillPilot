import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { getTheme } from '../../theme/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  containerStyle,
  style,
  ...props
}) => {
  const t = getTheme();
  const styles = createStyles(t);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={t.color.textMuted}
        {...props}
      />
      
      {helper && !error && (
        <Text style={styles.helper}>
          {helper}
        </Text>
      )}
      
      {error && (
        <Text style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
};

const createStyles = (t: any) => StyleSheet.create({
  container: {
    marginBottom: t.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: t.color.text,
    marginBottom: t.spacing.sm,
  },
  input: {
    backgroundColor: t.color.surface,
    borderWidth: 1,
    borderColor: t.color.outline,
    borderRadius: t.radius.md,
    padding: t.spacing.lg,
    fontSize: 16,
    color: t.color.text,
    minHeight: 48,
  },
  inputError: {
    borderColor: t.color.danger,
  },
  helper: {
    fontSize: 13,
    color: t.color.textMuted,
    marginTop: t.spacing.xs,
  },
  error: {
    fontSize: 13,
    color: t.color.danger,
    marginTop: t.spacing.xs,
  },
});

import { Appearance } from "react-native";
import light from "./tokens.json";
import dark from "./tokens.dark.json";

export type Theme = typeof light;

export const getTheme = (mode?: "light" | "dark"): Theme => {
  const m = mode ?? (Appearance.getColorScheme() === "dark" ? "dark" : "light");
  return m === "dark" ? (dark as Theme) : (light as Theme);
};

// Quick helpers
export const shadow = (t: Theme, level: keyof Theme["elevation"]) => {
  const e = t.elevation[level];
  // @ts-ignore
  return { ...e.ios, ...e.android };
};

// Common component styles
export const commonStyles = (t: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: t.color.bg,
  },
  surface: {
    backgroundColor: t.color.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.xl,
    borderWidth: 1,
    borderColor: t.color.outline,
    ...shadow(t, "e1"),
  },
  card: {
    backgroundColor: t.color.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.xl,
    borderWidth: 1,
    borderColor: t.color.outline,
    marginBottom: t.spacing.md,
    ...shadow(t, "e1"),
  },
  button: {
    primary: {
      backgroundColor: t.color.primary,
      borderRadius: t.radius.lg,
      paddingVertical: t.spacing.lg,
      paddingHorizontal: t.spacing.xl,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...shadow(t, "e1"),
    },
    accent: {
      backgroundColor: t.color.accent,
      borderRadius: t.radius.lg,
      paddingVertical: t.spacing.lg,
      paddingHorizontal: t.spacing.xl,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...shadow(t, "e1"),
    },
    secondary: {
      backgroundColor: t.color.surface,
      borderWidth: 1,
      borderColor: t.color.outline,
      borderRadius: t.radius.lg,
      paddingVertical: t.spacing.lg,
      paddingHorizontal: t.spacing.xl,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  },
  text: {
    title: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: t.color.text,
    },
    body: {
      fontSize: 17,
      fontWeight: '400' as const,
      color: t.color.text,
    },
    secondary: {
      fontSize: 15,
      fontWeight: '400' as const,
      color: t.color.textMuted,
    },
    caption: {
      fontSize: 13,
      fontWeight: '400' as const,
      color: t.color.textMuted,
    },
    button: {
      fontSize: 17,
      fontWeight: '600' as const,
    },
  },
  input: {
    backgroundColor: t.color.surface,
    borderWidth: 1,
    borderColor: t.color.outline,
    borderRadius: t.radius.md,
    padding: t.spacing.lg,
    fontSize: 16,
    color: t.color.text,
  },
  chip: {
    backgroundColor: t.color.primaryMuted,
    borderRadius: t.radius.pill,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
  },
});

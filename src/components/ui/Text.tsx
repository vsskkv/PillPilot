import React from 'react';
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';
import { getTheme } from '../../theme/theme';

export type TextVariant = 'title' | 'body' | 'secondary' | 'caption' | 'button';
export type TextSize = 'small' | 'medium' | 'large' | 'xl';

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  size?: TextSize;
  color?: string;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  size = 'medium',
  color,
  weight,
  align = 'left',
  style,
}) => {
  const t = getTheme();
  const styles = createStyles(t);

  const getTextStyle = (): TextStyle => {
    const baseStyle = styles.text[variant];
    const sizeStyle = styles.size[size];
    const weightStyle = weight ? styles.weight[weight] : {};
    const alignStyle = { textAlign: align };
    const colorStyle = color ? { color } : {};
    
    return {
      ...baseStyle,
      ...sizeStyle,
      ...weightStyle,
      ...alignStyle,
      ...colorStyle,
    };
  };

  return (
    <RNText style={[getTextStyle(), style]}>
      {children}
    </RNText>
  );
};

const createStyles = (t: any) => StyleSheet.create({
  text: {
    title: {
      color: t.color.text,
      fontWeight: '700',
    },
    body: {
      color: t.color.text,
      fontWeight: '400',
    },
    secondary: {
      color: t.color.textMuted,
      fontWeight: '400',
    },
    caption: {
      color: t.color.textMuted,
      fontWeight: '400',
    },
    button: {
      fontWeight: '600',
    },
  },
  size: {
    small: {
      fontSize: 13,
    },
    medium: {
      fontSize: 15,
    },
    large: {
      fontSize: 17,
    },
    xl: {
      fontSize: 20,
    },
  },
  weight: {
    normal: {
      fontWeight: '400',
    },
    medium: {
      fontWeight: '500',
    },
    semibold: {
      fontWeight: '600',
    },
    bold: {
      fontWeight: '700',
    },
  },
});

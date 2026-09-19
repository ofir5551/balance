export type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  muted: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  link: string;
  chip: string;
  chipText: string;
  chipOn: string;
  chipOnText: string;
  soon: string;
  inputBg: string;
  headerTint: string;
  statusBar: 'light' | 'dark';
};

export const lightColors: ThemeColors = {
  background: '#f7f8fa',
  card: '#ffffff',
  text: '#111827',
  textSecondary: '#374151',
  muted: '#6b7280',
  border: '#e5e7eb',
  primary: '#111827',
  primaryText: '#ffffff',
  danger: '#dc2626',
  link: '#2563eb',
  chip: '#f3f4f6',
  chipText: '#374151',
  chipOn: '#111827',
  chipOnText: '#ffffff',
  soon: '#b45309',
  inputBg: '#ffffff',
  headerTint: '#111827',
  statusBar: 'dark',
};

export const darkColors: ThemeColors = {
  background: '#0f1115',
  card: '#1a1d24',
  text: '#f3f4f6',
  textSecondary: '#d1d5db',
  muted: '#9ca3af',
  border: '#2d323c',
  primary: '#f3f4f6',
  primaryText: '#111827',
  danger: '#f87171',
  link: '#60a5fa',
  chip: '#2d323c',
  chipText: '#d1d5db',
  chipOn: '#f3f4f6',
  chipOnText: '#111827',
  soon: '#fbbf24',
  inputBg: '#1a1d24',
  headerTint: '#f3f4f6',
  statusBar: 'light',
};

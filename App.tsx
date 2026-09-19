import { useEffect, useMemo } from 'react';
import { ActivityIndicator, I18nManager, View } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { HomeScreen } from './src/screens/HomeScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { EditEntryScreen } from './src/screens/EditEntryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import type { RootStackParamList } from './src/screens/types';
import { t } from './src/i18n';
import { scheduleWeeklyExpiryReminder } from './src/notifications/weeklyExpiry';
import {
  SettingsProvider,
  useSettings,
} from './src/settings/SettingsContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

// HE RTL is applied manually via isRtl() (Home rows, chips, FAB/gear side).
// Pin Yoga to LTR so those flips are not double-applied; EN stays LTR.
// Expo Go: I18nManager.forceRTL typically needs a reload for native chrome;
// we keep allowRTL(false) + isRtl() so language/layout update immediately.
I18nManager.allowRTL(false);
if (I18nManager.isRTL) {
  I18nManager.forceRTL(false);
}

function AppNavigator() {
  const { ready, language, appearance, colors } = useSettings();

  useEffect(() => {
    void scheduleWeeklyExpiryReminder();
  }, []);

  const navTheme: Theme = useMemo(() => {
    const base = appearance === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.link,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    };
  }, [appearance, colors]);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme} key={language}>
      <StatusBar style={colors.statusBar} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.headerTint,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: t('title') }}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{ title: t('detail') }}
        />
        <Stack.Screen name="EditEntry" component={EditEntryScreen} />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: t('settings') }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <SettingsProvider>
          <AppNavigator />
        </SettingsProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

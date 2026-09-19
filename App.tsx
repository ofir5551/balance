import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { HomeScreen } from './src/screens/HomeScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { EditEntryScreen } from './src/screens/EditEntryScreen';
import type { RootStackParamList } from './src/screens/types';
import { t } from './src/i18n';
import { scheduleWeeklyExpiryReminder } from './src/notifications/weeklyExpiry';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    void scheduleWeeklyExpiryReminder();
  }, []);

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator>
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
          </Stack.Navigator>
        </NavigationContainer>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

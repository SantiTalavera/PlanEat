import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ScanScreen from '../screens/ScanScreen';
import InventoryScreen from '../screens/InventoryScreen';
import PlanScreen from '../screens/PlanScreen';
import { useAuthStore } from '../store/auth';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const token = useAuthStore(s => s.token);

  // Esperar a que Zustand rehidrate (persist)
  const [hydrated, setHydrated] = React.useState(
    // puede ser falso la primera vez
    // ts-expect-error: propiedad agregada por el middleware persist
    useAuthStore.persist?.hasHydrated?.() ?? false
  );

  React.useEffect(() => {
    // ts-expect-error: propiedad agregada por persist
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => setHydrated(true));
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!token ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="Inventory" component={InventoryScreen} />
          <Stack.Screen name="Plan" component={PlanScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

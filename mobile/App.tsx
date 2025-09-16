import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation';
import { AuthProvider } from './src/store/auth';
import 'react-native-gesture-handler';


export default function App() {
return (
<AuthProvider>
    <NavigationContainer>
        <RootNavigator />
    </NavigationContainer>
</AuthProvider>
);
}
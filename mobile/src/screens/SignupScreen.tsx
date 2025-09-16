import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useAuthStore } from '../store/auth';

export default function SignupScreen() {
  const signup = useAuthStore(s => s.signup);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const onSignup = async () => {
    const ok = await signup(email, password, name);
    if (!ok) Alert.alert('Error', 'No se pudo crear la cuenta');
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Crear cuenta</Text>
      <TextInput placeholder="Nombre" value={name} onChangeText={setName}
        style={{ borderWidth:1, borderRadius:8, padding:12 }} />
      <TextInput placeholder="Email" autoCapitalize="none" keyboardType="email-address"
        value={email} onChangeText={setEmail} style={{ borderWidth:1, borderRadius:8, padding:12 }} />
      <TextInput placeholder="Contraseña" secureTextEntry
        value={password} onChangeText={setPassword} style={{ borderWidth:1, borderRadius:8, padding:12 }} />
      <Button title="Registrarme" onPress={onSignup} />
    </View>
  );
}

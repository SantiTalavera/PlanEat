import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useAuthStore } from '../store/auth';

export default function LoginScreen({ navigation }: any){
const { login } = useAuthStore();
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');


const onLogin = async () => {
try { await login(email, password); }
catch(e: any){ Alert.alert('Error', e?.response?.data?.error || 'Login failed'); }
};


return (
<View style={{ padding: 16, gap: 12 }}>
<Text style={{ fontSize: 24, fontWeight: '700' }}>Iniciar sesión</Text>
<TextInput placeholder="Email" autoCapitalize='none' keyboardType='email-address' value={email} onChangeText={setEmail} style={{ borderWidth:1, borderRadius:8, padding:12 }} />
<TextInput placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth:1, borderRadius:8, padding:12 }} />
<Button title="Ingresar" onPress={onLogin} />
<Text>¿No tenés cuenta? <Text style={{color:'blue'}} onPress={()=>navigation.navigate('Signup')}>Registrate</Text></Text>
</View>
);
}
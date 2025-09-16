import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { api } from '../api/client';

export default function ScanScreen({ navigation }: any){
const [hasPermission, setHasPermission] = useState<boolean|null>(null);
const [scanned, setScanned] = useState(false);
const [last, setLast] = useState('');


useEffect(() => {
(async () => {
const { status } = await BarCodeScanner.requestPermissionsAsync();
setHasPermission(status === 'granted');
})();
}, []);


const handleBarCodeScanned = async ({ data }: { data: string }) => {
if (scanned) return;
setScanned(true);
setLast(data);
try {
const { data: product } = await api.get('/products/lookup', { params: { barcode: data } });
// crear en inventario con 500g por defecto en heladera
const { data: inv } = await api.post('/inventory', { product_id: product.id, grams: 500, location: 'fridge' });
Alert.alert('Agregado', `${product.name} (500 g) a tu inventario`);
} catch (e: any) {
Alert.alert('No encontrado', e?.response?.data?.error || 'No se pudo obtener producto');
} finally {
setTimeout(()=> setScanned(false), 800);
}
};

if (hasPermission === null) return <Text>Solicitando permiso de cámara...</Text>;
if (hasPermission === false) return <Text>Sin permiso para usar la cámara</Text>;


return (
<View style={{ flex: 1 }}>
<BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={{ flex: 1 }} />
<View style={{ padding: 8 }}>
<Button title="Ir al Inventario" onPress={()=>navigation.navigate('Inventory')} />
<Text style={{ opacity: 0.6, marginTop: 8 }}>Último: {last}</Text>
</View>
</View>
);
}
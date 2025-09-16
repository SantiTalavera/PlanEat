import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Alert } from 'react-native';
import { api } from '../api/client';

export default function PlanScreen(){
const [items, setItems] = useState<any[]>([]);
const [date, setDate] = useState<string>('');


const generate = async () => {
try {
const { data } = await api.post('/plan/generate', {});
setItems(data.items);
setDate(data.date);
} catch(e: any){
Alert.alert('Error', e?.response?.data?.error || 'No se pudo generar plan');
}
};

useEffect(() => { generate(); }, []);


return (
<View style={{ flex:1, padding: 12 }}>
<Button title="Regenerar" onPress={generate} />
<Text style={{ marginVertical: 8 }}>Fecha: {String(date).slice(0,10)}</Text>
<FlatList data={items} keyExtractor={i=>i.id}
renderItem={({item})=> (
<View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
<Text style={{ fontWeight:'700', textTransform:'capitalize' }}>{item.slot}</Text>
<Text>{item.grams} g • {Math.round(item.kcal)} kcal</Text>
</View>
)}
/>
</View>
);
}
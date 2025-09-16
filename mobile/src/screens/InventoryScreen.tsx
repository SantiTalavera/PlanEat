import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Button } from 'react-native';
import { api } from '../api/client';

export default function InventoryScreen({ navigation }: any){
const [items, setItems] = useState<any[]>([]);
const [refreshing, setRefreshing] = useState(false);


const load = async () => {
setRefreshing(true);
try {
const { data } = await api.get('/inventory');
setItems(data);
} finally { setRefreshing(false); }
};

useEffect(() => { load(); }, []);


return (
<View style={{ flex:1 }}>
<FlatList
data={items}
keyExtractor={i=>i.id}
refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
renderItem={({item})=> (
<View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
<Text style={{ fontWeight:'700' }}>{item.product.name}</Text>
<Text>{item.grams_remaining} g • {item.location}</Text>
</View>
)}
/>
<View style={{ padding: 8 }}>
<Button title="Generar plan" onPress={()=>navigation.navigate('Plan')} />
</View>
</View>
);
}
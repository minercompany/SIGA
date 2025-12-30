import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Ajustar import si es necesario
import { Ionicons } from '@expo/vector-icons';

// Hardcoded por ahora, luego lo tomamos del config context si es necesario
const API_URL = 'http://10.0.2.2:8080/api';

export default function MisListasScreen() {
    const { user, token } = useAuth();
    const [asignaciones, setAsignaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMisListas();
    }, []);

    const loadMisListas = async () => {
        try {
            // Endpoint correcto según backend (AsignacionController.java)
            const response = await axios.get(`${API_URL}/asignaciones/mis-listas`);
            setAsignaciones(response.data);
        } catch (error) {
            console.error('Error cargando mis listas', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={asignaciones}
                keyExtractor={(item: any) => item.id.toString()}
                ListEmptyComponent={<Text style={styles.empty}>No tienes listas asignadas</Text>}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{item.nombre || 'Lista sin nombre'}</Text>
                        <Text>Socios: {item.cantidadSocios || 0}</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#fff', padding: 16, marginBottom: 10, borderRadius: 8 },
    cardTitle: { fontSize: 16, fontWeight: 'bold' },
    empty: { textAlign: 'center', marginTop: 20, color: '#64748b' }
});

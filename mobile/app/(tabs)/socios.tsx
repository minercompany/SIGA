import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from '../../hooks/useDebounce';

const API_URL = 'https://asamblea.cloud/api';

interface Socio {
    id: number;
    cedula: string;
    nombreCompleto: string;
    numeroSocio: string;
    sucursal: string;
    tieneVozYVoto: boolean;
    presente: boolean;
}

export default function SociosScreen() {
    const [socios, setSocios] = useState<Socio[]>([]);
    const [filteredSocios, setFilteredSocios] = useState<Socio[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadSocios();
    }, []);

    const loadSocios = async (reset = false) => {
        try {
            const currentPage = reset ? 0 : page;
            const response = await axios.get(`${API_URL}/socios?page=${currentPage}&size=50`);
            const newSocios = response.data.content || response.data;

            if (reset) {
                setSocios(newSocios);
                setFilteredSocios(newSocios);
                setPage(1);
            } else {
                setSocios(prev => [...prev, ...newSocios]);
                setFilteredSocios(prev => [...prev, ...newSocios]);
                setPage(currentPage + 1);
            }

            setHasMore(newSocios.length === 50);
        } catch (error) {
            console.error('Error cargando socios:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadSocios(true);
        setRefreshing(false);
    };

    const handleSearch = useCallback(
        debounce((text: string) => {
            if (!text.trim()) {
                setFilteredSocios(socios);
                return;
            }

            const term = text.toLowerCase();
            const filtered = socios.filter(s =>
                s.cedula?.toLowerCase().includes(term) ||
                s.nombreCompleto?.toLowerCase().includes(term) ||
                s.numeroSocio?.toLowerCase().includes(term)
            );
            setFilteredSocios(filtered);
        }, 300),
        [socios]
    );

    const onSearchChange = (text: string) => {
        setSearchTerm(text);
        handleSearch(text);
    };

    const renderSocio = ({ item }: { item: Socio }) => (
        <View style={styles.socioCard}>
            <View style={styles.socioInfo}>
                <View style={styles.socioHeader}>
                    <Text style={styles.socioName}>{item.nombreCompleto}</Text>
                    {item.presente && (
                        <View style={styles.presenteBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#059669" />
                            <Text style={styles.presenteText}>Presente</Text>
                        </View>
                    )}
                </View>
                <View style={styles.socioDetails}>
                    <Text style={styles.socioDetail}>
                        <Ionicons name="card" size={12} color="#64748b" /> {item.cedula}
                    </Text>
                    <Text style={styles.socioDetail}>
                        <Ionicons name="person" size={12} color="#64748b" /> Socio #{item.numeroSocio}
                    </Text>
                </View>
                <View style={styles.tagsRow}>
                    <View style={[styles.tag, item.tieneVozYVoto ? styles.tagVyV : styles.tagSV]}>
                        <Text style={[styles.tagText, item.tieneVozYVoto ? styles.tagTextVyV : styles.tagTextSV]}>
                            {item.tieneVozYVoto ? 'Voz y Voto' : 'Solo Voz'}
                        </Text>
                    </View>
                    {item.sucursal && (
                        <View style={styles.tagSucursal}>
                            <Text style={styles.tagTextSucursal}>{item.sucursal}</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por cédula, nombre o N° socio..."
                    placeholderTextColor="#94a3b8"
                    value={searchTerm}
                    onChangeText={onSearchChange}
                />
                {searchTerm.length > 0 && (
                    <TouchableOpacity onPress={() => onSearchChange('')}>
                        <Ionicons name="close-circle" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Contador */}
            <View style={styles.counterBar}>
                <Text style={styles.counterText}>
                    Mostrando {filteredSocios.length} de {socios.length} socios
                </Text>
            </View>

            {/* Lista */}
            <FlatList
                data={filteredSocios}
                renderItem={renderSocio}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                onEndReached={() => hasMore && !searchTerm && loadSocios()}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No se encontraron socios</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        marginBottom: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1e293b',
    },
    counterBar: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    counterText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    socioCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    socioInfo: {
        flex: 1,
    },
    socioHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    socioName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
    },
    presenteBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 4,
    },
    presenteText: {
        fontSize: 11,
        color: '#059669',
        fontWeight: '600',
    },
    socioDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 10,
    },
    socioDetail: {
        fontSize: 13,
        color: '#64748b',
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagVyV: {
        backgroundColor: '#e0e7ff',
    },
    tagSV: {
        backgroundColor: '#fef3c7',
    },
    tagText: {
        fontSize: 11,
        fontWeight: '700',
    },
    tagTextVyV: {
        color: '#4f46e5',
    },
    tagTextSV: {
        color: '#d97706',
    },
    tagSucursal: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagTextSucursal: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 15,
        color: '#94a3b8',
        marginTop: 12,
    },
});

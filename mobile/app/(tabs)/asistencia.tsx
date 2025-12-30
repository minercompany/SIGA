import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Animated,
    Keyboard,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'http://10.0.2.2:8080/api';

interface SocioResult {
    id: number;
    cedula: string;
    nombreCompleto: string;
    numeroSocio: string;
    sucursal: any; // Puede ser string o objeto {id, nombre, ...}
    tieneVozYVoto: boolean;
    presente: boolean;
}

export default function AsistenciaScreen() {
    const [cedula, setCedula] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [socioFound, setSocioFound] = useState<SocioResult | null>(null);
    const [lastRegistered, setLastRegistered] = useState<SocioResult | null>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const buscarSocio = async () => {
        if (!cedula.trim()) {
            Alert.alert('Error', 'Ingresa una cédula para buscar');
            return;
        }

        Keyboard.dismiss();
        setIsSearching(true);
        setSocioFound(null);

        try {
            const response = await axios.get(`${API_URL}/socios/buscar?term=${cedula}`);
            const socios = response.data;

            if (socios && socios.length > 0) {
                setSocioFound(socios[0]);
                // Animación de "encontrado"
                Animated.sequence([
                    Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
                ]).start();
            } else {
                Alert.alert('No encontrado', 'No se encontró un socio con esa cédula');
            }
        } catch (error) {
            console.error('Error buscando socio:', error);
            Alert.alert('Error', 'No se pudo buscar el socio');
        } finally {
            setIsSearching(false);
        }
    };

    const registrarAsistencia = async () => {
        if (!socioFound) return;

        setIsRegistering(true);

        try {
            await axios.post(`${API_URL}/asistencia`, {
                socioId: socioFound.id,
            });

            setLastRegistered({ ...socioFound, presente: true });
            setSocioFound(null);
            setCedula('');

            // Feedback visual
            Alert.alert('✅ Éxito', `Asistencia registrada para ${socioFound.nombreCompleto}`);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error registrando asistencia';
            Alert.alert('Error', msg);
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Premium */}
            <LinearGradient
                colors={['#059669', '#0d9488', '#14b8a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="scan" size={32} color="#fff" />
                    </View>
                    <Text style={styles.headerTitle}>Registro de Asistencia</Text>
                    <Text style={styles.headerSubtitle}>Ingresa la cédula del socio</Text>
                </View>

                {/* Decoración */}
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />
            </LinearGradient>

            {/* Formulario de Búsqueda */}
            <View style={styles.searchSection}>
                <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={22} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Número de cédula..."
                        placeholderTextColor="#94a3b8"
                        value={cedula}
                        onChangeText={setCedula}
                        keyboardType="number-pad"
                        returnKeyType="search"
                        onSubmitEditing={buscarSocio}
                    />
                    {cedula.length > 0 && (
                        <TouchableOpacity onPress={() => setCedula('')}>
                            <Ionicons name="close-circle" size={22} color="#cbd5e1" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={buscarSocio}
                    disabled={isSearching}
                >
                    <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.searchButtonGradient}
                    >
                        {isSearching ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="search" size={20} color="#fff" />
                                <Text style={styles.searchButtonText}>Buscar</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Resultado de Búsqueda */}
            {socioFound && (
                <Animated.View style={[styles.resultCard, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={['#ffffff', '#f8fafc']}
                        style={styles.resultGradient}
                    >
                        <View style={styles.resultHeader}>
                            <View style={styles.avatarContainer}>
                                <LinearGradient
                                    colors={socioFound.tieneVozYVoto ? ['#6366f1', '#8b5cf6'] : ['#f59e0b', '#fbbf24']}
                                    style={styles.avatar}
                                >
                                    <Text style={styles.avatarText}>
                                        {socioFound.nombreCompleto.charAt(0).toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            </View>
                            <View style={styles.resultInfo}>
                                <Text style={styles.resultName}>{socioFound.nombreCompleto}</Text>
                                <Text style={styles.resultCedula}>CI: {socioFound.cedula}</Text>
                            </View>
                        </View>

                        <View style={styles.tagsContainer}>
                            <View style={[styles.tag, socioFound.tieneVozYVoto ? styles.tagVyV : styles.tagSV]}>
                                <Ionicons
                                    name={socioFound.tieneVozYVoto ? "shield-checkmark" : "volume-medium"}
                                    size={14}
                                    color={socioFound.tieneVozYVoto ? "#6366f1" : "#f59e0b"}
                                />
                                <Text style={[styles.tagText, socioFound.tieneVozYVoto ? styles.tagTextVyV : styles.tagTextSV]}>
                                    {socioFound.tieneVozYVoto ? 'Voz y Voto' : 'Solo Voz'}
                                </Text>
                            </View>
                            <View style={styles.tagSucursal}>
                                <Ionicons name="business" size={14} color="#64748b" />
                                <Text style={styles.tagTextSucursal}>
                                    {typeof socioFound.sucursal === 'object' ? socioFound.sucursal.nombre : socioFound.sucursal}
                                </Text>
                            </View>
                            <View style={styles.tagSocio}>
                                <Ionicons name="person" size={14} color="#64748b" />
                                <Text style={styles.tagTextSucursal}>#{socioFound.numeroSocio}</Text>
                            </View>
                        </View>

                        {socioFound.presente ? (
                            <View style={styles.alreadyPresent}>
                                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                                <Text style={styles.alreadyPresentText}>Ya está marcado como presente</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={registrarAsistencia}
                                disabled={isRegistering}
                            >
                                <LinearGradient
                                    colors={['#059669', '#10b981']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.registerButtonGradient}
                                >
                                    {isRegistering ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-done" size={22} color="#fff" />
                                            <Text style={styles.registerButtonText}>Registrar Asistencia</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </LinearGradient>
                </Animated.View>
            )}

            {/* Último Registrado */}
            {lastRegistered && !socioFound && (
                <View style={styles.lastRegistered}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={28} color="#059669" />
                    </View>
                    <Text style={styles.lastRegisteredTitle}>Último registro exitoso</Text>
                    <Text style={styles.lastRegisteredName}>{lastRegistered.nombreCompleto}</Text>
                    <Text style={styles.lastRegisteredCedula}>CI: {lastRegistered.cedula}</Text>
                </View>
            )}

            {/* Placeholder cuando no hay búsqueda */}
            {!socioFound && !lastRegistered && (
                <View style={styles.placeholder}>
                    <View style={styles.placeholderIcon}>
                        <Ionicons name="finger-print" size={48} color="#cbd5e1" />
                    </View>
                    <Text style={styles.placeholderText}>
                        Ingresa una cédula para buscar{'\n'}y registrar asistencia
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    headerContent: {
        alignItems: 'center',
        zIndex: 10,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    decorCircle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.1)',
        top: -80,
        right: -60,
    },
    decorCircle2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.05)',
        bottom: -40,
        left: -40,
    },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: -24,
        gap: 10,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1e293b',
    },
    searchButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    searchButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 6,
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    resultCard: {
        margin: 16,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 6,
    },
    resultGradient: {
        padding: 20,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarContainer: {
        marginRight: 14,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    resultInfo: {
        flex: 1,
    },
    resultName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 2,
    },
    resultCedula: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 5,
    },
    tagVyV: {
        backgroundColor: '#e0e7ff',
    },
    tagSV: {
        backgroundColor: '#fef3c7',
    },
    tagText: {
        fontSize: 12,
        fontWeight: '700',
    },
    tagTextVyV: {
        color: '#6366f1',
    },
    tagTextSV: {
        color: '#d97706',
    },
    tagSucursal: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 5,
    },
    tagSocio: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 5,
    },
    tagTextSucursal: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    alreadyPresent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dcfce7',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
    },
    alreadyPresentText: {
        color: '#059669',
        fontWeight: '700',
        fontSize: 14,
    },
    registerButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    registerButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    registerButtonText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    lastRegistered: {
        margin: 16,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    successIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#dcfce7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    lastRegisteredTitle: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    lastRegisteredName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 2,
    },
    lastRegisteredCedula: {
        fontSize: 14,
        color: '#64748b',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    placeholderIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    placeholderText: {
        fontSize: 15,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 22,
    },
});

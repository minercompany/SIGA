import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ConfigScreen() {
    const { user, logout } = useAuth();
    const { config } = useConfig();

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas salir?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Perfil de Usuario */}
            <View style={styles.profileCard}>
                <LinearGradient
                    colors={['#6366f1', '#8b5cf6', '#a855f7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileGradient}
                >
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarLargeText}>
                            {user?.nombreCompleto?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={styles.profileName}>{user?.nombreCompleto || user?.username}</Text>
                    <Text style={styles.profileUsername}>@{user?.username}</Text>
                    <View style={styles.rolePill}>
                        <Ionicons name="shield-checkmark" size={14} color="#6366f1" />
                        <Text style={styles.roleText}>{user?.rol}</Text>
                    </View>

                    {/* Decoración */}
                    <View style={styles.decorCircle1} />
                    <View style={styles.decorCircle2} />
                </LinearGradient>
            </View>

            {/* Información de la Asamblea */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información de la Asamblea</Text>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, { backgroundColor: '#dcfce7' }]}>
                            <Ionicons name="calendar" size={20} color="#059669" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Evento</Text>
                            <Text style={styles.infoValue}>{config?.nombreAsamblea || 'No configurado'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, { backgroundColor: '#e0e7ff' }]}>
                            <Ionicons name="today" size={20} color="#6366f1" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Fecha</Text>
                            <Text style={styles.infoValue}>{config?.fechaAsamblea || 'No configurado'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="time" size={20} color="#f59e0b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Hora de Inicio</Text>
                            <Text style={styles.infoValue}>{config?.horaAsamblea || '08:00'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Conexión */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Servidor</Text>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, { backgroundColor: '#dcfce7' }]}>
                            <Ionicons name="globe" size={20} color="#059669" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Conectado a</Text>
                            <Text style={styles.infoValue}>asamblea.cloud</Text>
                        </View>
                        <View style={styles.statusDot} />
                    </View>
                </View>
            </View>

            {/* Acciones */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cuenta</Text>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LinearGradient
                        colors={['#ef4444', '#dc2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.logoutGradient}
                    >
                        <Ionicons name="log-out" size={22} color="#fff" />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>SIGA Mobile v1.0.0</Text>
                <Text style={styles.footerSubtext}>Sistema de Gestión de Asambleas</Text>
                <Text style={styles.footerCopyright}>© 2024 Asamblea.Cloud</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    content: {
        paddingBottom: 40,
    },
    profileCard: {
        margin: 16,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
    },
    profileGradient: {
        padding: 28,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarLargeText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
    },
    profileName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    profileUsername: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        marginBottom: 12,
    },
    rolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    roleText: {
        color: '#6366f1',
        fontWeight: '700',
        fontSize: 12,
    },
    decorCircle1: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
        top: -50,
        right: -50,
    },
    decorCircle2: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.08)',
        bottom: -30,
        left: -30,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    logoutButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    logoutText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    footer: {
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 16,
    },
    footerText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 2,
    },
    footerSubtext: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 4,
    },
    footerCopyright: {
        fontSize: 11,
        color: '#cbd5e1',
    },
});

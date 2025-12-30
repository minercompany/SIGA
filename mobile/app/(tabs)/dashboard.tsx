import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://10.0.2.2:8080/api';

interface Stats {
    totalPadron: number;
    conVozYVoto: number;
    soloVoz: number;
    presentes: number;
}

export default function DashboardScreen() {
    const { user } = useAuth();
    const { config } = useConfig();
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        loadStats();
    }, []);

    // Contador de tiempo
    useEffect(() => {
        if (!config?.fechaAsamblea) return;

        const [year, month, day] = config.fechaAsamblea.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day, 8, 0, 0);

        const interval = setInterval(() => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [config]);

    const loadStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/socios/estadisticas`);
            setStats(response.data);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    const quorumNecesario = stats ? Math.floor(stats.totalPadron / 2) + 1 : 0;
    const progresoQuorum = stats && quorumNecesario > 0
        ? Math.min((stats.presentes / quorumNecesario) * 100, 100)
        : 0;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Bienvenida */}
            <View style={styles.welcomeCard}>
                <Text style={styles.welcomeText}>Bienvenido,</Text>
                <Text style={styles.userName}>{user?.nombreCompleto || user?.username}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user?.rol}</Text>
                </View>
            </View>

            {/* Contador */}
            <View style={styles.countdownCard}>
                <Text style={styles.countdownTitle}>{config?.nombreAsamblea || 'Asamblea'}</Text>
                <Text style={styles.countdownDate}>{config?.fechaAsamblea}</Text>
                <View style={styles.timerRow}>
                    {[
                        { val: timeLeft.days, label: 'DÍAS' },
                        { val: timeLeft.hours, label: 'HRS' },
                        { val: timeLeft.minutes, label: 'MIN' },
                        { val: timeLeft.seconds, label: 'SEG' },
                    ].map((item) => (
                        <View key={item.label} style={styles.timerItem}>
                            <View style={styles.timerBox}>
                                <Text style={styles.timerNumber}>{String(item.val).padStart(2, '0')}</Text>
                            </View>
                            <Text style={styles.timerLabel}>{item.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* KPIs */}
            <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, { backgroundColor: '#3b82f6' }]}>
                    <Ionicons name="people" size={24} color="#fff" />
                    <Text style={styles.kpiValue}>{stats?.totalPadron.toLocaleString()}</Text>
                    <Text style={styles.kpiLabel}>Total Padrón</Text>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: '#059669' }]}>
                    <Ionicons name="shield-checkmark" size={24} color="#fff" />
                    <Text style={styles.kpiValue}>{stats?.conVozYVoto.toLocaleString()}</Text>
                    <Text style={styles.kpiLabel}>Voz y Voto</Text>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: '#8b5cf6' }]}>
                    <Ionicons name="person-add" size={24} color="#fff" />
                    <Text style={styles.kpiValue}>{stats?.presentes.toLocaleString()}</Text>
                    <Text style={styles.kpiLabel}>Presentes</Text>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: '#f59e0b' }]}>
                    <Ionicons name="warning" size={24} color="#fff" />
                    <Text style={styles.kpiValue}>{stats?.soloVoz.toLocaleString()}</Text>
                    <Text style={styles.kpiLabel}>Solo Voz</Text>
                </View>
            </View>

            {/* Progreso Quórum */}
            <View style={styles.quorumCard}>
                <View style={styles.quorumHeader}>
                    <Text style={styles.quorumTitle}>Progreso al Quórum</Text>
                    <Text style={styles.quorumPercent}>{progresoQuorum.toFixed(1)}%</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progresoQuorum}%` }]} />
                </View>
                <Text style={styles.quorumInfo}>
                    {stats?.presentes.toLocaleString()} / {quorumNecesario.toLocaleString()} necesarios
                </Text>
                {progresoQuorum >= 100 && (
                    <View style={styles.quorumSuccess}>
                        <Ionicons name="checkmark-circle" size={20} color="#059669" />
                        <Text style={styles.quorumSuccessText}>¡QUÓRUM ALCANZADO!</Text>
                    </View>
                )}
            </View>
        </ScrollView>
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
    welcomeCard: {
        backgroundColor: '#fff',
        margin: 16,
        marginBottom: 8,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    welcomeText: {
        fontSize: 14,
        color: '#64748b',
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1e293b',
        marginTop: 4,
    },
    roleBadge: {
        backgroundColor: '#e6ffe6', // emerald-50 custom
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    roleText: {
        color: '#009900', // emerald-600 custom
        fontWeight: '700',
        fontSize: 12,
    },
    countdownCard: {
        backgroundColor: '#009900', // emerald-600 custom
        margin: 16,
        marginTop: 8,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    countdownTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    countdownDate: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 16,
    },
    timerRow: {
        flexDirection: 'row',
        gap: 12,
    },
    timerItem: {
        alignItems: 'center',
    },
    timerBox: {
        backgroundColor: '#fff',
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerNumber: {
        fontSize: 24,
        fontWeight: '900',
        color: '#009900', // emerald-600
    },
    timerLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
        marginTop: 6,
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        gap: 8,
    },
    kpiCard: {
        width: '48%',
        flexGrow: 1,
        flexBasis: '46%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 0,
    },
    kpiValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        marginTop: 8,
    },
    kpiLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    quorumCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 40, // Espacio extra para que no se corte con el menú
    },
    quorumHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    quorumTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    quorumPercent: {
        fontSize: 20,
        fontWeight: '900',
        color: '#009900',
    },
    progressBar: {
        height: 12,
        backgroundColor: '#e2e8f0',
        borderRadius: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#009900',
        borderRadius: 10,
    },
    quorumInfo: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 8,
        textAlign: 'center',
    },
    quorumSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        gap: 6,
    },
    quorumSuccessText: {
        color: '#009900',
        fontWeight: '800',
        fontSize: 14,
    },
});

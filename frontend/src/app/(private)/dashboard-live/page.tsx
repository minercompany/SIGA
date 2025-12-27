"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Clock, Users, UserCheck, Target, TrendingUp, Activity,
    Bell, Zap, MapPin, RefreshCw, CheckCircle2, Award, Crown, Medal,
    Building2, BarChart3, PieChart as PieIcon, AlertTriangle, Shield
} from "lucide-react";
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
    BarChart, Bar, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from "axios";

interface Asistencia {
    id: number;
    socioNombre: string;
    socioNumero: string;
    vozVoto: boolean;
    fechaHora: string;
    sucursal?: string;
}

interface Stats {
    totalPadron: number;
    conVozYVoto: number;
    soloVoz: number;
    presentes: number;
    presentesVyV: number;
}

interface Operador {
    id: number;
    nombre: string;
    username: string;
    rol: string;
    totalRegistros: number;
    vozYVoto: number;
    soloVoz: number;
}

interface SucursalStats {
    sucursalId: number;
    sucursal: string;
    padron: number;
    presentes: number;
    vozVoto: number;
}

// Tooltip personalizado premium
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-2xl px-5 py-4 rounded-2xl shadow-2xl border border-white/20">
                <p className="font-bold text-slate-800 mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm font-semibold" style={{ color: entry.color || '#374151' }}>
                        {entry.name}: <span className="font-black">{entry.value?.toLocaleString()}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function DashboardEnVivoPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [ultimasLlegadas, setUltimasLlegadas] = useState<Asistencia[]>([]);
    const [evolucionHora, setEvolucionHora] = useState<any[]>([]);
    const [rankingOperadores, setRankingOperadores] = useState<Operador[]>([]);
    const [sucursalesStats, setSucursalesStats] = useState<SucursalStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [quorumReached, setQuorumReached] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    // Verificar permisos de acceso - redirigir USUARIO_SOCIO a su dashboard
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const user = JSON.parse(userData);
            if (user.rol === "USUARIO_SOCIO") {
                setAccessDenied(true);
                window.location.href = "/dashboard";
            }
        }
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, asistenciasRes, rankingRes, sucursalesRes] = await Promise.all([
                axios.get("http://192.168.100.123:8081/api/socios/estadisticas", { headers }),
                axios.get("http://192.168.100.123:8081/api/asistencia/hoy", { headers }),
                axios.get("http://192.168.100.123:8081/api/asistencia/ranking-operadores", { headers }),
                axios.get("http://192.168.100.123:8081/api/socios/estadisticas/por-sucursal", { headers }),
            ]);

            setStats(statsRes.data);
            setRankingOperadores(rankingRes.data || []);
            setSucursalesStats(sucursalesRes.data || []);

            const asistencias = asistenciasRes.data || [];
            const ordenadas = [...asistencias].sort((a: Asistencia, b: Asistencia) =>
                new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
            );
            setUltimasLlegadas(ordenadas.slice(0, 8));

            const ahora = new Date();
            const horaInicio = 7;
            const horaActual = ahora.getHours();

            const evolucion = [];
            for (let h = horaInicio; h <= Math.min(horaActual, 20); h++) {
                const asistenciasHastaHora = asistencias.filter((a: Asistencia) => {
                    const fecha = new Date(a.fechaHora);
                    return fecha.getHours() <= h;
                }).length;
                evolucion.push({ hora: `${h}:00`, presentes: asistenciasHastaHora });
            }
            setEvolucionHora(evolucion);

            const quorum = Math.floor(statsRes.data.totalPadron / 2) + 1;
            if (statsRes.data.presentes >= quorum && !quorumReached) {
                setQuorumReached(true);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [quorumReached]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (isLoading || !stats) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full blur-xl opacity-30 animate-pulse" />
                        <RefreshCw className="relative h-16 w-16 text-teal-600 animate-spin mx-auto mb-4" />
                    </div>
                    <p className="text-slate-500 font-medium">Cargando datos en tiempo real...</p>
                </div>
            </div>
        );
    }

    const quorumNecesario = Math.floor(stats.totalPadron / 2) + 1;
    const faltanParaQuorum = Math.max(0, quorumNecesario - stats.presentes);
    const porcentajeQuorum = Math.min((stats.presentes / quorumNecesario) * 100, 100);
    const porcentajeAsistencia = stats.totalPadron > 0 ? (stats.presentes / stats.totalPadron) * 100 : 0;
    const presentesSoloVoz = stats.presentes - stats.presentesVyV;

    const distribucionPresentes = [
        { name: 'Con V&V', value: stats.presentesVyV, color: '#10b981' },
        { name: 'Solo Voz', value: presentesSoloVoz, color: '#f59e0b' },
    ];

    const distribucionPadron = [
        { name: 'Voz y Voto', value: stats.conVozYVoto, color: '#0d9488' },
        { name: 'Solo Voz', value: stats.soloVoz, color: '#f59e0b' },
    ];

    const topSucursales = [...sucursalesStats]
        .sort((a, b) => b.padron - a.padron)
        .slice(0, 6)
        .map(s => ({
            name: s.sucursal?.substring(0, 12) || 'N/A',
            padron: s.padron,
            vyv: s.vozVoto,
            presentes: s.presentes || 0,
        }));

    // Estilos de cards premium
    const cardStyle = "bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-teal-100/50 transition-all duration-500";
    const darkCardStyle = "bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50/30 p-4 lg:p-8">
            {/* Elementos decorativos de fondo */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
                {/* Alerta de Quórum Alcanzado */}
                <AnimatePresence>
                    {quorumReached && (
                        <motion.div
                            initial={{ opacity: 0, y: -50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -50, scale: 0.9 }}
                            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-10 py-5 rounded-3xl shadow-2xl shadow-emerald-500/30 flex items-center gap-4 border border-white/20"
                        >
                            <CheckCircle2 className="h-7 w-7" />
                            <span className="font-bold text-xl tracking-tight">¡QUÓRUM ALCANZADO!</span>
                            <Zap className="h-7 w-7 animate-pulse" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header Premium */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-xl shadow-teal-500/30">
                                <Activity className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-800 via-slate-700 to-teal-700 bg-clip-text text-transparent tracking-tight">
                                    Centro de Monitoreo
                                </h1>
                                <p className="text-slate-500 text-sm flex items-center gap-2 mt-1 font-medium">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Actualización en tiempo real
                                </p>
                            </div>
                        </div>

                        {/* Reloj Premium */}
                        <div className={`${cardStyle} px-8 py-4`}>
                            <div className="text-4xl lg:text-5xl font-mono font-black text-slate-800 tracking-wider">
                                {currentTime.toLocaleTimeString('es-PY', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                })}
                            </div>
                            <p className="text-center text-slate-400 text-sm mt-1 font-medium capitalize">
                                {currentTime.toLocaleDateString('es-PY', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </p>
                        </div>
                    </div>
                </motion.header>

                {/* KPIs Premium Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-blue-500/30 border border-white/10"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
                        <div className="relative">
                            <div className="p-3 bg-white/20 backdrop-blur rounded-2xl w-fit mb-4">
                                <UserCheck className="h-6 w-6" />
                            </div>
                            <div className="text-5xl font-black tracking-tight">{stats.presentes}</div>
                            <p className="text-blue-100 text-sm font-semibold mt-1">Presentes Hoy</p>
                            <div className="mt-3 pt-3 border-t border-white/20">
                                <p className="text-blue-200 text-xs font-bold">{porcentajeAsistencia.toFixed(2)}% del padrón</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-emerald-500/30 border border-white/10"
                    >
                        <div className="relative">
                            <div className="p-3 bg-white/20 backdrop-blur rounded-2xl w-fit mb-4">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div className="text-5xl font-black tracking-tight">{stats.presentesVyV}</div>
                            <p className="text-emerald-100 text-sm font-semibold mt-1">Con V&V Presentes</p>
                            <div className="mt-3 pt-3 border-t border-white/20">
                                <p className="text-emerald-200 text-xs font-bold">{presentesSoloVoz} solo voz</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className={`rounded-3xl p-6 text-white relative overflow-hidden shadow-xl border border-white/10 ${stats.presentes >= quorumNecesario
                            ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 shadow-green-500/30'
                            : 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-amber-500/30'
                            }`}
                    >
                        <div className="relative">
                            <div className="p-3 bg-white/20 backdrop-blur rounded-2xl w-fit mb-4">
                                <Target className="h-6 w-6" />
                            </div>
                            <div className="text-5xl font-black tracking-tight">
                                {stats.presentes >= quorumNecesario ? '✓' : faltanParaQuorum}
                            </div>
                            <p className="text-white/90 text-sm font-semibold mt-1">
                                {stats.presentes >= quorumNecesario ? 'Quórum Logrado' : 'Faltan Quórum'}
                            </p>
                            <div className="mt-3 pt-3 border-t border-white/20">
                                <p className="text-white/70 text-xs font-bold">Req: {quorumNecesario} (50%+1)</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-violet-500/30 border border-white/10"
                    >
                        <div className="relative">
                            <div className="p-3 bg-white/20 backdrop-blur rounded-2xl w-fit mb-4">
                                <Users className="h-6 w-6" />
                            </div>
                            <div className="text-5xl font-black tracking-tight">{stats.totalPadron.toLocaleString()}</div>
                            <p className="text-violet-100 text-sm font-semibold mt-1">Total Padrón</p>
                            <div className="mt-3 pt-3 border-t border-white/20">
                                <p className="text-violet-200 text-xs font-bold">{stats.conVozYVoto.toLocaleString()} con V&V</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Barra de Progreso Premium */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${cardStyle} p-6 mb-8`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-200">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Progreso hacia el Quórum</h2>
                                <p className="text-xs text-slate-400">50% + 1 de socios presentes requeridos</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black text-slate-800">{porcentajeQuorum.toFixed(1)}%</span>
                            <p className="text-slate-400 text-sm font-medium">{stats.presentes} / {quorumNecesario}</p>
                        </div>
                    </div>
                    <div className="h-5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${porcentajeQuorum}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full relative overflow-hidden ${porcentajeQuorum >= 100
                                ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500'
                                : 'bg-gradient-to-r from-teal-400 via-emerald-500 to-green-500'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Grid de Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`lg:col-span-2 ${cardStyle} p-6`}
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-200">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Evolución de Asistencia por Hora</h2>
                        </div>
                        {evolucionHora.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={evolucionHora}>
                                    <defs>
                                        <linearGradient id="colorPresentes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0d9488" stopOpacity={0.6} />
                                            <stop offset="100%" stopColor="#0d9488" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="hora" stroke="#64748b" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="presentes" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorPresentes)" name="Presentes" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-slate-400">
                                <p>Sin datos de evolución</p>
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`${cardStyle} p-6`}
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-200">
                                <PieIcon className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Presentes por Estado</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={distribucionPresentes} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                                    {distribucionPresentes.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={3} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 mt-3">
                            {distribucionPresentes.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs text-slate-500 font-medium">{item.name}: <span className="font-bold text-slate-700">{item.value}</span></span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Segunda fila */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`lg:col-span-2 ${cardStyle} p-6`}
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Top Sucursales por Padrón</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={topSucursales} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                    <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="padron" fill="url(#barGradient1)" name="Padrón" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="vyv" fill="url(#barGradient2)" name="V&V" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`${cardStyle} p-6`}
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg shadow-teal-200">
                                <PieIcon className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Habilitación General</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={distribucionPadron} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                                    {distribucionPadron.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={3} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 mt-3">
                            {distribucionPadron.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs text-slate-500 font-medium">{item.name}: <span className="font-bold text-slate-700">{item.value.toLocaleString()}</span></span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Tercera fila: Llegadas + Ranking */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`${darkCardStyle} p-6`}
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                                <Bell className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Últimas Llegadas</h2>
                        </div>
                        <div className="space-y-3 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                            {ultimasLlegadas.length > 0 ? (
                                ultimasLlegadas.map((llegada, index) => (
                                    <motion.div
                                        key={llegada.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white/5 backdrop-blur rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 border border-white/5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-white text-sm truncate">
                                                    {llegada.socioNombre || 'Sin nombre'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400 font-mono">#{llegada.socioNumero}</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${llegada.vozVoto ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        }`}>
                                                        {llegada.vozVoto ? 'V&V' : 'SV'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {new Date(llegada.fechaHora).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-500">
                                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Sin llegadas registradas</p>
                                </div>
                            )}
                        </div>
                        {ultimasLlegadas.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Actualizando automáticamente
                                </p>
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`lg:col-span-2 ${cardStyle} p-6`}
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-200">
                                <Award className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Ranking de Operadores</h2>
                        </div>
                        {rankingOperadores.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {rankingOperadores.slice(0, 6).map((operador, index) => (
                                    <motion.div
                                        key={operador.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ y: -3, scale: 1.02 }}
                                        className={`relative rounded-2xl p-4 border transition-all duration-300 ${index === 0
                                            ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-lg shadow-amber-100'
                                            : index === 1
                                                ? 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-lg shadow-slate-100'
                                                : index === 2
                                                    ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg shadow-orange-100'
                                                    : 'bg-slate-50 border-slate-100'
                                            }`}
                                    >
                                        {index < 3 && (
                                            <div className="absolute -top-2 -right-2">
                                                <div className={`p-1.5 rounded-full shadow-lg ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-amber-200' :
                                                    index === 1 ? 'bg-gradient-to-br from-slate-400 to-gray-500 shadow-slate-200' :
                                                        'bg-gradient-to-br from-orange-400 to-amber-500 shadow-orange-200'
                                                    }`}>
                                                    {index === 0 ? <Crown className="h-4 w-4 text-white" /> : <Medal className="h-4 w-4 text-white" />}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-lg ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-amber-200' :
                                                index === 1 ? 'bg-gradient-to-br from-slate-400 to-gray-500 text-white shadow-slate-200' :
                                                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-orange-200' :
                                                        'bg-slate-200 text-slate-600'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 text-sm truncate">{operador.nombre || operador.username}</p>
                                                <p className="text-xs text-slate-400">@{operador.username}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between text-center">
                                            <div>
                                                <p className="text-lg font-black text-slate-800">{operador.totalRegistros}</p>
                                                <p className="text-xs text-slate-400">Total</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-emerald-600">{operador.vozYVoto}</p>
                                                <p className="text-xs text-slate-400">V&V</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-amber-600">{operador.soloVoz}</p>
                                                <p className="text-xs text-slate-400">SV</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-400">
                                <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Sin registros de operadores</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Métricas Footer */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        { icon: Building2, value: sucursalesStats.length, label: 'Sucursales', color: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-200' },
                        { icon: Users, value: rankingOperadores.length, label: 'Operadores Activos', color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-200' },
                        { icon: TrendingUp, value: `${(stats.conVozYVoto > 0 ? ((stats.conVozYVoto / stats.totalPadron) * 100) : 0).toFixed(1)}%`, label: 'Ratio V&V General', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200' },
                        { icon: AlertTriangle, value: stats.soloVoz.toLocaleString(), label: 'Solo Voz (Total)', color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-200' },
                    ].map((metric, index) => (
                        <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            whileHover={{ y: -3, scale: 1.02 }}
                            className={`${cardStyle} p-5 text-center`}
                        >
                            <div className={`p-3 bg-gradient-to-br ${metric.color} rounded-2xl w-fit mx-auto mb-3 shadow-lg ${metric.shadow}`}>
                                <metric.icon className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-2xl font-black text-slate-800">{metric.value}</p>
                            <p className="text-xs text-slate-400 font-medium mt-1">{metric.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
}

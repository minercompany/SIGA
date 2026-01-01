"use client";

import { useState, useEffect } from "react";
import {
    Users, ShieldCheck, TrendingUp, Building2, Clock, RefreshCw,
    Activity, UserCheck, PieChart as PieIcon, BarChart3, Award,
    Zap, Target, CheckCircle2, AlertCircle, Crown, Medal, Star
} from "lucide-react";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { RankMotivationWidget } from "./RankMotivationWidget";



import { ActivityWidget } from "./ActivityWidget";
import { ActiveUsersModal } from "./ActiveUsersModal";
import { useUserActivity } from "@/context/UserActivityContext";

interface AdminDashboardProps {
    stats: {
        totalPadron: number;
        conVozYVoto: number;
        soloVoz: number;
        presentes?: number;
        presentesVyV?: number;
        totalMeta?: number;
    } | null;
    desempeno: any[];
    ranking?: any[];
    userActivity?: {
        total: number;
        usuales: number;
        activos: number;
        activeList: any[];
        hourlyStats: { labels: string[], data: number[] };
    };
    onRefresh: (silent?: boolean) => void;
}

import { MetasWidgets } from "./MetasWidgets";

// Contador animado premium
const AnimatedCounter = ({ value, duration = 3.5 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value || 0;
        // Optimization: Reduce updates on mobile or large numbers
        const totalFrames = end > 1000 ? 20 : 50;
        const incrementValue = Math.ceil(end / totalFrames);
        const incrementTime = (duration * 1000) / totalFrames;

        const timer = setInterval(() => {
            start += incrementValue;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, incrementTime || 50);
        return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{count.toLocaleString()}</span>;
};

export function AdminDashboard({ stats, desempeno, ranking, userActivity, onRefresh }: AdminDashboardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [isActiveUsersModalOpen, setIsActiveUsersModalOpen] = useState(false);
    const [userRole, setUserRole] = useState<string>("");
    const [currentUsername, setCurrentUsername] = useState<string>("");

    // Obtener username actual
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                setCurrentUsername(parsed.username || "");
                setUserRole(parsed.rol || "");
            } catch (e) {
                console.error("Error parsing user for dashboard restrictions:", e);
            }
        }
    }, []);

    // Usar el contexto global para usuarios activos en tiempo real
    const { stats: realTimeStats } = useUserActivity();

    // Si tenemos datos del contexto, usamos esos para "activos", sino el fallback de props
    const activeUsersCount = realTimeStats.activos > 0 ? realTimeStats.activos : (userActivity?.activos || 0);

    // Persistencia del estado Auto-Sync
    // Leer al montar el componente
    useEffect(() => {
        const saved = localStorage.getItem("dashboard_autosync");
        if (saved === "true") {
            setAutoRefresh(true);
        }
    }, []);

    const handleRefresh = (silent = false) => {
        if (!silent) setIsRefreshing(true);
        onRefresh(silent);
        if (!silent) setTimeout(() => setIsRefreshing(false), 800);
    };

    // Efecto para intervalo y guardar estado
    useEffect(() => {
        // Guardar persistencia
        localStorage.setItem("dashboard_autosync", String(autoRefresh));

        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(() => handleRefresh(true), 10000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [autoRefresh]);

    if (!stats) return null;

    const presentes = stats.presentes || 0;
    const ausentes = Math.max(0, stats.totalPadron - presentes);

    // Calcular porcentaje con precisión adecuada
    const porcentajeAsistenciaRaw = stats.totalPadron > 0 ? ((presentes / stats.totalPadron) * 100) : 0;
    // Mostrar hasta 3 decimales para valores pequeños, 1 decimal para valores grandes
    const porcentajeAsistencia = porcentajeAsistenciaRaw < 1
        ? porcentajeAsistenciaRaw.toFixed(3)
        : porcentajeAsistenciaRaw.toFixed(1);

    const porcentajeHabilitacionRaw = stats.totalPadron > 0 ? ((stats.conVozYVoto / stats.totalPadron) * 100) : 0;
    const porcentajeHabilitacion = porcentajeHabilitacionRaw < 1
        ? porcentajeHabilitacionRaw.toFixed(3)
        : porcentajeHabilitacionRaw.toFixed(1);
    const quorumNecesario = Math.floor(stats.totalPadron / 2) + 1;
    const progresoQuorum = stats.totalPadron > 0 ? Math.min((presentes / quorumNecesario) * 100, 100) : 0;

    // Data para gráficos
    const pieAsistencia = [
        { name: 'Presentes', value: presentes, color: '#10b981' },
        { name: 'Ausentes', value: ausentes, color: '#e2e8f0' },
    ];

    const pieHabilitacion = [
        { name: 'Voz y Voto', value: stats.conVozYVoto, color: '#6366f1' },
        { name: 'Solo Voz', value: stats.soloVoz, color: '#f59e0b' },
    ];

    const radialData = [
        { name: 'Quorum', value: progresoQuorum, fill: progresoQuorum >= 100 ? '#10b981' : '#6366f1' }
    ];

    const topSucursales = desempeno.slice(0, 6).map((item) => ({
        name: item.sucursal?.substring(0, 8) || 'N/A',
        vyv: item.vozVoto || 0,
        sv: Math.max(0, (item.padron || 0) - (item.vozVoto || 0)),
        presentes: item.presentes || 0,
    }));

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-6 pb-12">
            <ActiveUsersModal
                isOpen={isActiveUsersModalOpen}
                onClose={() => setIsActiveUsersModalOpen(false)}
                users={userActivity?.activeList || []}
            />

            {/* Header Global Súper Premium (Consistent Light Theme) */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-white p-4 lg:p-8 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100"
            >
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-50/50 to-teal-50/30 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-50/30 to-indigo-50/30 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">

                    {/* Title Section */}
                    <div className="flex items-center gap-4 lg:gap-6">
                        <div className="relative group">
                            {/* Icon Container with Glass Effect */}
                            <div className="relative p-3 lg:p-5 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-emerald-100/50 transition-transform group-hover:scale-105 duration-500">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl" />
                                <Activity className={`h-6 w-6 lg:h-8 lg:w-8 text-emerald-500 relative z-10 transition-all duration-700 ${autoRefresh ? 'animate-pulse' : ''}`} />
                            </div>

                            {/* Live Indicator Icon */}
                            {autoRefresh && (
                                <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 z-20">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 lg:gap-3 mb-1">
                                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight">
                                    Centro de Control
                                </h1>
                                {autoRefresh && (
                                    <span className="px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-500 text-[9px] lg:text-[10px] font-black uppercase tracking-widest animate-pulse shadow-sm">
                                        LIVE
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 font-medium text-xs lg:text-sm flex items-center gap-2">
                                Panel de Monitoreo & Estadísticas
                            </p>
                        </div>
                    </div>

                    {/* Controls Section - Premium Floating Pill */}
                    <div className="self-start lg:self-auto flex items-center gap-2 bg-slate-50/80 backdrop-blur-md p-1.5 lg:p-2 pr-2.5 rounded-full border border-slate-100 shadow-inner scale-75 xs:scale-90 origin-left lg:scale-100">
                        <div
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className="cursor-pointer group flex items-center gap-3 px-4 lg:px-5 py-2 lg:py-3 rounded-full hover:bg-white transition-all duration-300 select-none border border-transparent hover:border-slate-100 hover:shadow-sm"
                        >
                            {/* Custom Toggle Switch */}
                            <div className={`relative w-10 lg:w-12 h-6 lg:h-7 rounded-full transition-colors duration-300 shadow-inner ${autoRefresh ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                <motion.div
                                    animate={{ x: autoRefresh ? (typeof window !== 'undefined' && window.innerWidth < 1024 ? 18 : 22) : 2 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className="absolute top-1 left-0 w-4 lg:w-5 h-4 lg:h-5 bg-white rounded-full shadow-md"
                                />
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none lg:leading-none">Auto-Sync</span>
                                <span className={`text-[9px] lg:text-[10px] font-bold leading-none mt-1 ${autoRefresh ? 'text-emerald-500' : 'text-slate-500'}`}>
                                    {autoRefresh ? 'ACTIVADO' : 'PAUSADO'}
                                </span>
                            </div>
                        </div>

                        <div className="w-px h-6 lg:h-8 bg-slate-200 mx-1 lg:mx-2" />

                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: "#ffffff" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleRefresh(false)}
                            disabled={isRefreshing}
                            className="relative overflow-hidden bg-white text-slate-700 px-4 lg:px-6 py-2 lg:py-3 rounded-full font-bold uppercase text-[10px] lg:text-xs tracking-wider border border-slate-200 hover:border-emerald-200 hover:text-teal-500 transition-all flex items-center gap-2 shadow-sm hover:shadow-md group"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 lg:h-4 lg:w-4 text-emerald-500 transition-transform duration-700 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                            <span className="relative z-10">Actualizar</span>
                            {isRefreshing && (
                                <span className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 animate-[loading_1s_ease-in-out_infinite] w-full" />
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* SECCIÓN DE ACTIVIDAD DE USUARIOS - SOLO SUPER_ADMIN */}
            {userRole === "SUPER_ADMIN" && userActivity && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Widget Graph (Ocupa 3 columnas en desktop grande) */}
                    <div className="md:col-span-2 lg:col-span-3 h-[380px]">
                        <ActivityWidget data={userActivity.hourlyStats.data} labels={userActivity.hourlyStats.labels} />
                    </div>

                    {/* Summary Cards (Ocupa 2 columnas) */}
                    <div className="md:col-span-2 lg:col-span-2 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 gap-4 h-full">
                        {/* Activos - Clickable (Ocupa toda la altura izquierda) */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsActiveUsersModalOpen(true)}
                            className="row-span-1 md:row-span-2 bg-gradient-to-b from-emerald-500 to-teal-700 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 text-white shadow-2xl shadow-emerald-500/30 cursor-pointer relative overflow-hidden group flex flex-col items-center justify-center border border-emerald-400/30 text-center"
                        >
                            {/* Decoración Glass - Optimized for mobile */}
                            <div className="absolute top-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />
                            <Activity className="absolute bottom-0 text-white/5 h-64 w-64 -mb-10 pointer-events-none hidden md:block" />

                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-sm transition-all group-hover:bg-black/30">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                                    En Vivo
                                </span>
                                <h3 className="text-lg font-medium text-emerald-100 mt-2">Usuarios Conectados</h3>
                            </div>

                            <div className="relative z-10 my-2 lg:my-4">
                                <div className="text-6xl xs:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter drop-shadow-2xl">
                                    <AnimatedCounter value={activeUsersCount} />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 group-hover:border-white/30">
                                    <Users size={14} />
                                    <span>Ver Lista Completa</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Usuales (Derecha arriba) */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden flex flex-col items-center justify-center text-center group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-110" />

                            <div className="relative z-10 mb-1">
                                <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-500 rounded-2xl mb-2 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <UserCheck className="h-6 w-6" strokeWidth={2.5} />
                                </div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Usuarios Usuales</p>
                            </div>
                            <p className="relative z-10 text-5xl lg:text-6xl font-black text-slate-800 tracking-tighter leading-none"><AnimatedCounter value={userActivity.usuales} /></p>
                        </motion.div>

                        {/* Total (Derecha abajo) */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden flex flex-col items-center justify-center text-center group"
                        >
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none transition-transform group-hover:scale-110 hidden md:block" />

                            <div className="relative z-10 mb-1">
                                <div className="inline-flex items-center justify-center p-2 lg:p-3 bg-indigo-50 text-indigo-500 rounded-2xl mb-2 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <Users className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={2.5} />
                                </div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Cuentas</p>
                            </div>
                            <p className="relative z-10 text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tighter leading-none"><AnimatedCounter value={userActivity.total} /></p>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Widget de Motivación basado en Ranking */}
            {ranking && ranking.length > 0 && currentUsername && (
                <RankMotivationWidget
                    ranking={ranking}
                    currentUsername={currentUsername}
                />
            )}

            {/* WIDGETS DE METAS DE REGISTRO */}
            <MetasWidgets />

            {/* KPIs Premium 'Nano' Style */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
                {
                    [
                        { label: "Meta Global", value: stats.totalMeta || 0, icon: Target, gradient: "from-pink-500 via-rose-600 to-rose-700", shadow: "shadow-rose-500/40", ring: "ring-rose-400/30" },
                        { label: "Total Padrón", value: stats.totalPadron, icon: Users, gradient: "from-blue-500 via-blue-600 to-blue-700", shadow: "shadow-blue-500/40", ring: "ring-blue-400/30" },
                        { label: "Habilitados V&V", value: stats.conVozYVoto, icon: ShieldCheck, gradient: "from-emerald-500 via-emerald-500 to-teal-500", shadow: "shadow-emerald-500/40", ring: "ring-emerald-400/30" },
                        { label: "Presentes Ahora", value: presentes, icon: UserCheck, gradient: "from-violet-500 via-purple-600 to-purple-700", shadow: "shadow-purple-500/40", ring: "ring-purple-400/30" },
                        { label: "Solo Voz", value: stats.soloVoz, icon: AlertCircle, gradient: "from-amber-400 via-orange-500 to-orange-600", shadow: "shadow-orange-500/40", ring: "ring-orange-400/30" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className={`relative overflow-hidden rounded-[2rem] p-6 lg:p-8 text-white shadow-2xl bg-gradient-to-br ${stat.shadow} ${stat.gradient} group`}
                        >
                            {/* Glossy Overlay/Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none" />
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-colors" />

                            {/* Inner Highlight Ring */}
                            <div className={`absolute inset-0 rounded-[2rem] border border-white/20 ${stat.ring} pointer-events-none`} />

                            {/* Background Icon */}
                            <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110">
                                <stat.icon className="h-32 w-32" />
                            </div>

                            {/* Content */}
                            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                {/* Header: Icon + Label */}
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner border border-white/20">
                                        <stat.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 drop-shadow-sm">
                                        {stat.label}
                                    </span>
                                </div>

                                {/* Value */}
                                <div className="mt-auto">
                                    <p className="text-4xl xs:text-5xl md:text-5xl lg:text-6xl font-black tracking-tighter drop-shadow-lg leading-none">
                                        <AnimatedCounter value={stat.value} />
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                }
            </div >

            {/* Barra de Progreso Quórum Premium */}
            < motion.div
                initial={{ opacity: 0, y: 20 }
                }
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
                            <Target className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg">Progreso de Asistencia</h3>
                            <p className="text-slate-400 text-xs font-medium">Asistencia sobre el total de padrón</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-black text-slate-800">{porcentajeAsistencia}%</p>
                        <p className="text-slate-400 text-sm font-medium">{presentes.toLocaleString()} / {stats.totalPadron.toLocaleString()}</p>
                    </div>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(porcentajeAsistenciaRaw, 100)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full rounded-full relative ${porcentajeAsistenciaRaw >= 50 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse" />
                    </motion.div>
                </div>

            </motion.div >

            {/* Grid Principal de Estadísticas */}
            < div className="grid grid-cols-1 lg:grid-cols-3 gap-6" >

                {/* Gráfico Radial de Quórum */}
                < motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-200">
                            <PieIcon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Asistencia en Vivo</h3>
                    </div>

                    <div className="h-[220px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="95%" data={radialData} startAngle={90} endAngle={-270}>
                                <RadialBar background dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
                            <span className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight">{porcentajeAsistencia}%</span>
                            <span className="text-emerald-500 font-bold text-[9px] uppercase tracking-wider">Presentes</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                            <p className="text-2xl font-black text-emerald-500">{presentes.toLocaleString()}</p>
                            <p className="text-emerald-500/70 text-xs font-bold uppercase tracking-widest">Presentes</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                            <p className="text-2xl font-black text-slate-600">{ausentes.toLocaleString()}</p>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Ausentes</p>
                        </div>
                    </div>
                </motion.div >

                {/* Gráfico de Habilitación */}
                < motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Estado Habilitación</h3>
                    </div>

                    <div className="h-[220px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieHabilitacion}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieHabilitacion.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
                            <span className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight">{porcentajeHabilitacion}%</span>
                            <span className="text-indigo-500 font-bold text-[9px] uppercase tracking-wider">Habilitados</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
                            <p className="text-2xl font-black text-indigo-600">{stats.conVozYVoto.toLocaleString()}</p>
                            <p className="text-indigo-600/70 text-xs font-bold uppercase tracking-widest">Voz y Voto</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                            <p className="text-2xl font-black text-amber-600">{stats.soloVoz.toLocaleString()}</p>
                            <p className="text-amber-600/70 text-xs font-bold uppercase tracking-widest">Solo Voz</p>
                        </div>
                    </div>
                </motion.div >

                {/* Ranking de Operadores */}
                {/* Ranking de Operadores - DISEÑO PREMIUM */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col justify-between overflow-hidden relative"
                >
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-100/40 to-orange-100/40 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none" />

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-200">
                                <Award className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-wider text-base">Top Operadores</h3>
                                <p className="text-slate-400 text-xs font-bold">Líderes en asignaciones</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                            En Tiempo Real
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10 flex-1">
                        {ranking && ranking.length > 0 ? (
                            ranking.slice(0, 5).map((op, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 + 0.3 }}
                                    className={`group flex items-center gap-4 p-4 rounded-2xl transition-all border ${i === 0
                                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100 hover:shadow-md hover:shadow-amber-100/50'
                                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm'
                                        }`}
                                >
                                    {/* Ranking Badge - NÚMERO GRANDE */}
                                    <div className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center transition-transform group-hover:scale-110 shadow-lg shrink-0 ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-orange-200' :
                                        i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-200' :
                                            i === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-700 text-white shadow-orange-200' :
                                                'bg-slate-100 text-slate-400'
                                        }`}>
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-90">TOP</span>
                                        <span className="text-2xl font-black leading-none -mt-0.5">{i + 1}</span>
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col">
                                            <p className={`font-bold text-sm truncate ${i === 0 ? 'text-slate-800' : 'text-slate-700'}`}>
                                                {op.nombre || op.username}
                                            </p>
                                            <p className="text-slate-400 text-xs font-medium">@{op.username}</p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="text-right pl-4 border-l border-slate-100">
                                        <p className={`font-black text-xl ${i === 0 ? 'text-orange-500' : 'text-slate-700'}`}>
                                            {op.totalRegistros}
                                        </p>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Socios</p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                                <div className="p-4 bg-slate-50 rounded-full mb-3">
                                    <Clock className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sin actividad registrada</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div >

            {/* Segunda Fila - Gráficos Grandes */}
            < div className="grid grid-cols-1 lg:grid-cols-2 gap-6" >
                {/* Gráfico Torta Composición por Sucursal (Voz y Voto vs Solo Voz) */}
                < motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-200">
                                <PieIcon className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Composición por Sucursal</h3>
                        </div>
                    </div>

                    <div className="h-[280px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieHabilitacion}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                                    labelLine={false}
                                >
                                    {pieHabilitacion.map((entry, index) => (
                                        <Cell key={`cell-comp-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
                                    formatter={(value) => (value as number).toLocaleString()}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-black text-slate-800">{stats.totalPadron.toLocaleString()}</span>
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total Padrón</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white text-center shadow-lg shadow-indigo-200">
                            <p className="text-3xl font-black">{stats.conVozYVoto.toLocaleString()}</p>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">Voz y Voto</p>
                            <p className="text-white/60 text-[10px] font-bold mt-1">{porcentajeHabilitacion}%</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white text-center shadow-lg shadow-amber-200">
                            <p className="text-3xl font-black">{stats.soloVoz.toLocaleString()}</p>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">Solo Voz</p>
                            <p className="text-white/60 text-[10px] font-bold mt-1">{(100 - parseFloat(porcentajeHabilitacion)).toFixed(1)}%</p>
                        </div>
                    </div>
                </motion.div >

                {/* Tabla de Ranking Regional */}
                < motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-lg">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Ranking Regional</h3>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase">Top 8</span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-100">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Sucursal</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Padrón</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">V&V</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-slate-500 uppercase tracking-wider">%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {desempeno.slice(0, 8).map((row, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${i < 3 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                <span className="font-bold text-slate-700 text-sm">{row.sucursal}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-800 text-sm">{row.padron?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-bold text-indigo-600 text-sm">{row.vozVoto?.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                        style={{ width: `${Math.min(row.ratio, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-black text-slate-500 w-10">{row.ratio}%</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div >
            </div >

            {/* Mini Stats Footer */}
            < div className="grid grid-cols-2 lg:grid-cols-4 gap-4" >
                {
                    [
                        { label: "Sucursales", value: desempeno.length, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
                        { label: "Operadores Activos", value: ranking?.length || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Ratio VyV", value: `${porcentajeHabilitacion}%`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
                        { label: "Meta Quórum", value: quorumNecesario.toLocaleString(), icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            whileHover={{ y: -3 }}
                            className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center gap-4"
                        >
                            <div className={`p-3 ${stat.bg} rounded-xl`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))
                }
            </div >
        </div >
    );
}

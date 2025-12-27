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

interface AdminDashboardProps {
    stats: {
        totalPadron: number;
        conVozYVoto: number;
        soloVoz: number;
        presentes?: number;
        presentesVyV?: number;
    } | null;
    desempeno: any[];
    ranking?: any[];
    onRefresh: (silent?: boolean) => void;
}

// Contador animado premium
const AnimatedCounter = ({ value, duration = 1.5 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        const incrementTime = (duration * 1000) / end;
        const timer = setInterval(() => {
            start += Math.ceil(end / 50);
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, incrementTime);
        return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{count.toLocaleString()}</span>;
};

export function AdminDashboard({ stats, desempeno, ranking, onRefresh }: AdminDashboardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const handleRefresh = (silent = false) => {
        if (!silent) setIsRefreshing(true);
        onRefresh(silent);
        if (!silent) setTimeout(() => setIsRefreshing(false), 800);
    };

    useEffect(() => {
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
            {/* Header Premium con Gradiente */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 p-8 text-white shadow-2xl"
            >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20"
                        >
                            <Activity className="h-10 w-10 text-emerald-400" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                                Centro de Control
                            </h1>
                            <p className="text-white/60 font-medium flex items-center gap-2 mt-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Monitoreo en tiempo real
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur px-4 py-3 rounded-2xl flex items-center gap-3 border border-white/10">
                            <span className="text-xs font-bold uppercase text-white/60 tracking-widest">Auto-Sync</span>
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${autoRefresh ? 'bg-emerald-500' : 'bg-white/20'}`}
                            >
                                <motion.div
                                    animate={{ x: autoRefresh ? 28 : 4 }}
                                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                                />
                            </button>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRefresh(false)}
                            disabled={isRefreshing}
                            className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black uppercase text-sm tracking-wide hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-xl"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Actualizar
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* KPIs Premium con Animaciones */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Padrón", value: stats.totalPadron, icon: Users, gradient: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/25" },
                    { label: "Habilitados V&V", value: stats.conVozYVoto, icon: ShieldCheck, gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/25" },
                    { label: "Presentes Ahora", value: presentes, icon: UserCheck, gradient: "from-purple-500 to-indigo-600", shadow: "shadow-purple-500/25" },
                    { label: "Solo Voz", value: stats.soloVoz, icon: AlertCircle, gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/25" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} rounded-[1.5rem] p-6 text-white shadow-xl ${stat.shadow}`}
                    >
                        <div className="absolute -right-4 -top-4 opacity-20">
                            <stat.icon className="h-24 w-24" />
                        </div>
                        <div className="relative">
                            <div className="p-3 bg-white/20 backdrop-blur rounded-xl w-fit mb-4">
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <p className="text-4xl lg:text-5xl font-black tracking-tight">
                                <AnimatedCounter value={stat.value} />
                            </p>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-2">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Barra de Progreso Quórum Premium */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
                            <Target className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg">Progreso hacia el Quórum</h3>
                            <p className="text-slate-400 text-xs font-medium">Se requiere el 50% + 1 del padrón</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-black text-slate-800">{progresoQuorum.toFixed(1)}%</p>
                        <p className="text-slate-400 text-sm font-medium">{presentes.toLocaleString()} / {quorumNecesario.toLocaleString()}</p>
                    </div>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progresoQuorum}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full rounded-full relative ${progresoQuorum >= 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse" />
                    </motion.div>
                </div>
                {progresoQuorum >= 100 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-bold"
                    >
                        <CheckCircle2 className="h-5 w-5" />
                        <span>¡QUÓRUM ALCANZADO!</span>
                        <Zap className="h-5 w-5 animate-pulse" />
                    </motion.div>
                )}
            </motion.div>

            {/* Grid Principal de Estadísticas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Gráfico Radial de Quórum */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-200">
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
                            <p className="text-2xl font-black text-emerald-600">{presentes.toLocaleString()}</p>
                            <p className="text-emerald-600/70 text-xs font-bold uppercase tracking-widest">Presentes</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                            <p className="text-2xl font-black text-slate-600">{ausentes.toLocaleString()}</p>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Ausentes</p>
                        </div>
                    </div>
                </motion.div>

                {/* Gráfico de Habilitación */}
                <motion.div
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
                </motion.div>

                {/* Ranking de Operadores */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 shadow-xl text-white"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                            <Award className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-black uppercase tracking-wider text-sm">Top Operadores</h3>
                    </div>

                    <div className="space-y-3">
                        {ranking && ranking.length > 0 ? (
                            ranking.slice(0, 5).map((op, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl backdrop-blur border border-white/10 hover:bg-white/10 transition-all"
                                >
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-500/30' :
                                        i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700' :
                                            i === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white' :
                                                'bg-white/10 text-white/60'
                                        }`}>
                                        {i === 0 ? <Crown className="h-5 w-5" /> : i === 1 ? <Medal className="h-5 w-5" /> : i === 2 ? <Star className="h-5 w-5" /> : i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{op.nombre || op.username}</p>
                                        <p className="text-white/40 text-xs">@{op.username}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lg text-emerald-400">{op.totalRegistros}</p>
                                        <p className="text-white/40 text-xs uppercase">Registros</p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-white/30">
                                <Clock className="h-12 w-12 mb-3" />
                                <p className="text-sm font-bold uppercase tracking-widest">Sin actividad</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Segunda Fila - Gráficos Grandes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico Torta Composición por Sucursal (Voz y Voto vs Solo Voz) */}
                <motion.div
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
                </motion.div>

                {/* Tabla de Ranking Regional */}
                <motion.div
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
                </motion.div>
            </div>

            {/* Mini Stats Footer */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Sucursales", value: desempeno.length, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Operadores Activos", value: ranking?.length || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Ratio VyV", value: `${porcentajeHabilitacion}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
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
                ))}
            </div>
        </div>
    );
}

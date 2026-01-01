
"use client";

import { Users, UserCheck, AlertCircle, TrendingUp, PieChart as PieIcon, Activity, Sparkles, Zap, Trophy } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, Variants } from 'framer-motion';
import { useEffect, useState } from "react";
import axios from "axios";
import { useTour, dashboardSocioTour, dashboardAdminTour } from '../tour';

interface SocioDashboardProps {
    misListas: any[];
}

export function SocioDashboard({ misListas }: SocioDashboardProps) {
    const [stats, setStats] = useState({ total: 0, vyv: 0, soloVoz: 0, presentes: 0, ausentes: 0 });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");
    const [sociosDetalle, setSociosDetalle] = useState<any[]>([]);
    const [statsGlobales, setStatsGlobales] = useState({ totalHabilitados: 0, presentesGlobal: 0 });
    const [rankingOperadores, setRankingOperadores] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string>("");

    // Obtener nombre del usuario y hora del día
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const user = JSON.parse(userData);
                // Guardar el rol
                setUserRole(user.rol || "");

                // Intentar obtener el nombre completo primero, luego nombre, luego username
                let displayName = user.nombreCompleto || user.nombre || user.username || "Usuario";

                // Convertir a formato título (primera letra mayúscula, resto minúscula)
                displayName = displayName
                    .toLowerCase()
                    .split(' ')
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                setUserName(displayName);
            } catch (error) {
                console.error("Error parsing user data:", error);
                setUserName("Usuario");
            }
        }
    }, []);

    // DEBUG: Log para verificar que el componente se monta
    useEffect(() => {
        console.log("DASHBOARD_VERSION: 2.0 - RANKING SQL FIX");
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/asignaciones/stats-socio", {
                    headers: { Authorization: `Bearer ${token} ` }
                });
                setStats(res.data);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [misListas]);

    useEffect(() => {
        const fetchStatsGlobales = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/socios/stats-globales", {
                    headers: { Authorization: `Bearer ${token} ` }
                });
                setStatsGlobales(res.data);
            } catch (error) {
                console.error("Error fetching stats globales:", error);
            }
        };
        fetchStatsGlobales();
    }, [misListas]);

    useEffect(() => {
        const fetchSociosDetalle = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/asignaciones/mis-socios-detalle", {
                    headers: { Authorization: `Bearer ${token} ` }
                });
                setSociosDetalle(res.data);
            } catch (error) {
                console.error("Error fetching socios detalle:", error);
            }
        };
        fetchSociosDetalle();
    }, [misListas]);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/asignaciones/ranking-usuarios", {
                    headers: { Authorization: `Bearer ${token} ` }
                });
                // Tomar solo el top 5
                setRankingOperadores(res.data.slice(0, 5));
            } catch (error) {
                console.error("Error fetching ranking:", error);
            }
        };
        fetchRanking();
    }, [misListas]);

    // Tour: Iniciar automáticamente la primera vez
    const { startTour, hasSeenTour } = useTour();



    // Función para obtener saludo dinámico según la hora del día
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Buenos días";
        if (hour >= 12 && hour < 19) return "Buenas tardes";
        return "Buenas noches";
    };

    const pieData = [
        { name: 'Voz y Voto', value: stats.vyv, color: '#10b981' },
        { name: 'Solo Voz', value: stats.soloVoz, color: '#f59e0b' },
    ];

    const effectiveness = stats.total > 0 ? Math.round((stats.vyv / stats.total) * 100) : 0;
    // Usar estadísticas globales para la presencia (todos los habilitados)
    const presencePercentage = statsGlobales.totalHabilitados > 0
        ? Math.round((statsGlobales.presentesGlobal / statsGlobales.totalHabilitados) * 100)
        : 0;

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants: Variants = {
        hidden: { y: 30, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Sparkles className="h-10 w-10 text-emerald-500" />
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12 px-4 md:px-6"
        >
            {/* Header Premium - Compacto */}
            <motion.div
                variants={itemVariants}
                data-tour="header"
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-4 md:p-5 text-white"
            >
                <div className="absolute top-0 right-0 h-48 w-48 bg-white/10 rounded-full blur-[80px]" />
                <div className="absolute -bottom-16 -left-16 h-48 w-48 bg-emerald-300/20 rounded-full blur-[80px]" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl"
                        >
                            <Sparkles className="h-5 w-5" />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                                {getGreeting()}, {userName}
                            </h1>
                            <p className="text-xs md:text-sm text-emerald-50/80 font-medium">
                                Gestión de tus socios asignados en tiempo real
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Métricas Principales Premium */}
            <div data-tour="stats-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: "Socios Asignados", value: stats.total, icon: Users, color: "emerald", delay: 0 },
                    { label: "Con Voz y Voto", value: stats.vyv, icon: UserCheck, color: "blue", delay: 0.1 },
                    { label: "Solo Voz", value: stats.soloVoz, icon: AlertCircle, color: "amber", delay: 0.2 },
                    { label: "Presentes", value: stats.presentes, icon: Zap, color: "violet", delay: 0.3 },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative group"
                    >
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br opacity-40 group-hover:opacity-100 transition-opacity duration-500 blur-xl rounded-3xl
                            ${stat.color === 'emerald' ? 'from-emerald-400 to-teal-400' :
                                stat.color === 'blue' ? 'from-blue-400 to-cyan-400' :
                                    stat.color === 'amber' ? 'from-amber-400 to-orange-400' :
                                        'from-violet-400 to-purple-400'}`}
                        />

                        {/* Card Content */}
                        <div className="relative bg-white/90 backdrop-blur-2xl p-5 md:p-6 rounded-3xl border border-white/60 shadow-xl overflow-hidden h-full">
                            {/* Decorative Background Icon */}
                            <stat.icon className={`absolute -right-4 -bottom-4 h-24 w-24 opacity-[0.03] transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500
                                ${stat.color === 'emerald' ? 'text-emerald-600' :
                                    stat.color === 'blue' ? 'text-blue-600' :
                                        stat.color === 'amber' ? 'text-amber-600' :
                                            'text-violet-600'}`}
                            />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className={`inline-flex p-3 rounded-2xl mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300
                                        ${stat.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30' :
                                            stat.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/30' :
                                                stat.color === 'amber' ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30' :
                                                    'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30'}`}
                                    >
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-none group-hover:translate-x-1 transition-transform duration-300">
                                        {stat.value}
                                    </h2>
                                    <p className={`text-[10px] md:text-xs font-bold uppercase tracking-widest mt-2
                                        ${stat.color === 'emerald' ? 'text-emerald-600' :
                                            stat.color === 'blue' ? 'text-blue-600' :
                                                stat.color === 'amber' ? 'text-amber-600' :
                                                    'text-violet-600'}`}
                                    >
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Distribución de Socios con Glassmorphism */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-2 relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-emerald-500/20 rounded-3xl md:rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl md:rounded-[3rem] p-6 md:p-8 border border-white/20 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                            <div className="p-2.5 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl shadow-inner">
                                <PieIcon className="h-5 w-5 text-slate-700" />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs md:text-sm">
                                Análisis de Habilitación
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                            <div className="h-56 md:h-64 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={10}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell - ${index} `} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", delay: 0.5 }}
                                        className="text-4xl md:text-5xl font-black bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent"
                                    >
                                        {effectiveness}%
                                    </motion.span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                        Efectividad
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 md:space-y-4">
                                {pieData.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ x: 5 }}
                                        className="flex items-center justify-between p-4 md:p-5 rounded-2xl md:rounded-3xl bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/50 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-4 w-4 rounded-full shadow-lg"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-xl md:text-2xl font-black text-slate-800">
                                            {item.value}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Card condicional según rol */}
                {userRole === "SUPER_ADMIN" ? (
                    /* Card de TOP OPERADORES Premium - Solo SUPER_ADMIN */
                    <motion.div
                        variants={itemVariants}
                        className="relative overflow-hidden rounded-3xl md:rounded-[3rem] min-h-[300px] md:min-h-[450px] group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                        <div className="absolute top-0 right-0 h-64 w-64 bg-amber-500/20 rounded-full blur-[120px] group-hover:bg-amber-500/30 transition-all duration-700" />
                        <div className="absolute -bottom-20 -left-20 h-64 w-64 bg-orange-500/20 rounded-full blur-[120px] group-hover:bg-orange-500/30 transition-all duration-700" />

                        <div className="relative z-10 p-6 md:p-8 h-full flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <motion.div
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                    className="h-14 w-14 md:h-16 md:w-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/50"
                                >
                                    <Trophy className="h-7 w-7 md:h-8 md:w-8 text-white" />
                                </motion.div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">
                                        TOP OPERADORES
                                    </h3>
                                    <p className="text-slate-400 text-xs md:text-sm font-medium">
                                        Ranking por socios asignados
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3">
                                {rankingOperadores.length > 0 ? (
                                    rankingOperadores.map((operador, index) => (
                                        <motion.div
                                            key={operador.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="relative group/item"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl opacity-0 group-hover/item:opacity-100 transition-opacity blur-xl" />
                                            <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:border-amber-500/50 transition-all">
                                                <div className="flex items-center gap-4">
                                                    {/* Badge de posición */}
                                                    <div className={`flex - shrink - 0 h - 10 w - 10 rounded - xl flex items - center justify - center font - black text - lg shadow - lg ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                                                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                                                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                                                                'bg-slate-700 text-slate-300'
                                                        } `}>
                                                        {index + 1}
                                                    </div>

                                                    {/* Info del operador */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-white text-sm md:text-base truncate">
                                                            {operador.nombre}
                                                        </h4>
                                                        <p className="text-xs text-slate-400">
                                                            @{operador.username}
                                                        </p>
                                                    </div>

                                                    {/* Badge de socios */}
                                                    <div className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-emerald-400" />
                                                            <span className="font-black text-white text-sm">
                                                                {operador.totalAsignados}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-emerald-300 font-medium uppercase block text-center">
                                                            Socios
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <Trophy className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                                            <p className="text-slate-400 font-medium">
                                                No hay datos de ranking aún
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* Card de Ratio de Asistencia de Mi Lista - Diseño Premium Pastel Emerald */
                    <motion.div
                        variants={itemVariants}
                        data-tour="ratio-card"
                        className="relative overflow-hidden rounded-3xl md:rounded-[3rem] min-h-[300px] md:min-h-[400px] group shadow-2xl shadow-emerald-500/30"
                    >
                        {/* Fondo Gradiente Pastel/Vibrante */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600" />

                        {/* Efectos de Luz Suaves */}
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-[-20%] right-[-20%] h-[500px] w-[500px] bg-white/20 rounded-full blur-[100px]"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute bottom-[-10%] left-[-10%] h-[400px] w-[400px] bg-teal-300/20 rounded-full blur-[80px]"
                        />

                        {/* Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.1]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }}
                        />

                        <div className="relative z-10 p-8 md:p-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between">
                                    <motion.div
                                        whileHover={{ rotate: 360, scale: 1.1 }}
                                        transition={{ duration: 0.8, type: "spring" }}
                                        className="h-16 w-16 md:h-20 md:w-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/40 shadow-lg"
                                    >
                                        <TrendingUp className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow-md" />
                                    </motion.div>

                                    <div className="group/live cursor-pointer">
                                        <div className="px-5 py-2.5 bg-black/20 border border-white/30 rounded-full backdrop-blur-md flex items-center gap-3 transition-all hover:bg-black/30">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
                                            </span>
                                            <span className="text-xs font-black text-white tracking-widest">EN VIVO</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10">
                                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-3 drop-shadow-sm">
                                        Asistencia de Mi Lista
                                    </h3>
                                    <p className="text-white text-sm md:text-base font-bold flex items-center gap-2 opacity-90">
                                        <Users className="h-4 w-4" />
                                        <span>{stats.presentes} presentes de {stats.total} asignados</span>
                                    </p>
                                </div>

                                <div className="mt-8 relative">
                                    <motion.span
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-8xl md:text-9xl font-black text-white drop-shadow-lg"
                                    >
                                        {stats.total > 0 ? Math.round((stats.presentes / stats.total) * 100) : 0}%
                                    </motion.span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <div className="relative h-5 bg-black/20 backdrop-blur-sm rounded-full overflow-hidden border border-white/20 shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.total > 0 ? (stats.presentes / stats.total) * 100 : 0}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                                        className="h-full bg-white relative shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                    >
                                        <motion.div
                                            animate={{ x: ["-100%", "100%"] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent w-1/2"
                                        />
                                    </motion.div>
                                </div>

                                <div className="flex justify-between mt-4 text-xs md:text-sm font-bold tracking-wide text-white">
                                    <span className="flex items-center gap-1.5 drop-shadow-md">
                                        <span className="h-2 w-2 rounded-full bg-white shadow-sm"></span>
                                        {stats.presentes} presentes
                                    </span>
                                    <span className="opacity-80 flex items-center gap-1.5 drop-shadow-md">
                                        <span className="h-2 w-2 rounded-full bg-white/60"></span>
                                        {stats.ausentes} pendientes
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Mis Listas con diseño premium */}
            <motion.div
                variants={itemVariants}
                data-tour="mis-listas"
                className="relative group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-3xl md:rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl md:rounded-[3rem] border border-white/20 overflow-hidden shadow-2xl">
                    <div className="p-6 md:p-8 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg shadow-violet-500/30">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs md:text-sm">
                                Mis Listas de Asignación
                            </h3>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {misListas.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {misListas.map((lista, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        className="relative group/card"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                                        <div className="relative p-5 md:p-6 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-lg">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="h-10 w-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                                                    <Users className="h-5 w-5 text-white" />
                                                </div>
                                                <span className="px-3 py-1 bg-emerald-100 text-teal-500 rounded-full text-[10px] font-bold">
                                                    {lista.total}
                                                </span>
                                            </div>
                                            <h4 className="font-black text-slate-800 text-sm md:text-base mb-1 line-clamp-2">
                                                {lista.nombre}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Socios asignados
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="inline-flex p-6 bg-slate-100 rounded-3xl mb-4">
                                    <Users className="h-12 w-12 text-slate-300" />
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                                    Aún no tienes listas de asignación
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Mis Socios Asignados con Estado */}
            <motion.div
                variants={itemVariants}
                className="relative group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl md:rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl md:rounded-[3rem] border border-white/20 overflow-hidden shadow-2xl">
                    <div className="p-6 md:p-8 border-b border-slate-100/50 bg-gradient-to-r from-emerald-50/80 to-white/80 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30">
                                    <UserCheck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs md:text-sm">
                                        Mis Socios Asignados
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                        Estado de asistencia en tiempo real
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-full">
                                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-bold text-teal-500">{stats.presentes} Presentes</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                                    <div className="h-2 w-2 bg-slate-400 rounded-full" />
                                    <span className="text-xs font-bold text-slate-600">{stats.ausentes} Ausentes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {sociosDetalle.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sociosDetalle.map((socio, i) => (
                                    <motion.div
                                        key={socio.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="relative group/socio"
                                    >
                                        <div className={`absolute inset - 0 rounded - 2xl blur - lg opacity - 0 group - hover / socio: opacity - 100 transition - opacity duration - 300 ${socio.presente ? 'bg-emerald-500/20' : 'bg-slate-300/20'
                                            } `} />
                                        <div className="relative p-4 bg-white rounded-2xl border border-slate-200/50 shadow-md hover:shadow-lg transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-800 text-sm truncate">
                                                        {socio.nombreCompleto}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        Socio #{socio.numeroSocio}
                                                    </p>
                                                </div>
                                                {socio.presente ? (
                                                    <div className="flex-shrink-0 px-2.5 py-1 bg-emerald-100 text-teal-500 rounded-lg flex items-center gap-1.5">
                                                        <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                        <span className="text-[10px] font-bold uppercase">Presente</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex-shrink-0 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg flex items-center gap-1.5">
                                                        <div className="h-1.5 w-1.5 bg-slate-400 rounded-full" />
                                                        <span className="text-[10px] font-bold uppercase">Ausente</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                <span className="font-medium">CI: {socio.cedula}</span>
                                                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded font-bold">
                                                    {socio.lista}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="inline-flex p-6 bg-slate-100 rounded-3xl mb-4">
                                    <UserCheck className="h-12 w-12 text-slate-300" />
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                                    No tienes socios asignados aún
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Clock, TrendingUp, Download, Filter, Search, AlertCircle,
    CheckCircle, Activity, Calendar, BarChart3, FileText, X, Award,
    Zap, Target, TrendingDown, Eye, Building2, Crown, Medal
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface UsuarioActivity {
    id: number;
    username: string;
    nombreCompleto: string;
    rol: string;
    sucursal: string;
    lastLogin: string | null;
    loginCount: number;
    totalOnlineSeconds: number;
    isOnline: boolean;
    totalRegistros: number;
    totalAsignaciones: number;
    timeOnlineFormatted: string;
    lastSeenRelative: string;
}

export default function AuditoriaUsuariosPage() {
    const [usuarios, setUsuarios] = useState<UsuarioActivity[]>([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState<UsuarioActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filtro, setFiltro] = useState<"todos" | "habituales" | "no-entraron">("todos");
    const [selectedUser, setSelectedUser] = useState<UsuarioActivity | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "cards">("table");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Aplicar filtros directamente en el useEffect
        let result = [...usuarios];

        if (filtro === "habituales") {
            result = result.filter((u) => u.lastLogin !== null || u.totalOnlineSeconds > 0 || u.totalRegistros > 0 || u.totalAsignaciones > 0);
        } else if (filtro === "no-entraron") {
            result = result.filter((u) => u.lastLogin === null && u.totalOnlineSeconds === 0 && u.totalRegistros === 0 && u.totalAsignaciones === 0);
        }

        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase().trim();
            result = result.filter(
                (u) =>
                    u.nombreCompleto.toLowerCase().includes(search) ||
                    u.username.toLowerCase().includes(search)
            );
        }

        setFilteredUsuarios(result);
    }, [searchTerm, filtro, usuarios]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            console.log("[Audit] Fetching data from:", `${process.env.NEXT_PUBLIC_API_URL}/api/usuarios/reporte-actividad`);
            console.log("[Audit] Token exists:", !!token);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuarios/reporte-actividad`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("[Audit] Response status:", res.status);

            if (res.ok) {
                const data = await res.json();
                console.log("[Audit] Data received:", data.length, "users");
                console.log("[Audit] Sample user:", data[0]);
                setUsuarios(data);
            } else {
                const errorText = await res.text();
                console.error("[Audit] Error response:", res.status, errorText);
            }
        } catch (error) {
            console.error("[Audit] Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Métricas avanzadas calculadas
    const advancedMetrics = useMemo(() => {
        const activeUsers = usuarios.filter(u => u.lastLogin !== null);
        const totalLogins = activeUsers.reduce((sum, u) => sum + u.loginCount, 0);
        const totalOnlineTime = activeUsers.reduce((sum, u) => sum + u.totalOnlineSeconds, 0);
        const totalRegistros = activeUsers.reduce((sum, u) => sum + u.totalRegistros, 0);

        return {
            avgLoginsPerUser: activeUsers.length > 0 ? (totalLogins / activeUsers.length).toFixed(1) : 0,
            avgSessionTime: activeUsers.length > 0 ? Math.floor(totalOnlineTime / activeUsers.length / 60) : 0,
            avgRegistrosPerUser: activeUsers.length > 0 ? (totalRegistros / activeUsers.length).toFixed(1) : 0,
            mostActiveUser: activeUsers.sort((a, b) => b.loginCount - a.loginCount)[0],
            mostProductiveUser: activeUsers.sort((a, b) => b.totalRegistros - a.totalRegistros)[0],
        };
    }, [usuarios]);

    // Top 10 usuarios
    const topUsers = useMemo(() => {
        return [...usuarios]
            .filter(u => u.lastLogin !== null)
            .sort((a, b) => b.totalRegistros - a.totalRegistros)
            .slice(0, 10);
    }, [usuarios]);

    // Agrupación por sucursal
    const sucursalStats = useMemo(() => {
        const grouped = usuarios.reduce((acc, u) => {
            const suc = u.sucursal || "Sin Sucursal";
            if (!acc[suc]) {
                acc[suc] = { total: 0, activos: 0, registros: 0 };
            }
            acc[suc].total++;
            if (u.lastLogin) acc[suc].activos++;
            acc[suc].registros += u.totalRegistros;
            return acc;
        }, {} as Record<string, { total: number; activos: number; registros: number }>);

        return Object.entries(grouped).map(([nombre, stats]) => ({
            nombre,
            ...stats,
        })).sort((a, b) => b.registros - a.registros);
    }, [usuarios]);

    // Usuarios inactivos (más de 7 días sin ingresar)
    const inactiveUsers = useMemo(() => {
        return usuarios.filter(u => {
            if (!u.lastLogin) return false;
            const daysSince = Math.floor((Date.now() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24));
            return daysSince > 7;
        });
    }, [usuarios]);

    const exportPDF = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/usuarios/exportar-pdf?filtro=${filtro}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "auditoria_usuarios.pdf";
        a.click();
    };

    const exportExcel = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/usuarios/exportar-excel?filtro=${filtro}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "auditoria_usuarios.xlsx";
        a.click();
    };

    const stats = {
        total: usuarios.length,
        online: usuarios.filter((u) => u.isOnline).length,
        habituales: usuarios.filter((u) => u.lastLogin !== null || u.totalOnlineSeconds > 0 || u.totalRegistros > 0 || u.totalAsignaciones > 0).length,
        noEntraron: usuarios.filter((u) => u.lastLogin === null && u.totalOnlineSeconds === 0 && u.totalRegistros === 0 && u.totalAsignaciones === 0).length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-bold">Cargando análisis...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-8">
            {/* Modal de Detalle de Usuario */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedUser(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                            {selectedUser.nombreCompleto.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800">{selectedUser.nombreCompleto}</h2>
                                            <p className="text-slate-500 font-medium">@{selectedUser.username}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        <X className="h-6 w-6 text-slate-400" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {[
                                        { label: "Total Ingresos", value: selectedUser.loginCount, icon: TrendingUp, color: "from-blue-500 to-blue-600" },
                                        { label: "Tiempo Online", value: selectedUser.timeOnlineFormatted, icon: Clock, color: "from-emerald-500 to-teal-500" },
                                        { label: "Registros", value: selectedUser.totalRegistros, icon: CheckCircle, color: "from-violet-500 to-purple-600" },
                                        { label: "Asignaciones", value: selectedUser.totalAsignaciones, icon: Target, color: "from-amber-500 to-orange-500" },
                                    ].map((metric, i) => (
                                        <div key={i} className={`bg-gradient-to-br ${metric.color} rounded-2xl p-4 text-white`}>
                                            <metric.icon className="h-6 w-6 mb-2 opacity-80" />
                                            <p className="text-3xl font-black">{metric.value}</p>
                                            <p className="text-xs font-bold opacity-80 uppercase tracking-wider">{metric.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-sm font-bold text-slate-500 mb-1">Sucursal</p>
                                        <p className="text-lg font-bold text-slate-800">{selectedUser.sucursal}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-sm font-bold text-slate-500 mb-1">Rol</p>
                                        <p className="text-lg font-bold text-slate-800">{selectedUser.rol}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-sm font-bold text-slate-500 mb-1">Último Acceso</p>
                                        <p className="text-lg font-bold text-slate-800">{selectedUser.lastSeenRelative}</p>
                                        {selectedUser.lastLogin && (
                                            <p className="text-sm text-slate-600 mt-1">
                                                {new Date(selectedUser.lastLogin).toLocaleDateString("es-ES", {
                                                    day: "2-digit",
                                                    month: "long",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit",
                                                })}
                                            </p>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-sm font-bold text-slate-500 mb-2">Productividad</p>
                                        <div className="space-y-2">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-slate-600">Promedio registros/ingreso</span>
                                                    <span className="font-bold text-slate-800">
                                                        {selectedUser.loginCount > 0 ? (selectedUser.totalRegistros / selectedUser.loginCount).toFixed(1) : 0}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600" style={{ width: `${Math.min(100, (selectedUser.totalRegistros / selectedUser.loginCount) * 10)}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Premium */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 lg:p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200">
                        <BarChart3 className="h-7 w-7 lg:h-10 lg:w-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl lg:text-5xl font-black text-slate-800 tracking-tight">
                            Auditoría de Usuarios
                        </h1>
                        <p className="text-slate-500 font-medium text-sm lg:text-base">
                            Sistema Completo de Análisis de Actividad y Rendimiento
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards Premium */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                {[
                    {
                        label: "Total Usuarios",
                        value: stats.total,
                        icon: Users,
                        color: "from-blue-500 to-blue-600",
                        shadow: "shadow-blue-200",
                        detail: "En el sistema",
                        filterKey: "todos",
                    },
                    {
                        label: "Conectados Ahora",
                        value: stats.online,
                        icon: Activity,
                        color: "from-emerald-500 to-teal-500",
                        shadow: "shadow-emerald-200",
                        detail: "En línea",
                        filterKey: "todos", // Por ahora lleva a todos, el filtro online visual es interno
                    },
                    {
                        label: "Han Ingresado",
                        value: stats.habituales,
                        icon: CheckCircle,
                        color: "from-violet-500 to-purple-600",
                        shadow: "shadow-purple-200",
                        detail: "Al menos 1 vez",
                        filterKey: "habituales",
                    },
                    {
                        label: "Nunca Ingresaron",
                        value: stats.noEntraron,
                        icon: AlertCircle,
                        color: "from-amber-500 to-orange-500",
                        shadow: "shadow-orange-200",
                        detail: "Sin actividad",
                        filterKey: "no-entraron",
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        onClick={() => setFiltro(stat.filterKey as any)}
                        className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 lg:p-6 shadow-xl ${stat.shadow} text-white relative overflow-hidden group cursor-pointer ring-offset-2 ring-offset-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${filtro === stat.filterKey ? 'ring-2 ring-indigo-500 scale-105' : ''}`}
                    >
                        <div className="absolute -right-6 -bottom-6 opacity-10 transition-all group-hover:opacity-20 group-hover:scale-110">
                            <stat.icon className="h-28 w-28 lg:h-32 lg:w-32" />
                        </div>
                        <div className="relative z-10">
                            <stat.icon className="h-6 w-6 lg:h-7 lg:w-7 mb-2 opacity-90" />
                            <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">
                                {stat.label}
                            </p>
                            <p className="text-4xl lg:text-6xl font-black mb-1">{stat.value}</p>
                            <p className="text-xs opacity-75 font-medium">{stat.detail}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Métricas Avanzadas */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
            >
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500">Promedio Ingresos</p>
                            <p className="text-3xl font-black text-slate-800">{advancedMetrics.avgLoginsPerUser}</p>
                            <p className="text-xs text-slate-400">por usuario</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                            <Clock className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500">Tiempo Promedio</p>
                            <p className="text-3xl font-black text-slate-800">{advancedMetrics.avgSessionTime}min</p>
                            <p className="text-xs text-slate-400">online por usuario</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 rounded-xl">
                            <Target className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500">Promedio Registros</p>
                            <p className="text-3xl font-black text-slate-800">{advancedMetrics.avgRegistrosPerUser}</p>
                            <p className="text-xs text-slate-400">por usuario</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Gráficos y Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Ranking Top 10 */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 rounded-xl">
                            <Award className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Top 10 Usuarios</h3>
                            <p className="text-sm text-slate-500">Más registros realizados</p>
                        </div>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {topUsers.map((user, i) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                                onClick={() => setSelectedUser(user)}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                                    i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                                        i === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white' :
                                            'bg-slate-100 text-slate-600'
                                    }`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 truncate">{user.nombreCompleto}</p>
                                    <p className="text-xs text-slate-500">@{user.username}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-indigo-600">{user.totalRegistros}</p>
                                    <p className="text-xs text-slate-400">registros</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Mapa de Calor de Actividad */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg shadow-rose-200">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Mapa de Calor</h3>
                            <p className="text-sm text-slate-500">Intensidad de actividad por horario</p>
                        </div>
                    </div>

                    {/* Heatmap Grid */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 pl-8">
                            <span>00:00</span>
                            <span>06:00</span>
                            <span>12:00</span>
                            <span>18:00</span>
                            <span>23:00</span>
                        </div>
                        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, dIndex) => (
                            <div key={day} className="flex items-center gap-2">
                                <span className="w-8 text-xs font-bold text-slate-400">{day}</span>
                                <div className="flex-1 flex gap-1 h-8">
                                    {Array.from({ length: 24 }).map((_, hIndex) => {
                                        // Simulación de datos (en prod usar datos reales)
                                        // Calculamos intensidad basada en hora (más actividad laboral)
                                        const isWorkHour = hIndex >= 8 && hIndex <= 18;
                                        const intensity = isWorkHour ? Math.random() * 0.8 + 0.2 : Math.random() * 0.3;
                                        const hasActivity = Math.random() > 0.3;

                                        return (
                                            <div
                                                key={hIndex}
                                                className="flex-1 rounded-sm transition-all hover:scale-125 hover:z-10 cursor-help"
                                                style={{
                                                    backgroundColor: hasActivity
                                                        ? `rgba(244, 63, 94, ${intensity})` // Rose 500 con opacidad
                                                        : '#f1f5f9', // Slate 100
                                                }}
                                                title={`${day} ${hIndex}:00 - ${Math.floor(intensity * 10)} accesos`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-400">
                            <span>Menos</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-sm bg-slate-100" />
                                <div className="w-3 h-3 rounded-sm bg-rose-200" />
                                <div className="w-3 h-3 rounded-sm bg-rose-400" />
                                <div className="w-3 h-3 rounded-sm bg-rose-600" />
                            </div>
                            <span>Más</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Alertas de Usuarios Inactivos */}
            {inactiveUsers.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8"
                >
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="font-black text-amber-900 mb-1">⚠️ Usuarios Inactivos Detectados</h3>
                            <p className="text-sm text-amber-700 mb-3">
                                {inactiveUsers.length} usuarios no han ingresado en más de 7 días
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {inactiveUsers.slice(0, 5).map(user => (
                                    <span key={user.id} className="px-3 py-1 bg-white rounded-lg text-sm font-medium text-amber-800 border border-amber-200">
                                        {user.nombreCompleto}
                                    </span>
                                ))}
                                {inactiveUsers.length > 5 && (
                                    <span className="px-3 py-1 bg-amber-200 rounded-lg text-sm font-bold text-amber-900">
                                        +{inactiveUsers.length - 5} más
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Controls */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-4 lg:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-6"
            >
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                        <Filter className="h-5 w-5 text-slate-400 hidden lg:block" />
                        {["todos", "habituales", "no-entraron"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFiltro(f as any)}
                                className={`px-3 lg:px-4 py-2 rounded-xl font-bold text-xs lg:text-sm uppercase tracking-wider transition-all ${filtro === f
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {f === "todos" ? "Todos" : f === "habituales" ? "Activos" : "Sin Actividad"}
                            </button>
                        ))}
                    </div>

                    {/* Export */}
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={exportPDF}
                            className="px-3 lg:px-4 py-2 lg:py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold text-xs lg:text-sm flex items-center gap-2 shadow-lg shadow-red-200 hover:shadow-xl transition-all"
                        >
                            <FileText className="h-4 w-4" />
                            <span className="hidden lg:inline">PDF</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={exportExcel}
                            className="px-3 lg:px-4 py-2 lg:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs lg:text-sm flex items-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden lg:inline">Excel</span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                            <tr>
                                <th className="px-4 lg:px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Usuario</th>
                                <th className="px-4 lg:px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider hidden lg:table-cell">Sucursal</th>
                                <th className="px-4 lg:px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Ingresos</th>
                                <th className="px-4 lg:px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider hidden md:table-cell">Tiempo</th>
                                <th className="px-4 lg:px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Registros</th>
                                <th className="px-4 lg:px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider hidden xl:table-cell">Último Acceso</th>
                                <th className="px-4 lg:px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Estado</th>
                                <th className="px-4 lg:px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsuarios.map((user, i) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.01 }}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-4 lg:px-6 py-4">
                                        <div className="flex items-center gap-2 lg:gap-3">
                                            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${user.isOnline ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-slate-400 to-slate-500"
                                                }`}>
                                                {user.nombreCompleto.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 text-sm lg:text-base truncate">{user.nombreCompleto}</p>
                                                <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                                        <span className="px-2 lg:px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs lg:text-sm font-medium">
                                            {user.sucursal}
                                        </span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4 text-center">
                                        <span className="text-xl lg:text-2xl font-black text-indigo-600">{user.loginCount}</span>
                                        <p className="text-xs text-slate-400 font-medium hidden lg:block">veces</p>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4 text-center hidden md:table-cell">
                                        <span className="text-sm lg:text-lg font-bold text-slate-700">{user.timeOnlineFormatted}</span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4 text-center">
                                        <span className="text-lg lg:text-xl font-black text-emerald-600">{user.totalRegistros}</span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-4 text-center hidden xl:table-cell">
                                        <p className="font-medium text-slate-700 text-sm">{user.lastSeenRelative}</p>
                                        {user.lastLogin && (
                                            <p className="text-xs text-slate-400">
                                                {new Date(user.lastLogin).toLocaleDateString("es-ES", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 lg:px-6 py-4 text-center">
                                        {user.isOnline ? (
                                            <span className="inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                                <span className="hidden lg:inline">Online</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                                <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-slate-400 rounded-full"></span>
                                                <span className="hidden lg:inline">Offline</span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 lg:px-6 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="p-2 hover:bg-indigo-50 rounded-xl transition-colors group"
                                            title="Ver detalles"
                                        >
                                            <Eye className="h-4 w-4 lg:h-5 lg:w-5 text-slate-400 group-hover:text-indigo-500" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsuarios.length === 0 && (
                    <div className="py-12 text-center">
                        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">No se encontraron usuarios</p>
                    </div>
                )}
            </motion.div>

            {/* Footer Stats */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center text-sm text-slate-500"
            >
                Mostrando <span className="font-bold text-slate-700">{filteredUsuarios.length}</span> de{" "}
                <span className="font-bold text-slate-700">{usuarios.length}</span> usuarios
            </motion.div>
        </div>
    );
}

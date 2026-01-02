"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users, Clock, TrendingUp, Download, Filter, Search, AlertCircle,
    CheckCircle, Activity, Calendar, BarChart3, FileText
} from "lucide-react";

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

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, filtro, usuarios]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuarios/reporte-actividad`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUsuarios(data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...usuarios];

        if (filtro === "habituales") {
            result = result.filter((u) => u.lastLogin !== null);
        } else if (filtro === "no-entraron") {
            result = result.filter((u) => u.lastLogin === null);
        }

        if (searchTerm) {
            result = result.filter(
                (u) =>
                    u.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredUsuarios(result);
    };

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
        habituales: usuarios.filter((u) => u.lastLogin !== null).length,
        noEntraron: usuarios.filter((u) => u.lastLogin === null).length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
            {/* Header Premium */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200">
                        <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                            Auditoría de Usuarios
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Análisis detallado de actividad y uso del sistema
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: "Total Usuarios", value: stats.total, icon: Users, color: "from-blue-500 to-blue-600", shadow: "shadow-blue-200" },
                    { label: "Conectados Ahora", value: stats.online, icon: Activity, color: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-200" },
                    { label: "Han Ingresado", value: stats.habituales, icon: CheckCircle, color: "from-violet-500 to-purple-600", shadow: "shadow-purple-200" },
                    { label: "Nunca Ingresaron", value: stats.noEntraron, icon: AlertCircle, color: "from-amber-500 to-orange-500", shadow: "shadow-orange-200" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 shadow-xl ${stat.shadow} text-white relative overflow-hidden`}
                    >
                        <div className="absolute -right-4 -bottom-4 opacity-20">
                            <stat.icon className="h-24 w-24" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">
                                {stat.label}
                            </p>
                            <p className="text-5xl font-black">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Controls */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-6"
            >
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        <Filter className="h-5 w-5 text-slate-400" />
                        {["todos", "habituales", "no-entraron"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFiltro(f as any)}
                                className={`px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${filtro === f
                                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {f === "todos" ? "Todos" : f === "habituales" ? "Activos" : "Nunca Ingresaron"}
                            </button>
                        ))}
                    </div>

                    {/* Export */}
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={exportPDF}
                            className="px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-200 hover:shadow-xl transition-all"
                        >
                            <FileText className="h-4 w-4" />
                            PDF
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={exportExcel}
                            className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
                        >
                            <Download className="h-4 w-4" />
                            Excel
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
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Sucursal</th>
                                <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Ingresos</th>
                                <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Tiempo Online</th>
                                <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Registros</th>
                                <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Último Acceso</th>
                                <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsuarios.map((user, i) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${user.isOnline ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-slate-400 to-slate-500"
                                                }`}>
                                                {user.nombreCompleto.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{user.nombreCompleto}</p>
                                                <p className="text-sm text-slate-500">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                                            {user.sucursal}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-2xl font-black text-indigo-600">{user.loginCount}</span>
                                        <p className="text-xs text-slate-400 font-medium">veces</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-lg font-bold text-slate-700">{user.timeOnlineFormatted}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-lg font-bold text-emerald-600">{user.totalRegistros}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <p className="font-medium text-slate-700">{user.lastSeenRelative}</p>
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
                                    <td className="px-6 py-4 text-center">
                                        {user.isOnline ? (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                                En Línea
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                                <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                                                Fuera de Línea
                                            </span>
                                        )}
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
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import {
    Award,
    TrendingUp,
    Building2,
    Users,
    Trophy,
    RefreshCcw,
    ChevronRight,
    Search,
    Download,
    FileSpreadsheet,
    FileText,
    ChevronDown
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

export default function RankingsVyVPage() {
    const [loading, setLoading] = useState(true);
    const [asesores, setAsesores] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [downloading, setDownloading] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [resAsesores, resUsuarios, resSucursales] = await Promise.all([
                axios.get("/api/reportes/rankings/asesores", { headers }),
                axios.get("/api/reportes/rankings/usuarios", { headers }),
                axios.get("/api/reportes/rankings/sucursales", { headers })
            ]);

            setAsesores(resAsesores.data);
            setUsuarios(resUsuarios.data);
            setSucursales(resSucursales.data);
        } catch (error) {
            console.error("Error fetching rankings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        setDownloading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("/api/reportes/rankings/export-excel", {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'rankings_voz_y_voto.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading excel:", error);
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadPdf = async (type = "all") => {
        setDownloading(true);
        setShowExportMenu(false);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`/api/reportes/rankings/export-pdf?type=${type}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rankings_vyv_${type}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading pdf:", error);
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCcw className="h-10 w-10 animate-spin text-emerald-500" />
                    <p className="text-emerald-500 font-medium">Cargando rankings de Voz y Voto...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Rankings de Voz y Voto</h1>
                    <p className="text-slate-500 mt-1">Monitoreo de líderes en vinculación de socios habilitados.</p>
                </div>
                <div className="flex items-center gap-3 relative">
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={downloading}
                            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all font-medium disabled:opacity-50"
                        >
                            {downloading ? (
                                <RefreshCcw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Exportar <ChevronDown className={`h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showExportMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-2 overflow-hidden"
                                    >
                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Excel</div>
                                        <button
                                            onClick={handleDownloadExcel}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                        >
                                            <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Excel (Completo)
                                        </button>

                                        <div className="border-t border-slate-50 my-1" />
                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">PDF (con gráficos)</div>
                                        <button
                                            onClick={() => handleDownloadPdf("all")}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            <FileText className="h-4 w-4 text-blue-500" /> PDF Completo
                                        </button>
                                        <button
                                            onClick={() => handleDownloadPdf("asesores")}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            <div className="w-4 h-4" /> Sólo Asesores
                                        </button>
                                        <button
                                            onClick={() => handleDownloadPdf("usuarios")}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            <div className="w-4 h-4" /> Sólo Usuarios
                                        </button>
                                        <button
                                            onClick={() => handleDownloadPdf("sucursales")}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            <div className="w-4 h-4" /> Sólo Sucursales
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-all font-medium"
                    >
                        <RefreshCcw className="h-4 w-4" /> Actualizar Datos
                    </button>
                </div>
            </div>

            {/* Grid de Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* TOP ASESORES */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 bg-gradient-to-r from-emerald-50/50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <Trophy className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Top 10 Asesores (VyV)</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="h-64 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={asesores.slice(0, 5)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="nombre"
                                        type="category"
                                        width={100}
                                        fontSize={12}
                                        tick={{ fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="total_vyv" radius={[0, 4, 4, 0]} barSize={32}>
                                        {asesores.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-50">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Asesor</th>
                                        <th className="px-4 py-3">Sucursal</th>
                                        <th className="px-4 py-3 text-right">Total VyV</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {asesores.map((item: any, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-400">{idx + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">{item.nombre}</td>
                                            <td className="px-4 py-3 text-slate-500">{item.sucursal}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-bold text-xs">
                                                    {item.total_vyv}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {asesores.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No hay datos disponibles</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* TOP USUARIOS GENERAL */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 bg-gradient-to-r from-blue-50/50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Users className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Top 10 General (VyV)</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="h-64 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={usuarios.slice(0, 5)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="nombre"
                                        type="category"
                                        width={100}
                                        fontSize={12}
                                        tick={{ fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="total_vyv" radius={[0, 4, 4, 0]} barSize={32}>
                                        {usuarios.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-50">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Usuario</th>
                                        <th className="px-4 py-3">Rol</th>
                                        <th className="px-4 py-3 text-right">Total VyV</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {usuarios.map((item: any, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-400">{idx + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">{item.nombre}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase">
                                                    {item.rol?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold text-xs">
                                                    {item.total_vyv}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {usuarios.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No hay datos disponibles</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* TOP SUCURSALES */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-gradient-to-r from-amber-50/50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Top Sucursales con más Voz y Voto</h2>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sucursales}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="sucursal"
                                        fontSize={10}
                                        tick={{ fill: '#64748b' }}
                                        interval={0}
                                        angle={-15}
                                        textAnchor="end"
                                    />
                                    <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="total_vyv" radius={[4, 4, 0, 0]} barSize={40}>
                                        {sucursales.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-50">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Sucursal</th>
                                        <th className="px-4 py-3 text-right">Total VyV</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {sucursales.map((item: any, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-400">{idx + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">{item.sucursal}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-black text-xs">
                                                    {item.total_vyv}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {sucursales.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No hay datos disponibles</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

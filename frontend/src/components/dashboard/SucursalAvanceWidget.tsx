"use client";

import { useEffect, useState } from "react";
import { Building2, TrendingUp, Download, PieChart } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

interface SucursalAvance {
    sucursal: string;
    vyv: number;
    solo_voz: number;
    total: number;
    porcentaje_vyv: number;
}

export function SucursalAvanceWidget() {
    const [data, setData] = useState<SucursalAvance[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.get("/api/reportes/sucursales/avance", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            console.error("Error cargando avance de sucursales:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("/api/reportes/sucursales/avance/pdf", {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob"
            });

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `avance_sucursales_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error descargando PDF:", error);
            alert("Error al descargar PDF");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 h-full flex items-center justify-center">
                <div className="animate-pulse text-slate-400 font-bold text-xs uppercase">Cargando datos...</div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-200">
                        <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Avance por Sucursal</h3>
                        <p className="text-xs text-slate-400 font-bold">Socios cargados (VyV vs Solo Voz)</p>
                    </div>
                </div>

                <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                    {downloading ? (
                        <div className="h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    <span className="text-xs font-bold">PDF</span>
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-100 flex-1">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Sucursal</th>
                            <th className="px-3 py-3 text-center text-xs font-black text-emerald-600 uppercase tracking-wider">VyV</th>
                            <th className="px-3 py-3 text-center text-xs font-black text-amber-500 uppercase tracking-wider">Solo Voz</th>
                            <th className="px-3 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Total</th>
                            <th className="px-3 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wider">% VyV</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((row, i) => (
                            <motion.tr
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="hover:bg-slate-50/50 transition-colors group"
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${i < 3 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                        <span className="font-bold text-slate-700 text-sm truncate max-w-[120px]" title={row.sucursal}>
                                            {row.sucursal}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-black text-xs border border-emerald-100">
                                        {row.vyv}
                                    </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                    <span className="text-amber-500 font-bold text-xs">{row.solo_voz > 0 ? row.solo_voz : '-'}</span>
                                </td>
                                <td className="px-3 py-3 text-right font-black text-slate-800 text-sm">
                                    {row.total}
                                </td>
                                <td className="px-3 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${Math.min(row.porcentaje_vyv, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">{row.porcentaje_vyv}%</span>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs uppercase font-bold">
                                    No hay datos de carga
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

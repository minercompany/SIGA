"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Users, Download, Target, AlertTriangle, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AsesorData {
    id: number;
    nombreCompleto: string;
    sucursal: string;
    registrados: number;
    faltaMinimo: number;
    faltaMeta: number;
    estado: string;
    estadoColor: string;
    porcentaje: number;
}

interface ResumenData {
    total: number;
    cumplieronMeta: number;
    cumplieronMinimo: number;
    sinMinimo: number;
    metaMinima: number;
    metaGeneral: number;
}

export default function ReporteAsesoresPage() {
    const [asesores, setAsesores] = useState<AsesorData[]>([]);
    const [resumen, setResumen] = useState<ResumenData | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/reportes/asesores", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAsesores(res.data.asesores);
                setResumen(res.data.resumen);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("/api/reportes/asesores/pdf", {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob"
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `reporte_asesores_${new Date().toISOString().slice(0, 10)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error descargando PDF:", error);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-500 text-lg animate-pulse">Cargando reporte de asesores...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <header className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/reportes" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <ArrowLeft className="h-5 w-5 text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <Target className="h-7 w-7 text-emerald-500" />
                                Reporte de Asesores
                            </h1>
                            <p className="text-sm text-slate-400 mt-1">
                                Estado de cumplimiento de metas: Mínima (20) y General (50)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
                    >
                        <Download className="h-5 w-5" />
                        {downloading ? "Generando..." : "Descargar PDF"}
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            {resumen && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="h-16 w-16 text-blue-500" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Asesores</p>
                        <h3 className="text-4xl font-black text-slate-800 mt-2">{resumen.total}</h3>
                        <p className="text-xs text-slate-400 mt-1">Activos</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-2 top-2 opacity-20 group-hover:opacity-30 transition-opacity">
                            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                        </div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Cumplieron Meta</p>
                        <h3 className="text-4xl font-black text-emerald-600 mt-2">{resumen.cumplieronMeta}</h3>
                        <p className="text-xs text-emerald-500 mt-1">≥{resumen.metaGeneral} registros</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-2xl shadow-sm border border-amber-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-2 top-2 opacity-20 group-hover:opacity-30 transition-opacity">
                            <AlertTriangle className="h-16 w-16 text-amber-500" />
                        </div>
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Cumplieron Mínimo</p>
                        <h3 className="text-4xl font-black text-amber-600 mt-2">{resumen.cumplieronMinimo}</h3>
                        <p className="text-xs text-amber-500 mt-1">{resumen.metaMinima}-{resumen.metaGeneral - 1} registros</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-white p-5 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-2 top-2 opacity-20 group-hover:opacity-30 transition-opacity">
                            <XCircle className="h-16 w-16 text-red-500" />
                        </div>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Sin Mínimo</p>
                        <h3 className="text-4xl font-black text-red-600 mt-2">{resumen.sinMinimo}</h3>
                        <p className="text-xs text-red-500 mt-1">&lt;{resumen.metaMinima} registros</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">#</th>
                                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Nombre Completo</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Sucursal</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Registrados</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Falta Mín.</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Falta Meta</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {asesores.map((asesor, index) => (
                                <tr key={asesor.id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                    <td className="px-4 py-4 text-sm text-slate-400 font-mono">{index + 1}</td>
                                    <td className="px-4 py-4">
                                        <span className="font-bold text-slate-800">{asesor.nombreCompleto}</span>
                                    </td>
                                    <td className="px-4 py-4 text-center text-sm text-slate-500">{asesor.sucursal}</td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`text-lg font-black ${asesor.registrados >= 50 ? 'text-emerald-600' :
                                                asesor.registrados >= 20 ? 'text-amber-600' : 'text-red-600'
                                            }`}>
                                            {asesor.registrados}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {asesor.faltaMinimo > 0 ? (
                                            <span className="text-sm font-bold text-red-500">{asesor.faltaMinimo}</span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {asesor.faltaMeta > 0 ? (
                                            <span className="text-sm font-bold text-amber-500">{asesor.faltaMeta}</span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${asesor.estadoColor === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                                asesor.estadoColor === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {asesor.estadoColor === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                            {asesor.estadoColor === 'warning' && <AlertTriangle className="h-3.5 w-3.5" />}
                                            {asesor.estadoColor === 'danger' && <XCircle className="h-3.5 w-3.5" />}
                                            {asesor.estadoColor === 'success' ? 'Cumplió Meta' :
                                                asesor.estadoColor === 'warning' ? 'Cumplió Mínimo' : 'Sin Mínimo'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {asesores.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        No se encontraron asesores
                    </div>
                )}
            </div>
        </div>
    );
}

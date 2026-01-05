"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Users, Download, Target, AlertTriangle, CheckCircle2, XCircle, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

interface AsesorData {
    id: number;
    nombreCompleto: string;
    rol: string;
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
    sinGestion: number;
    metaMinima: number;
    metaGeneral: number;
}

type FilterType = "" | "cumplieron_meta" | "cumplieron_minimo" | "sin_minimo" | "sin_gestion";

export default function ReporteAsesoresPage() {
    const [asesores, setAsesores] = useState<AsesorData[]>([]);
    const [resumen, setResumen] = useState<ResumenData | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [downloadingFilter, setDownloadingFilter] = useState<FilterType | null>(null);
    const [downloadingUser, setDownloadingUser] = useState<number | null>(null);

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

    const handleDownloadPDF = async (filtro: FilterType = "") => {
        if (filtro) {
            setDownloadingFilter(filtro);
        } else {
            setDownloading(true);
        }
        try {
            const token = localStorage.getItem("token");
            const url = filtro
                ? `/api/reportes/asesores/pdf?filtro=${filtro}`
                : "/api/reportes/asesores/pdf";
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob"
            });
            // Crear blob con tipo MIME explícito
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            const fecha = new Date().toISOString().slice(0, 10);
            const filename = filtro
                ? `reporte_${filtro}_${fecha}.pdf`
                : `reporte_usuarios_${fecha}.pdf`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Error descargando PDF:", error);
            alert("Error al descargar el PDF. Por favor intente nuevamente.");
        } finally {
            setDownloading(false);
            setDownloadingFilter(null);
        }
    };

    const handleDownloadUserPDF = async (userId: number, nombreCompleto: string) => {
        setDownloadingUser(userId);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`/api/reportes/asesores/pdf/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob"
            });
            // Crear blob con tipo MIME explícito
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const safeName = nombreCompleto.replace(/\s+/g, '_');
            const fecha = new Date().toISOString().slice(0, 10);
            link.download = `reporte_${safeName}_${fecha}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error descargando PDF del usuario:", error);
            alert("Error al descargar el PDF del usuario.");
        } finally {
            setDownloadingUser(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-500 text-lg animate-pulse">Cargando reporte de usuarios...</div>
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
                                Reporte General de Usuarios
                            </h1>
                            <p className="text-sm text-slate-400 mt-1">
                                Estado de cumplimiento de metas: Mínima (20) y General (50)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleDownloadPDF("")}
                        disabled={downloading}
                        className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
                    >
                        <Download className="h-5 w-5" />
                        {downloading ? "Generando..." : "Descargar PDF General"}
                    </button>
                </div>
            </header>

            {/* KPI Cards - Ahora con 5 tarjetas */}
            {resumen && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    {/* Total Usuarios - Sin botón de descarga */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="h-10 w-10 text-blue-500" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Usuarios</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{resumen.total}</h3>
                        <p className="text-[10px] text-slate-400">Activos</p>
                    </div>

                    {/* Cumplieron Meta */}
                    <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl shadow-sm border border-emerald-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-2 top-2 opacity-20 group-hover:opacity-30 transition-opacity">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        </div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Cumplieron Meta</p>
                        <h3 className="text-3xl font-black text-emerald-600 mt-1">{resumen.cumplieronMeta}</h3>
                        <p className="text-[10px] text-emerald-500">≥{resumen.metaGeneral} registros</p>
                        <button
                            onClick={() => handleDownloadPDF("cumplieron_meta")}
                            disabled={downloadingFilter === "cumplieron_meta"}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        >
                            {downloadingFilter === "cumplieron_meta" ? <div className="h-2.5 w-2.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <Download className="h-3 w-3" />}
                            PDF
                        </button>
                    </div>

                    {/* Cumplieron Mínimo */}
                    <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-xl shadow-sm border border-amber-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-2 top-2 opacity-20 group-hover:opacity-30 transition-opacity">
                            <AlertTriangle className="h-10 w-10 text-amber-500" />
                        </div>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Cumplieron Mínimo</p>
                        <h3 className="text-3xl font-black text-amber-600 mt-1">{resumen.cumplieronMinimo}</h3>
                        <p className="text-[10px] text-amber-500">{resumen.metaMinima}-{resumen.metaGeneral - 1} registros</p>
                        <button
                            onClick={() => handleDownloadPDF("cumplieron_minimo")}
                            disabled={downloadingFilter === "cumplieron_minimo"}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        >
                            {downloadingFilter === "cumplieron_minimo" ? <div className="h-2.5 w-2.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /> : <Download className="h-3 w-3" />}
                            PDF
                        </button>
                    </div>

                    {/* Sin Mínimo */}
                    <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-xl shadow-sm border border-red-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-2 top-2 opacity-20 group-hover:opacity-30 transition-opacity">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Sin Mínimo</p>
                        <h3 className="text-3xl font-black text-red-600 mt-1">{resumen.sinMinimo}</h3>
                        <p className="text-[10px] text-red-500">1-19 registros</p>
                        <button
                            onClick={() => handleDownloadPDF("sin_minimo")}
                            disabled={downloadingFilter === "sin_minimo"}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        >
                            {downloadingFilter === "sin_minimo" ? <div className="h-2.5 w-2.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <Download className="h-3 w-3" />}
                            PDF
                        </button>
                    </div>

                    {/* Sin Gestión (0) */}
                    <div className="bg-gradient-to-br from-slate-100 to-white p-4 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-2 top-2 opacity-20 group-hover:opacity-30 transition-opacity">
                            <XCircle className="h-10 w-10 text-slate-500" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Sin Gestión</p>
                        <h3 className="text-3xl font-black text-slate-600 mt-1">{resumen.sinGestion}</h3>
                        <p className="text-[10px] text-slate-500">0 registros</p>
                        <button
                            onClick={() => handleDownloadPDF("sin_gestion")}
                            disabled={downloadingFilter === "sin_gestion"}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 px-2 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        >
                            {downloadingFilter === "sin_gestion" ? <div className="h-2.5 w-2.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" /> : <Download className="h-3 w-3" />}
                            PDF
                        </button>
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
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Rol</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Sucursal</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Registrados</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Falta Mín.</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Falta Meta</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Estado</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">PDF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {asesores.map((asesor, index) => (
                                <tr key={asesor.id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                    <td className="px-4 py-4 text-sm text-slate-400 font-mono">{index + 1}</td>
                                    <td className="px-4 py-4">
                                        <span className="font-bold text-slate-800">{asesor.nombreCompleto}</span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                                            {asesor.rol || 'N/A'}
                                        </span>
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
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => handleDownloadUserPDF(asesor.id, asesor.nombreCompleto)}
                                            disabled={downloadingUser === asesor.id}
                                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all disabled:opacity-50"
                                            title={`Descargar PDF de ${asesor.nombreCompleto}`}
                                        >
                                            {downloadingUser === asesor.id ? (
                                                <div className="h-4 w-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                                            ) : (
                                                <FileText className="h-4 w-4" />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {asesores.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        No se encontraron usuarios
                    </div>
                )}
            </div>
        </div>
    );
}

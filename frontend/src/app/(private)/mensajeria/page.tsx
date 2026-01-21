"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    MessageSquare,
    Download,
    FileSpreadsheet,
    FileText,
    Users,
    Phone,
    PhoneOff,
    CheckCircle2,
    Loader2,
    ArrowLeft
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

interface Stats {
    totalVyV: number;
    conTelefonoValido: number;
    sinTelefono: number;
}

export default function MensajeriaPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        cargarStats();
    }, []);

    const cargarStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("/api/mensajeria/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) {
            console.error("Error cargando estadísticas:", error);
        } finally {
            setLoading(false);
        }
    };

    const descargar = async (formato: "csv" | "excel") => {
        setDownloading(formato);
        try {
            const token = localStorage.getItem("token");
            const endpoint = formato === "csv" ? "/api/mensajeria/exportar/csv" : "/api/mensajeria/exportar/excel";

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob"
            });

            // Obtener nombre del archivo del header
            const contentDisposition = response.headers["content-disposition"];
            let filename = `socios_vyv.${formato === "csv" ? "csv" : "xlsx"}`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }

            // Crear descarga
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error descargando:", error);
            alert("Error al descargar el archivo");
        } finally {
            setDownloading(null);
        }
    };

    const formatNumber = (num: number) => num.toLocaleString("es-PY");

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" style={{ padding: "clamp(1rem, 3vw, 3rem)" }}>
            <div className="mx-auto space-y-8" style={{ maxWidth: "clamp(320px, 90vw, 1100px)" }}>

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/dashboard" className="p-2 rounded-xl bg-white shadow-md hover:shadow-lg transition-all">
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                            Mensajería
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Exportar datos de socios para envío de mensajes
                        </p>
                    </div>
                </div>

                {/* Banner Principal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-8 md:p-12 text-white shadow-2xl shadow-purple-500/30"
                >
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-48 w-48 rounded-full bg-black/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-4">
                                <MessageSquare className="h-4 w-4" />
                                Exportar para WhatsApp / SMS
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                                Socios con Voz y Voto
                            </h2>
                            <p className="text-purple-100 max-w-lg">
                                Descarga la lista de socios habilitados con teléfonos limpios y formateados
                                en formato internacional (+595) listos para importar en plataformas de mensajería.
                            </p>
                        </div>

                        <div className="flex-shrink-0">
                            <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                                <MessageSquare className="h-16 w-16 text-white/80" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Estadísticas */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                    </div>
                ) : stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-600">
                                    <Users className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total VyV</p>
                                    <p className="text-4xl font-black text-slate-800">{formatNumber(stats.totalVyV)}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-4 rounded-2xl bg-green-100 text-green-600">
                                    <Phone className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Con Teléfono</p>
                                    <p className="text-4xl font-black text-green-600">{formatNumber(stats.conTelefonoValido)}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-4 rounded-2xl bg-red-100 text-red-600">
                                    <PhoneOff className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sin Teléfono</p>
                                    <p className="text-4xl font-black text-red-500">{formatNumber(stats.sinTelefono)}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Botones de Descarga */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                    <h3 className="text-xl font-black text-slate-800 mb-2">Descargar Listado</h3>
                    <p className="text-slate-500 mb-6">
                        El archivo incluye: Número de socio, Cédula, Nombre completo, y hasta 3 teléfonos limpios en formato +595XXXXXXXXX
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CSV */}
                        <button
                            onClick={() => descargar("csv")}
                            disabled={downloading !== null}
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-xl shadow-emerald-500/30 transition-all hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-70"
                        >
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                                        <FileText className="h-8 w-8" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-black">Descargar CSV</p>
                                        <p className="text-emerald-100 text-sm">Formato universal, compatible con todo</p>
                                    </div>
                                </div>
                                {downloading === "csv" ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <Download className="h-6 w-6 group-hover:translate-y-1 transition-transform" />
                                )}
                            </div>
                        </button>

                        {/* Excel */}
                        <button
                            onClick={() => descargar("excel")}
                            disabled={downloading !== null}
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white shadow-xl shadow-green-500/30 transition-all hover:shadow-2xl hover:shadow-green-500/40 active:scale-[0.98] disabled:opacity-70"
                        >
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                                        <FileSpreadsheet className="h-8 w-8" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-black">Descargar Excel</p>
                                        <p className="text-green-100 text-sm">Formato .xlsx con columnas formateadas</p>
                                    </div>
                                </div>
                                {downloading === "excel" ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <Download className="h-6 w-6 group-hover:translate-y-1 transition-transform" />
                                )}
                            </div>
                        </button>
                    </div>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-slate-600">
                                <p className="font-bold text-slate-700 mb-1">Formato de teléfonos:</p>
                                <p>Los números se exportan en formato internacional <code className="bg-white px-2 py-0.5 rounded border">+595XXXXXXXXX</code> (sin espacios), listo para importar en plataformas como WhatsApp Business, Twilio, etc.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

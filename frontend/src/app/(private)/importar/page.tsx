"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, AlertCircle, CheckCircle2, Loader2, X, History, User, FileSpreadsheet, Download, ChevronRight, Zap, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useImport } from "@/context/ImportContext";
import axios from "axios";

interface ImportHistorial {
    id: number;
    fechaImportacion: string;
    usuarioImportador: string;
    totalRegistros: number;
    archivoNombre: string;
}

export default function ImportarPage() {
    const { isImporting, isUploading, progress, error, stats, startImport, cancelImport, resetImport } = useImport();
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [historial, setHistorial] = useState<ImportHistorial[]>([]);
    const [loadingHistorial, setLoadingHistorial] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchHistorial();
    }, [stats]);

    const fetchHistorial = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:8081/api/socios/import-history", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistorial(response.data);
        } catch (error) {
            console.error("Error cargando historial:", error);
        } finally {
            setLoadingHistorial(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (
                droppedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                droppedFile.name.endsWith(".xlsx")
            ) {
                setFile(droppedFile);
                startImport(droppedFile);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            startImport(selectedFile);
        }
    };

    // Función para descargar plantilla
    const downloadTemplate = () => {
        // En una app real, esto podría ser una descarga de un archivo estático o generado
        // Por ahora, simularemos la descarga creando un CSV básico o alertando
        const headers = ["Nro Socio", "Cédula", "Nombre", "Teléfono", "Sucursal", "Aporte", "Solidaridad", "Fondo", "Incoop", "Crédito"];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plantilla_socios.csv"); // Fallback simple
        const alertMsg = document.createElement('div');
        alert("Descarga de plantilla iniciada...");
    };

    const formatNumber = (num: number) => num.toLocaleString();
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("es-PY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    // Calcular paso actual
    const getStep = () => {
        if (stats) return 3; // Finalizado
        if (isImporting || isUploading) return 2; // Procesando
        return 1; // Subir
    };
    const currentStep = getStep();

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 pb-32">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header Premium con Gradiente Vivo */}
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 p-10 shadow-2xl shadow-emerald-500/20 text-white">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-4 border border-white/20 shadow-lg">
                                <Zap className="h-3 w-3 text-yellow-300 fill-yellow-300" />
                                Sistema de Importación Inteligente
                            </div>
                            <h1 className="text-5xl font-black tracking-tight drop-shadow-sm">
                                Importar Padrón
                            </h1>
                            <p className="mt-3 text-lg font-medium text-emerald-50 max-w-xl leading-relaxed opacity-90">
                                Actualiza masivamente la base de datos de socios.
                                <br />Rápido, seguro y con validación automática en tiempo real.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.open('/plantilla_padron.xlsx', '_blank')}
                                className="group relative overflow-hidden rounded-2xl bg-white px-8 py-4 text-emerald-900 shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                <div className="relative z-10 flex items-center gap-3 font-bold">
                                    <Download className="h-5 w-5 text-emerald-600 transition-transform group-hover:-translate-y-1" />
                                    <span>Descargar Plantilla</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stepper Interactivo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { step: 1, label: "Cargar Archivo", desc: "Sube tu Excel", icon: Upload },
                        { step: 2, label: "Procesamiento", desc: "Validación de datos", icon: Loader2 },
                        { step: 3, label: "Resultados", desc: "Resumen final", icon: CheckCircle2 }
                    ].map((s) => {
                        const isActive = s.step === currentStep;
                        const isPast = s.step < currentStep;
                        return (
                            <div key={s.step}
                                className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-500 border-2
                                ${isActive ? "border-emerald-500 bg-white shadow-xl shadow-emerald-500/10 scale-105"
                                        : isPast ? "border-transparent bg-emerald-500 text-white"
                                            : "border-transparent bg-white text-slate-400 opacity-60"}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`p-4 rounded-2xl shadow-sm ${isActive ? "bg-emerald-100 text-emerald-600" : isPast ? "bg-white/20 text-white" : "bg-slate-100"}`}>
                                        <s.icon className={`h-6 w-6 ${isActive && s.step === 2 ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-emerald-500" : isPast ? "text-emerald-200" : "text-slate-300"}`}>
                                            Paso 0{s.step}
                                        </span>
                                        <h3 className="text-lg font-bold">{s.label}</h3>
                                        {isActive && <p className="text-xs text-slate-500 font-medium mt-0.5">{s.desc}</p>}
                                    </div>
                                </div>
                                {isActive && <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full animate-pulse" />}
                            </div>
                        )
                    })}
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">

                    {/* ZONA PRINCIPAL DE CARGA (8 Columnas) */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group relative rounded-[2rem] bg-white p-2 shadow-xl shadow-slate-200/50"
                                >
                                    <div className="absolute -inset-1 rounded-[2.1rem] bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 opacity-20 blur group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={`relative flex flex-col items-center justify-center rounded-[1.8rem] border-4 border-dashed p-16 text-center transition-all duration-300 bg-white
                                            ${dragActive ? "border-emerald-500 bg-emerald-50/50 scale-[0.99]" : "border-slate-100 hover:border-emerald-300"}`}
                                    >
                                        <div className="mb-8 relative">
                                            <div className="absolute inset-0 bg-emerald-400/30 blur-2xl rounded-full scale-150 animate-pulse" />
                                            <div className="relative rounded-3xl bg-gradient-to-br from-white to-emerald-50 p-6 shadow-2xl ring-1 ring-black/5">
                                                <Upload className="h-12 w-12 text-emerald-600" />
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-slate-800">
                                            Arrastra y suelta tu Excel
                                        </h3>
                                        <p className="mt-3 text-slate-500 font-medium max-w-sm mx-auto">
                                            Soporta archivos <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">.xlsx</span> hasta 50MB
                                        </p>

                                        <div className="mt-10 w-full max-w-xs">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2 group/btn"
                                            >
                                                Elegir Archivo Manualmente
                                                <ChevronRight className="h-4 w-4 opacity-50 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />

                                        {error && (
                                            <div className="absolute bottom-6 left-0 right-0 max-w-md mx-auto">
                                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 shadow-lg shadow-red-500/10">
                                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                                    <span className="font-bold text-sm text-left">{error}</span>
                                                </motion.div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-slate-900 rounded-[2rem] p-12 min-h-[500px] flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl shadow-slate-900/40"
                                >
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[100px] animate-pulse" />

                                    <div className="relative z-10 w-72 h-72 mb-10">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="6" className="opacity-30" />
                                            <motion.circle
                                                cx="50" cy="50" r="45" fill="none" stroke="#34d399" strokeWidth="6" strokeLinecap="round"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: progress / 100 }}
                                                transition={{ duration: 0.5 }}
                                                style={{ filter: "drop-shadow(0 0 10px rgba(52, 211, 153, 0.5))" }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                            <span className="text-7xl font-black tracking-tighter">{Math.round(progress)}<span className="text-4xl text-emerald-400">%</span></span>
                                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-2 bg-emerald-400/10 px-3 py-1 rounded-full">
                                                {isUploading ? "Subiendo Datos" : "Procesando"}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-2">Procesando Padrón</h3>
                                    <p className="text-slate-400 font-medium animate-pulse">Por favor mantén esta ventana abierta...</p>
                                </motion.div>
                            )}

                            {currentStep === 3 && stats && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-500/10"
                                >
                                    <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                        <div className="relative z-10 text-center">
                                            <div className="inline-flex p-4 bg-white/20 rounded-full text-white mb-4 backdrop-blur-md shadow-lg">
                                                <CheckCircle2 className="h-10 w-10" />
                                            </div>
                                            <h2 className="text-3xl font-black tracking-tight">¡Misión Cumplida!</h2>
                                            <p className="text-emerald-100 font-medium mt-2">La base de datos ha sido sincronizada exitosamente.</p>
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            {[
                                                { label: "Total Filas", val: stats.totalRows, color: "text-slate-800", bg: "bg-slate-50", border: "border-slate-100" },
                                                { label: "Nuevos Socios", val: stats.imported, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                                                { label: "Actualizados", val: stats.updated, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                                                { label: "Errores", val: stats.errors, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" }
                                            ].map((stat, i) => (
                                                <div key={i} className={`p-6 rounded-2xl border ${stat.bg} ${stat.border} flex flex-col items-center justify-center`}>
                                                    <span className={`text-4xl font-black ${stat.color}`}>{formatNumber(stat.val)}</span>
                                                    <span className={`text-xs font-bold uppercase mt-1 opacity-70 ${stat.color}`}>{stat.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={resetImport}
                                            className="w-full py-5 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95"
                                        >
                                            Realizar Nueva Importación
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* HISTORIAL LATERAL (4 Columnas) */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <div className="flex items-center gap-3 mb-8 px-2">
                                <div className="p-3 bg-indigo-50 rounded-xl">
                                    <History className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Historial</h3>
                                    <p className="text-xs text-slate-400 font-medium">Últimos movimientos</p>
                                </div>
                            </div>

                            {loadingHistorial ? (
                                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500 h-8 w-8" /></div>
                            ) : historial.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-sm italic">Sin actividad reciente</div>
                            ) : (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {historial.map((h) => (
                                        <div key={h.id} className="group relative p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                                                    PASSED
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">{formatDate(h.fechaImportacion)}</span>
                                            </div>
                                            <p className="font-bold text-slate-700 text-sm truncate mb-3" title={h.archivoNombre}>{h.archivoNombre}</p>

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {h.usuarioImportador?.[0] || "U"}
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-medium truncate max-w-[80px]">{h.usuarioImportador}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text font-black text-slate-900">{formatNumber(h.totalRegistros)}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase font-bold">Registros</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <ShieldCheck className="h-6 w-6 text-indigo-200" />
                                <h4 className="font-bold text-lg">Requisitos</h4>
                            </div>

                            <ul className="space-y-4 relative z-10">
                                {[
                                    "Archivo con extensión .xlsx",
                                    "Primera fila para encabezados",
                                    "Datos obligatorios: Cédula, Nombre",
                                    "No debe superar los 50MB"
                                ].map((req, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-indigo-50">
                                        <div className="min-w-[4px] h-[4px] mt-2 rounded-full bg-indigo-300" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

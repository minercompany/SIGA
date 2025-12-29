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
            const response = await axios.get("/api/socios/import-history", {
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

    const formatNumber = (num: number | undefined | null) => (num ?? 0).toLocaleString();
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
        <div className="min-h-screen bg-slate-50/50" style={{ padding: 'clamp(1rem, 3vw, 3rem)' }}>
            <div className="mx-auto space-y-6" style={{ maxWidth: 'clamp(320px, 90vw, 1000px)' }}>

                {/* Header Premium - Compacto y Responsivo */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500 shadow-xl shadow-emerald-500/20 text-white" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-48 w-48 rounded-full bg-black/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-lg w-fit">
                            <Zap className="h-3 w-3 text-yellow-300 fill-yellow-300" />
                            Sistema de Importación Inteligente
                        </div>

                        <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)' }} className="font-black tracking-tight drop-shadow-sm leading-tight">
                            Importar Padrón
                        </h1>

                        <p className="text-emerald-50 max-w-md leading-relaxed opacity-90" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                            Actualiza masivamente la base de datos de socios.<br className="hidden md:block" />
                            Rápido, seguro y con validación automática.
                        </p>

                        <button
                            onClick={() => window.open('/plantilla_padron.xlsx', '_blank')}
                            className="group mt-2 inline-flex items-center gap-2 rounded-xl bg-white/95 px-5 py-3 text-emerald-800 shadow-lg transition-all hover:scale-105 active:scale-95 w-fit"
                        >
                            <Download className="h-4 w-4 text-emerald-600 transition-transform group-hover:-translate-y-1" />
                            <span className="font-bold text-sm">Descargar Plantilla</span>
                        </button>
                    </div>
                </div>

                {/* Stepper Interactivo - Responsivo */}
                <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-4 md:overflow-visible hide-scrollbar">
                    {[
                        { step: 1, label: "Cargar Archivo", desc: "Sube tu Excel", icon: Upload },
                        { step: 2, label: "Procesamiento", desc: "Validación de datos", icon: Loader2 },
                        { step: 3, label: "Resultados", desc: "Resumen final", icon: CheckCircle2 }
                    ].map((s) => {
                        const isActive = s.step === currentStep;
                        const isPast = s.step < currentStep;
                        return (
                            <div key={s.step}
                                className={`relative overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-5 transition-all duration-500 border-2 flex-shrink-0 snap-center
                                    ${isActive ? "border-emerald-500 bg-white shadow-lg shadow-emerald-500/10 min-w-[200px] md:min-w-0"
                                        : isPast ? "border-transparent bg-emerald-500 text-white min-w-[160px] md:min-w-0"
                                            : "border-transparent bg-white text-slate-400 opacity-60 min-w-[160px] md:min-w-0"}`}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={`p-3 rounded-xl shadow-sm ${isActive ? "bg-emerald-100 text-emerald-600" : isPast ? "bg-white/20 text-white" : "bg-slate-100"}`}>
                                        <s.icon className={`h-5 w-5 ${isActive && s.step === 2 ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div>
                                        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isActive ? "text-emerald-500" : isPast ? "text-emerald-200" : "text-slate-300"}`}>
                                            Paso 0{s.step}
                                        </span>
                                        <h3 className="text-sm md:text-base font-bold">{s.label}</h3>
                                    </div>
                                </div>
                                {isActive && <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full animate-pulse" />}
                            </div>
                        )
                    })}
                </div>

                {/* Contenido Principal - Stack en móvil, Grid en desktop */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ZONA PRINCIPAL DE CARGA */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group relative rounded-2xl md:rounded-3xl bg-white p-1.5 md:p-2 shadow-xl shadow-slate-200/50"
                                >
                                    <div className="absolute -inset-1 rounded-2xl md:rounded-3xl bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 opacity-20 blur group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={`relative flex flex-col items-center justify-center rounded-xl md:rounded-2xl border-3 md:border-4 border-dashed text-center transition-all duration-300 bg-white
                                            ${dragActive ? "border-emerald-500 bg-emerald-50/50 scale-[0.99]" : "border-slate-100 hover:border-emerald-300"}`}
                                        style={{ padding: 'clamp(2rem, 6vw, 4rem)' }}
                                    >
                                        <div className="mb-6 relative">
                                            <div className="absolute inset-0 bg-emerald-400/30 blur-2xl rounded-full scale-150 animate-pulse" />
                                            <div className="relative rounded-2xl bg-gradient-to-br from-white to-emerald-50 p-4 md:p-5 shadow-xl ring-1 ring-black/5">
                                                <Upload className="h-8 w-8 md:h-10 md:w-10 text-emerald-600" />
                                            </div>
                                        </div>

                                        <h3 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }} className="font-black text-slate-800">
                                            Arrastra y suelta tu Excel
                                        </h3>
                                        <p className="mt-2 text-slate-500 font-medium text-sm md:text-base">
                                            Soporta archivos <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">.xlsx</span> hasta 50MB
                                        </p>

                                        <div className="mt-6 md:mt-8 w-full" style={{ maxWidth: 'clamp(200px, 80%, 280px)' }}>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full rounded-xl md:rounded-2xl bg-slate-900 py-3 md:py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2 group/btn"
                                            >
                                                Elegir Archivo
                                                <ChevronRight className="h-4 w-4 opacity-50 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />

                                        {error && (
                                            <div className="mt-4 w-full">
                                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-lg shadow-red-500/10">
                                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                                    <span className="font-bold text-xs md:text-sm text-left">{error}</span>
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
                                >
                                    {/* Step 2: Processing (Clean White Theme) */}
                                    {isImporting && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-emerald-50/30 to-white p-12 shadow-2xl shadow-emerald-500/20 border-2 border-emerald-100"
                                        >
                                            {/* Subtle Animated Background Pattern */}
                                            <div className="absolute inset-0 opacity-30"
                                                style={{
                                                    backgroundImage: `radial-gradient(circle at 20% 50%, ${`hsla(${Math.round((progress / 100) * 120)}, 70%, 85%, 0.4)`} 0%, transparent 50%),
                                                   radial-gradient(circle at 80% 80%, ${`hsla(${Math.round((progress / 100) * 120)}, 70%, 90%, 0.3)`} 0%, transparent 50%)`
                                                }}
                                            />

                                            {/* Content Container */}
                                            <div className="relative z-10 flex flex-col items-center space-y-8">
                                                {/* Circular Progress Animation */}
                                                <div className="relative">
                                                    {/* Outer Decorative Ring */}
                                                    <svg className="w-64 h-64 transform -rotate-90">
                                                        <circle
                                                            cx="128"
                                                            cy="128"
                                                            r="120"
                                                            stroke="currentColor"
                                                            strokeWidth="3"
                                                            fill="none"
                                                            className="text-slate-100"
                                                        />
                                                        {/* Progress Ring - Dynamic Color */}
                                                        <motion.circle
                                                            cx="128"
                                                            cy="128"
                                                            r="120"
                                                            stroke={`hsl(${Math.round((progress / 100) * 120)}, 75%, 50%)`}
                                                            strokeWidth="12"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeDasharray="754"
                                                            initial={{ strokeDashoffset: 754 }}
                                                            animate={{ strokeDashoffset: 754 - (754 * progress) / 100 }}
                                                            transition={{ duration: 0.8, ease: "easeInOut" }}
                                                            style={{
                                                                filter: `drop-shadow(0 0 12px hsla(${Math.round((progress / 100) * 120)}, 75%, 55%, 0.5))`
                                                            }}
                                                        />
                                                    </svg>

                                                    {/* Center Content */}
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <motion.div
                                                            key={progress}
                                                            initial={{ scale: 0.9, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className="text-center"
                                                        >
                                                            <div
                                                                className="text-7xl font-black mb-3 tracking-tight"
                                                                style={{
                                                                    color: `hsl(${Math.round((progress / 100) * 120)}, 70%, 45%)`,
                                                                }}
                                                            >
                                                                {progress}%
                                                            </div>
                                                            <div
                                                                className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest border-2"
                                                                style={{
                                                                    backgroundColor: `hsla(${Math.round((progress / 100) * 120)}, 70%, 95%, 1)`,
                                                                    color: `hsl(${Math.round((progress / 100) * 120)}, 70%, 40%)`,
                                                                    borderColor: `hsla(${Math.round((progress / 100) * 120)}, 70%, 60%, 0.3)`
                                                                }}
                                                            >
                                                                {progress === 100 ? 'Completado' : 'Procesando'}
                                                            </div>
                                                        </motion.div>
                                                    </div>

                                                    {/* Orbiting Indicator */}
                                                    <motion.div
                                                        className="absolute w-5 h-5 rounded-full shadow-lg"
                                                        style={{
                                                            backgroundColor: `hsl(${Math.round((progress / 100) * 120)}, 75%, 55%)`,
                                                            top: '50%',
                                                            left: '50%',
                                                        }}
                                                        animate={{
                                                            rotate: 360,
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "linear"
                                                        }}
                                                    />
                                                </div>

                                                {/* Title & Subtitle */}
                                                <div className="text-center space-y-3">
                                                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">
                                                        Procesando Padrón
                                                    </h2>
                                                    <div className="flex items-center justify-center gap-3 text-slate-500">
                                                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                                        <p className="text-sm font-medium">
                                                            Por favor mantén esta ventana abierta...
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {currentStep === 3 && stats && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
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
                                                { label: "Total Filas", val: stats.totalRows ?? 0, color: "text-slate-800", bg: "bg-slate-50", border: "border-slate-100" },
                                                { label: "Nuevos Socios", val: stats.imported ?? 0, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                                                { label: "Actualizados", val: stats.updated ?? 0, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                                                { label: "Errores", val: stats.errors ?? 0, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" }
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

                    {/* HISTORIAL LATERAL - Oculto en móvil, visible en escritorio */}
                    <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
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

"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, AlertCircle, CheckCircle2, Loader2, History, Users, Database, Lock, Unlock, Download, ChevronRight, Zap, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function ImportarFuncionariosPage() {
    // Estado local
    const [isImporting, setIsImporting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);

    // Estado protección BD
    const [dbCount, setDbCount] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [loadingDb, setLoadingDb] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cargar estado inicial
    useEffect(() => {
        checkDbStatus();
    }, []);

    const checkDbStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:8081/api/funcionarios/count", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const total = response.data.total || 0;
            setDbCount(total);
            if (total > 0) {
                setIsLocked(true);
            }
        } catch (error) {
            console.error("Error verificando DB:", error);
        } finally {
            setLoadingDb(false);
        }
    };

    // Simular progreso
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isUploading && progress < 90) {
            interval = setInterval(() => {
                setProgress(prev => {
                    const next = prev + Math.random() * 10;
                    return next > 90 ? 90 : next;
                });
            }, 200);
        }
        return () => clearInterval(interval);
    }, [isUploading, progress]);

    const startImport = async (selectedFile: File) => {
        setError(null);
        setStats(null);
        setProgress(0);
        setIsUploading(true);
        setIsImporting(true);

        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await axios.post("http://localhost:8081/api/funcionarios/importar", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });

            setProgress(100);
            setIsUploading(false);

            const data = response.data;
            setStats({
                totalRows: data.total,
                imported: data.importados,
                updated: data.actualizados,
                errors: data.errores,
                mensajesError: data.mensajesError
            });

            checkDbStatus();

        } catch (err: any) {
            console.error("Error en importación:", err);
            setError(err.response?.data?.error || "Error al importar el archivo. Verifique el formato.");
            setIsUploading(false);
            setIsImporting(false);
        }
    };

    const resetImport = () => {
        setIsImporting(false);
        setIsUploading(false);
        setProgress(0);
        setStats(null);
        setError(null);
        setFile(null);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLocked) return;
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
        if (isLocked) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith(".xlsx")) {
                setFile(droppedFile);
                startImport(droppedFile);
            } else {
                setError("Solo archivos .xlsx permitidos");
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

    const formatNumber = (num: number) => num?.toLocaleString() || '0';

    // Calcular paso actual
    const getStep = () => {
        if (stats) return 3;
        if (isImporting || isUploading) return 2;
        return 1;
    };
    const currentStep = getStep();

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 pb-32">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header Premium con Gradiente Vivo */}
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 p-10 shadow-2xl shadow-indigo-500/20 text-white">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-4 border border-white/20 shadow-lg">
                                <Zap className="h-3 w-3 text-yellow-300 fill-yellow-300" />
                                Gestión de Funcionarios
                            </div>
                            <h1 className="text-5xl font-black tracking-tight drop-shadow-sm">
                                Importar Funcionarios
                            </h1>
                            <p className="mt-3 text-lg font-medium text-indigo-50 max-w-xl leading-relaxed opacity-90">
                                Carga la base de datos de directivos y funcionarios.
                                <br />Su acceso al sistema se creará automáticamente.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Switch de Protección Premium */}
                            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all backdrop-blur-md ${isLocked
                                ? "bg-white/20 border-white/30"
                                : "bg-amber-500/30 border-amber-300/50 ring-2 ring-amber-200/30"
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isLocked ? "bg-white/20 text-white" : "bg-amber-200/30 text-amber-100"}`}>
                                        {isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase tracking-wider text-white">
                                            {isLocked ? "Base Protegida" : "Modo Edición"}
                                        </span>
                                        <span className="text-xs font-medium text-white/70">
                                            {dbCount} Funcionarios
                                        </span>
                                    </div>
                                </div>

                                <div className="h-8 w-px bg-white/20 mx-2"></div>

                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={!isLocked}
                                        onChange={() => setIsLocked(!isLocked)}
                                    />
                                    <div className="w-11 h-6 bg-white/30 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                                </label>
                            </div>

                            <button
                                onClick={() => window.open('/plantilla_funcionarios.xlsx', '_blank')}
                                className="group relative overflow-hidden rounded-2xl bg-white px-8 py-4 text-indigo-900 shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                <div className="relative z-10 flex items-center gap-3 font-bold">
                                    <Download className="h-5 w-5 text-indigo-600 transition-transform group-hover:-translate-y-1" />
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
                                ${isActive ? "border-indigo-500 bg-white shadow-xl shadow-indigo-500/10 scale-105"
                                        : isPast ? "border-transparent bg-indigo-500 text-white"
                                            : "border-transparent bg-white text-slate-400 opacity-60"}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`p-4 rounded-2xl shadow-sm ${isActive ? "bg-indigo-100 text-indigo-600" : isPast ? "bg-white/20 text-white" : "bg-slate-100"}`}>
                                        <s.icon className={`h-6 w-6 ${isActive && s.step === 2 ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-indigo-500" : isPast ? "text-indigo-200" : "text-slate-300"}`}>
                                            Paso 0{s.step}
                                        </span>
                                        <h3 className="text-lg font-bold">{s.label}</h3>
                                        {isActive && <p className="text-xs text-slate-500 font-medium mt-0.5">{s.desc}</p>}
                                    </div>
                                </div>
                                {isActive && <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 w-full animate-pulse" />}
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
                                    <div className="absolute -inset-1 rounded-[2.1rem] bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 opacity-20 blur group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

                                    {/* Overlay de Bloqueo */}
                                    {isLocked && (
                                        <div className="absolute inset-0 z-20 bg-slate-50/80 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center text-center p-6 cursor-not-allowed">
                                            <div className="bg-white p-5 rounded-full shadow-2xl mb-5 ring-4 ring-indigo-50">
                                                <Lock className="h-12 w-12 text-indigo-500" />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-800">Base de Datos Protegida</h3>
                                            <p className="text-sm text-slate-500 max-w-sm mt-3 leading-relaxed">
                                                Para cargar nuevos funcionarios, desactiva el modo protección desde el switch en la cabecera.
                                            </p>
                                        </div>
                                    )}

                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={`relative flex flex-col items-center justify-center rounded-[1.8rem] border-4 border-dashed p-16 text-center transition-all duration-300 bg-white
                                            ${dragActive ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]" : "border-slate-100 hover:border-indigo-300"}`}
                                    >
                                        <div className="mb-8 relative">
                                            <div className="absolute inset-0 bg-indigo-400/30 blur-2xl rounded-full scale-150 animate-pulse" />
                                            <div className="relative rounded-3xl bg-gradient-to-br from-white to-indigo-50 p-6 shadow-2xl ring-1 ring-black/5">
                                                <Users className="h-12 w-12 text-indigo-600" />
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-slate-800">
                                            Arrastra y suelta tu Excel
                                        </h3>
                                        <p className="mt-3 text-slate-500 font-medium max-w-sm mx-auto">
                                            Soporta archivos <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">.xlsx</span> con datos de funcionarios
                                        </p>

                                        <div className="mt-10 w-full max-w-xs">
                                            <button
                                                onClick={() => !isLocked && fileInputRef.current?.click()}
                                                disabled={isLocked}
                                                className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-indigo-600 hover:shadow-indigo-500/30 active:scale-95 flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Elegir Archivo Manualmente
                                                <ChevronRight className="h-4 w-4 opacity-50 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" disabled={isLocked} />

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
                                >
                                    {/* Step 2: Processing */}
                                    {isImporting && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-indigo-50/30 to-white p-12 shadow-2xl shadow-indigo-500/20 border-2 border-indigo-100"
                                        >
                                            {/* Subtle Animated Background Pattern */}
                                            <div className="absolute inset-0 opacity-30"
                                                style={{
                                                    backgroundImage: `radial-gradient(circle at 20% 50%, ${`hsla(${220 + Math.round((progress / 100) * 30)}, 70%, 85%, 0.4)`} 0%, transparent 50%),
                                                   radial-gradient(circle at 80% 80%, ${`hsla(${220 + Math.round((progress / 100) * 30)}, 70%, 90%, 0.3)`} 0%, transparent 50%)`
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
                                                        {/* Progress Ring */}
                                                        <motion.circle
                                                            cx="128"
                                                            cy="128"
                                                            r="120"
                                                            stroke={`hsl(${240 - Math.round((progress / 100) * 20)}, 75%, 55%)`}
                                                            strokeWidth="12"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeDasharray="754"
                                                            initial={{ strokeDashoffset: 754 }}
                                                            animate={{ strokeDashoffset: 754 - (754 * progress) / 100 }}
                                                            transition={{ duration: 0.8, ease: "easeInOut" }}
                                                            style={{
                                                                filter: `drop-shadow(0 0 12px hsla(${240 - Math.round((progress / 100) * 20)}, 75%, 55%, 0.5))`
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
                                                                className="text-7xl font-black mb-3 tracking-tight text-indigo-600"
                                                            >
                                                                {Math.round(progress)}%
                                                            </div>
                                                            <div
                                                                className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest border-2 bg-indigo-50 text-indigo-600 border-indigo-200"
                                                            >
                                                                {progress === 100 ? 'Completado' : 'Procesando'}
                                                            </div>
                                                        </motion.div>
                                                    </div>

                                                    {/* Orbiting Indicator */}
                                                    <motion.div
                                                        className="absolute w-5 h-5 rounded-full shadow-lg bg-indigo-500"
                                                        style={{
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
                                                        Procesando Funcionarios
                                                    </h2>
                                                    <div className="flex items-center justify-center gap-3 text-slate-500">
                                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
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
                                    className="bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/10"
                                >
                                    <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                        <div className="relative z-10 text-center">
                                            <div className="inline-flex p-4 bg-white/20 rounded-full text-white mb-4 backdrop-blur-md shadow-lg">
                                                <CheckCircle2 className="h-10 w-10" />
                                            </div>
                                            <h2 className="text-3xl font-black tracking-tight">¡Importación Exitosa!</h2>
                                            <p className="text-indigo-100 font-medium mt-2">La base de funcionarios ha sido actualizada correctamente.</p>
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            {[
                                                { label: "Total Filas", val: stats.totalRows ?? 0, color: "text-slate-800", bg: "bg-slate-50", border: "border-slate-100" },
                                                { label: "Importados", val: stats.imported ?? 0, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
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

                    {/* PANEL LATERAL (4 Columnas) */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <div className="flex items-center gap-3 mb-8 px-2">
                                <div className="p-3 bg-indigo-50 rounded-xl">
                                    <Database className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Estado del Sistema</h3>
                                    <p className="text-xs text-slate-400 font-medium">Base de datos de funcionarios</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <span className="text-sm text-slate-600 font-medium">Funcionarios Registrados</span>
                                    <span className="font-black text-2xl text-slate-900">{dbCount}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <span className="text-sm text-slate-600 font-medium">Estado de Base</span>
                                    <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg ${isLocked ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                        {isLocked ? "PROTEGIDA" : "EDICIÓN"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <ShieldCheck className="h-6 w-6 text-indigo-200" />
                                <h4 className="font-bold text-lg">Información</h4>
                            </div>

                            <ul className="space-y-4 relative z-10">
                                {[
                                    "Formato requerido: .xlsx",
                                    "Columnas: Nro Socio, Cédula, Nombre, Cargo",
                                    "Los usuarios se crean al cargar el padrón",
                                    "Solo SUPER_ADMIN puede importar"
                                ].map((req, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-indigo-50">
                                        <div className="min-w-[4px] h-[4px] mt-2 rounded-full bg-indigo-300" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-amber-50 rounded-[2rem] p-6 border-2 border-amber-100">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-amber-100 rounded-xl">
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-800 mb-1">Nota Importante</h4>
                                    <p className="text-sm text-amber-700 leading-relaxed">
                                        Los funcionarios aquí registrados tendrán acceso automático al sistema una vez que se importe el padrón de socios y coincidan sus datos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

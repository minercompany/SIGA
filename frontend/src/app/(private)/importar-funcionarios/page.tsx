"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, AlertCircle, CheckCircle2, Loader2, X, History, Calendar, User, FileSpreadsheet, Users, Database, Lock, Unlock } from "lucide-react";
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

    // Cargar estado inicial (Si hay datos, bloquear)
    useEffect(() => {
        checkDbStatus();
    }, []);

    const checkDbStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://192.168.100.123:8081/api/funcionarios/count", {
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
            const response = await axios.post("http://192.168.100.123:8081/api/funcionarios/importar", formData, {
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

            // Actualizar contador
            checkDbStatus();

        } catch (err: any) {
            console.error("Error en importación:", err);
            setError(err.response?.data?.error || "Error al importar el archivo. Verifique el formato.");
            setIsUploading(false);
            setIsImporting(false);
        }
    };

    const cancelImport = () => {
        setIsImporting(false);
        setIsUploading(false);
        setProgress(0);
        setFile(null);
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
        if (isLocked) return; // Bloqueado
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
        if (isLocked) return; // Bloqueado

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

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Importar Funcionarios</h1>
                    <p className="text-gray-500 mt-2">
                        Gestión de la base de datos de funcionarios para acceso automático.
                    </p>
                </div>

                {/* Switch de Protección */}
                <div className={`flex items-center gap-4 px-5 py-3 rounded-2xl border transition-all ${isLocked
                        ? "bg-emerald-50 border-emerald-200 shadow-sm"
                        : "bg-amber-50 border-amber-200 shadow-md ring-2 ring-amber-100"
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isLocked ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                            {isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-xs font-black uppercase tracking-wider ${isLocked ? "text-emerald-700" : "text-amber-700"}`}>
                                {isLocked ? "Base de Datos Activa" : "Modo Edición"}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                                {dbCount} Registros Cargados
                            </span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2"></div>

                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={!isLocked}
                            onChange={() => setIsLocked(!isLocked)}
                        />
                        <div className="w-11 h-6 bg-emerald-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Panel de Importación */}
                <div className={`rounded-xl border bg-white p-8 shadow-sm transition-all relative overflow-hidden ${isLocked ? "border-slate-200 opacity-80" : "border-blue-200 ring-4 ring-blue-50"
                    }`}>
                    {/* Overlay de Bloqueo */}
                    {isLocked && (
                        <div className="absolute inset-0 z-10 bg-slate-50/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 cursor-not-allowed">
                            <div className="bg-white p-4 rounded-full shadow-lg mb-4">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Base de Datos Protegida</h3>
                            <p className="text-sm text-slate-500 max-w-xs mt-2">
                                Para cargar nuevos funcionarios o actualizar, desactiva el switch de "Base de Datos Activa".
                            </p>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {(!isImporting && !isUploading && !stats) ? (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={`flex flex-col items-center justify-center text-center transition-all ${dragActive ? "scale-105" : ""}`}
                            >
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`w-full rounded-2xl border-2 border-dashed p-10 transition-colors ${dragActive
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                                        }`}
                                >
                                    <div className="mb-4 flex justify-center">
                                        <div className="rounded-full bg-gray-50 p-4 ring-1 ring-gray-200">
                                            <Users className="h-8 w-8 text-blue-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Actualizar Funcionarios</h3>
                                    <p className="mt-1 text-sm text-gray-500">Arrastra nuevo Excel para actualizar</p>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        disabled={isLocked}
                                    />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLocked}
                                        className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Seleccionar Archivo
                                    </button>
                                </div>

                                {error && (
                                    <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <span className="font-medium">Error:</span> {error}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (isImporting || isUploading) ? (
                            <motion.div key="processing" className="flex flex-col items-center justify-center py-12">
                                {/* ... LOGICA DE PROGRESO EXISTENTE SIMPLIFICADA ... */}
                                <div className="relative mb-8 h-40 w-40">
                                    <Loader2 className="h-full w-full animate-spin text-blue-500 opacity-20" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-blue-600">{Math.round(progress)}%</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Procesando Archivo...</h3>
                            </motion.div>
                        ) : stats ? (
                            <motion.div key="completed" className="w-full">
                                <div className="mb-6 flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-700">
                                    <CheckCircle2 className="h-6 w-6" />
                                    <span className="font-semibold">¡Base de Datos Actualizada!</span>
                                </div>
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                                        <div className="text-2xl font-black text-slate-800">{formatNumber(stats.totalRows || stats.total)}</div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Database</div>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                                        <div className="text-2xl font-black text-blue-600">{formatNumber(stats.updated + stats.imported)}</div>
                                        <div className="text-[10px] uppercase font-bold text-blue-400">Procesados Hoy</div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-center">
                                    <button onClick={resetImport} className="text-sm font-bold text-slate-500 hover:text-slate-800 underline">
                                        Importar otro archivo
                                    </button>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

                {/* Panel Informativo */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Database className="h-5 w-5 text-slate-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Estado del Sistema</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm text-slate-600 font-medium">Funcionarios Registrados</span>
                                <span className="font-bold text-slate-900 bg-white px-2 py-1 rounded shadow-sm border">{dbCount}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm text-slate-600 font-medium">Estado de Base de Datos</span>
                                <span className={`text-xs font-black uppercase px-2 py-1 rounded ${isLocked ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                    {isLocked ? "PROTEGIDA" : "EDICIÓN HABILITADA"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-blue-50 rounded-xl text-xs text-blue-800 leading-relaxed border border-blue-100">
                            <strong>Nota Importante:</strong><br />
                            Los funcionarios registrados aquí tendrán acceso automático al sistema (se les creará un usuario) tan pronto cargues el Padrón de Socios y coincidan sus datos.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

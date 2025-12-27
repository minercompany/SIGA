"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileUp, AlertCircle, CheckCircle2, Loader2, X, History, Calendar, User, FileSpreadsheet, Clock } from "lucide-react";
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
            const response = await axios.get("http://192.168.100.123:8081/api/socios/import-history", {
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

    const formatNumber = (num: number) => num.toLocaleString();
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("es-PY", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Importar Padrón</h1>
                <p className="text-gray-500 mt-2">
                    Sube el archivo Excel del padrón de socios para actualizar la base de datos.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Panel de Importación */}
                <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                    <AnimatePresence mode="wait">
                        {(!isImporting && !isUploading && !stats) ? (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`flex flex-col items-center justify-center text-center transition-all ${dragActive ? "scale-105" : ""}`}
                            >
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`w-full rounded-2xl border-2 border-dashed p-10 transition-colors ${dragActive
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50"
                                        }`}
                                >
                                    <div className="mb-4 flex justify-center">
                                        <div className="rounded-full bg-gray-50 p-4 ring-1 ring-gray-200">
                                            <Upload className="h-8 w-8 text-gray-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Arrastra tu archivo aquí</h3>
                                    <p className="mt-1 text-sm text-gray-500">o haz clic para buscar en tu equipo</p>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
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
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center justify-center py-12"
                            >
                                {/* Función para calcular color según progreso */}
                                {(() => {
                                    // Calcular color: 0-33% rojo, 34-66% amarillo, 67-100% verde
                                    const getProgressColor = (p: number) => {
                                        if (p < 33) {
                                            // Rojo a naranja
                                            const ratio = p / 33;
                                            return `rgb(${239}, ${Math.round(68 + ratio * 100)}, ${68})`;
                                        } else if (p < 66) {
                                            // Naranja a amarillo
                                            const ratio = (p - 33) / 33;
                                            return `rgb(${245}, ${Math.round(158 + ratio * 50)}, ${Math.round(11 + ratio * 50)})`;
                                        } else {
                                            // Amarillo a verde
                                            const ratio = (p - 66) / 34;
                                            return `rgb(${Math.round(234 - ratio * 218)}, ${Math.round(179 + ratio * 6)}, ${Math.round(8 + ratio * 91)})`;
                                        }
                                    };

                                    const progressColor = getProgressColor(progress);
                                    const isComplete = progress >= 100;

                                    return (
                                        <>
                                            {/* Indicador de progreso GRANDE con color dinámico */}
                                            <div className="relative mb-8 h-48 w-48">
                                                {isComplete && (
                                                    <motion.div
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                                                        transition={{ duration: 0.5, times: [0, 0.5, 1] }}
                                                        className="absolute inset-0 flex items-center justify-center"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full animate-pulse opacity-20" />
                                                    </motion.div>
                                                )}
                                                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                                    <path
                                                        className="text-gray-100"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                    />
                                                    <motion.path
                                                        initial={{ strokeDasharray: "0, 100" }}
                                                        animate={{ strokeDasharray: `${progress}, 100` }}
                                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke={progressColor}
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        style={{
                                                            filter: isComplete ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' : 'none'
                                                        }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <motion.span
                                                        className="text-5xl font-black"
                                                        style={{ color: progressColor }}
                                                        animate={isComplete ? { scale: [1, 1.1, 1] } : {}}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        {progress}%
                                                    </motion.span>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                        {isUploading ? "Subiendo" : isComplete ? "¡Listo!" : "Procesando"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mensaje con animación especial al completar */}
                                            {isComplete ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-center"
                                                >
                                                    <motion.div
                                                        animate={{ scale: [1, 1.05, 1] }}
                                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                                        className="flex items-center justify-center gap-3 mb-4"
                                                    >
                                                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                                        <h3 className="text-2xl font-black text-emerald-600 uppercase tracking-tight">
                                                            ¡Padrón Cargado!
                                                        </h3>
                                                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                                    </motion.div>
                                                    <p className="text-sm text-gray-500">Procesando resultados finales...</p>
                                                </motion.div>
                                            ) : (
                                                <>
                                                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                                        {isUploading ? "Subiendo archivo..." : "Importando datos..."}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        {isUploading ? "Por favor espere..." : "Esto puede tomar unos momentos"}
                                                    </p>
                                                </>
                                            )}
                                        </>
                                    );
                                })()}

                                {!isUploading && isImporting && progress < 100 && (
                                    <button
                                        onClick={cancelImport}
                                        className="mt-8 flex items-center gap-2 rounded-xl border-2 border-red-200 bg-white px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                                    >
                                        <X className="h-5 w-5" />
                                        Cancelar Importación
                                    </button>
                                )}
                            </motion.div>
                        ) : stats ? (
                            <motion.div
                                key="completed"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full"
                            >
                                <div className="mb-6 flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-700">
                                    <CheckCircle2 className="h-6 w-6" />
                                    <span className="font-semibold">¡Importación completada exitosamente!</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                                        <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalRows)}</div>
                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Filas</div>
                                    </div>
                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                                        <div className="text-2xl font-bold text-emerald-600">{formatNumber(stats.imported)}</div>
                                        <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Nuevos</div>
                                    </div>
                                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
                                        <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.updated)}</div>
                                        <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Actualizados</div>
                                    </div>
                                    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
                                        <div className="text-2xl font-bold text-red-600">{formatNumber(stats.errors)}</div>
                                        <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Errores</div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={resetImport}
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                                    >
                                        Subir otro archivo
                                    </button>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

                {/* Panel Historial */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <History className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Historial de Importaciones</h2>
                            <p className="text-xs text-gray-500">Últimas cargas realizadas</p>
                        </div>
                    </div>

                    {loadingHistorial ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : historial.length === 0 ? (
                        <div className="text-center py-12">
                            <FileSpreadsheet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No hay importaciones registradas</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {historial.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                                <span className="font-semibold text-gray-900 text-sm truncate">
                                                    {item.archivoNombre || "Archivo Excel"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(item.fechaImportacion)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {item.usuarioImportador || "Admin"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                {formatNumber(item.totalRegistros)} registros
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-xl bg-blue-50 p-6 text-sm text-blue-900 shadow-sm">
                <h4 className="mb-2 font-semibold">Instrucciones</h4>
                <ul className="list-inside list-disc space-y-1 text-blue-800">
                    <li>El archivo debe ser formato <strong>Excel (.xlsx)</strong></li>
                    <li>La primera fila debe contener los encabezados</li>
                    <li>El proceso reemplazará totalmente el padrón anterior</li>
                    <li>Columnas requeridas: Nro Socio, Cédula, Nombre, Teléfono, Sucursal, Aporte, Solidaridad, Sede, Incoop, Crédito</li>
                </ul>
            </div>
        </div>
    );
}

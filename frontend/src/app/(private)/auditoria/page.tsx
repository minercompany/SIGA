"use client";

import { useState, useEffect } from "react";
import {
    History,
    Search,
    Filter,
    User,
    Shield,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Activity,
    Info,
    RefreshCw
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface LogEntry {
    id: number;
    modulo: string;
    accion: string;
    detalles: string;
    usuario: string;
    ipAddress: string;
    createdAt: string;
}

export default function AuditoriaPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterModulo, setFilterModulo] = useState("TODOS");

    // RASTREO STATE
    const [rastreoMode, setRastreoMode] = useState(false);
    const [rastreoTerm, setRastreoTerm] = useState("");
    const [rastreoData, setRastreoData] = useState<any>(null);
    const [searchingSocio, setSearchingSocio] = useState(false);

    const handleRastrear = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!rastreoTerm.trim()) return;

        setSearchingSocio(true);
        setRastreoData(null);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:8081/api/asignaciones/rastreo/${rastreoTerm}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRastreoData(res.data);
        } catch (error) {
            console.error("Error rastreando socio:", error);
            setRastreoData({ error: "Socio no encontrado o sin historial" });
        } finally {
            setSearchingSocio(false);
        }
    };

    useEffect(() => {
        if (!rastreoMode) fetchLogs();
    }, [rastreoMode]);

    const fetchLogs = async (pageNum = 0) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:8081/api/auditoria?page=${pageNum}&size=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data.content);
            setTotalPages(res.data.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error("Error al cargar auditoría:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.detalles.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.accion.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesModulo = filterModulo === "TODOS" || log.modulo === filterModulo;

        return matchesSearch && matchesModulo;
    });

    const getModuleColor = (modulo: string) => {
        switch (modulo) {
            case 'ASIGNACIONES': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'ASISTENCIA': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'SOCIOS': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'USUARIOS': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'CONFIGURACION': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('es-PY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    };

    return (
        <div className="mx-auto space-y-4" style={{ maxWidth: 'clamp(320px, 98vw, 1200px)', padding: 'clamp(0.5rem, 2vw, 1.5rem)' }}>
            {/* Header con Estética Premium - Compacto */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-2 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
                                <History className="h-5 w-5 text-white" />
                            </div>
                            <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }} className="font-black text-slate-900 tracking-tight flex items-center gap-2">
                                AUDITORÍA <span className="italic text-teal-600">TOTAL</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 font-medium text-xs hidden md:block">Registro inmutable de acciones. Para ver el historial de asignaciones de un socio, busca su número o cédula.</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="bg-white border border-slate-200 p-1 rounded-xl flex shadow-sm">
                            <button
                                onClick={() => setRastreoMode(false)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${!rastreoMode ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                General
                            </button>
                            <button
                                onClick={() => setRastreoMode(true)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${rastreoMode ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Rastrear
                            </button>
                        </div>

                        <button
                            onClick={() => fetchLogs(page)}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl hidden sm:flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sistema Protegido</span>
                        </div>
                    </div>
                </div>
            </div>

            {rastreoMode ? (
                // MODO RASTREO
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Search Box Extra Large */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
                        <h2 className="text-2xl font-black text-white mb-6 relative z-10">INVESTIGACIÓN DE ASIGNACIONES</h2>
                        <form onSubmit={handleRastrear} className="max-w-xl mx-auto relative z-10 flex gap-4">
                            <input
                                type="text"
                                placeholder="Ingresa N° de Socio o Cédula (Ej: 56015)"
                                value={rastreoTerm}
                                onChange={(e) => setRastreoTerm(e.target.value)}
                                className="flex-1 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-white/40 font-bold text-xl focus:outline-none focus:ring-4 focus:ring-teal-500/50 transition-all text-center"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={searchingSocio}
                                className="bg-teal-500 hover:bg-teal-400 text-white px-8 rounded-2xl font-black shadow-lg shadow-teal-900/50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {searchingSocio ? <RefreshCw className="animate-spin" /> : <Search />}
                            </button>
                        </form>
                    </div>

                    {/* Resultados */}
                    {rastreoData && !rastreoData.error && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Columna Izquierda: Estado Actual */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5">
                                        <User className="w-32 h-32" />
                                    </div>
                                    <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Socio Identificado</h3>
                                    <div className="text-4xl font-black text-slate-900 mb-2">{rastreoData.socio.numeroSocio}</div>
                                    <div className="text-xl font-bold text-slate-600 mb-6">{rastreoData.socio.nombreCompleto}</div>
                                    <div className="text-sm font-mono text-slate-400 bg-slate-50 inline-block px-3 py-1 rounded-lg">CI: {rastreoData.socio.cedula}</div>
                                </div>

                                {rastreoData.estadoActual ? (
                                    <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 shadow-xl relative">
                                        <div className="absolute -top-3 -right-3 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                                            Asignación Actual
                                        </div>
                                        <h3 className="text-emerald-800/60 font-bold uppercase tracking-widest text-xs mb-4">Poseedor Actual</h3>
                                        <div className="text-2xl font-black text-emerald-900 mb-2">{rastreoData.estadoActual.asignadoA}</div>
                                        <div className="flex flex-col gap-1 text-emerald-700 text-sm font-medium mb-4">
                                            <span>Usuario: @{rastreoData.estadoActual.usuario}</span>
                                            <span>Lista: {rastreoData.estadoActual.lista}</span>
                                        </div>
                                        <div className="pt-4 border-t border-emerald-200/50 text-xs font-bold text-emerald-600 flex justify-between items-center">
                                            <span>Asignado el: {formatDate(rastreoData.estadoActual.fecha)}</span>
                                            {/* Si hay asignador */}
                                            {rastreoData.estadoActual.asignadoPor && (
                                                <span title="Asignado por">Por: {rastreoData.estadoActual.asignadoPor}</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200 border-dashed text-center">
                                        <p className="text-slate-400 font-bold italic">Este socio no se encuentra asignado a ninguna lista activa.</p>
                                    </div>
                                )}
                            </div>

                            {/* Columna Derecha: Timeline */}
                            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl">
                                <h3 className="text-slate-900 font-black text-xl mb-8 flex items-center gap-3">
                                    <Activity className="text-teal-500" />
                                    LÍNEA DE TIEMPO DE EVENTOS
                                </h3>

                                <div className="space-y-0 relative pl-4 border-l-2 border-slate-100 ml-4">
                                    {rastreoData.historial.length > 0 ? (
                                        rastreoData.historial.map((log: any, idx: number) => (
                                            <div key={log.id} className="relative pl-8 pb-10 last:pb-0">
                                                {/* Bullet */}
                                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white ${log.accion.includes('FALLIDO') ? 'bg-red-500 shadow-red-200' :
                                                    log.accion.includes('ASIGNAR') ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-400'
                                                    } shadow-lgbox`} style={{ boxShadow: '0 0 0 4px white' }}></div>

                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{formatDate(log.createdAt)}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${log.accion.includes('FALLIDO') ? 'bg-red-100 text-red-700' :
                                                            log.accion.includes('ASIGNAR') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {log.accion.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        {log.detalles}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-500">Operador: {log.usuario}</span>
                                                        {log.ipAddress && <span className="text-[10px] text-slate-300">({log.ipAddress})</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10">
                                            <p className="text-slate-400 font-medium">No hay registros de auditoría reciente para este socio.</p>
                                            <p className="text-xs text-slate-300 mt-2">Nota: Solo se muestran eventos registrados a partir de la actualización del sistema.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {rastreoData && rastreoData.error && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-600 font-bold">
                            ⚠️ {rastreoData.error}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Filtros Inteligentes */}
                    <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-slate-200 p-6 shadow-xl shadow-slate-100/50">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por N° Socio, Cédula, Usuario..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/10 transition-all"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Filter className="h-5 w-5 text-slate-400 mr-2" />
                                {['TODOS', 'ASIGNACIONES', 'ASISTENCIA', 'SOCIOS', 'USUARIOS', 'CONFIGURACION'].map((mod) => (
                                    <button
                                        key={mod}
                                        onClick={() => setFilterModulo(mod)}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest border ${filterModulo === mod
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {mod}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Listado de Logs */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fecha y Hora</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Módulo</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Usuario / IP</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Acción</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Detalles del Evento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={5} className="px-8 py-6">
                                                    <div className="h-10 bg-slate-50 rounded-xl" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredLogs.length > 0 ? (
                                        filteredLogs.map((log) => (
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                key={log.id}
                                                className="hover:bg-slate-50/50 transition-colors group"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900">{formatDate(log.createdAt).split(',')[0]}</span>
                                                        <span className="text-[11px] font-medium text-slate-400">{formatDate(log.createdAt).split(',')[1]}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase border leading-none ${getModuleColor(log.modulo)}`}>
                                                        {log.modulo}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                                                            <User className="h-4 w-4 text-slate-500" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-800">{log.usuario}</span>
                                                            <span className="text-[10px] font-medium text-slate-400 uppercase">{log.ipAddress}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900 leading-tight mb-1 uppercase tracking-tight">
                                                            {log.accion.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="max-w-[500px]">
                                                        <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-4 py-1">
                                                            "{log.detalles}"
                                                        </p>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="p-4 bg-slate-50 rounded-full">
                                                        <Info className="h-10 w-10 text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No se encontraron registros de auditoría</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación Premium */}
                        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                PÁGINA {page + 1} DE {totalPages || 1}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchLogs(page - 1)}
                                    disabled={page === 0 || loading}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => fetchLogs(page + 1)}
                                    disabled={page >= totalPages - 1 || loading}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Banner de Integridad */}
            <div className="rounded-[2.5rem] bg-gradient-to-r from-slate-900 to-slate-800 p-1 bg-opacity-10">
                <div className="rounded-[2.4rem] bg-white p-8 flex flex-col md:flex-row items-center gap-8 border-4 border-slate-900/5">
                    <div className="p-4 bg-teal-50 rounded-3xl">
                        <Shield className="h-12 w-12 text-teal-600" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-black text-slate-900 uppercase italic mb-2 tracking-tight">Integridad de Datos Garantizada</h3>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                            Este módulo registra cada interacción crítica. La manipulación de estos registros está restringida y solo se ven afectados por un reinicio total de fábrica desde el panel de seguridad avanzado.
                        </p>
                    </div>
                    <div>
                        <div className="flex flex-col items-center gap-2">
                            <Activity className="h-10 w-10 text-slate-900 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Monitor Activo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

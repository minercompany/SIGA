"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Trash2,
    AlertTriangle,
    Users,
    CheckCircle,
    XCircle,
    RefreshCw,
    ArrowLeft,
    Shield,
    Clock,
    Building2,
    User,
    AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

interface AsistenciaItem {
    id: number;
    socioId: number;
    socioNombre: string;
    socioNumero: string;
    cedulaSocio: string;
    vozVoto: boolean;
    fechaHora: string;
    sucursal: string;
    operador: string;
    operadorUsername: string;
}

const ACCESS_CODE = "Superseguro226118";

export default function GestionAsistenciaPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessCode, setAccessCode] = useState("");
    const [accessError, setAccessError] = useState(false);
    const [asistencias, setAsistencias] = useState<AsistenciaItem[]>([]);
    const [filteredAsistencias, setFilteredAsistencias] = useState<AsistenciaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [showDeleteOneModal, setShowDeleteOneModal] = useState(false);
    const [selectedAsistencia, setSelectedAsistencia] = useState<AsistenciaItem | null>(null);
    const [codigoSeguridad, setCodigoSeguridad] = useState("");
    const [deleting, setDeleting] = useState(false);

    const handleAccessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (accessCode === ACCESS_CODE) {
            setIsAuthenticated(true);
            setAccessError(false);
        } else {
            setAccessError(true);
            setAccessCode("");
        }
    };

    const fetchAsistencias = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/asistencia/gestion`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    toast.error("No tienes permisos para acceder a esta página");
                    router.push("/dashboard");
                    return;
                }
                throw new Error("Error al cargar asistencias");
            }

            const data = await response.json();
            setAsistencias(data.asistencias || []);
            setFilteredAsistencias(data.asistencias || []);
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al cargar las asistencias");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAsistencias();
        }
    }, [isAuthenticated, fetchAsistencias]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredAsistencias(asistencias);
        } else {
            const term = searchTerm.toLowerCase();
            setFilteredAsistencias(
                asistencias.filter((a: AsistenciaItem) =>
                    a.socioNombre?.toLowerCase().includes(term) ||
                    a.socioNumero?.toLowerCase().includes(term) ||
                    a.cedulaSocio?.toLowerCase().includes(term)
                )
            );
        }
    }, [searchTerm, asistencias]);

    const handleDeleteOne = async () => {
        if (!selectedAsistencia) return;

        setDeleting(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/asistencia/eliminar/${selectedAsistencia.socioId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al eliminar");
            }

            toast.success(`Asistencia de ${selectedAsistencia.socioNombre} eliminada`);
            setShowDeleteOneModal(false);
            setSelectedAsistencia(null);
            fetchAsistencias();
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar asistencia");
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (codigoSeguridad !== "ELIMINAR-TODO-2026") {
            toast.error("Código de seguridad incorrecto");
            return;
        }

        setDeleting(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/asistencia/eliminar-todas`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ codigoSeguridad })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al eliminar");
            }

            const data = await response.json();
            toast.success(`${data.totalEliminados} asistencias eliminadas correctamente`);
            setShowDeleteAllModal(false);
            setCodigoSeguridad("");
            fetchAsistencias();
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar asistencias");
        } finally {
            setDeleting(false);
        }
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleString("es-PY", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const stats = {
        total: asistencias.length,
        vozVoto: asistencias.filter((a: AsistenciaItem) => a.vozVoto).length,
        soloVoz: asistencias.filter((a: AsistenciaItem) => !a.vozVoto).length
    };

    // Access Code Gate - Light Theme
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Toaster position="top-center" richColors />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-100"
                >
                    <div className="flex flex-col items-center mb-8">
                        <div className="p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-lg mb-4">
                            <Shield className="h-12 w-12 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 text-center uppercase tracking-tight">
                            Acceso Restringido
                        </h1>
                        <p className="text-slate-400 text-center mt-2 text-sm">
                            Gestión de Asistencias requiere código de acceso
                        </p>
                    </div>

                    <form onSubmit={handleAccessSubmit} className="space-y-6">
                        <div>
                            <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                                Código de Acceso
                            </label>
                            <input
                                type="password"
                                value={accessCode}
                                onChange={(e) => {
                                    setAccessCode(e.target.value);
                                    setAccessError(false);
                                }}
                                placeholder="Ingrese el código..."
                                className={`w-full px-4 py-4 bg-slate-50 border-2 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-0 transition-all text-lg font-bold ${accessError
                                        ? "border-red-300 bg-red-50"
                                        : "border-slate-100 focus:border-emerald-400"
                                    }`}
                                autoFocus
                            />
                            {accessError && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-xs font-bold mt-2 flex items-center gap-2"
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    Código incorrecto. Intente nuevamente.
                                </motion.p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                        >
                            <Shield className="h-5 w-5" />
                            Acceder
                        </button>
                    </form>

                    <button
                        onClick={() => router.back()}
                        className="w-full mt-4 py-3 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Volver
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 min-h-screen">
            <Toaster position="top-center" richColors />

            {/* Header */}
            <div className="pt-4 sm:pt-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors mb-4 text-sm font-bold"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Volver</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">
                            Gestión <span className="text-red-500">Asistencias</span>
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm">
                            Administra y elimina registros de asistencia
                        </p>
                    </div>

                    <button
                        onClick={() => setShowDeleteAllModal(true)}
                        disabled={asistencias.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
                    >
                        <Trash2 className="h-4 w-4" />
                        Eliminar Todas ({stats.total})
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-slate-50">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-blue-50 rounded-xl">
                            <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-blue-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Total</p>
                            <p className="text-2xl md:text-3xl font-black text-slate-800">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-slate-50">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-emerald-50 rounded-xl">
                            <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-emerald-600 text-[10px] md:text-xs font-bold uppercase tracking-widest">Votan</p>
                            <p className="text-2xl md:text-3xl font-black text-slate-800">{stats.vozVoto}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-slate-50">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-amber-50 rounded-xl">
                            <XCircle className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-amber-600 text-[10px] md:text-xs font-bold uppercase tracking-widest">Solo Voz</p>
                            <p className="text-2xl md:text-3xl font-black text-slate-800">{stats.soloVoz}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Refresh */}
            <div className="bg-white p-3 md:p-4 rounded-[2rem] shadow-xl border border-slate-100 flex items-center gap-3">
                <div className="bg-emerald-500 h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0">
                    <Search className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre, N° socio o cédula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none text-lg md:text-xl font-bold text-slate-800 focus:ring-0 outline-none placeholder:text-slate-300"
                />
                <button
                    onClick={fetchAsistencias}
                    disabled={loading}
                    className="p-2 md:p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
                >
                    <RefreshCw className={`h-5 w-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
                    </div>
                ) : filteredAsistencias.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                        <Users className="h-16 w-16 mb-4" />
                        <p className="text-lg font-black uppercase">
                            {searchTerm ? "Sin resultados" : "No hay asistencias"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Socio</th>
                                    <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                    <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Sucursal</th>
                                    <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Operador</th>
                                    <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Fecha/Hora</th>
                                    <th className="text-center px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAsistencias.map((asistencia: AsistenciaItem, index: number) => (
                                    <tr
                                        key={asistencia.id}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-sm">{asistencia.socioNombre}</p>
                                                <p className="text-xs text-slate-400 font-bold">
                                                    #{asistencia.socioNumero} • CI: {asistencia.cedulaSocio || "-"}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${asistencia.vozVoto
                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                    : "bg-amber-50 text-amber-600 border border-amber-100"
                                                }`}>
                                                {asistencia.vozVoto ? (
                                                    <><CheckCircle className="h-3 w-3" /> Voz y Voto</>
                                                ) : (
                                                    <><XCircle className="h-3 w-3" /> Solo Voz</>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                                                <Building2 className="h-4 w-4 text-slate-300" />
                                                {asistencia.sucursal}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 hidden lg:table-cell">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                                                <User className="h-4 w-4 text-slate-300" />
                                                {asistencia.operador}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                                                <Clock className="h-4 w-4 text-slate-300" />
                                                {formatDateTime(asistencia.fechaHora)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedAsistencia(asistencia);
                                                    setShowDeleteOneModal(true);
                                                }}
                                                className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors"
                                                title="Eliminar asistencia"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete One Modal */}
            <AnimatePresence>
                {showDeleteOneModal && selectedAsistencia && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                            onClick={() => setShowDeleteOneModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-red-50 rounded-xl">
                                    <AlertTriangle className="h-8 w-8 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase">Eliminar Asistencia</h3>
                                    <p className="text-slate-400 text-sm">Esta acción no se puede deshacer</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                                <p className="text-slate-800 font-black uppercase">{selectedAsistencia.socioNombre}</p>
                                <p className="text-slate-400 text-sm font-bold">
                                    Socio #{selectedAsistencia.socioNumero} • {selectedAsistencia.vozVoto ? "Voz y Voto" : "Solo Voz"}
                                </p>
                                <p className="text-slate-300 text-xs font-bold mt-2">
                                    Registrado: {formatDateTime(selectedAsistencia.fechaHora)}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteOneModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl transition-colors uppercase text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteOne}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-sm"
                                >
                                    {deleting ? (
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Eliminar
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete All Modal */}
            <AnimatePresence>
                {showDeleteAllModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                            onClick={() => setShowDeleteAllModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-red-100"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-red-50 rounded-xl">
                                    <AlertCircle className="h-8 w-8 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-red-500 uppercase">⚠️ Acción Peligrosa</h3>
                                    <p className="text-slate-400 text-sm">Eliminar TODAS las asistencias</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                                <p className="text-red-600 text-sm">
                                    Estás a punto de eliminar <strong className="text-red-700">{stats.total} registros</strong>.
                                    Esta acción es <strong>irreversible</strong>.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                                    Código de Seguridad:
                                </label>
                                <input
                                    type="text"
                                    value={codigoSeguridad}
                                    onChange={(e) => setCodigoSeguridad(e.target.value)}
                                    placeholder="ELIMINAR-TODO-2026"
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:border-red-300 font-mono font-bold"
                                />
                                <p className="text-slate-400 text-xs mt-2">
                                    Código: <code className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">ELIMINAR-TODO-2026</code>
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteAllModal(false);
                                        setCodigoSeguridad("");
                                    }}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl transition-colors uppercase text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={deleting || codigoSeguridad !== "ELIMINAR-TODO-2026"}
                                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase text-sm"
                                >
                                    {deleting ? (
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Eliminar Todo
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

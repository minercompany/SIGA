"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
    Search, User, Users, CheckCircle, XCircle, AlertCircle,
    ChevronDown, Menu, Loader2, QrCode, CreditCard, Clock, Check
} from "lucide-react";
import { Toaster, toast } from "sonner";

interface FoundSocio {
    id: number;
    nombreCompleto: string;
    numeroSocio: string;
    cedula: string;
    conVozYVoto: boolean;

    // Asistencia
    asistenciaConfirmada: boolean;
    fechaAsistencia?: string;

    // Campos de estado de cuenta
    aporteAlDia: boolean;
    solidaridadAlDia: boolean;
    fondoAlDia: boolean;
    incoopAlDia: boolean;
    creditoAlDia: boolean;

    sucursal?: { nombre: string };
}

interface AsistenciaItem {
    id: number;
    fechaHora: string;
    socioNombre: string;
    socioNumero: string;
    vozVoto: boolean;
}

export default function AsistenciaPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [foundSocios, setFoundSocios] = useState<FoundSocio[]>([]);
    const [loading, setLoading] = useState(false);
    const [marking, setMarking] = useState<number | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Lista de asistencias del día
    const [asistenciasHoy, setAsistenciasHoy] = useState<AsistenciaItem[]>([]);

    // Cargar asistencias al inicio y cada 10s
    useEffect(() => {
        fetchAsistenciasHoy();
        const interval = setInterval(fetchAsistenciasHoy, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchAsistenciasHoy = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8081/api/asistencia/hoy", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAsistenciasHoy(res.data);
        } catch (error) {
            console.error("Error cargando asistencias", error);
        }
    };

    // Búsqueda en tiempo real
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchTerm.trim().length >= 1) {
            searchTimeoutRef.current = setTimeout(() => {
                buscarSocios(searchTerm);
            }, 600);
        } else if (searchTerm === "") {
            setFoundSocios([]);
            setHasSearched(false);
        }

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchTerm]);

    const buscarSocios = async (term: string) => {
        setLoading(true);
        setHasSearched(true);
        try {
            const token = localStorage.getItem("token");
            // Usamos buscar-exacto o buscar general según prefieras. 
            // 'buscar' devuelve lista, 'buscar-exacto' devuelve uno.
            // Para UX premium, mejor una lista de coincidencias:
            const res = await axios.get(`http://localhost:8081/api/socios/buscar?term=${term}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Mapemos la respuesta para asegurar compatibilidad
            const socios = res.data.map((s: any) => ({
                ...s,
                // Si el backend no devuelve 'conVozYVoto' calculado, lo calculamos aquí
                conVozYVoto: s.estadoVozVoto !== undefined ? s.estadoVozVoto : (s.aporteAlDia && s.solidaridadAlDia && s.fondoAlDia && s.incoopAlDia && s.creditoAlDia),

                // Chequear si ya está en asistenciasHoy
                asistenciaConfirmada: asistenciasHoy.some(a => a.socioNumero === s.numeroSocio)
            }));

            setFoundSocios(socios);
        } catch (error) {
            console.error("Error buscando socios", error);
            toast.error("Error al buscar socios");
        } finally {
            setLoading(false);
        }
    };

    const marcarAsistencia = async (socioId: number) => {
        setMarking(socioId);
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `http://localhost:8081/api/asistencia/marcar`,
                { socioId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Actualizar estado local
            setFoundSocios(prev => prev.map(s =>
                s.id === socioId
                    ? { ...s, asistenciaConfirmada: true, fechaAsistencia: new Date().toISOString() }
                    : s
            ));

            toast.success("Asistencia registrada correctamente");

            // Recargar lista
            fetchAsistenciasHoy();

        } catch (error: any) {
            console.error("Error marcando asistencia", error);
            // El backend devuelve { error: "..." }
            const msg = error.response?.data?.error || "Error al marcar asistencia";
            toast.error(msg);
        } finally {
            setMarking(null);
        }
    };

    // Estadísticas rápidas
    const totalPresentes = asistenciasHoy.length;
    const conVoto = asistenciasHoy.filter(a => a.vozVoto).length;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 min-h-screen relative">
            {/* Fondo Vivido Premium */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px]" />
            </div>

            <Toaster position="top-center" richColors />

            {/* Header Premium */}
            <div className="text-center space-y-4 pt-10">
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full shadow-lg shadow-violet-500/30 animate-in fade-in slide-in-from-top-4 duration-700">
                    <QrCode className="w-4 h-4 text-white" />
                    <span className="text-white font-bold text-xs uppercase tracking-widest">Control de Acceso 2025</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight animate-in fade-in zoom-in duration-700 drop-shadow-sm">
                    Registro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600">Asistencia</span>
                </h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    Control en tiempo real de ingreso a la asamblea.
                </p>

                {/* KPI Cards Vividos */}
                <div className="grid grid-cols-2 max-w-lg mx-auto gap-4 pt-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-xl shadow-emerald-500/10 border border-emerald-100 hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Users className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className="text-slate-500 text-xs font-black uppercase tracking-wider">Presentes</span>
                        </div>
                        <p className="text-4xl font-black text-emerald-600">{totalPresentes}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-100 hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-slate-500 text-xs font-black uppercase tracking-wider">Votan</span>
                        </div>
                        <p className="text-4xl font-black text-blue-600">{conVoto}</p>
                    </div>
                </div>
            </div>

            {/* Buscador Flotante Vivido */}
            <div className="sticky top-6 z-40 max-w-3xl mx-auto">
                <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 ring-4 ring-white/50 border border-indigo-100 transition-all focus-within:ring-violet-500/30 focus-within:shadow-violet-500/40 focus-within:scale-105 duration-300">
                    <div className="relative group flex items-center bg-slate-50/50 rounded-[2rem] hover:bg-white transition-colors">
                        <div className="pl-6 pr-4 pointer-events-none">
                            <Search className="h-7 w-7 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                        </div>
                        <input
                            autoFocus
                            type="text"
                            className="w-full py-5 bg-transparent text-xl font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            placeholder="Buscar socio (Nombre, CI, N°)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {loading && (
                            <div className="pr-6">
                                <Loader2 className="h-7 w-7 text-violet-600 animate-spin" />
                            </div>
                        )}
                        <div className="absolute right-4 hidden group-focus-within:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span className="bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">Enter</span>
                            para buscar
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start pt-4">

                {/* Columna Resultados (2/3) */}
                <div className="lg:col-span-2 space-y-4">
                    {foundSocios.map((socio) => (
                        <div
                            key={socio.id}
                            className={`group relative bg-white border rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 ${socio.asistenciaConfirmada
                                ? 'border-emerald-200 bg-emerald-50/20'
                                : 'border-slate-100 hover:border-violet-200'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

                                {/* Avatar / Estado */}
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors ${socio.asistenciaConfirmada
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-500'
                                    }`}>
                                    {socio.asistenciaConfirmada
                                        ? <CheckCircle className="w-10 h-10" />
                                        : <User className="w-10 h-10" />
                                    }
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="text-xl font-black text-slate-800">
                                                {socio.nombreCompleto}
                                            </h3>
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-black border border-slate-200">
                                                N° {socio.numeroSocio}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-medium text-slate-500 mt-1">
                                            <span className="flex items-center gap-1.5">
                                                <CreditCard className="w-4 h-4" />
                                                {socio.cedula}
                                            </span>
                                            {socio.sucursal && (
                                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-sm">
                                                    {socio.sucursal.nombre}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Badges Estado */}
                                    <div className="flex flex-wrap gap-2">
                                        {socio.conVozYVoto ? (
                                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                                                Voz y Voto
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Solo Voz (Observado)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Botón Acción */}
                                <div className="w-full md:w-auto">
                                    {socio.asistenciaConfirmada ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 cursor-default">
                                                <Check className="w-5 h-5" strokeWidth={3} />
                                                Ingresó
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-600">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => marcarAsistencia(socio.id)}
                                            disabled={marking === socio.id}
                                            className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-violet-600 hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-violet-500/20 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                        >
                                            {marking === socio.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-5 h-5" />
                                            )}
                                            <span>Registrar Ingreso</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {hasSearched && foundSocios.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Sin resultados</h3>
                            <p className="text-slate-500">No encontramos socios con ese criterio.</p>
                        </div>
                    )}

                    {!hasSearched && (
                        <div className="text-center py-20 opacity-40">
                            <Users className="w-32 h-32 text-slate-300 mx-auto mb-4" />
                            <p className="text-xl font-bold text-slate-400">Busca para comenzar...</p>
                        </div>
                    )}
                </div>

                {/* Columna Recientes (1/3) */}
                <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-slate-800 uppercase text-sm tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4 text-violet-500" />
                            Últimos Ingresos
                        </h3>
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                            Hoy: {asistenciasHoy.length}
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {asistenciasHoy.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-8">No hay ingresos registrados hoy.</p>
                        ) : (
                            asistenciasHoy.slice(0, 10).map((a, i) => (
                                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className={`w-2 h-10 rounded-full ${a.vozVoto ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{a.socioNombre}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-slate-400 font-mono">#{a.socioNumero}</p>
                                            <span className="text-[10px] text-slate-300">•</span>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {new Date(a.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {asistenciasHoy.length > 10 && (
                            <div className="text-center pt-2 border-t border-slate-100">
                                <span className="text-xs font-bold text-violet-600 cursor-pointer hover:underline">Ver todos...</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

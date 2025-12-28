"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search,
    UserCheck,
    Printer,
    AlertCircle,
    ShieldCheck,
    MapPin,
    Loader2,
    Users,
    Clock,
    CheckCircle2,
    AlertTriangle,
    X
} from "lucide-react";
import axios from "axios";
import { createRoot } from "react-dom/client";
import SocioCarnet, { SocioCarnetBase } from "@/components/carnet/SocioCarnet";
import { useConfig } from "@/context/ConfigContext";

interface Socio {
    id: number;
    numeroSocio: string;
    nombreCompleto: string;
    cedula: string;
    telefono: string | null;
    sucursal: { id: number; nombre: string; codigo: string } | null;
    aporteAlDia: boolean;
    solidaridadAlDia: boolean;
    fondoAlDia: boolean;
    incoopAlDia: boolean;
    creditoAlDia: boolean;
    presente?: boolean;
    horaIngreso?: string;
}

interface CheckinStat {
    total: number;
    presentes: number;
}

export default function CheckInPage() {
    const [query, setQuery] = useState("");
    const [socioEncontrado, setSocioEncontrado] = useState<Socio | null>(null);
    const [searching, setSearching] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [checkinLoading, setCheckinLoading] = useState(false);
    const [checkinSuccess, setCheckinSuccess] = useState(false);
    const [stats, setStats] = useState<CheckinStat>({ total: 0, presentes: 0 });
    const [ultimosCheckins, setUltimosCheckins] = useState<Socio[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const { nombreAsamblea, fechaAsamblea } = useConfig();

    // Estado para modal de socio ya ingresado
    const [showYaIngresoModal, setShowYaIngresoModal] = useState(false);
    const [yaIngresoInfo, setYaIngresoInfo] = useState<{
        socioNombre: string;
        socioNumero: string;
        horaIngreso: string;
        operadorRegistro: string;
    } | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get("http://localhost:8081/api/socios/estadisticas", { headers });
            setStats({
                total: response.data.totalPadron || 0,
                presentes: response.data.presentes || 0
            });
        } catch (error) {
            console.error("Error:", error);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        inputRef.current?.focus();
    }, [fetchStats]);

    const tieneVozYVoto = (socio: Socio) => {
        return socio.aporteAlDia && socio.solidaridadAlDia && socio.fondoAlDia && socio.incoopAlDia && socio.creditoAlDia;
    };

    // Nueva función reutilizable de búsqueda
    const performSearch = useCallback(async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setSocioEncontrado(null);
            setNotFound(false);
            return;
        }

        setSearching(true);
        setNotFound(false);
        setSocioEncontrado(null);
        setCheckinSuccess(false);

        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            // Usar endpoint de búsqueda parcial/exacta
            const response = await axios.get(
                `http://localhost:8081/api/socios/buscar?term=${encodeURIComponent(searchTerm.trim())}`,
                { headers }
            );

            if (response.data && response.data.length > 0) {
                // Si la búsqueda es exacta (ej. cédula completa o nro socio), el backend lo pone primero
                setSocioEncontrado(response.data[0]);
            } else {
                setNotFound(true);
            }
        } catch (error) {
            console.error("Error al buscar:", error);
            // No mostrar error 404 como alert, solo estado notFound
            setNotFound(true);
        } finally {
            setSearching(false);
        }
    }, []);

    // Effect para búsqueda automática (Debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 3) {
                performSearch(query);
            } else if (query.trim().length === 0) {
                setSocioEncontrado(null);
                setNotFound(false);
            }
        }, 500); // 500ms de espera al escribir

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(query);
    };

    const handleCheckin = async () => {
        if (!socioEncontrado) return;

        setCheckinLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:8081/api/asistencia/marcar",
                { socioId: socioEncontrado.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setCheckinSuccess(true);
            setUltimosCheckins(prev => [
                { ...socioEncontrado, horaIngreso: new Date().toLocaleTimeString() },
                ...prev.slice(0, 4)
            ]);

            // Actualizar estadísticas inmediatamente
            fetchStats();

            // Limpiar para nuevo check-in
            setTimeout(() => {
                setQuery("");
                setSocioEncontrado(null);
                setCheckinSuccess(false);
                inputRef.current?.focus();
            }, 2000);
        } catch (error: any) {
            // Manejar error de socio ya ingresado
            if (error.response?.status === 409 && error.response?.data?.error === 'SOCIO_YA_INGRESO') {
                setYaIngresoInfo({
                    socioNombre: error.response.data.socioNombre,
                    socioNumero: error.response.data.socioNumero,
                    horaIngreso: error.response.data.horaIngreso,
                    operadorRegistro: error.response.data.operadorRegistro
                });
                setShowYaIngresoModal(true);
                setSocioEncontrado(null);
                setQuery("");
            } else {
                console.error("Error en check-in:", error);
                alert("Error al registrar asistencia. Intente nuevamente.");
            }
        } finally {
            setCheckinLoading(false);
        }
    };

    const resetSearch = () => {
        setQuery("");
        setSocioEncontrado(null);
        setNotFound(false);
        setCheckinSuccess(false);
        inputRef.current?.focus();
    };

    const handlePrint = () => {
        if (!socioEncontrado) return;

        const printWindow = window.open('', '_blank', 'width=800,height=800');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Imprimir Carnet - ${socioEncontrado.nombreCompleto}</title>
                    <base href="${window.location.origin}/">
                    <meta charset="utf-8" />
                    <style>
                        body { 
                            margin: 0; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            min-height: 100vh; 
                            background: white; 
                        }
                        @media print {
                            @page { size: 100mm 100mm; margin: 0; }
                            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            #print-root { width: 100%; height: 100%; }
                        }
                    </style>
                </head>
                <body>
                    <div id="print-root"></div>
                </body>
            </html>
        `);
        printWindow.document.close();

        // Inyectar estilos del documento padre (Tailwind, fuentes, etc.)
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(style => {
            printWindow.document.head.appendChild(style.cloneNode(true));
        });

        const printRoot = printWindow.document.getElementById('print-root');
        if (printRoot) {
            const root = createRoot(printRoot);
            root.render(
                <SocioCarnetBase
                    socio={{
                        nroSocio: socioEncontrado.numeroSocio,
                        nombreCompleto: socioEncontrado.nombreCompleto,
                        tieneVoto: tieneVozYVoto(socioEncontrado),
                        cedula: socioEncontrado.cedula
                    }}
                    config={{
                        nombreAsamblea,
                        fechaAsamblea
                    }}
                />
            );

            // Esperar a que se renderice y carguen imágenes
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 1000);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header con stats */}
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Registro de Asistencia</h1>
                    <p className="text-slate-500">Busca al socio para confirmar su ingreso</p>
                </div>
                <div className="flex gap-4 justify-center">
                    <div className="bg-white rounded-xl px-6 py-4 border border-slate-100 text-center">
                        <p className="text-3xl font-bold text-slate-800">{stats.total.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Padrón Total</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl px-6 py-4 border border-emerald-200 text-center">
                        <p className="text-3xl font-bold text-emerald-600">{stats.presentes}</p>
                        <p className="text-xs text-emerald-600 uppercase tracking-wide">Presentes</p>
                    </div>
                </div>
            </div>

            {/* Buscador Central */}
            <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 p-8 border border-emerald-100">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2">
                        {searching ? (
                            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                        ) : (
                            <Search className="h-6 w-6 text-emerald-500 group-focus-within:text-emerald-600 transition-colors" />
                        )}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Introduce Cédula o Número de Socio..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-6 pl-16 pr-40 text-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                        autoFocus
                        disabled={searching}
                    />
                    <button
                        type="submit"
                        disabled={searching || !query.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3.5 px-8 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-200"
                    >
                        {searching ? "Buscando..." : "Buscar Socio"}
                    </button>
                </form>
            </div>

            {/* Resultado Check-in Exitoso */}
            {checkinSuccess && socioEncontrado && (
                <div className="bg-emerald-50 rounded-3xl p-8 border-2 border-emerald-300 text-center animate-pulse">
                    <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-emerald-800">¡CHECK-IN EXITOSO!</h2>
                    <p className="text-emerald-600 font-bold text-lg">{socioEncontrado.nombreCompleto}</p>
                </div>
            )}

            {/* Socio Encontrado */}
            {socioEncontrado && !checkinSuccess && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Ficha del Socio */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className={`rounded-3xl p-8 border ${tieneVozYVoto(socioEncontrado) ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} shadow-sm relative overflow-hidden`}>
                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                                <div className={`h-32 w-32 rounded-3xl flex items-center justify-center font-black text-4xl shadow-inner ${tieneVozYVoto(socioEncontrado) ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                    {socioEncontrado.numeroSocio.slice(-2)}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-800 leading-tight">{socioEncontrado.nombreCompleto}</h2>
                                        <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                                            Socio #{socioEncontrado.numeroSocio} • CI {socioEncontrado.cedula}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                        <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-bold text-slate-600">
                                                {socioEncontrado.sucursal?.nombre || "Sin sucursal"}
                                            </span>
                                        </div>
                                        {tieneVozYVoto(socioEncontrado) ? (
                                            <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm font-bold">
                                                <ShieldCheck className="h-4 w-4" />
                                                VOZ Y VOTO
                                            </div>
                                        ) : (
                                            <div className="bg-amber-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm font-bold">
                                                <AlertCircle className="h-4 w-4" />
                                                SOLO VOZ
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Estado de pagos - Responsivo */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Aporte</p>
                                <p className={`font-bold ${socioEncontrado.aporteAlDia ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {socioEncontrado.aporteAlDia ? 'AL DÍA' : 'PENDIENTE'}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Solidaridad</p>
                                <p className={`font-bold ${socioEncontrado.solidaridadAlDia ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {socioEncontrado.solidaridadAlDia ? 'AL DÍA' : 'PENDIENTE'}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Fondo</p>
                                <p className={`font-bold ${socioEncontrado.fondoAlDia ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {socioEncontrado.fondoAlDia ? 'AL DÍA' : 'PENDIENTE'}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Incoop</p>
                                <p className={`font-bold ${socioEncontrado.incoopAlDia ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {socioEncontrado.incoopAlDia ? 'AL DÍA' : 'PENDIENTE'}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Crédito</p>
                                <p className={`font-bold ${socioEncontrado.creditoAlDia ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {socioEncontrado.creditoAlDia ? 'AL DÍA' : 'PENDIENTE'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="space-y-6">
                        <button
                            onClick={handleCheckin}
                            disabled={checkinLoading}
                            className="w-full h-24 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-3xl flex flex-col items-center justify-center gap-2 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all text-xl font-black"
                        >
                            {checkinLoading ? (
                                <Loader2 className="h-8 w-8 animate-spin" />
                            ) : (
                                <UserCheck className="h-8 w-8" />
                            )}
                            {checkinLoading ? "PROCESANDO..." : "CONFIRMAR INGRESO"}
                        </button>

                        <button
                            onClick={handlePrint}
                            className="w-full h-24 bg-white border-2 border-slate-100 hover:border-emerald-200 text-emerald-600 rounded-3xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all text-xl font-black shadow-sm group">
                            <Printer className="h-8 w-8 group-hover:scale-110 transition-transform" />
                            IMPRIMIR CARNET
                        </button>

                        <button
                            onClick={resetSearch}
                            className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                        >
                            Nueva Búsqueda
                        </button>
                    </div>
                </div>
            )}

            {/* No encontrado */}
            {notFound && (
                <div className="bg-red-50 rounded-3xl p-12 text-center border-2 border-red-200">
                    <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-600">Socio no encontrado</h3>
                    <p className="text-red-500 mt-2">No se encontró ningún socio con: &quot;{query}&quot;</p>
                    <button
                        onClick={resetSearch}
                        className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                    >
                        Intentar de nuevo
                    </button>
                </div>
            )}

            {/* Últimos Check-ins */}
            {ultimosCheckins.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-emerald-600" />
                        Últimos Ingresos
                    </h3>
                    <div className="space-y-3">
                        {ultimosCheckins.map((socio, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                        {socio.numeroSocio.slice(-2)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">{socio.nombreCompleto}</p>
                                        <p className="text-xs text-slate-500">#{socio.numeroSocio}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-emerald-600">{socio.horaIngreso}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Placeholder inicial */}
            {!socioEncontrado && !notFound && !query && (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                    <Users className="h-20 w-20 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">Introduce un número para comenzar</h3>
                    <p className="text-slate-400 text-sm mt-2">Ingresa el número de socio o cédula del asistente</p>
                </div>
            )}

            {/* Modal: Socio Ya Ingresó */}
            {showYaIngresoModal && yaIngresoInfo && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
                        {/* Icono de advertencia */}
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-amber-100 rounded-full">
                                <AlertTriangle className="w-12 h-12 text-amber-600" />
                            </div>
                        </div>

                        {/* Título */}
                        <h3 className="text-xl font-black text-center text-slate-800 mb-2">
                            ¡Socio Ya Ingresó!
                        </h3>
                        <p className="text-slate-500 text-center text-sm mb-6">
                            Este socio ya se encuentra registrado en la asamblea
                        </p>

                        {/* Info del Socio */}
                        <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Socio</p>
                            <p className="font-bold text-slate-800">{yaIngresoInfo.socioNombre}</p>
                            <p className="text-sm text-slate-500">Nro: {yaIngresoInfo.socioNumero}</p>
                        </div>

                        {/* Info del Ingreso */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200">
                            <p className="text-xs text-amber-600 uppercase tracking-wide font-bold mb-2">Hora de Ingreso</p>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500 rounded-xl">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">
                                        {new Date(yaIngresoInfo.horaIngreso).toLocaleTimeString('es-PY', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                    <p className="text-sm text-slate-600">Registrado por {yaIngresoInfo.operadorRegistro}</p>
                                </div>
                            </div>
                        </div>

                        {/* Botón Cerrar */}
                        <button
                            onClick={() => {
                                setShowYaIngresoModal(false);
                                setYaIngresoInfo(null);
                                inputRef.current?.focus();
                            }}
                            className="w-full mt-6 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold transition-all"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

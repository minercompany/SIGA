"use client";

import { useState, useEffect } from "react";
import { Search, UserCheck, Clock, Users, CheckCircle2, XCircle, Printer, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import SocioCarnet from "@/components/carnet/SocioCarnet";

interface ConfirmacionData {
    nombre: string;
    numero: string;
    vozVoto: boolean;
}

export default function AsistenciaPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);
    const [socioEncontrado, setSocioEncontrado] = useState<any>(null);
    const [asistenciasHoy, setAsistenciasHoy] = useState<any[]>([]);
    const [marcando, setMarcando] = useState(false);
    const [showConfirmacion, setShowConfirmacion] = useState(false);
    const [confirmacionData, setConfirmacionData] = useState<ConfirmacionData | null>(null);
    const [printingContent, setPrintingContent] = useState<"carnet" | "voto" | null>(null);

    const handlePrint = (type: "carnet" | "voto") => {
        setPrintingContent(type);
        setTimeout(() => {
            window.print();
            setPrintingContent(null);
        }, 300);
    };

    useEffect(() => {
        fetchAsistenciasHoy();
        const interval = setInterval(fetchAsistenciasHoy, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchAsistenciasHoy = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:8081/api/asistencia/hoy", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAsistenciasHoy(response.data);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleBuscarSocio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) return;

        setSearching(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `http://localhost:8081/api/socios/buscar-exacto?term=${searchTerm}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const socio = response.data;
            // Asegurarse de calcular el estado de voto si no viene del backend
            if (socio && socio.conVozYVoto === undefined) {
                socio.conVozYVoto = socio.aporteAlDia &&
                    socio.solidaridadAlDia &&
                    socio.fondoAlDia &&
                    socio.incoopAlDia &&
                    socio.creditoAlDia;
            }

            setSocioEncontrado(socio);
        } catch (error: any) {
            if (error.response?.status === 404) {
                alert("Socio no encontrado");
            } else {
                console.error("Error:", error);
            }
            setSocioEncontrado(null);
        } finally {
            setSearching(false);
        }
    };

    const handleMarcarAsistencia = async () => {
        if (!socioEncontrado) return;

        setMarcando(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:8081/api/asistencia/marcar",
                { socioId: socioEncontrado.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Mostrar modal de confirmación animado
            setConfirmacionData({
                nombre: socioEncontrado.nombreCompleto,
                numero: socioEncontrado.numeroSocio,
                vozVoto: response.data.vozVoto
            });
            setShowConfirmacion(true);

            setSearchTerm("");
            setSocioEncontrado(null);
            fetchAsistenciasHoy();

            // Auto-cerrar después de 3 segundos
            setTimeout(() => {
                setShowConfirmacion(false);
                setConfirmacionData(null);
            }, 3000);
        } catch (error: any) {
            alert(error.response?.data?.error || "Error al marcar asistencia");
        } finally {
            setMarcando(false);
        }
    };

    const totalPresentes = asistenciasHoy.length;
    const vyvPresentes = asistenciasHoy.filter(a => a.vozVoto).length;

    return (
        <div className="min-h-screen bg-slate-50 p-6 relative">
            {/* Modal de Confirmación Animado */}
            <AnimatePresence>
                {showConfirmacion && confirmacionData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center"
                        onClick={() => setShowConfirmacion(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="bg-white rounded-[3rem] p-12 shadow-2xl max-w-md w-full mx-4 text-center relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Círculos decorativos */}
                            <div className="absolute -top-20 -right-20 h-40 w-40 bg-emerald-100 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-20 -left-20 h-40 w-40 bg-teal-100 rounded-full blur-3xl"></div>

                            <div className="relative z-10">
                                {/* Icono animado */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
                                    className="mx-auto mb-6 h-24 w-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200"
                                >
                                    <Check className="h-12 w-12 text-white" strokeWidth={3} />
                                </motion.div>

                                {/* Título */}
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2"
                                >
                                    Asistencia Confirmada
                                </motion.h2>

                                {/* Datos del socio */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-6 space-y-3"
                                >
                                    <p className="text-xl font-black text-slate-700">{confirmacionData.nombre}</p>
                                    <p className="text-sm font-bold text-slate-400">N° {confirmacionData.numero}</p>

                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5, type: "spring" }}
                                        className={`inline-block mt-4 px-6 py-2 rounded-full font-black uppercase tracking-widest text-sm ${confirmacionData.vozVoto
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-amber-100 text-amber-700"
                                            }`}
                                    >
                                        {confirmacionData.vozVoto ? "VOZ Y VOTO" : "SOLO VOZ"}
                                    </motion.div>
                                </motion.div>

                                {/* Barra de progreso */}
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 3, ease: "linear" }}
                                    className="mt-8 h-1 bg-emerald-500 rounded-full origin-left"
                                ></motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Control de Asistencia</h1>
                        <p className="text-slate-500 font-medium">Registro de presencia de socios</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3">
                                <Users className="h-8 w-8 text-emerald-600" />
                                <div>
                                    <p className="text-2xl font-black text-slate-800">{totalPresentes}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presentes</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3">
                                <UserCheck className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-2xl font-black text-slate-800">{vyvPresentes}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voz y Voto</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Panel de búsqueda */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                        <h2 className="text-xl font-black text-slate-700 mb-6 uppercase tracking-tight">Buscar Socio</h2>

                        <form onSubmit={handleBuscarSocio} className="space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="CI o Número de Socio..."
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={searching || !searchTerm}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-30 shadow-lg"
                            >
                                {searching ? "Buscando..." : "Buscar"}
                            </button>
                        </form>

                        {/* Resultado de búsqueda */}
                        {socioEncontrado && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black text-slate-800">{socioEncontrado.nombreCompleto}</h3>
                                        <div className="flex gap-3 mt-2">
                                            <span className="text-xs font-bold text-slate-600">CI: {socioEncontrado.cedula}</span>
                                            <span className="text-xs font-bold text-slate-600">N°: {socioEncontrado.numeroSocio}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {socioEncontrado.conVozYVoto ? (
                                            <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                                                Voz y Voto
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                                                Solo Voz
                                            </span>
                                        )}
                                        {socioEncontrado.asistenciaConfirmada && (
                                            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                <Check className="h-3 w-3" /> Asistencia Confirmada
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {socioEncontrado.asistenciaConfirmada ? (
                                    <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
                                        <p className="text-sm font-black text-blue-700 uppercase">
                                            ✓ Este socio ya tiene asistencia confirmada
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <button
                                            onClick={handleMarcarAsistencia}
                                            disabled={marcando}
                                            className="py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            {marcando ? "Marcando..." : "Confirmar Asistencia"}
                                        </button>
                                        <button
                                            onClick={() => { setSocioEncontrado(null); setSearchTerm(""); }}
                                            className="py-3 bg-slate-200 text-slate-700 rounded-xl font-black uppercase text-xs hover:bg-slate-300 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Cancelar
                                        </button>
                                    </div>
                                )}

                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => handlePrint("carnet")}
                                        className="flex-1 py-2 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Printer className="h-3 w-3" />
                                        Carnet
                                    </button>
                                    <button
                                        onClick={() => handlePrint("voto")}
                                        className="flex-1 py-2 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Printer className="h-3 w-3" />
                                        Voto
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Lista de asistencias */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-slate-700 uppercase tracking-tight">Asistencias de Hoy</h2>
                            <Clock className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {asistenciasHoy.length === 0 ? (
                                <p className="text-center text-slate-400 font-bold py-12 text-sm">
                                    Aún no hay asistencias registradas
                                </p>
                            ) : (
                                asistenciasHoy.map((asistencia, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-black text-slate-800 text-sm">{asistencia.socioNombre}</p>
                                                <p className="text-xs font-bold text-slate-400">N° {asistencia.socioNumero}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {asistencia.vozVoto ? (
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase">Voz y Voto</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase">Solo Voz</span>
                                                )}
                                                <span className="text-xs text-slate-400 font-bold">
                                                    {new Date(asistencia.fechaHora).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PRINT AREA - HIDDEN ON SCREEN */}
            <div className="hidden print:block fixed inset-0 z-[9999] bg-white">
                <style jsx global>{`
                    @media print {
                        @page { 
                            size: 100mm 100mm; 
                            margin: 0; 
                        }
                        body { 
                            background: white !important; 
                            padding: 0 !important; 
                            margin: 0 !important; 
                        }
                        .no-print { display: none !important; }
                    }
                `}</style>

                {printingContent === "carnet" && socioEncontrado && (
                    <div style={{ width: '100mm', height: '100mm', overflow: 'hidden' }}>
                        <SocioCarnet socio={{
                            nroSocio: socioEncontrado.numeroSocio,
                            nombreCompleto: socioEncontrado.nombreCompleto,
                            tieneVoto: socioEncontrado.conVozYVoto,
                            cedula: socioEncontrado.cedula
                        }} />
                    </div>
                )}

                {printingContent === "voto" && socioEncontrado && (
                    <div className="flex items-center justify-center h-screen p-10">
                        <div style={{
                            width: '100mm',
                            height: '100mm',
                            border: '3px solid black',
                            padding: '10mm',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            textAlign: 'center',
                            fontFamily: 'Arial, sans-serif',
                            background: socioEncontrado.conVozYVoto ? '#f0fdf4' : '#fff'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <img src="/images/logo_coop.png" style={{ width: '30px', height: '30px' }} />
                                <div>
                                    <h1 style={{ fontSize: '20px', fontWeight: '900', margin: '0' }}>BOLETO DE VOTO</h1>
                                    <p style={{ fontSize: '10px', fontWeight: 'bold', margin: '0' }}>ASAMBLEA GENERAL ORDINARIA 2025</p>
                                </div>
                            </div>

                            <div style={{ borderTop: '2px dashed #000', borderBottom: '2px dashed #000', padding: '15px 0' }}>
                                <p style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>SOCIO N°</p>
                                <p style={{ fontSize: '60px', fontWeight: '900', margin: 0, lineHeight: '1' }}>{socioEncontrado.numeroSocio}</p>
                                <p style={{ fontSize: '20px', fontWeight: '900', marginTop: '5px', textTransform: 'uppercase' }}>{socioEncontrado.nombreCompleto}</p>
                            </div>

                            <div>
                                <div style={{
                                    backgroundColor: socioEncontrado.conVozYVoto ? '#000' : '#fff',
                                    color: socioEncontrado.conVozYVoto ? '#fff' : '#000',
                                    padding: '10px',
                                    fontSize: '22px',
                                    fontWeight: '900',
                                    border: '2px solid black'
                                }}>
                                    {socioEncontrado.conVozYVoto ? "HABILITADO PARA VOTAR" : "SOLO VOZ (NO VOTA)"}
                                </div>
                                <p style={{ fontSize: '8px', marginTop: '8px', fontStyle: 'italic', fontWeight: 'bold' }}>
                                    ESTE BOLETO ES PERSONAL E INTRANSFERIBLE.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

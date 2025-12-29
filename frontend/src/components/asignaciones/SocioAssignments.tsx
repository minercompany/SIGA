"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Loader2, ClipboardList, Trash2, Plus, Shield, CheckCircle2, UserPlus, Bell, X } from "lucide-react";

interface Socio {
    id: number;
    numeroSocio: string;
    nombreCompleto: string;
    cedula: string;
    aporteAlDia: boolean;
    solidaridadAlDia: boolean;
    fondoAlDia: boolean;
    incoopAlDia: boolean;
    creditoAlDia: boolean;
}

interface ListaAsignacion {
    id: number;
    nombre: string;
    descripcion: string;
    total: number;
    vyv: number;
    soloVoz: number;
}

interface SocioAssignmentsProps {
    misListas: ListaAsignacion[];
    selectedLista: ListaAsignacion | null;
    socios: Socio[];
    loadingSocios: boolean;
    socioSearchTerm: string;
    addingSocio: boolean;
    searchedSocio: Socio | null;
    showConfirmModal: boolean;
    onSelectLista: (lista: ListaAsignacion) => void;
    onCreateClick: () => void;
    onSearchSocio: () => void;
    onConfirmAddSocio: () => void;
    onCancelAdd: () => void;
    onRemoveSocio: (socioId: number) => void;
    onSearchTermChange: (term: string) => void;
    tieneVozYVoto: (socio: Socio) => boolean;
    onDeleteLista?: (listaId: number) => void;
    onUpdateLista?: (listaId: number, nombre: string, descripcion: string) => void;
}

export function SocioAssignments({
    misListas,
    selectedLista,
    socios,
    loadingSocios,
    socioSearchTerm,
    addingSocio,
    searchedSocio,
    onSelectLista,
    onSearchSocio,
    onConfirmAddSocio,
    onCancelAdd,
    onRemoveSocio,
    onSearchTermChange,
    tieneVozYVoto,
}: SocioAssignmentsProps) {

    // Estado para notificación toast
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // Usar selectedLista para estadísticas (el padre selecciona la lista con más socios)
    // Fallback a la primera lista solo si no hay ninguna seleccionada
    const miLista = selectedLista || (misListas.length > 0 ? misListas[0] : null);

    // Mensajes amables rotativos
    const mensajesAmables = [
        "¡Hola! 👋 Te faltan {n} socios para alcanzar tu meta de 10. ¡Tú puedes!",
        "📊 Recordatorio amable: Con {n} socios más llegarás a la meta recomendada.",
        "🎯 ¡Sigue así! Solo necesitas agregar {n} socios más a tu lista.",
        "💪 ¡Casi llegas! Agrega {n} socios más para una distribución óptima.",
        "✨ ¡Excelente trabajo! Solo faltan {n} socios para completar tu meta."
    ];

    // Notificación periódica amable (cada 2 minutos)
    useEffect(() => {
        if (!miLista || miLista.total >= 10) return;

        const interval = setInterval(() => {
            const faltantes = 10 - miLista.total;
            const mensajeRandom = mensajesAmables[Math.floor(Math.random() * mensajesAmables.length)];
            setToastMessage(mensajeRandom.replace("{n}", faltantes.toString()));
            setShowToast(true);

            // Auto-ocultar después de 8 segundos
            setTimeout(() => setShowToast(false), 8000);
        }, 120000); // 2 minutos

        // Mostrar primera notificación después de 30 segundos
        const initialTimeout = setTimeout(() => {
            if (miLista.total < 10) {
                const faltantes = 10 - miLista.total;
                setToastMessage(`¡Hola! 👋 Te recomendamos agregar ${faltantes} socios más para llegar a 10. ¡Tú puedes!`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 8000);
            }
        }, 30000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimeout);
        };
    }, [miLista?.total]);

    // Búsqueda automática (Debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (socioSearchTerm.length >= 3) {
                onSearchSocio();
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [socioSearchTerm]);

    // Auto-selección de la primera lista solo si no hay una seleccionada
    useEffect(() => {
        if (misListas.length > 0 && !selectedLista) {
            // Seleccionar la lista con más socios
            const listaConMasSocios = misListas.reduce((prev, curr) =>
                (curr.total || 0) > (prev.total || 0) ? curr : prev
            );
            onSelectLista(listaConMasSocios);
        }
    }, [misListas, selectedLista]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header Premium con Estadísticas - Compacto */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white">
                <div className="mx-auto" style={{ maxWidth: 'clamp(320px, 95vw, 900px)', padding: 'clamp(0.75rem, 2vw, 1.5rem)' }}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div data-tour="asignaciones-header">
                            <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }} className="font-black leading-tight">
                                Mi Lista de Asignaciones
                            </h1>
                            <p className="text-violet-200 text-xs mt-0.5">
                                {miLista?.nombre || "Cargando..."}
                            </p>
                        </div>

                        {/* Estadísticas - Compactas */}
                        {miLista && (
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 md:pb-0">
                                <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 text-center min-w-[60px] flex-shrink-0">
                                    <p className="text-lg md:text-xl font-black">{miLista.total}</p>
                                    <p className="text-[9px] md:text-[10px] text-violet-200 uppercase tracking-wide">Total</p>
                                </div>
                                <div className="bg-emerald-500/30 backdrop-blur rounded-xl px-3 py-2 text-center min-w-[60px] flex-shrink-0">
                                    <p className="text-lg md:text-xl font-black text-emerald-300">{miLista.vyv}</p>
                                    <p className="text-[9px] md:text-[10px] text-emerald-200 uppercase tracking-wide">V&V</p>
                                </div>
                                <div className="bg-amber-500/30 backdrop-blur rounded-xl px-3 py-2 text-center min-w-[60px] flex-shrink-0">
                                    <p className="text-lg md:text-xl font-black text-amber-300">{miLista.soloVoz}</p>
                                    <p className="text-[9px] md:text-[10px] text-amber-200 uppercase tracking-wide">Solo</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto space-y-4" style={{ maxWidth: 'clamp(320px, 95vw, 900px)', padding: 'clamp(0.75rem, 2vw, 1.5rem)' }}>
                {/* Mensaje Amable: Mínimo 5 Socios */}
                {miLista && miLista.total < 10 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 rounded-3xl border-2 border-indigo-200 p-6 shadow-lg shadow-indigo-100"
                        data-tour="meta-indicator"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-500 rounded-xl shadow-lg">
                                <ClipboardList className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-indigo-900 mb-1">
                                    ¡Estás comenzando bien! 🎯
                                </h3>
                                <p className="text-sm text-indigo-700 mb-3 leading-relaxed">
                                    Para asegurar una distribución efectiva del trabajo, <span className="font-bold">te recomendamos agregar al menos 10 socios</span> a tu lista.
                                    Actualmente tienes <span className="font-bold text-indigo-900">{miLista.total}</span> {miLista.total === 1 ? 'socio' : 'socios'}.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-white/50 rounded-full h-3 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((miLista.total / 10) * 100, 100)}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-indigo-600 min-w-[60px] text-right">
                                        {miLista.total} / 10
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Buscador Principal */}
                {miLista && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6"
                        data-tour="search-socio"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-200">
                                <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Agregar Socio</h2>
                                <p className="text-sm text-slate-500">Escribe la cédula o número de socio</p>
                            </div>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); onSearchSocio(); }} className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Ingresa Cédula o N° de Socio..."
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-medium text-lg text-slate-700 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white outline-none transition-all"
                                    value={socioSearchTerm}
                                    onChange={(e) => onSearchTermChange(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={addingSocio || !socioSearchTerm}
                                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold hover:from-violet-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-violet-200"
                            >
                                {addingSocio ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Search className="h-5 w-5" />
                                        Buscar
                                    </>
                                )}
                            </motion.button>
                        </form>

                        {/* Resultado de búsqueda */}
                        {searchedSocio && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 p-5"
                            >
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-500 rounded-xl">
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Socio Encontrado</p>
                                            <p className="text-xl font-black text-slate-800">{searchedSocio.nombreCompleto}</p>
                                            <div className="flex gap-4 mt-1">
                                                <span className="text-sm text-slate-500">CI: <span className="font-bold text-slate-700">{searchedSocio.cedula}</span></span>
                                                <span className="text-sm text-slate-500">Nro: <span className="font-bold text-slate-700">{searchedSocio.numeroSocio}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                        <div className={`px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 border-2 ${tieneVozYVoto(searchedSocio)
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {tieneVozYVoto(searchedSocio) ? (
                                                <><CheckCircle2 className="w-4 h-4" /> VOZ Y VOTO</>
                                            ) : (
                                                <><Shield className="w-4 h-4" /> SOLO VOZ</>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={onConfirmAddSocio}
                                                className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Agregar
                                            </button>
                                            <button
                                                onClick={onCancelAdd}
                                                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold transition-all"
                                                title="Cancelar"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Lista de Socios */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
                    data-tour="socios-list"
                >
                    {/* Header Compacto Movil */}
                    <div className="p-3 md:p-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                        <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                <Users className="w-5 h-5 flex-shrink-0" />
                                <div className="min-w-0">
                                    <h2 className="text-sm md:text-xl font-bold leading-tight truncate">Mis Socios</h2>
                                    <p className="text-[10px] md:text-sm text-emerald-100 truncate hidden md:block">{miLista?.nombre}</p>
                                </div>
                            </div>
                            <div className="flex gap-1.5 md:gap-3 flex-shrink-0">
                                <div className="bg-white/20 backdrop-blur rounded-lg px-2 py-1 text-center min-w-[36px] md:min-w-[50px]">
                                    <p className="text-sm md:text-xl font-black">{miLista?.total || 0}</p>
                                    <p className="text-[7px] md:text-[10px] text-white/80 uppercase">Total</p>
                                </div>
                                <div className="bg-emerald-400/30 backdrop-blur rounded-lg px-2 py-1 text-center min-w-[36px] md:min-w-[50px]">
                                    <p className="text-sm md:text-xl font-black text-emerald-100">{miLista?.vyv || 0}</p>
                                    <p className="text-[7px] md:text-[10px] text-emerald-100/80 uppercase">V&V</p>
                                </div>
                                <div className="bg-amber-400/30 backdrop-blur rounded-lg px-2 py-1 text-center min-w-[36px] md:min-w-[50px]">
                                    <p className="text-sm md:text-xl font-black text-amber-100">{miLista?.soloVoz || 0}</p>
                                    <p className="text-[7px] md:text-[10px] text-amber-100/80 uppercase">SV</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista con Animaciones */}
                    {loadingSocios ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-3" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Actualizando nómina...</p>
                        </div>
                    ) : socios.length > 0 ? (
                        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {socios.map((socio, index) => {
                                    const esVyV = tieneVozYVoto(socio);
                                    return (
                                        <motion.div
                                            key={socio.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{
                                                opacity: 0,
                                                scale: 0.9,
                                                x: -20,
                                                transition: { duration: 0.2, ease: "easeIn" }
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 30,
                                                delay: index * 0.01
                                            }}
                                            className="p-3 md:p-5 hover:bg-slate-50/80 transition-all group relative border-l-4 border-transparent hover:border-violet-500"
                                        >
                                            <div className="flex items-center gap-3 md:gap-4">
                                                {/* Número Identificador */}
                                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-white text-sm md:text-lg shadow-lg rotate-3 group-hover:rotate-0 transition-transform ${esVyV ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-100' : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-100'
                                                    }`}>
                                                    {index + 1}
                                                </div>

                                                {/* Información Principal */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                                                        <p className="font-black text-slate-800 text-sm md:text-lg leading-tight truncate tracking-tight">
                                                            {socio.nombreCompleto}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] md:text-xs font-black uppercase tracking-wider border-2 ${esVyV
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                                                }`}>
                                                                {esVyV ? 'Derecho a Voto' : 'Solo Voz'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 text-[10px] md:text-sm">
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold">
                                                            <Shield className="w-3 h-3 text-slate-400" />
                                                            CI: <span className="text-slate-800">{socio.cedula}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold">
                                                            <Users className="w-3 h-3 text-slate-400" />
                                                            N°: <span className="text-slate-800">{socio.numeroSocio}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Acción de Quitar (Botón Progresivo) */}
                                                <div className="flex-shrink-0">
                                                    <ConfirmRemoveButton onConfirm={() => onRemoveSocio(socio.id)} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="relative inline-block mb-6">
                                <Users className="w-20 h-20 text-slate-100" />
                                <Plus className="w-8 h-8 text-emerald-400 absolute -bottom-2 -right-2 animate-bounce" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase italic">Tu lista está vacía</h3>
                            <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">
                                Comienza agregando socios a tu lista de trabajo usando el buscador superior.
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Toast Notification Premium */}
            {showToast && (
                <motion.div
                    initial={{ opacity: 0, y: 100, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-6 left-1/2 transform z-50"
                >
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-lg">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                            <Bell className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <p className="text-sm font-medium flex-1">{toastMessage}</p>
                        <button
                            onClick={() => setShowToast(false)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// Componente Interno para botón de borrado con confirmación premium
function ConfirmRemoveButton({ onConfirm }: { onConfirm: () => void }) {
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (isConfirming) {
            const timer = setTimeout(() => setIsConfirming(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isConfirming]);

    return (
        <div className="relative flex items-center justify-end min-w-[40px] md:min-w-[120px]">
            <AnimatePresence mode="wait">
                {!isConfirming ? (
                    <motion.button
                        key="delete"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsConfirming(true);
                        }}
                        className="p-2 md:p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                        title="Quitar socio"
                    >
                        <Trash2 className="w-5 h-5" />
                    </motion.button>
                ) : (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className="flex items-center gap-2 bg-red-500 rounded-xl p-1 md:pr-4 overflow-hidden shadow-lg shadow-red-200"
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsConfirming(false);
                            }}
                            className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
                        >
                            <X className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onConfirm();
                            }}
                            className="text-white text-[10px] md:text-sm font-black uppercase tracking-widest whitespace-nowrap py-2 pr-2"
                        >
                            Confirmar
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

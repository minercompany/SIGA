"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, Loader2, ClipboardList, Trash2, Plus, Shield, CheckCircle2, UserPlus } from "lucide-react";

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

    // Usar selectedLista para estadísticas (el padre selecciona la lista con más socios)
    // Fallback a la primera lista solo si no hay ninguna seleccionada
    const miLista = selectedLista || (misListas.length > 0 ? misListas[0] : null);

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
            {/* Header Premium con Estadísticas */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black">
                                Mi Lista de Asignaciones
                            </h1>
                            <p className="text-violet-200 text-sm mt-1">
                                {miLista?.nombre || "Cargando..."}
                            </p>
                        </div>

                        {/* Estadísticas */}
                        {miLista && (
                            <div className="flex gap-4">
                                <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3 text-center">
                                    <p className="text-2xl font-black">{miLista.total}</p>
                                    <p className="text-xs text-violet-200 uppercase tracking-wide">Total</p>
                                </div>
                                <div className="bg-emerald-500/30 backdrop-blur rounded-2xl px-5 py-3 text-center">
                                    <p className="text-2xl font-black text-emerald-300">{miLista.vyv}</p>
                                    <p className="text-xs text-emerald-200 uppercase tracking-wide">Voz y Voto</p>
                                </div>
                                <div className="bg-amber-500/30 backdrop-blur rounded-2xl px-5 py-3 text-center">
                                    <p className="text-2xl font-black text-amber-300">{miLista.soloVoz}</p>
                                    <p className="text-xs text-amber-200 uppercase tracking-wide">Solo Voz</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                {/* Buscador Principal */}
                {miLista && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6"
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
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-2 rounded-xl text-sm font-bold ${tieneVozYVoto(searchedSocio) ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                            {tieneVozYVoto(searchedSocio) ? '✓ VOZ Y VOTO' : '⚠ SOLO VOZ'}
                                        </span>
                                        <button
                                            onClick={onConfirmAddSocio}
                                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Agregar
                                        </button>
                                        <button
                                            onClick={onCancelAdd}
                                            className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl font-bold transition-all"
                                        >
                                            Cancelar
                                        </button>
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
                >
                    {/* Header */}
                    <div className="p-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6" />
                                <div>
                                    <h2 className="text-xl font-bold">Mis Socios Asignados</h2>
                                    <p className="text-sm text-emerald-100">{miLista?.nombre}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center">
                                    <p className="text-xl font-black">{miLista?.total || 0}</p>
                                    <p className="text-[10px] text-white/70 uppercase">Total</p>
                                </div>
                                <div className="bg-emerald-400/30 backdrop-blur rounded-xl px-4 py-2 text-center">
                                    <p className="text-xl font-black text-emerald-200">{miLista?.vyv || 0}</p>
                                    <p className="text-[10px] text-emerald-100/70 uppercase">V&V</p>
                                </div>
                                <div className="bg-amber-400/30 backdrop-blur rounded-xl px-4 py-2 text-center">
                                    <p className="text-xl font-black text-amber-200">{miLista?.soloVoz || 0}</p>
                                    <p className="text-[10px] text-amber-100/70 uppercase">SV</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista */}
                    {loadingSocios ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-3" />
                            <p className="text-slate-500">Cargando socios...</p>
                        </div>
                    ) : socios.length > 0 ? (
                        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                            {socios.map((socio, index) => {
                                const esVyV = tieneVozYVoto(socio);
                                return (
                                    <motion.div
                                        key={`${socio.id}-${index}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="p-4 hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm ${esVyV ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-amber-500 to-orange-500'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{socio.nombreCompleto}</p>
                                                    <div className="flex gap-3 text-sm text-slate-500">
                                                        <span>CI: <span className="font-medium text-slate-700">{socio.cedula}</span></span>
                                                        <span>Nro: <span className="font-medium text-slate-700">{socio.numeroSocio}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${esVyV
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {esVyV ? 'VOZ Y VOTO' : 'SOLO VOZ'}
                                                </span>
                                                <button
                                                    onClick={() => onRemoveSocio(socio.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Tu lista no tiene socios aún</p>
                            <p className="text-sm text-slate-400 mt-1">Usa el buscador de arriba para agregar socios</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

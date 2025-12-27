"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, User, ChevronRight, Check, X, ShieldAlert, Users, ChevronDown } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";

interface Lista {
    id: number;
    idUsuario: number;
    nombre: string;
    responsable: string;
    responsableUser: string;
    activa: boolean;
    total: number;
}

interface Socio {
    id: number;
    nombreCompleto: string;
    numeroSocio: string;
    cedula: string;
    vozYVoto: boolean;
}

export default function DirectAssignmentMaster() {
    const [responsables, setResponsables] = useState<Lista[]>([]);
    const [selectedTarget, setSelectedTarget] = useState<Lista | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [socioEncontrado, setSocioEncontrado] = useState<Socio | null>(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(true);

    useEffect(() => {
        fetchResponsables();
    }, []);

    // Efecto Debounce para búsqueda automática
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length >= 3) {
                performSearch(searchTerm);
            } else if (searchTerm.length === 0) {
                setSocioEncontrado(null);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchResponsables = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://192.168.100.123:8081/api/asignaciones/admin/responsables", {
                headers: { Authorization: `Bearer ${token}` }
            });
            // res.data is List<Map> from getPosiblesResponsables
            // Mapeamos ID de usuario a idUsuario y id ficticio
            setResponsables(res.data);

            if (res.data.length === 1) {
                setSelectedTarget(res.data[0]);
                setIsSelectorOpen(false);
            }

        } catch (error) {
            console.error("Error cargando responsables:", error);
        }
    };

    const performSearch = async (term: string) => {
        setSearching(true);
        setSocioEncontrado(null);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://192.168.100.123:8081/api/socios/buscar?term=${term}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (Array.isArray(res.data) && res.data.length > 0) {
                setSocioEncontrado(res.data[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    const [searchTermResponsable, setSearchTermResponsable] = useState("");

    const handleAssign = async () => {
        if (!selectedTarget || !socioEncontrado) return;

        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            await axios.post(
                `http://192.168.100.123:8081/api/asignaciones/admin/asignar-a-usuario/${selectedTarget.idUsuario || selectedTarget.id}`,
                { term: socioEncontrado.numeroSocio },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Feedback Toast
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });

            // Actualizar contador visualmente (truco optimista)
            setSelectedTarget(prev => prev ? ({ ...prev, total: prev.total + 1 }) : null);

            Toast.fire({
                icon: 'success',
                title: `Asignado a ${selectedTarget.responsable.split(' ')[0]}`
            });

            setSocioEncontrado(null);
            setSearchTerm("");

        } catch (error: any) {
            Swal.fire("Error", error.response?.data?.error || "Error al asignar", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-20 pt-8 px-4">

            {/* Header */}
            <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider shadow-sm mb-4">
                    <ShieldAlert className="h-3 w-3 text-red-400" />
                    MODO ADMINISTRADOR
                </div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
                    Asignación Directa
                </h1>
                <p className="text-slate-500 font-medium">Selecciona un responsable y asigna socios automáticamente.</p>
            </div>

            {/* SELECCIÓN DE RESPONSABLE */}
            <div className={`bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-500 relative z-20 ${isSelectorOpen ? 'mb-8 ring-4 ring-slate-100' : 'mb-8'}`}>
                {/* Header Selector */}
                <button
                    onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                    className="w-full bg-slate-900 text-white p-5 flex items-center justify-between hover:bg-slate-800 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <Users className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">RESPONSABLE ACTUAL</div>
                            <div className="font-bold text-xl flex items-center gap-2">
                                {selectedTarget ? (
                                    <>
                                        {selectedTarget.responsable}
                                        <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full ml-1 shadow-sm">
                                            {selectedTarget.total}
                                        </span>
                                    </>
                                ) : "Selecciona un Responsable"}
                            </div>
                        </div>
                    </div>
                    <ChevronDown className={`h-6 w-6 text-slate-400 transition-transform duration-300 ${isSelectorOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Body Selector (Lista de Personas) */}
                <div className={`transition-all duration-300 ease-in-out ${isSelectorOpen ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'}`}>

                    {/* BUSCADOR RESPONSABLES */}
                    <div className="p-3 bg-slate-100 sticky top-0 z-20 border-b border-slate-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar nombre o cédula..."
                                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
                                value={searchTermResponsable}
                                onChange={e => setSearchTermResponsable(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="p-2 bg-slate-50 overflow-y-auto max-h-[50vh] custom-scrollbar">
                        {responsables
                            .filter(r => r.responsable.toLowerCase().includes(searchTermResponsable.toLowerCase()) || r.responsableUser.includes(searchTermResponsable))
                            .map(target => (
                                <button
                                    key={target.id}
                                    onClick={() => {
                                        setSelectedTarget(target);
                                        setIsSelectorOpen(false); // Auto cerrar al seleccionar
                                    }}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all mb-2 last:mb-0 group ${selectedTarget?.id === target.id
                                        ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                                        : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-100"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-black transition-colors ${selectedTarget?.id === target.id ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500 group-hover:bg-white group-hover:shadow"
                                            }`}>
                                            {target.responsable.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <div className={`font-bold text-base ${selectedTarget?.id === target.id ? "text-slate-900" : "text-slate-600"}`}>
                                                {target.responsable}
                                            </div>
                                            <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                                                <span className={target.activa ? "text-emerald-500" : "text-amber-500"}>
                                                    {target.activa ? "● Activo" : "● Inactivo"}
                                                </span>
                                                <span>• {target.idUsuario ? `User ${target.idUsuario}` : `Lista #${target.id}`}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedTarget?.id === target.id && <Check className="h-6 w-6 text-emerald-600" />}
                                </button>
                            ))}
                        {responsables.length === 0 && (
                            <div className="p-8 text-center text-slate-400">
                                Sin responsables disponibles.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BUSCADOR GIGANTE */}
            <div className={`transition-all duration-500 ${!selectedTarget ? 'opacity-50 blur-sm pointer-events-none' : 'opacity-100'}`}>
                <div className="relative group">
                    <div className={`absolute -inset-1 rounded-3xl blur transition duration-500 ${socioEncontrado ? 'bg-gradient-to-r from-emerald-400 to-green-500 opacity-50' : 'bg-gradient-to-r from-slate-200 to-slate-300 opacity-50 group-hover:opacity-100'}`}></div>
                    <div className="relative bg-white rounded-3xl shadow-xl flex items-center p-2 border border-slate-100">
                        <div className="pl-4 pr-2">
                            {searching ? (
                                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                            ) : (
                                <Search className={`h-8 w-8 transition-colors ${searchTerm ? 'text-slate-800' : 'text-slate-300'}`} />
                            )}
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar Socio..."
                            className="w-full bg-transparent text-3xl font-black text-slate-800 placeholder:text-slate-200 placeholder:font-bold outline-none border-none py-6 px-2"
                            autoFocus
                        />
                        {searchTerm && (
                            <button onClick={() => { setSearchTerm(""); setSocioEncontrado(null); }} className="hover:bg-slate-100 p-2 rounded-full mr-2 transition-colors">
                                <X className="h-6 w-6 text-slate-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* TARJETA DE RESULTADO Y ACCIÓN */}
                <div className={`transition-all duration-500 ease-out overflow-hidden ${socioEncontrado ? 'max-h-[600px] mt-6 opacity-100 transform translate-y-0' : 'max-h-0 mt-0 opacity-0 transform -translate-y-4'}`}>
                    {socioEncontrado && (
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative">
                            {/* Header Tarjeta */}
                            <div className="bg-emerald-600 p-8 flex justify-between items-start relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                                <div className="relative z-10 w-full">
                                    <div className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <User className="h-3 w-3" /> SOCIO ENCONTRADO
                                    </div>
                                    <h2 className="text-3xl font-black text-white leading-tight mb-1">{socioEncontrado.nombreCompleto}</h2>
                                    <div className="text-emerald-100 text-sm font-medium opacity-80">
                                        {socioEncontrado.vozYVoto ? "Habilitado para Voto" : "Sin Voto"}
                                    </div>
                                </div>
                            </div>

                            {/* Body & Acción */}
                            <div className="p-6 pt-8">
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">CÉDULA DE IDENTIDAD</div>
                                        <div className="text-xl font-black text-slate-700">{socioEncontrado.cedula}</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">NÚMERO DE SOCIO</div>
                                        <div className="text-xl font-black text-slate-700">{socioEncontrado.numeroSocio}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAssign}
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 relative overflow-hidden group"
                                >
                                    {loading ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            <span>ASIGNAR AHORA</span>
                                            <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Instrucciones */}
                {!socioEncontrado && selectedTarget && (
                    <div className="mt-8 flex justify-center opacity-50">
                        <div className="text-xs font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-full">
                            TIP: Presiona ENTER al escribir para buscar
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

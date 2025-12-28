"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    MapPin,
    Users,
    UserCheck,
    Loader2,
    Building2,
    ChevronRight,
    ClipboardList,
    HelpCircle
} from "lucide-react";
import axios from "axios";
import { useTour } from "@/components/tour/TourContext";
import { asignacionesTour } from "@/components/tour/tourSteps";

// interfaces locales adicionales
interface Sucursal {
    sucursalId: number;
    sucursal: string;
    padron: number;
    presentes: number;
    vozVoto: number;
}

interface Socio {
    id: number;
    numeroSocio: string;
    nombreCompleto: string;
    cedula: string;
    sucursal: { id: number; nombre: string } | null;
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

interface RankingUsuario {
    id: number;
    nombre: string;
    username: string;
    rol: string;
    totalListas: number;
    totalAsignados: number;
    vyv: number;
    soloVoz: number;
}

import AdminAssignments from "@/components/asignaciones/AdminAssignments";
import { SocioAssignments } from "@/components/asignaciones/SocioAssignments";

export default function AsignacionesPage() {
    const [user, setUser] = useState<any>(null);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);
    const [socios, setSocios] = useState<Socio[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSocios, setLoadingSocios] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [rankingUsuarios, setRankingUsuarios] = useState<RankingUsuario[]>([]);

    // Estados para gestión de listas (Socio)
    const [misListas, setMisListas] = useState<ListaAsignacion[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [newListDesc, setNewListDesc] = useState("");
    const [selectedLista, setSelectedLista] = useState<ListaAsignacion | null>(null);
    const [socioSearchTerm, setSocioSearchTerm] = useState("");
    const [addingSocio, setAddingSocio] = useState(false);
    const [searchedSocio, setSearchedSocio] = useState<any>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Modal para socio ya asignado
    const [showAlreadyAssignedModal, setShowAlreadyAssignedModal] = useState(false);
    const [alreadyAssignedInfo, setAlreadyAssignedInfo] = useState<{
        socioNombre: string;
        socioNro: string;
        listaNombre: string;
        listaUsuario: string;
    } | null>(null);

    // Modal para socio no encontrado
    const [showNotFoundModal, setShowNotFoundModal] = useState(false);
    const [notFoundTerm, setNotFoundTerm] = useState("");

    const { startTour, hasSeenTour } = useTour();

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const userData = localStorage.getItem("user");
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);

                const headers = { Authorization: `Bearer ${token}` };
                const isSocio = parsedUser.rol === "USUARIO_SOCIO";

                if (isSocio) {
                    try {
                        const response = await axios.get("/api/asignaciones/mis-listas", { headers });

                        if (response.data.length === 0) {
                            // AUTO CREAR LISTA si no existe ninguna
                            const timestamp = new Date().toLocaleString('es-PY', {
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            });
                            const createRes = await axios.post("/api/asignaciones/crear-lista",
                                {
                                    nombre: `Mi Lista ${timestamp}`,
                                    descripcion: "Lista generada automáticamente"
                                },
                                { headers }
                            );
                            const nuevaLista = { ...createRes.data, total: 0, vyv: 0, soloVoz: 0 };
                            setMisListas([nuevaLista]);
                            setSelectedLista(nuevaLista);
                        } else {
                            setMisListas(response.data);
                            // Auto-select the list with the most socios (not just the first one)
                            if (response.data.length > 0 && !selectedLista) {
                                const listaConMasSocios = response.data.reduce((prev: ListaAsignacion, curr: ListaAsignacion) =>
                                    (curr.total || 0) > (prev.total || 0) ? curr : prev
                                );
                                handleSelectLista(listaConMasSocios);
                            }
                        }
                    } catch (err: any) {
                        console.error("Error cargando listas:", err);
                        if (err.response?.status === 403) {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            window.location.href = "/login";
                        }
                    }
                } else {
                    // Admin/Directivo: cargar sucursales + ranking
                    const [sucursalesRes, rankingRes] = await Promise.all([
                        axios.get("/api/socios/estadisticas/por-sucursal", { headers }),
                        axios.get("/api/asignaciones/ranking-usuarios", { headers }).catch(() => ({ data: [] }))
                    ]);
                    setSucursales(sucursalesRes.data);
                    setRankingUsuarios(rankingRes.data || []);
                }
            }
        } catch (error: any) {
            console.error("Error:", error);
            if (error.response?.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateLista = async () => {
        try {
            const token = localStorage.getItem("token");
            // Crear lista automáticamente con nombre temporal
            const timestamp = new Date().toLocaleString('es-PY', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            const response = await axios.post("/api/asignaciones/crear-lista",
                {
                    nombre: `Mi Lista ${timestamp}`,
                    descripcion: "Lista creada automáticamente"
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Recargar datos
            await fetchData();

            // Seleccionar la nueva lista automáticamente
            setTimeout(() => {
                if (response.data && response.data.id) {
                    handleSelectLista({
                        ...response.data,
                        total: 0,
                        vyv: 0,
                        soloVoz: 0
                    });
                }
            }, 100);
        } catch (error) {
            alert("Error al crear lista");
        }
    };

    // Iniciar tour automáticamente cuando haya una lista seleccionada (UI visible)
    useEffect(() => {
        if (!loading && selectedLista) {
            const timer = setTimeout(() => {
                if (!hasSeenTour('asignaciones')) {
                    console.log("Iniciando tour de asignaciones...");
                    startTour(asignacionesTour, 'asignaciones');
                }
            }, 1000); // 1s delay para asegurar renderizado completo del componente hijo
            return () => clearTimeout(timer);
        }
    }, [loading, selectedLista, hasSeenTour, startTour]);

    // Botón flotante de ayuda manual
    const handleManualTour = () => {
        startTour(asignacionesTour, 'asignaciones');
    };

    const handleSearchSocio = async () => {
        if (!selectedLista || !socioSearchTerm) return;
        setAddingSocio(true);
        try {
            const token = localStorage.getItem("token");
            // Buscar el socio sin asignarlo todavía
            const response = await axios.get(`/api/socios/buscar-exacto?term=${socioSearchTerm}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) {
                setSearchedSocio(response.data);
                // No mostramos modal, se muestra inline
            } else {
                setNotFoundTerm(socioSearchTerm);
                setShowNotFoundModal(true);
                setSocioSearchTerm("");
            }
        } catch (error: any) {
            // Si hay error 404, es socio no encontrado
            if (error.response?.status === 404) {
                setNotFoundTerm(socioSearchTerm);
                setShowNotFoundModal(true);
                setSocioSearchTerm("");
            } else {
                setNotFoundTerm(error.response?.data?.error || "Error al buscar socio");
                setShowNotFoundModal(true);
            }
        } finally {
            setAddingSocio(false);
        }
    };

    const handleConfirmAddSocio = async () => {
        if (!selectedLista || !searchedSocio) return;
        try {
            const token = localStorage.getItem("token");
            await axios.post(`/api/asignaciones/${selectedLista.id}/agregar-socio`,
                { term: searchedSocio.cedula },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSocioSearchTerm("");
            setSearchedSocio(null);

            // Refresh socios list and counts
            const responseSocios = await axios.get(`/api/asignaciones/${selectedLista.id}/socios`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSocios(responseSocios.data);
            fetchData(); // actualizar contadores
        } catch (error: any) {
            // Force refresh list even on error if it might be an inconsistency
            if (error.response?.status === 400 && error.response.data.error === "El socio ya está en esta lista") {
                // Refresh anyway to show the invisible socio
                try {
                    const token = localStorage.getItem("token");
                    const responseSocios = await axios.get(`/api/asignaciones/${selectedLista.id}/socios`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSocios(responseSocios.data);
                } catch (e) { console.error("Error refreshing list", e); }

                alert("El socio ya figura en tu lista (actualizando visualización...)");
                setSearchedSocio(null);
                setSocioSearchTerm("");
                return;
            }
            // Verificar si es error de socio ya asignado a OTRA lista (código 409)
            if (error.response?.status === 409 && error.response?.data?.error === 'SOCIO_YA_ASIGNADO') {
                setAlreadyAssignedInfo({
                    socioNombre: error.response.data.socioNombre,
                    socioNro: error.response.data.socioNro,
                    listaNombre: error.response.data.listaNombre,
                    listaUsuario: error.response.data.listaUsuario
                });
                setShowAlreadyAssignedModal(true);
                setSearchedSocio(null);
                setSocioSearchTerm("");
            }
            // Error de socio ya en la MISMA lista (código 400)
            else if (error.response?.status === 400 && error.response?.data?.error?.includes('ya está')) {
                setAlreadyAssignedInfo({
                    socioNombre: searchedSocio?.nombreCompleto || 'Socio',
                    socioNro: searchedSocio?.numeroSocio || '',
                    listaNombre: selectedLista?.nombre || 'esta lista',
                    listaUsuario: 'TÚ MISMO'
                });
                setShowAlreadyAssignedModal(true);
                setSearchedSocio(null);
                setSocioSearchTerm("");
            }
            else {
                alert(error.response?.data?.error || error.response?.data?.message || "Error al agregar socio");
            }
        }
    };

    const handleRemoveSocio = async (socioId: number) => {
        if (!selectedLista) return;
        if (!confirm("¿Estás seguro de quitar este socio de la lista?")) return;

        // Optimistic UI: remover inmediatamente para animación suave
        setSocios(prev => prev.filter(s => s.id !== socioId));

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`/api/asignaciones/${selectedLista.id}/socio/${socioId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(); // actualizar contadores
        } catch (error: any) {
            console.error("Error al eliminar socio:", error);
            alert(error.response?.data?.error || "Error al eliminar socio. Recargando lista...");

            // Recargar la lista completa en caso de error
            try {
                const token = localStorage.getItem("token");
                const responseSocios = await axios.get(`/api/asignaciones/${selectedLista.id}/socios`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSocios(responseSocios.data);
                fetchData();
            } catch (reloadError) {
                console.error("Error al recargar:", reloadError);
            }
        }
    };

    const handleDeleteLista = async (listaId: number) => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`/api/asignaciones/lista/${listaId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (selectedLista?.id === listaId) {
                setSelectedLista(null);
                setSocios([]);
            }
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || "Error al eliminar lista");
        }
    };

    const handleUpdateLista = async (listaId: number, nombre: string, descripcion: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`/api/asignaciones/lista/${listaId}`,
                { nombre, descripcion },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (selectedLista?.id === listaId) {
                setSelectedLista({ ...selectedLista, nombre, descripcion });
            }
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || "Error al actualizar lista");
        }
    };

    const handleSelectLista = async (lista: ListaAsignacion) => {
        setSelectedLista(lista);
        setLoadingSocios(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`/api/asignaciones/${lista.id}/socios`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSocios(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSocios(false);
        }
    };

    const fetchSociosBySucursal = useCallback(async (sucursalId: number) => {
        setLoadingSocios(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get("/api/socios", { headers });
            const filtered = response.data.filter((s: Socio) => s.sucursal?.id === sucursalId);
            setSocios(filtered);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoadingSocios(false);
        }
    }, []);

    const handleSelectSucursal = (suc: Sucursal) => {
        setSelectedSucursal(suc);
        fetchSociosBySucursal(suc.sucursalId);
        setSearchTerm("");
    };

    const tieneVozYVoto = (socio: Socio) => {
        return socio.aporteAlDia && socio.solidaridadAlDia && socio.fondoAlDia && socio.incoopAlDia && socio.creditoAlDia;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Módulos...</p>
                </div>
            </div>
        );
    }

    // Mostrar el nuevo diseño premium para todos los usuarios
    return (
        <div className="animate-in fade-in duration-500">
            <SocioAssignments
                misListas={misListas}
                selectedLista={selectedLista}
                socios={socios}
                loadingSocios={loadingSocios}
                socioSearchTerm={socioSearchTerm}
                addingSocio={addingSocio}
                searchedSocio={searchedSocio}
                showConfirmModal={showConfirmModal}
                onSelectLista={handleSelectLista}
                onCreateClick={handleCreateLista}
                onSearchSocio={handleSearchSocio}
                onConfirmAddSocio={handleConfirmAddSocio}
                onCancelAdd={() => { setShowConfirmModal(false); setSearchedSocio(null); setSocioSearchTerm(""); }}
                onRemoveSocio={handleRemoveSocio}
                onSearchTermChange={setSocioSearchTerm}
                tieneVozYVoto={(socio) => socio.aporteAlDia && socio.solidaridadAlDia && socio.fondoAlDia && socio.incoopAlDia && socio.creditoAlDia}
                onDeleteLista={handleDeleteLista}
                onUpdateLista={handleUpdateLista}
            />

            {/* MODAL CREAR LISTA */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-800 italic uppercase">Nueva Lista de Asignación</h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Identificador de Lista</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="Nombre descriptivo..."
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas Adicionales</label>
                                <textarea
                                    className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white outline-none h-32 transition-all font-bold text-slate-700 placeholder:text-slate-300 resize-none"
                                    placeholder="Detalles sobre este grupo..."
                                    value={newListDesc}
                                    onChange={(e) => setNewListDesc(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 flex gap-4">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px]"
                            >
                                Descartar
                            </button>
                            <button
                                onClick={handleCreateLista}
                                disabled={!newListName}
                                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 shadow-xl shadow-emerald-200 disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
                            >
                                Confirmar Creación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: SOCIO YA ASIGNADO - Premium Animated */}
            {showAlreadyAssignedModal && alreadyAssignedInfo && (
                <div
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={() => setShowAlreadyAssignedModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header con Gradiente */}
                        <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-8 text-white overflow-hidden">
                            {/* Decorative Circles */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-8 -mb-8" />

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className="inline-flex p-4 bg-white/20 backdrop-blur rounded-2xl mb-4 shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl md:text-3xl font-black leading-tight mb-2">
                                    ¡Socio Ya Asignado!
                                </h2>
                                <p className="text-red-100 text-sm font-medium">
                                    Este socio ya pertenece a otra lista
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6">
                            {/* Socio Info Card */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Información del Socio
                                </p>
                                <p className="text-xl font-black text-slate-800 mb-1">
                                    {alreadyAssignedInfo.socioNombre}
                                </p>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span className="text-sm font-bold">N° {alreadyAssignedInfo.socioNro}</span>
                                </div>
                            </div>

                            {/* Assignment Info */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Detalles de Asignación
                                </p>

                                {/* Lista */}
                                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                                    <div className="p-2 bg-orange-500 rounded-lg shadow-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-orange-600 font-bold uppercase tracking-wide">Lista de Asignación</p>
                                        <p className="text-sm font-black text-slate-800 mt-1">{alreadyAssignedInfo.listaNombre}</p>
                                    </div>
                                </div>

                                {/* Usuario */}
                                <div className="flex items-start gap-3 p-4 bg-violet-50 rounded-xl border border-violet-200">
                                    <div className="p-2 bg-violet-500 rounded-lg shadow-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-violet-600 font-bold uppercase tracking-wide">Asignado Por</p>
                                        <p className="text-sm font-black text-slate-800 mt-1">{alreadyAssignedInfo.listaUsuario}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Info Message */}
                            <div className="flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Un socio solo puede estar asignado a una lista a la vez. Para agregarlo a tu lista, el usuario responsable debe quitarlo de su lista actual primero.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={() => setShowAlreadyAssignedModal(false)}
                                className="w-full py-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-2xl font-bold text-sm hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg shadow-slate-300 active:scale-95"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL: SOCIO NO ENCONTRADO - Premium Animated */}
            {showNotFoundModal && (
                <div
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={() => setShowNotFoundModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header con Gradiente Azul */}
                        <div className="relative bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 p-8 text-white overflow-hidden">
                            {/* Decorative Circles */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-8 -mb-8" />

                            <div className="relative z-10 text-center">
                                {/* Animated Icon */}
                                <div className="inline-flex p-5 bg-white/20 backdrop-blur rounded-full mb-4 shadow-lg">
                                    <svg className="w-12 h-12 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 10l4 4" />
                                    </svg>
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl md:text-3xl font-black leading-tight mb-2">
                                    Socio No Encontrado
                                </h2>
                                <p className="text-blue-100 text-sm font-medium">
                                    No pudimos localizar al socio buscado
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-5">
                            {/* Término buscado */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border-2 border-slate-200 text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Término buscado
                                </p>
                                <p className="text-2xl font-black text-slate-800 font-mono">
                                    "{notFoundTerm}"
                                </p>
                            </div>

                            {/* Sugerencias */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    ¿Qué puedes hacer?
                                </p>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">✓</span>
                                        Verifica que el número de cédula sea correcto
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">✓</span>
                                        Intenta con el número de socio en su lugar
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">✓</span>
                                        Confirma que el socio esté en el padrón actual
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={() => setShowNotFoundModal(false)}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Botón Flotante de Ayuda */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={handleManualTour}
                    className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full shadow-lg shadow-violet-300 hover:scale-110 transition-transform group"
                    title="Reiniciar Guía"
                >
                    <HelpCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </button>
            </div>
        </div>
    );
}

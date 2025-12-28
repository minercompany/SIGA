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
    ClipboardList
} from "lucide-react";
import axios from "axios";

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
                        const response = await axios.get("http://localhost:8081/api/asignaciones/mis-listas", { headers });

                        if (response.data.length === 0) {
                            // AUTO CREAR LISTA si no existe ninguna
                            const timestamp = new Date().toLocaleString('es-PY', {
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            });
                            const createRes = await axios.post("http://localhost:8081/api/asignaciones/crear-lista",
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
                        axios.get("http://localhost:8081/api/socios/estadisticas/por-sucursal", { headers }),
                        axios.get("http://localhost:8081/api/asignaciones/ranking-usuarios", { headers }).catch(() => ({ data: [] }))
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
            const response = await axios.post("http://localhost:8081/api/asignaciones/crear-lista",
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

    const handleSearchSocio = async () => {
        if (!selectedLista || !socioSearchTerm) return;
        setAddingSocio(true);
        try {
            const token = localStorage.getItem("token");
            // Buscar el socio sin asignarlo todavía
            const response = await axios.get(`http://localhost:8081/api/socios/buscar-exacto?term=${socioSearchTerm}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) {
                setSearchedSocio(response.data);
                // No mostramos modal, se muestra inline
            } else {
                alert("Socio no encontrado");
            }
        } catch (error: any) {
            alert(error.response?.data?.error || "Error al buscar socio");
        } finally {
            setAddingSocio(false);
        }
    };

    const handleConfirmAddSocio = async () => {
        if (!selectedLista || !searchedSocio) return;
        try {
            const token = localStorage.getItem("token");
            await axios.post(`http://localhost:8081/api/asignaciones/${selectedLista.id}/agregar-socio`,
                { term: searchedSocio.cedula },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSocioSearchTerm("");
            setSearchedSocio(null);

            // Refresh socios list and counts
            const responseSocios = await axios.get(`http://localhost:8081/api/asignaciones/${selectedLista.id}/socios`, {
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
                    const responseSocios = await axios.get(`http://localhost:8081/api/asignaciones/${selectedLista.id}/socios`, {
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
            } else {
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
            await axios.delete(`http://localhost:8081/api/asignaciones/${selectedLista.id}/socio/${socioId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(); // actualizar contadores
        } catch (error: any) {
            console.error("Error al eliminar socio:", error);
            alert(error.response?.data?.error || "Error al eliminar socio. Recargando lista...");

            // Recargar la lista completa en caso de error
            try {
                const token = localStorage.getItem("token");
                const responseSocios = await axios.get(`http://localhost:8081/api/asignaciones/${selectedLista.id}/socios`, {
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
            await axios.delete(`http://localhost:8081/api/asignaciones/lista/${listaId}`, {
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
            await axios.put(`http://localhost:8081/api/asignaciones/lista/${listaId}`,
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
            const response = await axios.get(`http://localhost:8081/api/asignaciones/${lista.id}/socios`, {
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
            const response = await axios.get("http://localhost:8081/api/socios", { headers });
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
        </div>
    );
}

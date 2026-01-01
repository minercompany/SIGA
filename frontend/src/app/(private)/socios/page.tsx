"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    FileDown,
    FileSpreadsheet,
    FileText,
    ShieldCheck,
    AlertTriangle,
    Building2,
    Edit,
    Trash2,
    X,
    Users,
    Zap,
    Plus,
    Save,
    Loader2,
    Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Socio {
    id: number;
    numeroSocio: string;
    nombreCompleto: string;
    cedula: string;
    telefono: string | null;
    direccion: string | null;
    sucursal: { id: number; nombre: string; codigo: string } | null;
    aporteAlDia: boolean;
    solidaridadAlDia: boolean;
    fondoAlDia: boolean;
    incoopAlDia: boolean;
    creditoAlDia: boolean;
    activo: boolean;
}

interface User {
    id: number;
    username: string;
    rol: string;
}

// =============================================================================
// SOCIO ROW COMPONENT - Premium table row with side panel modal on hover
// =============================================================================

interface SocioRowProps {
    socio: Socio;
    index: number;
    tieneVozYVoto: boolean;
    isSuperAdmin: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onHover: (socio: Socio | null, mouseY?: number) => void;
    isHovered: boolean;
}

// Mobile-friendly card component to prevent clipping
function SocioCard({ socio, tieneVozYVoto, isSuperAdmin, onEdit, onDelete }: Omit<SocioRowProps, 'index' | 'onHover' | 'isHovered'>) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-col gap-3 relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-tighter text-white
                ${tieneVozYVoto ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                {tieneVozYVoto ? 'Voz y Voto' : 'Solo Voz'}
            </div>

            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0
                    ${tieneVozYVoto ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    {socio.nombreCompleto.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">#{socio.numeroSocio}</div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">{socio.nombreCompleto}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">CI: {socio.cedula}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-[8px] text-slate-400 font-bold uppercase">Teléfono</p>
                    <p className="text-[10px] font-bold text-slate-600 truncate">{socio.telefono || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-[8px] text-slate-400 font-bold uppercase">Sucursal</p>
                    <p className="text-[10px] font-bold text-slate-600 truncate">{socio.sucursal?.nombre || '—'}</p>
                </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-50">
                <button
                    onClick={onEdit}
                    className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                >
                    Editar
                </button>
                {isSuperAdmin && (
                    <button
                        onClick={onDelete}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function SocioRow({ socio, index, tieneVozYVoto, isSuperAdmin, onEdit, onDelete, onHover, isHovered }: SocioRowProps) {
    const handleMouseEnter = (e: React.MouseEvent) => {
        onHover(socio, e.clientY);
    };

    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02, duration: 0.3 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => onHover(null)}
            className={`relative transition-all duration-300 cursor-pointer group
                ${isHovered
                    ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 scale-[1.01] shadow-lg z-10'
                    : 'hover:bg-slate-50/80'}
            `}
        >
            {/* Número de Socio - MUY VISIBLE */}
            <td className="p-4 md:p-5">
                <motion.div
                    animate={{ scale: isHovered ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                    className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl font-black text-base shadow-lg
                        ${tieneVozYVoto
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200'
                            : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-200'
                        }`}
                >
                    <span className="text-white/60 text-xs">#</span>
                    {socio.numeroSocio}
                </motion.div>
            </td>

            {/* Nombre con Avatar */}
            <td className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={{ scale: isHovered ? 1.1 : 1 }}
                        className={`h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0
                            ${tieneVozYVoto
                                ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                                : 'bg-gradient-to-br from-amber-400 to-orange-500'
                            }`}
                    >
                        {socio.nombreCompleto.substring(0, 2).toUpperCase()}
                    </motion.div>
                    <div>
                        <div className="font-bold text-slate-800">{socio.nombreCompleto}</div>
                        <div className="text-xs text-slate-400 font-mono">CI: {socio.cedula}</div>
                    </div>
                </div>
            </td>

            {/* Teléfono */}
            <td className="p-4 md:p-5 hidden md:table-cell">
                {socio.telefono === "Actualizar Nro" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                        Actualizar Nro
                    </span>
                ) : (
                    <span className="text-sm text-slate-600 font-mono">
                        {socio.telefono || <span className="text-slate-300">—</span>}
                    </span>
                )}
            </td>

            {/* Sucursal */}
            <td className="p-4 md:p-5 hidden lg:table-cell">
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                        {socio.sucursal?.nombre || <span className="text-slate-300">—</span>}
                    </span>
                </div>
            </td>

            {/* Estado */}
            <td className="p-4 md:p-5 text-center">
                <motion.span
                    animate={{ scale: isHovered ? 1.05 : 1 }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-md
                        ${tieneVozYVoto
                            ? 'bg-emerald-100 text-teal-500 border border-emerald-200 shadow-emerald-100'
                            : 'bg-amber-100 text-amber-700 border border-amber-200 shadow-amber-100'
                        }`}
                >
                    {tieneVozYVoto ? (
                        <><ShieldCheck className="h-3.5 w-3.5" /> Voz y Voto</>
                    ) : (
                        <><AlertTriangle className="h-3.5 w-3.5" /> Solo Voz</>
                    )}
                </motion.span>
            </td>

            {/* Indicador de hover */}
            <td className="p-4 md:p-5 w-12">
                <motion.div
                    animate={{ opacity: isHovered ? 1 : 0.3, x: isHovered ? 0 : -5 }}
                    className="text-emerald-500"
                >
                    <ChevronRight className="h-5 w-5" />
                </motion.div>
            </td>
        </motion.tr>
    );
}

export default function SociosPage() {
    const [socios, setSocios] = useState<Socio[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(10);
    const [error, setError] = useState<string | null>(null);

    // User & permissions
    const [user, setUser] = useState<User | null>(null);
    const isSuperAdmin = user?.rol === "SUPER_ADMIN";

    // Export dropdown
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exporting, setExporting] = useState<string | null>(null);

    // ABM Modal
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
    const [saving, setSaving] = useState(false);

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [socioToDelete, setSocioToDelete] = useState<Socio | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Hover state for side panel
    const [hoveredSocio, setHoveredSocio] = useState<Socio | null>(null);
    const [mouseY, setMouseY] = useState(0);

    // Additional statistics
    const [presentesCount, setPresentesCount] = useState(0);
    const [registradosVozYVoto, setRegistradosVozYVoto] = useState(0);
    const [registradosSoloVoz, setRegistradosSoloVoz] = useState(0);

    // Column Filters
    const [filterNumeroSocio, setFilterNumeroSocio] = useState("");
    const [filterNombre, setFilterNombre] = useState("");
    const [filterTelefono, setFilterTelefono] = useState("");
    const [filterSucursal, setFilterSucursal] = useState("");
    const [filterEstado, setFilterEstado] = useState<"todos" | "vozYVoto" | "soloVoz">("todos");
    const [showFilters, setShowFilters] = useState(false);
    const [sucursales, setSucursales] = useState<{ id: number; nombre: string; codigo: string }[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        numeroSocio: "",
        nombreCompleto: "",
        cedula: "",
        telefono: "",
        aporteAlDia: true,
        solidaridadAlDia: true,
        fondoAlDia: true,
        incoopAlDia: true,
        creditoAlDia: true
    });

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // Load user from localStorage
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error("Error parsing user data:", e);
            }
        }
    }, []);

    // Close export menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Load sucursales
    useEffect(() => {
        const fetchSucursales = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/sucursales", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSucursales(res.data);
            } catch (err) {
                console.error("Error loading sucursales:", err);
            }
        };
        fetchSucursales();
    }, []);

    const fetchSocios = useCallback(async (page: number, term: string, estado: string, nSocio: string, nombre: string, tel: string, sucId: string) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            if (term) {
                const searchUrl = `/api/socios/buscar?term=${encodeURIComponent(term)}`;
                const response = await axios.get(searchUrl, { headers });

                if (response.data) {
                    // Search returns a list, not a page
                    setSocios(Array.isArray(response.data) ? response.data : response.data.content || []);
                    setTotalElements(Array.isArray(response.data) ? response.data.length : response.data.totalElements || 0);
                    setTotalPages(1);
                } else {
                    setSocios([]);
                    setTotalElements(0);
                    setTotalPages(0);
                }
            } else {
                const baseUrl = `/api/socios`;
                const params: any = {
                    page,
                    size: pageSize
                };

                if (estado && estado !== "todos") params.estado = estado;
                if (nSocio) params.numeroSocio = nSocio;
                if (nombre) params.nombre = nombre;
                if (tel) params.telefono = tel;
                if (sucId) params.sucursalId = sucId;

                const response = await axios.get(baseUrl, { headers, params });

                if (response.data.content) {
                    setSocios(response.data.content);
                    setTotalPages(response.data.totalPages);
                    setTotalElements(response.data.totalElements);
                } else {
                    setSocios([]);
                    setTotalElements(0);
                    setTotalPages(0);
                }
            }
        } catch (err) {
            console.error("Error cargando socios:", err);
            setError("No se pudieron cargar los datos del padrón.");
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    // Trigger fetch when any filter changes (debounced for text inputs if we wanted, currently instant/effect based)
    useEffect(() => {
        // Debounce only if typing text, but for selects it can be instant.
        // For simplicity, we are debouncing everything via the timeout in handleSearchChange, 
        // but parameters like filters need to be passed.

        // Use a small timeout to avoid double fetching if multiple states change at once, 
        // though React batching helps.

        const timeoutId = setTimeout(() => {
            fetchSocios(currentPage, searchTerm, filterEstado, filterNumeroSocio, filterNombre, filterTelefono, filterSucursal);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [currentPage, searchTerm, filterEstado, filterNumeroSocio, filterNombre, filterTelefono, filterSucursal, fetchSocios]);

    // Fetch additional stats
    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            const headers = { Authorization: `Bearer ${token}` };

            try {
                // Get presentes count
                const asistenciaRes = await axios.get("/api/asistencia/hoy", { headers });
                if (asistenciaRes.data) {
                    setPresentesCount(asistenciaRes.data.length);
                    // Count registrados con voz y voto y solo voz entre los presentes
                    const conVoto = asistenciaRes.data.filter((a: { socio?: Socio }) => {
                        if (a.socio) {
                            return a.socio.aporteAlDia && a.socio.solidaridadAlDia && a.socio.fondoAlDia && a.socio.incoopAlDia && a.socio.creditoAlDia;
                        }
                        return false;
                    }).length;
                    setRegistradosVozYVoto(conVoto);
                    setRegistradosSoloVoz(asistenciaRes.data.length - conVoto);
                }
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        };

        fetchStats();
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setCurrentPage(0);
            fetchSocios(0, val, filterEstado, filterNumeroSocio, filterNombre, filterTelefono, filterSucursal);
        }, 500);
    };

    const tieneVozYVoto = (socio: Socio) => {
        return socio.aporteAlDia && socio.solidaridadAlDia && socio.fondoAlDia && socio.incoopAlDia && socio.creditoAlDia;
    };

    // Client-side filtering removed as we now filter on backend
    const displayedSocios = socios;

    const sociosConVoto = registradosVozYVoto; // Simplificado

    // Check if any filter is active
    const hasActiveFilters = filterNumeroSocio || filterNombre || filterTelefono || filterSucursal || filterEstado !== "todos";

    // Clear all filters
    const clearAllFilters = () => {
        setFilterNumeroSocio("");
        setFilterNombre("");
        setFilterTelefono("");
        setFilterSucursal("");
        setFilterEstado("todos");
        fetchSocios(0, "", "todos", "", "", "", "");
    };

    // Export functions
    const handleExport = async (format: "excel" | "pdf") => {
        setExporting(format);
        setShowExportMenu(false);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `/api/socios/export/${format}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob"
                }
            );

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = format === "excel" ? "padron_socios.xlsx" : "padron_socios.pdf";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`Padrón exportado a ${format.toUpperCase()} exitosamente`);
        } catch (err) {
            console.error("Error exporting:", err);
            toast.error(`Error al exportar a ${format.toUpperCase()}`);
        } finally {
            setExporting(null);
        }
    };

    // ABM functions
    const openCreateModal = () => {
        setFormData({
            numeroSocio: "",
            nombreCompleto: "",
            cedula: "",
            telefono: "",
            aporteAlDia: true,
            solidaridadAlDia: true,
            fondoAlDia: true,
            incoopAlDia: true,
            creditoAlDia: true
        });
        setSelectedSocio(null);
        setModalMode("create");
        setShowModal(true);
    };

    const openEditModal = (socio: Socio) => {
        setFormData({
            numeroSocio: socio.numeroSocio,
            nombreCompleto: socio.nombreCompleto,
            cedula: socio.cedula,
            telefono: socio.telefono || "",
            aporteAlDia: socio.aporteAlDia,
            solidaridadAlDia: socio.solidaridadAlDia,
            fondoAlDia: socio.fondoAlDia,
            incoopAlDia: socio.incoopAlDia,
            creditoAlDia: socio.creditoAlDia
        });
        setSelectedSocio(socio);
        setModalMode("edit");
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.numeroSocio || !formData.nombreCompleto || !formData.cedula) {
            toast.error("Número de socio, nombre y cédula son obligatorios");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            if (modalMode === "create") {
                await axios.post("/api/socios", formData, { headers });
                toast.success("Socio creado exitosamente");
            } else {
                await axios.put(`/api/socios/${selectedSocio?.id}`, formData, { headers });
                toast.success("Socio actualizado exitosamente");
            }

            setShowModal(false);
            fetchSocios(currentPage, searchTerm, filterEstado, filterNumeroSocio, filterNombre, filterTelefono, filterSucursal);
        } catch (err: any) {
            console.error("Error saving:", err);
            const msg = err.response?.data?.error || "Error al guardar socio";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (socio: Socio) => {
        setSocioToDelete(socio);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!socioToDelete) return;

        setDeleting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`/api/socios/${socioToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Socio eliminado exitosamente");
            setShowDeleteConfirm(false);
            setSocioToDelete(null);
            fetchSocios(currentPage, searchTerm, filterEstado, filterNumeroSocio, filterNombre, filterTelefono, filterSucursal);
        } catch (err: any) {
            console.error("Error deleting:", err);
            toast.error(err.response?.data?.error || "Error al eliminar socio");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 lg:p-12 pb-32">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-10">

                {/* Header Premium con Gradiente */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 p-6 md:p-10 shadow-2xl shadow-emerald-500/20 text-white">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-white/10 blur-3xl hidden md:block" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-black/10 blur-3xl hidden md:block" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 md:px-4 md:py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-3 md:mb-4 border border-white/20 shadow-lg">
                                <Zap className="h-3 w-3 text-yellow-300 fill-yellow-300" />
                                Base de Datos Electoral
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-sm">
                                Padrón de Socios
                            </h1>
                            <p className="mt-2 md:mt-3 text-sm md:text-lg font-medium text-emerald-50 max-w-xl leading-relaxed opacity-90">
                                Consulta y gestión del padrón electoral.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 w-full lg:w-auto">
                            {/* Estadísticas Rápidas - Grid Premium */}
                            <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-3 gap-2 md:gap-3">
                                {/* Total Padrón */}
                                <div className="bg-white rounded-xl p-2.5 md:p-3 text-center shadow-lg">
                                    <div className="text-xl md:text-2xl font-black text-slate-800">{totalElements.toLocaleString()}</div>
                                    <div className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Padrón</div>
                                </div>
                                {/* Habilitados Voz y Voto */}
                                <div className="bg-gradient-to-br from-emerald-500 to-emerald-500 rounded-xl p-2.5 md:p-3 text-center shadow-lg text-white">
                                    <div className="text-xl md:text-2xl font-black">{sociosConVoto.toLocaleString()}</div>
                                    <div className="text-[8px] md:text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Voz y Voto</div>
                                </div>
                                {/* Solo Voz */}
                                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-2.5 md:p-3 text-center shadow-lg text-white">
                                    <div className="text-xl md:text-2xl font-black">{(totalElements - sociosConVoto).toLocaleString()}</div>
                                    <div className="text-[8px] md:text-[10px] font-bold text-amber-100 uppercase tracking-wider">Solo Voz</div>
                                </div>
                                {/* Presentes Ahora */}
                                <div className="bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl p-2.5 md:p-3 text-center shadow-lg text-white">
                                    <div className="text-xl md:text-2xl font-black">{presentesCount.toLocaleString()}</div>
                                    <div className="text-[8px] md:text-[10px] font-bold text-cyan-100 uppercase tracking-wider">Presentes</div>
                                </div>
                                {/* Registrados con Voz y Voto */}
                                <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-2.5 md:p-3 text-center shadow-lg text-white">
                                    <div className="text-xl md:text-2xl font-black">{registradosVozYVoto.toLocaleString()}</div>
                                    <div className="text-[8px] md:text-[10px] font-bold text-green-100 uppercase tracking-wider">Reg. Voz+Voto</div>
                                </div>
                                {/* Registrados Solo Voz */}
                                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-2.5 md:p-3 text-center shadow-lg text-white">
                                    <div className="text-xl md:text-2xl font-black">{registradosSoloVoz.toLocaleString()}</div>
                                    <div className="text-[8px] md:text-[10px] font-bold text-orange-100 uppercase tracking-wider">Reg. Solo Voz</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {/* Export Dropdown */}
                                <div className="relative" ref={exportMenuRef}>
                                    <button
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        disabled={!!exporting}
                                        className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-white px-4 md:px-6 py-2.5 md:py-3 text-emerald-900 shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-70"
                                    >
                                        <div className="relative z-10 flex items-center gap-2 font-bold text-sm md:text-base">
                                            {exporting ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <FileDown className="h-4 w-4 text-emerald-500" />
                                            )}
                                            <span>Exportar</span>
                                            <ChevronDown className="h-4 w-4" />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {showExportMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                                            >
                                                <button
                                                    onClick={() => handleExport("excel")}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left"
                                                >
                                                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                                    <span className="font-medium text-slate-700">Excel (.xlsx)</span>
                                                </button>
                                                <button
                                                    onClick={() => handleExport("pdf")}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 transition-colors text-left border-t border-slate-100"
                                                >
                                                    <FileText className="h-5 w-5 text-rose-600" />
                                                    <span className="font-medium text-slate-700">PDF</span>
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Nuevo Socio - Solo SUPER_ADMIN */}
                                {isSuperAdmin && (
                                    <button
                                        onClick={openCreateModal}
                                        className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-md px-4 md:px-6 py-2.5 md:py-3 text-white shadow-xl transition-all hover:scale-105 active:scale-95 border border-white/20"
                                    >
                                        <div className="relative z-10 flex items-center gap-2 font-bold text-sm md:text-base">
                                            <Plus className="h-4 w-4" />
                                            <span>Nuevo Socio</span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Barra de búsqueda Premium con Filtros */}
                <div className="space-y-3">
                    <div className="group relative rounded-xl md:rounded-[2rem] bg-white p-2 shadow-xl shadow-slate-200/50">
                        <div className="absolute -inset-1 rounded-[1.5rem] md:rounded-[2.1rem] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-0 blur group-hover:opacity-20 transition duration-500" />
                        <div className="relative flex items-center">
                            <div className="pl-4 md:pl-5 pr-2 md:pr-3 text-slate-400">
                                <Search className="h-5 w-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por nombre, cédula o número de socio..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full py-3 md:py-4 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400 text-base md:text-lg"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        fetchSocios(0, "", filterEstado, filterNumeroSocio, filterNombre, filterTelefono, filterSucursal);
                                    }}
                                    className="mr-2 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`mr-2 md:mr-4 px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-bold
                                    ${showFilters || hasActiveFilters
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <Filter className="h-4 w-4" />
                                <span className="hidden md:inline">Filtros</span>
                                {hasActiveFilters && (
                                    <span className="bg-white text-emerald-500 text-xs font-black px-1.5 py-0.5 rounded-md">!</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Panel de Filtros Avanzados */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xl shadow-slate-200/50 border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                            <Filter className="h-4 w-4 text-emerald-500" />
                                            Filtros por Columna
                                        </h4>
                                        {hasActiveFilters && (
                                            <button
                                                onClick={clearAllFilters}
                                                className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                                            >
                                                <X className="h-3 w-3" />
                                                Limpiar todo
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                        {/* Filtro N° Socio */}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">N° Socio</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: 1234"
                                                value={filterNumeroSocio}
                                                onChange={(e) => setFilterNumeroSocio(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                            />
                                        </div>
                                        {/* Filtro Nombre */}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Juan"
                                                value={filterNombre}
                                                onChange={(e) => setFilterNombre(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                            />
                                        </div>
                                        {/* Filtro Teléfono */}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teléfono</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: 0981"
                                                value={filterTelefono}
                                                onChange={(e) => setFilterTelefono(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                            />
                                        </div>
                                        {/* Filtro Sucursal */}
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sucursal</label>
                                            <select
                                                value={filterSucursal}
                                                onChange={(e) => setFilterSucursal(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white"
                                            >
                                                <option value="">Todas</option>
                                                {sucursales.map((sucursal) => (
                                                    <option key={sucursal.id} value={sucursal.id}>
                                                        {sucursal.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* Filtro Estado */}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Estado</label>
                                            <select
                                                value={filterEstado}
                                                onChange={(e) => setFilterEstado(e.target.value as "todos" | "vozYVoto" | "soloVoz")}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white"
                                            >
                                                <option value="todos">Todos</option>
                                                <option value="vozYVoto">Voz y Voto</option>
                                                <option value="soloVoz">Solo Voz</option>
                                            </select>
                                        </div>
                                    </div>
                                    {hasActiveFilters && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                                            <span className="font-medium">Mostrando:</span>
                                            <span className="font-black text-emerald-500">{displayedSocios.length}</span>
                                            <span>de {totalElements} resultados</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-500 mx-auto"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Users className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>
                        <p className="mt-4 text-slate-500 font-medium">Cargando padrón...</p>
                    </div>
                ) : error ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 text-red-600 p-8 rounded-2xl text-center border-2 border-red-100 shadow-xl shadow-red-500/10"
                    >
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                        <p className="font-bold text-lg">{error}</p>
                    </motion.div>
                ) : (
                    <>
                        {/* Premium Table with Rows */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl md:rounded-3xl lg:shadow-2xl lg:shadow-slate-200/50 lg:border lg:border-slate-100 overflow-hidden"
                        >
                            {/* Card view for mobile */}
                            <div className="grid grid-cols-1 gap-4 p-2 md:hidden">
                                {displayedSocios.map((socio) => (
                                    <SocioCard
                                        key={socio.id}
                                        socio={socio}
                                        tieneVozYVoto={tieneVozYVoto(socio)}
                                        isSuperAdmin={isSuperAdmin}
                                        onEdit={() => openEditModal(socio)}
                                        onDelete={() => confirmDelete(socio)}
                                    />
                                ))}
                                {displayedSocios.length === 0 && (
                                    <div className="text-center py-10 text-slate-400">No se encontraron socios</div>
                                )}
                            </div>

                            {/* Table view for desktop */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b-2 border-slate-100">
                                            <th className="p-4 md:p-5 text-xs font-black text-slate-500 uppercase tracking-wider">N° Socio</th>
                                            <th className="p-4 md:p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Socio</th>
                                            <th className="p-4 md:p-5 text-xs font-black text-slate-500 uppercase tracking-wider hidden md:table-cell">Teléfono</th>
                                            <th className="p-4 md:p-5 text-xs font-black text-slate-500 uppercase tracking-wider hidden lg:table-cell">Sucursal</th>
                                            <th className="p-4 md:p-5 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Estado</th>
                                            <th className="p-4 md:p-5 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {displayedSocios.map((socio, index) => (
                                            <SocioRow
                                                key={socio.id}
                                                socio={socio}
                                                index={index}
                                                tieneVozYVoto={tieneVozYVoto(socio)}
                                                isSuperAdmin={isSuperAdmin}
                                                onEdit={() => openEditModal(socio)}
                                                onDelete={() => confirmDelete(socio)}
                                                onHover={(s, y) => { setHoveredSocio(s); if (y) setMouseY(y); }}
                                                isHovered={hoveredSocio?.id === socio.id}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>

                        {/* Paginación Premium */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100/50 flex flex-col sm:flex-row items-center justify-between gap-4"
                        >
                            <p className="text-sm text-slate-500 font-medium">
                                Mostrando <span className="font-black text-emerald-500">{displayedSocios.length}</span> de <span className="font-black text-slate-800">{totalElements.toLocaleString()}</span> socios
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                    disabled={currentPage === 0}
                                    className="h-12 w-12 md:h-14 md:w-14 flex items-center justify-center bg-slate-100 rounded-2xl hover:bg-emerald-500 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-400 transition-all duration-300 text-slate-600 shadow-lg shadow-slate-200/50 hover:shadow-emerald-200/50"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <div className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-base shadow-xl shadow-emerald-200/50 min-w-[100px] text-center">
                                    {currentPage + 1} / {totalPages || 1}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage >= totalPages - 1 && (!searchTerm || displayedSocios.length < pageSize)}
                                    className="h-12 w-12 md:h-14 md:w-14 flex items-center justify-center bg-slate-100 rounded-2xl hover:bg-emerald-500 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-400 transition-all duration-300 text-slate-600 shadow-lg shadow-slate-200/50 hover:shadow-emerald-200/50"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>

            {/* Fixed Side Panel Modal - Appears on row hover */}
            <AnimatePresence>
                {hoveredSocio && (
                    <motion.div
                        initial={{ opacity: 0, x: 30, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 30, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="fixed right-4 z-50 w-72 md:w-80"
                        style={{
                            top: `${Math.max(Math.min(mouseY - 100, typeof window !== 'undefined' ? window.innerHeight - 400 : 400), 80)}px`,
                        }}
                        onMouseEnter={() => setHoveredSocio(hoveredSocio)}
                        onMouseLeave={() => setHoveredSocio(null)}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                            {/* Compact Modal Header */}
                            <div className={`p-4 ${tieneVozYVoto(hoveredSocio)
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500'
                                } text-white`}>
                                <div className="flex items-center gap-3">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg shadow-lg
                                        ${tieneVozYVoto(hoveredSocio) ? 'bg-white text-emerald-500' : 'bg-white text-amber-600'}`}>
                                        {hoveredSocio.nombreCompleto.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs font-bold">#{hoveredSocio.numeroSocio}</span>
                                        </div>
                                        <h3 className="font-bold text-base truncate">{hoveredSocio.nombreCompleto}</h3>
                                        <p className="text-white/70 font-mono text-xs">CI: {hoveredSocio.cedula}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Compact Modal Body */}
                            <div className="p-4 space-y-3">
                                {/* Contact Info - Compact */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 rounded-lg p-2.5">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Teléfono</p>
                                        <p className="font-bold text-slate-700 font-mono text-sm">{hoveredSocio.telefono || '—'}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2.5">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Sucursal</p>
                                        <p className="font-bold text-slate-700 text-sm truncate">{hoveredSocio.sucursal?.nombre || '—'}</p>
                                    </div>
                                </div>

                                {/* Aportes Status - Compact */}
                                <div className="bg-slate-50 rounded-lg p-2.5">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">Estado de Aportes</p>
                                    <div className="flex flex-wrap gap-1">
                                        {[
                                            { key: 'aporteAlDia', label: 'Aporte', value: hoveredSocio.aporteAlDia },
                                            { key: 'solidaridadAlDia', label: 'Solid.', value: hoveredSocio.solidaridadAlDia },
                                            { key: 'fondoAlDia', label: 'Fondo', value: hoveredSocio.fondoAlDia },
                                            { key: 'incoopAlDia', label: 'INCOOP', value: hoveredSocio.incoopAlDia },
                                            { key: 'creditoAlDia', label: 'Créd.', value: hoveredSocio.creditoAlDia },
                                        ].map(item => (
                                            <span
                                                key={item.key}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold
                                                    ${item.value
                                                        ? 'bg-emerald-100 text-teal-500'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {item.value ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                                {item.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Badge - Compact */}
                                <div className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black
                                    ${tieneVozYVoto(hoveredSocio)
                                        ? 'bg-emerald-100 text-teal-500'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}
                                >
                                    {tieneVozYVoto(hoveredSocio) ? (
                                        <><ShieldCheck className="h-4 w-4" /> CON VOZ Y VOTO</>
                                    ) : (
                                        <><AlertTriangle className="h-4 w-4" /> SOLO VOZ</>
                                    )}
                                </div>
                            </div>

                            {/* ABM Actions - Compact */}
                            {isSuperAdmin && (
                                <div className="p-4 pt-0 flex gap-2">
                                    <button
                                        onClick={() => { openEditModal(hoveredSocio); setHoveredSocio(null); }}
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => { confirmDelete(hoveredSocio); setHoveredSocio(null); }}
                                        className="h-10 w-10 flex items-center justify-center bg-red-50 border border-red-200 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Crear/Editar Socio */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-800">
                                        {modalMode === "create" ? "Nuevo Socio" : "Editar Socio"}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        <X className="h-5 w-5 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">N° Socio *</label>
                                        <input
                                            type="text"
                                            value={formData.numeroSocio}
                                            onChange={(e) => setFormData({ ...formData, numeroSocio: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-mono"
                                            placeholder="00001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cédula *</label>
                                        <input
                                            type="text"
                                            value={formData.cedula}
                                            onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-mono"
                                            placeholder="1234567"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo *</label>
                                    <input
                                        type="text"
                                        value={formData.nombreCompleto}
                                        onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                        placeholder="Juan Pérez González"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-mono"
                                        placeholder="0981123456"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Estado de Aportes</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: "aporteAlDia", label: "Aporte" },
                                            { key: "solidaridadAlDia", label: "Solidaridad" },
                                            { key: "fondoAlDia", label: "Fondo" },
                                            { key: "incoopAlDia", label: "INCOOP" },
                                            { key: "creditoAlDia", label: "Crédito" }
                                        ].map((item) => (
                                            <label key={item.key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData[item.key as keyof typeof formData] as boolean}
                                                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                                                    className="h-5 w-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                                                />
                                                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-teal-500 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="h-5 w-5" />
                                            Guardar
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Confirmar Eliminación */}
            <AnimatePresence>
                {showDeleteConfirm && socioToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md p-6"
                        >
                            <div className="text-center">
                                <div className="mx-auto h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                                    <Trash2 className="h-8 w-8 text-rose-600" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">¿Eliminar Socio?</h3>
                                <p className="text-slate-500 mb-1">
                                    Estás a punto de eliminar a:
                                </p>
                                <p className="font-bold text-slate-800 mb-4">
                                    {socioToDelete.nombreCompleto}
                                </p>
                                <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3 mb-6">
                                    Esta acción no se puede deshacer. Se eliminarán también las asistencias y asignaciones relacionadas.
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {deleting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 className="h-5 w-5" />
                                                Eliminar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

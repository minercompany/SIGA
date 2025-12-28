"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users,
    UserPlus,
    Shield,
    Search,
    Loader2,
    CheckCircle2,
    XCircle,
    Edit2,
    Trash2,
    X,
    Eye,
    EyeOff,
    Monitor,
    Layout,
    Globe,
    CreditCard,
    ClipboardList,
    FileText,
    Settings,
    Lock,
    UserCircle2,
    BarChart3,
    Activity,
    Zap,
    ShieldAlert,
    UserCheck,
    CheckSquare,
    History,
    Upload
} from "lucide-react";
import axios from "axios";
import Swal from 'sweetalert2';

interface Usuario {
    id: number | null;
    username: string | null;
    nombreCompleto: string;
    email: string;
    telefono: string;
    rol: string;
    rolNombre: string;
    activo: boolean;
    sucursal: string | null;
    sucursalId: number | null;
    permisosEspeciales: string | null;
    idSocio: number | null;
    tipo: "USUARIO" | "SOCIO";
    nroSocio?: string;
    cedula?: string;
}

interface Rol {
    value: string;
    nombre: string;
    descripcion: string;
}

interface Sucursal {
    sucursalId: number;
    sucursal: string;
}

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Form state
    const [form, setForm] = useState({
        username: "",
        password: "",
        nombreCompleto: "",
        email: "",
        telefono: "",
        rol: "OPERADOR",
        sucursalId: "",
        permisosEspeciales: "",
        idSocio: "" as string | number
    });

    const AVAILABLE_SCREENS = [
        { id: "dashboard", label: "Dashboard", icon: BarChart3, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700" },
        { id: "dashboard-live", label: "Dashboard En Vivo", icon: Activity, color: "from-purple-500 to-pink-500", bgColor: "bg-purple-50", borderColor: "border-purple-200", textColor: "text-purple-700" },
        { id: "importar", label: "Importar Padrón", icon: Upload, color: "from-indigo-500 to-blue-500", bgColor: "bg-indigo-50", borderColor: "border-indigo-200", textColor: "text-indigo-700" },
        { id: "importar-funcionarios", label: "Importar Funcionarios", icon: Users, color: "from-violet-500 to-purple-500", bgColor: "bg-violet-50", borderColor: "border-violet-200", textColor: "text-violet-700" },
        { id: "socios", label: "Padrón Socios", icon: Users, color: "from-teal-500 to-emerald-500", bgColor: "bg-teal-50", borderColor: "border-teal-200", textColor: "text-teal-700" },
        { id: "asignacion-rapida", label: "Asignación Rápida", icon: Zap, color: "from-amber-500 to-orange-500", bgColor: "bg-amber-50", borderColor: "border-amber-200", textColor: "text-amber-700" },
        { id: "asignaciones", label: "Mis Listas", icon: UserCheck, color: "from-emerald-500 to-teal-500", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", textColor: "text-emerald-700" },
        { id: "asignaciones-admin", label: "Asignación Master", icon: ShieldAlert, color: "from-red-500 to-rose-500", bgColor: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-700" },
        { id: "asistencia", label: "Asistencia", icon: ClipboardList, color: "from-sky-500 to-blue-500", bgColor: "bg-sky-50", borderColor: "border-sky-200", textColor: "text-sky-700" },
        { id: "checkin", label: "Check-in", icon: CheckSquare, color: "from-green-500 to-emerald-500", bgColor: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700" },
        { id: "reportes", label: "Reportes", icon: FileText, color: "from-slate-500 to-gray-600", bgColor: "bg-slate-50", borderColor: "border-slate-200", textColor: "text-slate-700" },
        { id: "usuarios", label: "Usuarios y Roles", icon: Shield, color: "from-rose-500 to-pink-500", bgColor: "bg-rose-50", borderColor: "border-rose-200", textColor: "text-rose-700" },
        { id: "auditoria", label: "Auditoría", icon: History, color: "from-gray-500 to-slate-500", bgColor: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-700" },
        { id: "configuracion", label: "Configuración", icon: Settings, color: "from-zinc-500 to-gray-600", bgColor: "bg-zinc-50", borderColor: "border-zinc-200", textColor: "text-zinc-700" },
    ];

    const fetchData = useCallback(async (query = "") => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [usuariosRes, rolesRes, sucursalesRes] = await Promise.all([
                axios.get(`/api/usuarios/unificados?term=${query}`, { headers }),
                axios.get("/api/usuarios/roles", { headers }),
                axios.get("/api/socios/estadisticas/por-sucursal", { headers })
            ]);

            setUsuarios(usuariosRes.data);
            setRoles(rolesRes.data);
            setSucursales(sucursalesRes.data);
            setCurrentPage(1); // Reset page on new data
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchData]);

    const openNewModal = () => {
        setEditingUser(null);
        setForm({
            username: "",
            password: "",
            nombreCompleto: "",
            email: "",
            telefono: "",
            rol: "OPERADOR",
            sucursalId: "",
            permisosEspeciales: "",
            idSocio: ""
        });
        setShowModal(true);
    };

    const openGiveAccessModal = (socio: Usuario) => {
        setEditingUser(null);
        setForm({
            username: socio.cedula || socio.nroSocio || "",
            password: socio.cedula || socio.nroSocio || "", // Default password is ID/Nro
            nombreCompleto: socio.nombreCompleto,
            email: "",
            telefono: "",
            rol: "USUARIO_SOCIO",
            sucursalId: socio.sucursalId?.toString() || "", // Pre-fill sucursal
            permisosEspeciales: "dashboard,asignaciones,configuracion", // Default granular permissions
            idSocio: socio.idSocio || ""
        });
        setShowModal(true);
    };

    const openEditModal = (user: Usuario) => {
        setEditingUser(user);
        setForm({
            username: user.username || "",
            password: "",
            nombreCompleto: user.nombreCompleto,
            email: user.email || "",
            telefono: user.telefono || "",
            rol: user.rol,
            sucursalId: user.sucursalId?.toString() || "",
            permisosEspeciales: user.permisosEspeciales || "",
            idSocio: user.idSocio || ""
        });
        setShowModal(true);
    };

    const togglePermiso = (screenId: string) => {
        const current = form.permisosEspeciales.split(',').filter(p => p !== "");
        const index = current.indexOf(screenId);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(screenId);
        }
        setForm(prev => ({ ...prev, permisosEspeciales: current.join(',') }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const payload = {
                ...form,
                sucursalId: form.sucursalId ? parseInt(form.sucursalId) : null,
                idSocio: form.idSocio ? parseInt(form.idSocio.toString()) : null
            };

            if (editingUser && editingUser.id) {
                await axios.put(`/api/usuarios/${editingUser.id}`, payload, { headers });
                setMessage({ type: "success", text: "Usuario actualizado correctamente" });
            } else {
                await axios.post("/api/usuarios", payload, { headers });
                setMessage({ type: "success", text: "Usuario creado correctamente" });
            }

            fetchData(searchTerm);
            setTimeout(() => {
                setShowModal(false);
                setMessage(null);
            }, 1000);
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                setMessage({ type: "error", text: error.response.data.error });
            } else {
                setMessage({ type: "error", text: "Error al guardar usuario" });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user: Usuario) => {
        if (!user.id) return;

        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Deseas dar de baja al usuario "${user.nombreCompleto}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'rounded-2xl' }
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                // Usamos DELETE para baja lógica (según controller)
                await axios.delete(`/api/usuarios/${user.id}`, { headers });

                await Swal.fire({
                    title: '¡Desactivado!',
                    text: 'El usuario ha sido dado de baja correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' }
                });
                fetchData(searchTerm);
            } catch (error) {
                console.error("Error:", error);
                Swal.fire({ title: 'Error', text: 'No se pudo desactivar el usuario', icon: 'error' });
            }
        }
    };

    const handleActivate = async (user: Usuario) => {
        if (!user.id) return;

        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            await axios.put(`/api/usuarios/${user.id}`, { activo: true }, { headers });

            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            Toast.fire({
                icon: 'success',
                title: 'Usuario reactivado exitosamente'
            });
            fetchData(searchTerm);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const getRolColor = (rol: string) => {
        switch (rol) {
            case "SUPER_ADMIN": return "bg-purple-100 text-purple-700 border-purple-200";
            case "DIRECTIVO": return "bg-blue-100 text-blue-700 border-blue-200";
            case "OPERADOR": return "bg-teal-100 text-teal-700 border-teal-200";
            case "USUARIO_SOCIO": return "bg-slate-100 text-slate-700 border-slate-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentUsers = usuarios.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(usuarios.length / ITEMS_PER_PAGE);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    if (loading && usuarios.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Premium */}
            <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black">Gestión de Usuarios y Roles</h1>
                        <p className="text-rose-100 text-sm mt-1">Administra los accesos al sistema y permisos granulares</p>
                    </div>
                    <button
                        onClick={openNewModal}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur px-5 py-3 font-bold text-white hover:bg-white/30 border border-white/30 transition-all"
                    >
                        <UserPlus className="h-5 w-5" />
                        Crear Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Resumen de Roles - Premium Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {roles.map((rol) => {
                    const count = usuarios.filter(u => u.rol === rol.value && u.tipo === "USUARIO").length;
                    const colorConfig: Record<string, { gradient: string; bg: string; border: string; text: string; icon: string }> = {
                        'SUPER_ADMIN': { gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500' },
                        'DIRECTIVO': { gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' },
                        'OPERADOR': { gradient: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', icon: 'text-teal-500' },
                        'USUARIO_SOCIO': { gradient: 'from-slate-500 to-gray-600', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'text-slate-500' }
                    };
                    const colors = colorConfig[rol.value] || colorConfig['USUARIO_SOCIO'];

                    return (
                        <div key={rol.value} className={`${colors.bg} rounded-2xl p-5 border-2 ${colors.border} hover:shadow-lg transition-all`}>
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-xl bg-gradient-to-br ${colors.gradient}`}>
                                    <Shield className="h-5 w-5 text-white" />
                                </div>
                                <p className={`text-3xl font-black ${colors.text}`}>{count}</p>
                            </div>
                            <p className={`font-bold mt-3 ${colors.text}`}>{rol.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Usuarios Activos</p>
                        </div>
                    );
                })}
            </div>

            {/* Tabla Unificada */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, C.I., usuario o Nro. Socio..."
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        {searchTerm.length > 0 && (
                            <p className="text-xs text-slate-500 font-medium italic mb-1">
                                Resultados: {usuarios.length}
                            </p>
                        )}
                        <p className="text-xs text-slate-400 font-medium text-right">
                            Total Registros: {usuarios.length}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identificación</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre y Detalles</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado de Acceso</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentUsers.map((user, idx) => (
                                <tr key={user.id ? `u-${user.id}` : `s-${user.idSocio}-${idx}`} className="hover:bg-teal-50/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        {user.tipo === "USUARIO" ? (
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded w-fit mb-1">@{user.username}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Sist. Operativo</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-600">Socio #{user.nroSocio}</span>
                                                <span className="text-[10px] text-slate-400">Sin acceso activo</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${user.tipo === "USUARIO" ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {user.tipo === "USUARIO" ? <Shield className="h-5 w-5" /> : <UserCircle2 className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700">{user.nombreCompleto}</p>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    {user.cedula && <span className="text-[10px] font-medium text-slate-400">C.I.: {user.cedula}</span>}
                                                    {user.sucursal && <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded tracking-tight">{user.sucursal}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border ${getRolColor(user.rol)}`}>
                                                {user.tipo === "USUARIO" ? <CheckCircle2 className="h-3 w-3 mr-1.5" /> : <XCircle className="h-3 w-3 mr-1.5" />}
                                                {user.rolNombre}
                                            </span>
                                            {user.permisosEspeciales && (
                                                <div className="relative group/perm">
                                                    <Lock className="h-4 w-4 text-emerald-500" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/perm:block z-20 w-40 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg">
                                                        Permisos: {user.permisosEspeciales}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            {user.tipo === "USUARIO" ? (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-teal-600 transition-all border border-transparent hover:border-slate-200"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="h-4.5 w-4.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => user.activo ? handleDelete(user) : handleActivate(user)}
                                                        className={`p-2.5 rounded-xl transition-all border border-transparent ${user.activo
                                                            ? 'text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100'
                                                            : 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100'
                                                            }`}
                                                        title={user.activo ? "Dar de Baja (Desactivar)" : "Reactivar Acceso"}
                                                    >
                                                        {user.activo ? <Trash2 className="h-4.5 w-4.5" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => openGiveAccessModal(user)}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all uppercase"
                                                >
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                    Dar Acceso
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {usuarios.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <Search className="h-10 w-10 text-slate-200 mb-4" />
                                            <p className="text-slate-400 font-medium">No se encontraron resultados</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Controles de Paginación */}
                    {usuarios.length > 0 && (
                        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                            <p className="text-xs text-slate-400 font-medium">
                                Mostrando <span className="font-bold text-slate-600">{indexOfFirstItem + 1}</span> a <span className="font-bold text-slate-600">{Math.min(indexOfLastItem, usuarios.length)}</span> de <span className="font-bold text-slate-600">{usuarios.length}</span> resultados
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Anterior
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        // Simple logic to show first 5 pages or sliding window could be added
                                        // For now, let's keep it simple or minimal
                                        let pageNum = i + 1;
                                        if (totalPages > 5 && currentPage > 3) {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        if (pageNum > totalPages) return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => paginate(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum
                                                    ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                                                    : "bg-white text-slate-600 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Crear/Editar */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-teal-600 rounded-2xl shadow-lg shadow-teal-200">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">
                                        {editingUser ? "Configurar Operador" : "Habilitar Nuevo Usuario"}
                                    </h2>
                                    <p className="text-slate-500 text-xs font-medium">Define el rol y los permisos granulares</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all">
                                <X className="h-6 w-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {message && (
                                <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                                    {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                    {message.text}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre de Usuario</label>
                                        <input
                                            type="text"
                                            value={form.username}
                                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-500 focus:bg-white outline-none transition-all font-mono text-sm"
                                            placeholder="ej: jdoe"
                                            required
                                            disabled={!!editingUser}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Contraseña {editingUser && "(campo opcional)"}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={form.password}
                                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-500 focus:bg-white outline-none transition-all pr-12 font-mono"
                                                placeholder="••••••••"
                                                required={!editingUser}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={form.nombreCompleto}
                                            onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
                                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-500 focus:bg-white outline-none transition-all"
                                            placeholder="Nombre Apellido"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email / Contacto</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-500 focus:bg-white outline-none transition-all"
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Rol de Sistema</label>
                                    <select
                                        value={form.rol}
                                        onChange={(e) => setForm({ ...form, rol: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-500 focus:bg-white outline-none transition-all font-bold"
                                        required
                                    >
                                        {roles.map((rol) => (
                                            <option key={rol.value} value={rol.value}>{rol.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sucursal Asignada</label>
                                    <select
                                        value={form.sucursalId}
                                        onChange={(e) => setForm({ ...form, sucursalId: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-500 focus:bg-white outline-none transition-all font-bold"
                                    >
                                        <option value="">Sin Restricción (Todas)</option>
                                        {sucursales.map((suc) => (
                                            <option key={suc.sucursalId} value={suc.sucursalId}>{suc.sucursal}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-6 space-y-4 border border-slate-200">
                                <label className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest">
                                    <Lock className="h-4 w-4 text-emerald-600" />
                                    Permisos Granulares (Pantallas)
                                </label>
                                <p className="text-[10px] text-slate-500 font-medium mb-4">
                                    Habilita pantallas específicas de forma individual. Los permisos activos se muestran con color.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {AVAILABLE_SCREENS.map(screen => {
                                        const Icon = screen.icon;
                                        const hasAccess = form.permisosEspeciales.split(',').includes(screen.id);
                                        return (
                                            <button
                                                key={screen.id}
                                                type="button"
                                                onClick={() => togglePermiso(screen.id)}
                                                className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-[10px] font-bold border-2 transition-all duration-300 overflow-hidden group ${hasAccess
                                                    ? `${screen.bgColor} ${screen.borderColor} ${screen.textColor} shadow-lg`
                                                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:shadow-md'
                                                    }`}
                                            >
                                                {/* Background gradient on active */}
                                                {hasAccess && (
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${screen.color} opacity-10`} />
                                                )}

                                                {/* Icon container */}
                                                <div className={`relative z-10 p-2 rounded-xl transition-all ${hasAccess
                                                    ? `bg-gradient-to-br ${screen.color} shadow-lg`
                                                    : 'bg-slate-100 group-hover:bg-slate-200'
                                                    }`}>
                                                    <Icon className={`h-5 w-5 ${hasAccess ? 'text-white' : 'text-slate-400'}`} />
                                                </div>

                                                {/* Label */}
                                                <span className="relative z-10 text-center leading-tight">
                                                    {screen.label}
                                                </span>

                                                {/* Active indicator */}
                                                {hasAccess && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckCircle2 className={`h-4 w-4 ${screen.textColor}`} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Quick actions */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, permisosEspeciales: AVAILABLE_SCREENS.map(s => s.id).join(',') }))}
                                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all"
                                    >
                                        ✓ Seleccionar Todos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, permisosEspeciales: '' }))}
                                        className="text-[10px] font-bold text-red-600 hover:text-red-700 px-3 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                                    >
                                        ✕ Quitar Todos
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-teal-100 transition-all"
                                >
                                    {saving && <Loader2 className="h-5 w-5 animate-spin" />}
                                    {editingUser ? "Actualizar" : "Activar Acceso"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

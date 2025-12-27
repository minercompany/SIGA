"use client";

import { useState } from "react";
import {
    Trash2,
    Database,
    RefreshCcw,
    ShieldAlert,
    Save,
    Info,
    Key,
    Search,
    UserCircle2,
    Check,
    X,
    Loader2,
    Camera,
    Mail,
    Phone,
    Upload
} from "lucide-react";
import axios from "axios";
import { useEffect, useCallback } from "react";
import { useConfig } from "@/context/ConfigContext";
import Swal from 'sweetalert2';

const ConfiguracionEvento = () => {
    const { nombreAsamblea, fechaAsamblea, updateConfig } = useConfig();
    const [nombre, setNombre] = useState(nombreAsamblea);
    const [fecha, setFecha] = useState(fechaAsamblea);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setNombre(nombreAsamblea);
        setFecha(fechaAsamblea);
    }, [nombreAsamblea, fechaAsamblea]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateConfig("ASAMBLEA_NOMBRE", nombre);
            await updateConfig("ASAMBLEA_FECHA", fecha);

            Swal.fire({
                title: '¡Configuración Guardada!',
                text: 'Los parámetros del evento se han actualizado y sincronizado con el sistema.',
                icon: 'success',
                confirmButtonText: 'Excelente',
                confirmButtonColor: '#10b981',
                padding: '2em',
                customClass: {
                    popup: 'rounded-[2rem] shadow-2xl'
                }
            });
        } catch (error) {
            Swal.fire({
                title: 'Error al Guardar',
                text: 'Hubo un problema al intentar actualizar la configuración. Verifica tu conexión.',
                icon: 'error',
                confirmButtonText: 'Intentar De Nuevo',
                confirmButtonColor: '#ef4444',
                padding: '2em',
                customClass: {
                    popup: 'rounded-[2rem] shadow-2xl'
                }
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 italic uppercase">
                <Save className="h-5 w-5 text-emerald-500" />
                Parámetros del Evento
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase">Nombre de la Asamblea</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 outline-none transition-all font-medium"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase">Fecha del Evento</label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 outline-none transition-all font-medium"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-slate-900 px-8 py-3 font-bold text-white hover:bg-black shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? "Guardando..." : "Guardar Configuración"}
                </button>
            </div>
        </>
    );
};

export default function ConfiguracionPage() {
    const [user, setUser] = useState<any>(null);
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    // Perfil / Password States
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPass, setSavingPass] = useState(false);

    // Hidden Admin Module State (Solo para ADMIN)
    const [accessCode, setAccessCode] = useState("");
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [foundSocios, setFoundSocios] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [updatingSocioId, setUpdatingSocioId] = useState<number | null>(null);

    // Personal Data States
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [fotoPerfil, setFotoPerfil] = useState("");
    const [savingPersonal, setSavingPersonal] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const u = JSON.parse(userData);
            setUser(u);
            setEmail(u.email || "");
            setTelefono(u.telefono || "");
            setFotoPerfil(u.fotoPerfil || "");
        }
    }, []);

    const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5000000) { // 5MB limit
                setMessage({ type: 'error', text: 'La imagen es demasiado grande (Máx 5MB)' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFotoPerfil(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSavePersonal = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validación @gmail.com
        if (email && !email.toLowerCase().endsWith("@gmail.com")) {
            setMessage({ type: 'error', text: 'El correo electrónico debe ser una cuenta @gmail.com' });
            return;
        }

        setSavingPersonal(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:8081/api/usuarios/${user.id}`, {
                email,
                telefono,
                fotoPerfil
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Actualizar Local Storage
            const updatedUser = { ...user, email, telefono, fotoPerfil };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);

            setMessage({ type: 'success', text: 'Datos personales actualizados correctamente' });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Error al actualizar datos'
            });
        } finally {
            setSavingPersonal(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        setSavingPass(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:8081/api/usuarios/cambiar-password-actual", {
                currentPassword,
                newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Error al cambiar la contraseña'
            });
        } finally {
            setSavingPass(false);
        }
    };

    const handleResetData = async (type: 'padron' | 'factory') => {
        if (type === 'padron' && confirmText !== "REINICIAR_TODO_EL_PADRON") {
            setMessage({ type: "error", text: "Texto de confirmación incorrecto." });
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setMessage({ type: "error", text: "No hay sesión activa. Por favor, cierra sesión e inicia de nuevo." });
                return;
            }
            const response = await axios.post(`http://localhost:8081/api/socios/reset-${type}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Reset response:", response.data);
            setMessage({ type: "success", text: `¡Sistema reiniciado! Se eliminaron ${response.data.eliminados?.socios || 0} socios, ${response.data.eliminados?.asistencias || 0} asistencias, ${response.data.eliminados?.asignaciones || 0} asignaciones.` });
            setConfirmText("");
            setIsAdminMode(false);
        } catch (error: any) {
            console.error("Error en reset:", error);
            setMessage({ type: "error", text: "Error al reiniciar: " + (error.message || "Error desconocido") });
        } finally {
            setLoading(false);
        }
    };

    // Función simplificada de reset - usando endpoint principal
    const handleSimpleReset = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No hay sesión activa. Recarga la página.");

            // Usar el endpoint oficial que borra todo (incluyendo usuarios)
            const response = await axios.post("http://localhost:8081/api/socios/reset-padron", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Reset response:", response.data);
            setMessage({
                type: "success",
                text: `¡Sistema a CERO! Eliminados: ${response.data.eliminados?.socios || 0} socios, ${response.data.eliminados?.usuarios || 0} usuarios.`
            });
            setIsAdminMode(false);
        } catch (error: any) {
            console.error("Error en reset:", error);
            setMessage({ type: "error", text: "Error: " + (error.response?.data?.error || error.message) });
        } finally {
            setLoading(false);
        }
    };

    const checkAccess = () => {
        if (accessCode === "226118") {
            setIsAdminMode(true);
            setAccessCode("");
            setMessage({ type: "success", text: "Modo Administrador Maestro activado." });
        } else {
            setMessage({ type: "error", text: "Código incorrecto." });
        }
    };

    const handleSearchSocio = useCallback(async (query: string) => {
        if (query.length < 2) return;
        setIsSearching(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:8081/api/socios/buscar?term=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFoundSocios(response.data);
        } catch (error) {
            console.error("Error buscando socio:", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) handleSearchSocio(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearchSocio]);

    const toggleStatus = async (socioId: number, field: string, currentValue: boolean) => {
        setUpdatingSocioId(socioId);
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`http://localhost:8081/api/socios/${socioId}/estado`,
                { [field]: !currentValue },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Actualizar localmente
            setFoundSocios(prev => prev.map(s =>
                s.id === socioId ? { ...s, [field]: !currentValue } : s
            ));
        } catch (error) {
            console.error("Error actualizando estado:", error);
            alert("Error al actualizar el estado");
        } finally {
            setUpdatingSocioId(null);
        }
    };

    const isSocio = user?.rol === "USUARIO_SOCIO";

    return (
        <div className="max-w-4xl space-y-8 pb-20">
            <div>
                <h1 className="text-2xl font-black text-slate-800 italic uppercase tracking-tight">Mi Perfil y Configuración</h1>
                <p className="text-slate-500">Gestiona tu cuenta y parámetros del sistema</p>
            </div>

            {/* SECCIÓN PERFIL (VISIBLE PARA TODOS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center">
                    <div className="relative group">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-xl overflow-hidden">
                            {fotoPerfil || user?.fotoPerfil ? (
                                <img src={fotoPerfil || user?.fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle2 className="h-12 w-12 text-emerald-600" />
                            )}
                        </div>
                        <label className="absolute bottom-4 right-0 p-1.5 bg-slate-800 rounded-full text-white cursor-pointer hover:bg-black transition-colors shadow-lg">
                            <Camera className="h-3 w-3" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleFotoUpload} />
                        </label>
                    </div>
                    <h2 className="font-bold text-slate-800 line-clamp-1">{user?.nombreCompleto}</h2>
                    <p className="text-xs text-slate-400 font-medium mb-4">@{user?.username}</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <UserCircle2 className="h-3 w-3" />
                        ROL: {user?.rol}
                    </div>
                </div>

                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <Key className="h-4 w-4 text-emerald-600" />
                        <h2 className="text-sm font-bold text-slate-700 uppercase">Datos Personales & Seguridad</h2>
                    </div>

                    <form onSubmit={handleSavePersonal} className="p-5 space-y-4 border-b border-slate-100">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Información Básica</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Correo Gmail (Para Notificaciones)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="usuario@gmail.com"
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-emerald-500 outline-none"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        pattern=".*@gmail\.com"
                                        title="Debe ser una dirección @gmail.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Teléfono / WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="tel"
                                        placeholder="+595 981 ..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-emerald-500 outline-none"
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={savingPersonal}
                                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingPersonal ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                Guardar Datos
                            </button>
                        </div>
                    </form>

                    <form onSubmit={handleChangePassword} className="p-5 space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Seguridad de la Cuenta</h3>
                        {message && message.text.includes("Contraseña") && (
                            <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {message.type === 'success' ? <Check className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                {message.text}
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-4">
                            <input
                                type="password"
                                placeholder="Contraseña Actual"
                                className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-emerald-500 outline-none"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input
                                    type="password"
                                    placeholder="Nueva Contraseña"
                                    className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-emerald-500 outline-none"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Confirmar Nueva"
                                    className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-emerald-500 outline-none"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={savingPass}
                            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {savingPass ? "Guardando..." : "Actualizar Contraseña"}
                        </button>
                    </form>
                </div>
            </div>

            {!isSocio && (
                <>
                    <div className="h-px bg-slate-100 my-8"></div>

                    {/* Zona de Peligro - Reset de Datos con Protección */}
                    <div className="rounded-2xl border-2 border-red-100 bg-gradient-to-br from-red-50/50 to-orange-50/30 p-8 space-y-6 relative overflow-hidden">
                        {/* Decoración de fondo */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-center gap-3 text-red-700 relative">
                            <div className="p-2 bg-red-100 rounded-xl">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Zona de Peligro</h2>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-lg relative">
                            {/* Estado: Bloqueado */}
                            {!isAdminMode ? (
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-amber-100 p-3 rounded-xl">
                                            <Key className="h-6 w-6 text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-800 text-lg">Acceso Protegido</h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Esta sección está protegida por una <strong className="text-red-600">clave de administrador</strong>.
                                                Ingresa el código para desbloquear las opciones de reinicio.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                            Código de Autorización
                                        </label>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="password"
                                                value={accessCode}
                                                onChange={(e) => setAccessCode(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && checkAccess()}
                                                placeholder="••••••"
                                                className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-lg font-mono tracking-[0.5em] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                                                maxLength={6}
                                            />
                                            <button
                                                onClick={checkAccess}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 text-sm font-bold text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/30 whitespace-nowrap"
                                            >
                                                <Key className="h-4 w-4" />
                                                Desbloquear
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-400 text-center">
                                            Solo personal autorizado tiene acceso a esta clave.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* Estado: Desbloqueado - UI Simplificada */
                                <div className="space-y-6">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                                        <Check className="h-5 w-5 text-emerald-600" />
                                        <span className="text-sm font-bold text-emerald-700">Modo Administrador Activado</span>
                                        <button
                                            onClick={() => setIsAdminMode(false)}
                                            className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                                        >
                                            Bloquear
                                        </button>
                                    </div>

                                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center space-y-4">
                                        <div className="flex justify-center">
                                            <div className="bg-red-100 p-4 rounded-full">
                                                <Database className="h-8 w-8 text-red-600" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-lg">¿Restablecer Todo a Cero?</h3>
                                            <p className="text-sm text-slate-500 mt-2">
                                                Se eliminarán <strong className="text-red-600">TODOS</strong> los socios, asignaciones,
                                                asistencias, importaciones y auditorías del sistema.
                                            </p>
                                            <p className="text-xs text-red-500 mt-2 font-bold">
                                                ⚠️ Esta acción NO se puede deshacer
                                            </p>
                                        </div>

                                        <button
                                            onClick={handleSimpleReset}
                                            disabled={loading}
                                            className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-8 py-4 text-sm font-black text-white uppercase tracking-wider hover:from-red-700 hover:to-red-800 transition-all shadow-xl shadow-red-500/30 disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <>
                                                    <RefreshCcw className="h-5 w-5 animate-spin" />
                                                    Procesando...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="h-5 w-5" />
                                                    Restablecer Datos a Cero
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {message && !message.text.includes("Contraseña") && (
                            <div className={`p-4 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {message.text}
                            </div>
                        )}
                    </div>

                    {/* Otras Configuraciones de Asamblea */}
                    <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 space-y-6">
                        <ConfiguracionEvento />
                    </div>

                    {/* Hidden Master Override Section */}
                    <div className="pt-20 pb-10 border-t border-slate-100 mt-12">
                        {!isAdminMode ? (
                            <div className="flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                                <div className="p-2 bg-slate-100 rounded-full">
                                    <Key className="h-4 w-4 text-slate-400" />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Override</p>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && checkAccess()}
                                        placeholder="••••••"
                                        className="w-40 rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-sm outline-none focus:border-slate-400 shadow-sm"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-3xl bg-white p-8 shadow-2xl border-4 border-emerald-500/20 space-y-8 animate-in zoom-in-95 duration-300">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
                                            <ShieldAlert className="h-7 w-7 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Modificador Maestro</h2>
                                            <p className="text-emerald-600 text-xs font-black uppercase tracking-widest">Control Total de Estados</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAdminMode(false)}
                                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Buscar socio para forzar cambio de estado..."
                                            className="w-full rounded-2xl bg-slate-50 border-2 border-slate-100 px-14 py-5 text-xl outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner font-bold"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        {isSearching && (
                                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 animate-spin text-emerald-500" />
                                        )}
                                    </div>

                                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {foundSocios.map(socio => (
                                            <div key={socio.id} className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between gap-6 hover:border-emerald-200 hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                                        <UserCircle2 className="h-7 w-7 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-lg line-clamp-1">{socio.nombreCompleto}</p>
                                                        <div className="flex gap-2 items-center text-xs text-slate-500 font-medium">
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded italic"># {socio.numeroSocio}</span>
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded">CI: {socio.cedula}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    {[
                                                        { label: "Aporte", field: "aporteAlDia" },
                                                        { label: "Solid.", field: "solidaridadAlDia" },
                                                        { label: "Fondo", field: "fondoAlDia" },
                                                        { label: "Incoop", field: "incoopAlDia" },
                                                        { label: "Crédito", field: "creditoAlDia" }
                                                    ].map(item => (
                                                        <div key={item.field} className="flex flex-col items-center gap-2">
                                                            <span className="text-[9px] uppercase font-black text-slate-400">{item.label}</span>
                                                            <button
                                                                onClick={() => toggleStatus(socio.id, item.field, (socio as any)[item.field])}
                                                                className={`h-8 w-14 rounded-full p-1 transition-all flex items-center ${(socio as any)[item.field]
                                                                    ? 'bg-emerald-500'
                                                                    : 'bg-slate-200'
                                                                    } group relative`}
                                                                disabled={updatingSocioId === socio.id}
                                                            >
                                                                <div className={`h-6 w-6 rounded-full bg-white shadow flex items-center justify-center transition-all transform ${(socio as any)[item.field] ? 'translate-x-6' : 'translate-x-0'
                                                                    }`}>
                                                                    {(socio as any)[item.field] ? (
                                                                        <Check className="h-3 w-3 text-emerald-600" />
                                                                    ) : (
                                                                        <X className="h-3 w-3 text-slate-300" />
                                                                    )}
                                                                </div>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

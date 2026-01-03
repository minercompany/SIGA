"use client";

import { Bell, Search, User, Calendar, Menu, X, ArrowLeft, LogOut, Settings, Mail, UserCircle, HelpCircle, Users, Activity, UserCheck, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { WelcomeModal } from "../onboarding/WelcomeModal";
import AvisosBell from "../AvisosBell";
import { ManualUsuarioModal } from "../ManualUsuarioModal";
import { useConfig } from "@/context/ConfigContext";
import { useUserActivity } from "@/context/UserActivityContext";
import { Database, AlertTriangle, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

export function TopBar() {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);

    // Estados para estadísticas de usuarios
    // Estados para estadísticas de usuarios (Ahora desde Contexto)
    const { stats: userStats } = useUserActivity();

    const userMenuRef = useRef<HTMLDivElement>(null);

    const searchContainerRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLInputElement>(null);

    // Click Outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchContainerRef, userMenuRef]);

    // Cerrar modal con ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedMember(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSidebarToggle = () => {
        window.dispatchEvent(new Event('toggle-sidebar'));
    };

    const [currentTime, setCurrentTime] = useState<string>("");
    const [currentDate, setCurrentDate] = useState<string>("");
    const [user, setUser] = useState<any>(null);
    const [daysUntil, setDaysUntil] = useState<number | null>(null);
    const [isAdminSession, setIsAdminSession] = useState(false);

    useEffect(() => {
        setIsAdminSession(!!localStorage.getItem("adminToken"));
    }, []);

    // Effect para fecha y hora
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }

        const fetchAsamblea = async () => {
            try {
                const res = await fetch("/api/asambleas/proxima", {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                });
                if (res.ok) {
                    if (res.status === 204) return;
                    const data = await res.json();
                    const target = new Date(data.fecha);
                    const now = new Date();
                    const diffTime = target.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setDaysUntil(diffDays);
                }
            } catch { }
        };
        fetchAsamblea();

        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" }));
            setCurrentDate(now.toLocaleDateString("es-PY", { weekday: "long", day: "numeric", month: "long" }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const { isTestMode, deactivateTestMode } = useConfig();

    // Heartbeat y estadísticas de usuarios (Ahora manejado por el Contexto Global)
    // El contexto se encarga del heartbeat y de las estadísticas
    // No necesitamos duplicar la lógica aquí

    useEffect(() => {
        let isActive = true; // Prevents race conditions
        const timer = setTimeout(async () => {
            if (searchTerm.trim().length >= 1) {
                setIsSearching(true);
                try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`/api/usuarios/unificados?term=${searchTerm}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (res.ok && isActive) {
                        const data = await res.json();
                        setSearchResults(data);
                        setShowResults(true);
                    }
                } catch (error) {
                    console.error("Error buscando", error);
                } finally {
                    if (isActive) setIsSearching(false);
                }
            } else {
                if (isActive) {
                    setSearchResults([]);
                    setShowResults(false);
                }
            }
        }, 500); // Increased debounce to 500ms

        return () => {
            clearTimeout(timer);
            isActive = false;
        };
    }, [searchTerm]);

    const handleSelectMember = (member: any) => {
        setSelectedMember(member);
        setShowResults(false);
        setSearchTerm("");
        setMobileSearchOpen(false);
    };

    const handleQuickDeactivate = async () => {
        const result = await Swal.fire({
            title: '⚠️ ¿Desactivar Modo de Prueba?',
            text: 'Se perderán todos los cambios temporales y se restaurarán los datos originales.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, Restaurar Todo',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setIsDeactivating(true);
            const response = await deactivateTestMode();
            setIsDeactivating(false);

            if (response.success) {
                Swal.fire({
                    title: '✅ Restaurado',
                    text: 'El sistema ha vuelto a su estado original.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        }
    };

    const handleReturnToAdmin = () => {
        const adminToken = localStorage.getItem("adminToken");
        const adminUser = localStorage.getItem("adminUser");
        if (adminToken && adminUser) {
            localStorage.setItem("token", adminToken);
            localStorage.setItem("user", adminUser);
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            window.location.href = "/usuarios";
        }
    };

    return (
        <>
            {/* Banner de Modo Prueba */}
            {isTestMode && (
                <div className="bg-violet-600 text-white px-4 py-2 flex items-center justify-between shadow-lg z-50 animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex-shrink-0 bg-violet-500 p-1.5 rounded-lg border border-violet-400 animate-pulse">
                            <Database className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                            <span className="text-xs md:text-sm font-black uppercase tracking-widest whitespace-nowrap italic">
                                🧪 Modo de Prueba Activo
                            </span>
                            <span className="hidden md:inline text-[10px] text-violet-200 font-bold uppercase tracking-wider">
                                • Los cambios realizados son temporales y no afectan los datos reales
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleQuickDeactivate}
                        disabled={isDeactivating}
                        className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider transition-all border border-white/20 flex items-center gap-2"
                    >
                        {isDeactivating ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
                        Desactivar
                    </button>
                </div>
            )}

            {isAdminSession && (
                <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between shadow-lg z-50 animate-in slide-in-from-top duration-500 border-b border-emerald-500">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl animate-pulse">
                            <UserCheck className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs md:text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                                🕵️ Sesión de Impersonación Activa
                            </span>
                            <span className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">
                                Estás viendo el sistema como: <span className="text-white underline">{user?.nombreCompleto}</span>
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleReturnToAdmin}
                        className="bg-white text-emerald-600 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-emerald-50 hover:scale-105 shadow-xl flex items-center gap-2 border-2 border-transparent active:scale-95"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a mi Sesión Admin
                    </button>
                </div>
            )}

            <header className="sticky top-0 z-40 flex h-14 md:h-16 w-full items-center justify-between border-b border-emerald-100/50 px-2 md:px-4 lg:px-8 bg-white/95 backdrop-blur-md shadow-sm">

                {/* Izquierda - Hamburguesa y Búsqueda Responsive */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                        onClick={handleSidebarToggle}
                        data-tour="sidebar-trigger"
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg shrink-0"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Búsqueda Responsive (Siempre visible) */}
                    <div className="flex flex-col relative flex-1 max-w-xs md:max-w-sm lg:max-w-md" ref={searchContainerRef}>
                        <div className="w-full flex items-center gap-2 rounded-lg md:rounded-xl bg-slate-100 px-3 py-2 md:py-2.5 border border-transparent focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:bg-white transition-all">
                            <Search className={`h-4 w-4 text-slate-400 shrink-0 ${isSearching ? 'animate-spin text-emerald-500' : ''}`} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar socio..."
                                className="bg-transparent text-sm outline-none w-full text-slate-700 placeholder:text-slate-400 min-w-0"
                            />
                            {isSearching && <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />}
                        </div>

                        {/* Resultados Dropdown - Fixed en móvil para mejor UX */}
                        {showResults && searchResults.length > 0 && (
                            <div className="fixed md:absolute top-14 md:top-12 left-2 right-2 md:left-0 md:right-auto md:w-full bg-white rounded-xl shadow-2xl border border-slate-200 max-h-[70vh] md:max-h-96 overflow-y-auto z-[60] animate-in fade-in slide-in-from-top-2">
                                <div className="p-2">
                                    <p className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Resultados ({searchResults.length})</p>
                                    {searchResults.map((item: any) => (
                                        <button
                                            key={item.idSocio || item.id || Math.random()}
                                            onClick={() => handleSelectMember(item)}
                                            className="w-full text-left px-3 py-3 hover:bg-emerald-50 active:bg-emerald-100 rounded-lg group transition-colors flex items-center gap-3"
                                        >
                                            <div className="h-10 w-10 md:h-8 md:w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm md:text-xs shrink-0">
                                                {item.nombreCompleto?.charAt(0) || "?"}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-slate-800 truncate">{item.nombreCompleto}</p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    CI: {item.cedula || item.username} {item.nroSocio && `• #${item.nroSocio}`}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {showResults && searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
                            <div className="fixed md:absolute top-14 md:top-12 left-2 right-2 md:left-0 md:right-auto md:w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-4 text-center z-[60]">
                                <p className="text-sm text-slate-500">No se encontraron resultados</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Centro - Fecha y hora y countdown */}
                <div className="hidden lg:flex items-center gap-6">
                    <div className="flex items-center gap-3 text-slate-500 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                        <Calendar className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium capitalize">{currentDate}</span>
                        <div className="h-4 w-px bg-slate-200" />
                        <span className="text-sm font-bold text-emerald-500 tabular-nums">{currentTime}</span>
                    </div>

                    {daysUntil !== null && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-500 rounded-2xl shadow-lg shadow-emerald-200/50 animate-pulse transition-all">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest leading-none">Días para Asamblea</span>
                                <span className="text-lg font-black text-white leading-none mt-1">{daysUntil} {daysUntil === 1 ? 'DÍA' : 'DÍAS'}</span>
                            </div>
                        </div>
                    )}

                    {/* Estadísticas de Usuarios - Solo visible para Super Admin */}
                    {user?.rol === 'SUPER_ADMIN' && (
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                            {/* Total de Usuarios */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl" title="Total de usuarios registrados">
                                <Users className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-black text-slate-700">{userStats.total}</span>
                            </div>

                            <div className="h-6 w-px bg-slate-200" />

                            {/* Usuarios Usuales */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl" title="Usuarios que han iniciado sesión alguna vez">
                                <UserCheck className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-black text-blue-600">{userStats.usuales}</span>
                            </div>

                            <div className="h-6 w-px bg-slate-200" />

                            {/* Usuarios Activos en Tiempo Real */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl" title="Usuarios activos en este momento">
                                <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                                <span className="text-sm font-black text-emerald-600">{userStats.activos}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Derecha - Usuario y notificaciones */}
                <div className="flex items-center gap-1 md:gap-3 shrink-0">
                    {/* Botón Ayuda - Manual de Usuario (oculto en móvil muy pequeño) */}
                    <button
                        onClick={() => setIsHelpOpen(true)}
                        className="hidden sm:flex p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Manual de Usuario"
                    >
                        <HelpCircle className="h-5 w-5 md:h-6 md:w-6" />
                    </button>

                    {/* Notificaciones */}
                    <AvisosBell />

                    <div className="h-6 w-px bg-slate-200 hidden md:block" />

                    {/* Perfil de usuario con Dropdown */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors outline-none focus:ring-2 focus:ring-emerald-100"
                        >
                            <div className="text-right hidden lg:block">
                                <p className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{user?.nombreCompleto || "..."}</p>
                                <p className="text-xs text-emerald-500 font-medium">{user?.rol || "Usuario"}</p>
                            </div>
                            <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200/50 ring-2 ring-white">
                                {user?.fotoPerfil ? (
                                    <img
                                        src={user.fotoPerfil}
                                        alt="Perfil"
                                        className="h-full w-full object-cover rounded-xl"
                                    />
                                ) : (
                                    <User className="h-4 w-4 md:h-5 md:w-5 text-white" />
                                )}
                            </div>
                        </button>

                        {/* Dropdown Menu Premium */}
                        {isUserMenuOpen && (
                            <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                                {/* Header del Dropdown */}
                                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-500 flex items-center justify-center shadow-md text-white font-bold text-xl">
                                        {user?.fotoPerfil ? (
                                            <img src={user.fotoPerfil} alt="" className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            user?.nombreCompleto?.charAt(0) || "U"
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-slate-800 truncate">{user?.nombreCompleto}</p>
                                        <p className="text-xs text-slate-500 truncate">{user?.username}</p>
                                    </div>
                                </div>

                                <div className="p-2 space-y-1">
                                    <button
                                        onClick={() => { setIsUserMenuOpen(false); window.location.href = '/configuracion'; }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-emerald-500 hover:bg-emerald-50 transition-colors group"
                                    >
                                        <UserCircle className="h-5 w-5 text-slate-400 group-hover:text-emerald-500" />
                                        Mi Perfil
                                    </button>
                                    <button
                                        onClick={() => { setIsUserMenuOpen(false); window.location.href = '/mensajes/chat'; }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-emerald-500 hover:bg-emerald-50 transition-colors group"
                                    >
                                        <Mail className="h-5 w-5 text-slate-400 group-hover:text-emerald-500" />
                                        Ver Mensajes
                                    </button>
                                    <button
                                        onClick={() => { setIsUserMenuOpen(false); window.location.href = '/configuracion'; }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-emerald-500 hover:bg-emerald-50 transition-colors group"
                                    >
                                        <Settings className="h-5 w-5 text-slate-400 group-hover:text-emerald-500" />
                                        Configuración
                                    </button>
                                </div>

                                <div className="p-2 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem("token");
                                            localStorage.removeItem("user");
                                            window.location.href = "/login";
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors group"
                                    >
                                        <LogOut className="h-5 w-5 text-red-400 group-hover:text-red-500" />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* MODAL DETALLE DE SOCIO - RESPONSIVE Y CENTRADO */}
            {selectedMember && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedMember(null)}
                    />

                    {/* Lógica de colores dinámica - Basada en estado de aportes */}
                    {(() => {
                        // Determinar si tiene Voz y Voto basándose en los aportes
                        const tieneVozVoto = selectedMember.vozVoto === true ||
                            (selectedMember.aporteAlDia && selectedMember.solidaridadAlDia &&
                                selectedMember.fondoAlDia && selectedMember.incoopAlDia && selectedMember.creditoAlDia);

                        const esAdmin = selectedMember.tipo === 'ADMIN' || (!selectedMember.nroSocio && !selectedMember.idSocio);

                        // Esquemas de colores: VERDE = Voz y Voto, AMARILLO = Solo Voz, AZUL = Admin
                        const theme = esAdmin
                            ? { // Admin (Azul)
                                headerGradient: "from-blue-500 via-indigo-500 to-blue-600",
                                ringColor: "ring-blue-500",
                                badgeText: "text-blue-700",
                            }
                            : tieneVozVoto
                                ? { // VOZ Y VOTO (VERDE)
                                    headerGradient: "from-emerald-500 via-green-500 to-emerald-600",
                                    ringColor: "ring-emerald-500",
                                    badgeText: "text-emerald-700",
                                }
                                : { // SOLO VOZ (AMARILLO)
                                    headerGradient: "from-amber-400 via-yellow-400 to-amber-500",
                                    ringColor: "ring-amber-400",
                                    badgeText: "text-amber-700",
                                };

                        return (
                            <div className="relative w-full max-w-[calc(100%-32px)] sm:max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">

                                {/* Header con color dinámico */}
                                <div className={`relative h-24 bg-gradient-to-br ${theme.headerGradient} flex items-center justify-center shrink-0`}>
                                    <button
                                        onClick={() => setSelectedMember(null)}
                                        className="absolute top-3 right-3 z-20 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>

                                    {/* Avatar superpuesto */}
                                    <div className={`absolute -bottom-8 z-10 h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white p-1 shadow-lg ring-4 ring-offset-2 ${theme.ringColor} ring-offset-white`}>
                                        <div className="h-full w-full bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                            <span className={`text-2xl sm:text-4xl font-black ${theme.badgeText} uppercase`}>
                                                {selectedMember.nombreCompleto?.charAt(0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>


                                {/* Contenido Compacto */}
                                <div className="pt-8 sm:pt-10 pb-6 px-4 text-center space-y-3 overflow-y-auto">

                                    {/* Info Principal */}
                                    <div>
                                        <h2 className="text-base sm:text-lg font-black text-slate-800 leading-tight uppercase line-clamp-2">
                                            {selectedMember.nombreCompleto}
                                        </h2>
                                        <p className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${theme.badgeText}`}>
                                            {selectedMember.rolNombre || "Socio Cooperativa"}
                                        </p>
                                    </div>

                                    {/* Datos - Grid Compacta */}
                                    <div className="flex gap-2 justify-center">
                                        <div className="flex-1 bg-slate-50 py-2 px-2 rounded-xl border border-slate-200">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Cédula</p>
                                            <p className="text-xs sm:text-sm font-black text-slate-700">{selectedMember.cedula || "---"}</p>
                                        </div>
                                        <div className="flex-1 bg-slate-50 py-2 px-2 rounded-xl border border-slate-200">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Nro. Socio</p>
                                            <p className="text-xs sm:text-sm font-black text-slate-700">#{selectedMember.nroSocio || "---"}</p>
                                        </div>
                                    </div>

                                    {/* Aportes Compacto - Solo si es socio */}
                                    {!esAdmin && (selectedMember.idSocio || selectedMember.nroSocio) && (
                                        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                                            <div className="grid grid-cols-5 gap-1">
                                                {[
                                                    { label: "Aporte", val: selectedMember.aporteAlDia },
                                                    { label: "Solid.", val: selectedMember.solidaridadAlDia },
                                                    { label: "Fondo", val: selectedMember.fondoAlDia },
                                                    { label: "INCOOP", val: selectedMember.incoopAlDia },
                                                    { label: "Créd.", val: selectedMember.creditoAlDia },
                                                ].map((item, idx) => (
                                                    <div key={idx} className={`flex flex-col items-center justify-center py-1.5 rounded-lg border ${item.val
                                                        ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700'
                                                        : 'bg-red-50 border-red-100 text-red-600'
                                                        }`}>
                                                        {item.val
                                                            ? <Check className="h-3 w-3 mb-0.5" strokeWidth={4} />
                                                            : <X className="h-3 w-3 mb-0.5" strokeWidth={4} />
                                                        }
                                                        <span className="text-[8px] font-black uppercase text-center leading-none">{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Estado Final (Voz/Voto) Banner */}
                                    {!esAdmin ? (
                                        tieneVozVoto ? (
                                            <div className="bg-gradient-to-r from-emerald-100 to-green-100 border-2 border-green-400 rounded-xl py-3 shadow-sm">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg sm:text-xl font-black text-green-700 tracking-tighter leading-none">VOZ Y VOTO</span>
                                                    <span className="text-[9px] font-bold text-green-800 uppercase mt-0.5">Habilitado</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-amber-400 rounded-xl py-3 shadow-sm">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg sm:text-xl font-black text-amber-700 tracking-tighter leading-none">SOLO VOZ</span>
                                                    <span className="text-[9px] font-bold text-amber-800 uppercase mt-0.5">Sin Voto</span>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl py-3">
                                            <span className="font-bold text-blue-700 uppercase tracking-wide text-xs">PERSONAL ADMINISTRATIVO</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    <style jsx global>{`
                        @keyframes shimmer {
                            100% { transform: translateX(100%); }
                        }
                    `}</style>
                </div>
            )}
            {/* MODAL MANUAL DE USUARIO */}
            <ManualUsuarioModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

            {/* MODAL ONBOARDING */}
            {/* <WelcomeModal user={user} onUpdateUser={setUser} /> MOVED TO LAYOUT */}
        </>
    );
}

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
    Upload,
    HelpCircle,
    RotateCcw,
    Hammer,
    Bell
} from "lucide-react";
import axios from "axios";
import { useEffect, useCallback } from "react";
import { useConfig } from "@/context/ConfigContext";
import Swal from 'sweetalert2';
import { useTour } from "@/components/tour";
import { configuracionTour } from "@/components/tour/tourSteps";
import { useRouter } from "next/navigation";

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

const ConfiguracionMantenimiento = () => {
    const { isMaintenanceMode, updateConfig } = useConfig();
    const [enabled, setEnabled] = useState(isMaintenanceMode);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setEnabled(isMaintenanceMode);
    }, [isMaintenanceMode]);

    const handleToggle = async () => {
        const newValue = !enabled;
        setSaving(true);
        try {
            await updateConfig("MODO_MANTENIMIENTO", newValue ? "true" : "false");
            setEnabled(newValue);

            Swal.fire({
                title: newValue ? '¡Modo Mantenimiento ACTIVADO!' : '¡Modo Mantenimiento DESACTIVADO!',
                text: newValue
                    ? 'El sistema ha sido bloqueado para todos los usuarios excepto Super Administradores.'
                    : 'El sistema ya está disponible nuevamente para todos los usuarios.',
                icon: newValue ? 'warning' : 'success',
                confirmButtonText: 'Entendido',
                confirmButtonColor: newValue ? '#f59e0b' : '#10b981',
                padding: '2em',
                customClass: {
                    popup: 'rounded-[2rem] shadow-2xl'
                }
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo actualizar el estado de mantenimiento',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 italic uppercase border-t border-slate-100 pt-6 mt-6">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Control de Acceso / Mantenimiento
            </h2>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${enabled ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <Hammer className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Modo Mantenimiento</h3>
                        <p className="text-sm text-slate-500 max-w-md">
                            Si activas esto, <strong>nadie podrá acceder al sistema</strong> excepto los usuarios con rol de <strong>Super Admin</strong>.
                            Los demás verán una pantalla de "En Mantenimiento".
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={saving}
                    className={`relative inline-flex h-12 w-20 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 ${enabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                >
                    <span className="sr-only">Activar Mantenimiento</span>
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-11 w-11 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-8' : 'translate-x-0'}`}
                    >
                        {saving && <Loader2 className="h-6 w-6 m-2.5 animate-spin text-amber-500" />}
                    </span>
                </button>
            </div>
        </>
    );
};

// Componente para Notificaciones de Asignación
const ConfiguracionNotificaciones = () => {
    const { updateConfig } = useConfig();
    const [enabled, setEnabled] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Cargar estado actual de la configuración
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/configuracion", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Manejar diferentes formatos de respuesta
                const data = res.data;
                if (Array.isArray(data)) {
                    const config = data.find((c: any) => c.clave === "notificaciones_asignacion_activas");
                    if (config) {
                        setEnabled(config.valor !== "false");
                    }
                } else if (data && typeof data === 'object') {
                    // Si es un objeto, buscar directamente la clave
                    if (data.notificaciones_asignacion_activas !== undefined) {
                        setEnabled(data.notificaciones_asignacion_activas !== "false");
                    }
                }
            } catch (error) {
                console.error("Error cargando config de notificaciones:", error);
            } finally {
                setLoaded(true);
            }
        };
        fetchConfig();
    }, []);

    const handleToggle = async () => {
        const newValue = !enabled;
        setSaving(true);
        try {
            await updateConfig("notificaciones_asignacion_activas", newValue ? "true" : "false");
            setEnabled(newValue);

            Swal.fire({
                title: newValue ? '¡Notificaciones ACTIVADAS!' : '¡Notificaciones DESACTIVADAS!',
                text: newValue
                    ? 'Recibirás avisos cada vez que alguien asigne un socio a una lista.'
                    : 'Ya no recibirás notificaciones de asignación de socios.',
                icon: newValue ? 'success' : 'info',
                confirmButtonText: 'Entendido',
                confirmButtonColor: newValue ? '#10b981' : '#6b7280',
                padding: '2em',
                customClass: {
                    popup: 'rounded-[2rem] shadow-2xl'
                }
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo actualizar la configuración',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleTestNotification = async () => {
        // Verificar si el navegador soporta notificaciones
        if (!("Notification" in window)) {
            Swal.fire({
                title: 'No soportado',
                text: 'Tu navegador no soporta notificaciones del sistema.',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        // Pedir permiso si no lo tenemos
        if (Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                Swal.fire({
                    title: 'Permiso denegado',
                    text: 'Debes permitir las notificaciones para recibir alertas del sistema.',
                    icon: 'warning',
                    confirmButtonColor: '#f59e0b'
                });
                return;
            }
        }

        if (Notification.permission === "denied") {
            Swal.fire({
                title: 'Notificaciones bloqueadas',
                html: 'Las notificaciones están bloqueadas. Para activarlas:<br><br>1. Haz clic en el candado 🔒 en la barra de direcciones<br>2. Busca "Notificaciones"<br>3. Cambia a "Permitir"',
                icon: 'warning',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        // Mostrar toast pequeño primero
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });

        Toast.fire({
            icon: 'info',
            title: 'Enviando notificación de prueba...'
        });

        // Esperar un momento para que el toast no tape la notificación
        setTimeout(() => {
            // ¡Mostrar notificación nativa de Windows!
            try {
                const notification = new Notification("🔔 Nueva Asignación de Socio", {
                    body: "Juan Operador asignó al socio #12345 (María García) a la lista 'Lista Principal'",
                    icon: "/logo.png",
                    tag: "test-notification-" + Date.now(),
                    requireInteraction: false
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                // Mostrar toast de éxito después
                setTimeout(() => {
                    Toast.fire({
                        icon: 'success',
                        title: '¡Notificación enviada! Mira la esquina de tu pantalla'
                    });
                }, 500);
            } catch (error) {
                console.error("Error creando notificación:", error);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo crear la notificación: ' + error,
                    icon: 'error'
                });
            }
        }, 300);

        // También intentar enviar push real desde el backend
        try {
            const token = localStorage.getItem("token");
            await axios.post("/api/push/send-test", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            // Silently fail
        }
    };

    if (!loaded) return null;

    return (
        <>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 italic uppercase border-t border-slate-100 pt-6 mt-6">
                <Bell className="h-5 w-5 text-blue-500" />
                Notificaciones de Asignación
            </h2>

            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl transition-colors ${enabled ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <Bell className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Avisar Asignaciones</h3>
                            <p className="text-sm text-slate-500 max-w-md">
                                Cuando está activo, recibirás una <strong>notificación</strong> cada vez que un usuario asigne un socio a su lista.
                                Aparecerá en el centro de avisos y como notificación push si está habilitada.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleToggle}
                        disabled={saving}
                        className={`relative inline-flex h-12 w-20 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${enabled ? 'bg-blue-500' : 'bg-slate-300'}`}
                    >
                        <span className="sr-only">Activar Notificaciones</span>
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-11 w-11 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-8' : 'translate-x-0'}`}
                        >
                            {saving && <Loader2 className="h-6 w-6 m-2.5 animate-spin text-blue-500" />}
                        </span>
                    </button>
                </div>

                {/* Botón de prueba */}
                <div className="flex justify-end pt-2 border-t border-blue-100">
                    <button
                        onClick={handleTestNotification}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                        <Bell className="h-4 w-4" />
                        Probar Notificación
                    </button>
                </div>
            </div>
        </>
    );
};

// Componente para Modo de Prueba (Test Mode)
const ConfiguracionModoPrueba = () => {
    const { isTestMode, testModeInfo, activateTestMode, deactivateTestMode } = useConfig();
    const [saving, setSaving] = useState(false);

    const handleActivate = async () => {
        const result = await Swal.fire({
            title: '¿Activar Modo de Prueba?',
            html: `
                <div class="text-left space-y-3">
                    <p class="text-slate-600">Se creará una <strong>copia de seguridad</strong> de todos los datos actuales:</p>
                    <ul class="text-sm text-slate-500 list-disc list-inside space-y-1">
                        <li>Padrón de Socios</li>
                        <li>Asignaciones a Listas</li>
                        <li>Registros de Asistencia</li>
                        <li>Usuarios del Sistema</li>
                    </ul>
                    <p class="text-violet-600 font-bold mt-4">🧪 Podrás usar el sistema normalmente. Los cambios NO serán permanentes.</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#8b5cf6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, Activar Modo Prueba',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        setSaving(true);
        const response = await activateTestMode();
        setSaving(false);

        if (response.success) {
            Swal.fire({
                title: '🧪 Modo de Prueba ACTIVADO',
                text: response.message || 'Ahora puedes usar el sistema libremente. Al desactivar, todo volverá a como estaba.',
                icon: 'success',
                confirmButtonColor: '#8b5cf6'
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: response.error || 'No se pudo activar el modo de prueba',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    const handleDeactivate = async () => {
        const result = await Swal.fire({
            title: '⚠️ ¿Desactivar Modo de Prueba?',
            html: `
                <div class="text-left space-y-3">
                    <p class="text-red-600 font-bold">ADVERTENCIA: Se perderán TODOS los cambios realizados durante la prueba:</p>
                    <ul class="text-sm text-slate-500 list-disc list-inside space-y-1">
                        <li>Nuevos socios importados</li>
                        <li>Asignaciones realizadas</li>
                        <li>Asistencias marcadas</li>
                        <li>Usuarios creados</li>
                    </ul>
                    <p class="text-emerald-500 font-bold mt-4">✅ Los datos originales serán restaurados.</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, Restaurar Datos Originales',
            cancelButtonText: 'Seguir en Modo Prueba'
        });

        if (!result.isConfirmed) return;

        setSaving(true);
        const response = await deactivateTestMode();
        setSaving(false);

        if (response.success) {
            Swal.fire({
                title: '✅ Datos Restaurados',
                text: response.message || 'El sistema ha vuelto a su estado original.',
                icon: 'success',
                confirmButtonColor: '#10b981'
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: response.error || 'No se pudieron restaurar los datos',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    return (
        <>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 italic uppercase border-t border-slate-100 pt-6 mt-6">
                <Database className="h-5 w-5 text-violet-500" />
                Modo de Prueba / Sandbox
            </h2>

            <div className={`rounded-2xl p-6 border flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${isTestMode ? 'bg-violet-100 border-violet-300' : 'bg-violet-50 border-violet-100'}`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${isTestMode ? 'bg-violet-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                        <Database className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            Modo de Prueba
                            {isTestMode && <span className="px-2 py-0.5 bg-violet-600 text-white text-[10px] font-black uppercase rounded-full animate-pulse">ACTIVO</span>}
                        </h3>
                        <p className="text-sm text-slate-500 max-w-md">
                            {isTestMode ? (
                                <>
                                    <strong className="text-violet-700">Los cambios NO son permanentes.</strong> Al desactivar, todo volverá a como estaba antes.
                                    {testModeInfo?.activatedBy && (
                                        <span className="block mt-1 text-xs text-violet-600">
                                            Activado por: {testModeInfo.activatedBy}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    Activa para probar el sistema sin afectar los datos reales. Se creará una copia de seguridad automática.
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <button
                    onClick={isTestMode ? handleDeactivate : handleActivate}
                    disabled={saving}
                    className={`relative inline-flex h-12 w-20 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 ${isTestMode ? 'bg-violet-600' : 'bg-slate-300'}`}
                >
                    <span className="sr-only">Activar Modo Prueba</span>
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-11 w-11 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isTestMode ? 'translate-x-8' : 'translate-x-0'}`}
                    >
                        {saving && <Loader2 className="h-6 w-6 m-2.5 animate-spin text-violet-600" />}
                    </span>
                </button>
            </div>
        </>
    );
};

// Subcomponente para Opciones de Reset
const ResetOptionsPanel = ({ isAdminMode, accessCode, setAccessCode, checkAccess, setIsAdminMode, loading, handleReset }: any) => {
    const [options, setOptions] = useState({
        socios: true,
        asignaciones: true,
        listas: true,
        usuarios: true,
        asistencias: true,
        importaciones: true
    });

    // Validar dependencias visualmente
    useEffect(() => {
        const newOptions = { ...options };
        // Si borras listas, borras asignaciones
        if (newOptions.listas && !newOptions.asignaciones) setOptions(prev => ({ ...prev, asignaciones: true }));
    }, [options.listas]);

    const toggleOption = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const onResetClick = () => {
        handleReset(options);
    };

    return (
        <div className="rounded-2xl border-2 border-red-100 bg-gradient-to-br from-red-50/50 to-orange-50/30 p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-3 text-red-700 relative">
                <div className="p-2 bg-red-100 rounded-xl">
                    <ShieldAlert className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">Zona de Peligro / Reset</h2>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-lg relative">
                {!isAdminMode ? (
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-amber-100 p-3 rounded-xl">
                                <Key className="h-6 w-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 text-lg">Acceso Protegido</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Ingresa el código maestro de administrador para desbloquear las opciones de limpieza.
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-5 flex gap-3">
                            <input
                                type="password"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && checkAccess()}
                                placeholder="••••••"
                                className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-lg font-mono tracking-[0.5em] outline-none focus:border-amber-500 transition-all"
                                maxLength={6}
                            />
                            <button
                                onClick={checkAccess}
                                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all"
                            >
                                Desbloquear
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center">
                            <span className="text-sm font-bold text-teal-500 flex items-center gap-2">
                                <Check className="h-4 w-4" /> Modo Administrador
                            </span>
                            <button onClick={() => setIsAdminMode(false)} className="text-xs text-emerald-500 font-bold hover:underline">Bloquear</button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Selecciona qué datos eliminar:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { key: "socios", label: "Padrón de Socios", desc: "Borra todos los socios (CUIDADO)" },
                                    { key: "asignaciones", label: "Asignaciones", desc: "Borra las distribuciones de socios en listas" },
                                    { key: "listas", label: "Listas Creadas", desc: "Borra las listas vacías o llenas de los operadores" },
                                    { key: "usuarios", label: "Cuentas de Operadores", desc: "Borra los usuarios (Login)" },
                                    { key: "asistencias", label: "Control de Asistencia", desc: "Borra registros de check-in" },
                                    { key: "importaciones", label: "Historial de Importación", desc: "Limpia el log de importaciones" },
                                ].map((opt) => (
                                    <label key={opt.key} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${(options as any)[opt.key] ? 'border-red-200 bg-red-50/50' : 'border-slate-100 hover:border-slate-200'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            checked={(options as any)[opt.key]}
                                            onChange={() => toggleOption(opt.key as any)}
                                            className="mt-1 w-4 h-4 accent-red-600"
                                        />
                                        <div>
                                            <span className="block font-bold text-slate-800 text-sm">{opt.label}</span>
                                            <span className="block text-[10px] text-slate-500 leading-tight">{opt.desc}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={onResetClick}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Trash2 />}
                            EJECUTAR LIMPIEZA SELECCIONADA
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ConfiguracionPage() {
    const [user, setUser] = useState<any>(null);
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    // Tour hook
    const { resetAllTours, startTour, hasSeenTour } = useTour();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!hasSeenTour('configuracion')) {
                startTour(configuracionTour, 'configuracion');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [hasSeenTour, startTour]);

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

    // Logout all sessions
    const [closingSessions, setClosingSessions] = useState(false);
    const router = useRouter();

    // Handler para reiniciar guía
    const handleResetTour = () => {
        resetAllTours();
        Swal.fire({
            title: '¡Guía Reiniciada!',
            text: 'La próxima vez que entres al Dashboard verás el tutorial de nuevo.',
            icon: 'success',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#10b981',
            padding: '2em',
            customClass: {
                popup: 'rounded-[2rem] shadow-2xl'
            }
        });
    };

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
            await axios.put(`/api/usuarios/${user.id}`, {
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
            await axios.post("/api/usuarios/cambiar-password-actual", {
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

    const handleLogoutAllSessions = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar Todas las Sesiones?',
            text: 'Esto invalidará todos los tokens activos. Tendrás que volver a iniciar sesión.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, Cerrar Todas',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        setClosingSessions(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post("/api/auth/logout-all-sessions", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                title: '¡Sesiones Cerradas!',
                text: 'Todas tus sesiones han sido invalidadas. Serás redirigido al login.',
                icon: 'success',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#10b981'
            }).then(() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/login");
            });
        } catch (error: any) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.error || 'No se pudieron cerrar las sesiones',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setClosingSessions(false);
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
            const response = await axios.post(`/api/socios/reset-${type}`, {}, {
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
    const handleSimpleReset = async (options: any = {}) => {
        setLoading(true);
        setMessage(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No hay sesión activa. Recarga la página.");

            // Usar el endpoint oficial que borra todo con opciones
            const response = await axios.post("/api/socios/reset-padron", options, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Reset response:", response.data);
            setMessage({
                type: "success",
                text: `¡Limpieza completada! ${response.data.message}`
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
            const response = await axios.get(`/api/socios/buscar?term=${query}`, {
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
            await axios.patch(`/api/socios/${socioId}/estado`,
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
        <div className="max-w-4xl space-y-8 pb-20 mt-2 md:mt-0">
            <div data-tour="config-header">
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
                                <UserCircle2 className="h-12 w-12 text-emerald-500" />
                            )}
                        </div>
                        <label className="absolute bottom-4 right-0 p-1.5 bg-slate-800 rounded-full text-white cursor-pointer hover:bg-black transition-colors shadow-lg">
                            <Camera className="h-3 w-3" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleFotoUpload} />
                        </label>
                    </div>
                    <h2 className="font-bold text-slate-800 line-clamp-1">{user?.nombreCompleto}</h2>
                    <p className="text-xs text-slate-400 font-medium mb-4">@{user?.username}</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <UserCircle2 className="h-3 w-3" />
                        ROL: {user?.rol}
                    </div>
                </div>

                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2" data-tour="config-profile">
                        <Key className="h-4 w-4 text-emerald-500" />
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
                            <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-teal-500' : 'bg-red-50 text-red-700'}`}>
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
                            className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-500 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {savingPass ? "Guardando..." : "Actualizar Contraseña"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Sección Guía de Principiante */}
            <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-200">
                            <HelpCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Guía de Principiante</h2>
                            <p className="text-sm text-slate-500">
                                ¿Necesitas ver el tutorial de nuevo? Reinícialo aquí.
                            </p>
                        </div>
                    </div>
                    <button
                        data-tour="config-guide"
                        onClick={handleResetTour}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold text-sm hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-200"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reiniciar Guía
                    </button>
                </div>
            </div>

            {/* Sección Cerrar Todas las Sesiones */}
            <div className="rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 p-6 border border-red-100 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg shadow-red-200">
                            <ShieldAlert className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Seguridad de la Cuenta</h2>
                            <p className="text-sm text-slate-500">
                                Si sospechas que alguien accedió a tu cuenta, cierra todas las sesiones.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogoutAllSessions}
                        disabled={closingSessions}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:from-red-600 hover:to-orange-600 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                    >
                        {closingSessions ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                        Cerrar Todas las Sesiones
                    </button>
                </div>
            </div>

            {!isSocio && (
                <>
                    <div className="h-px bg-slate-100 my-8"></div>


                    {/* Otras Configuraciones de Asamblea */}
                    <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 space-y-6">
                        <ConfiguracionEvento />
                        <ConfiguracionMantenimiento />
                        <ConfiguracionNotificaciones />
                        <ConfiguracionModoPrueba />
                    </div>


                    <ResetOptionsPanel isAdminMode={isAdminMode} accessCode={accessCode} setAccessCode={setAccessCode} checkAccess={checkAccess} setIsAdminMode={setIsAdminMode} loading={loading} handleReset={handleSimpleReset} />


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
                                        <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-200">
                                            <ShieldAlert className="h-7 w-7 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Modificador Maestro</h2>
                                            <p className="text-emerald-500 text-xs font-black uppercase tracking-widest">Control Total de Estados</p>
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
                                                                        <Check className="h-3 w-3 text-emerald-500" />
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


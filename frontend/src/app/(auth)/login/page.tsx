"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, RefreshCcw, Eye, EyeOff, ChevronRight, Users } from "lucide-react";
import axios from "axios";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // New state for password change
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await axios.post("/api/auth/login", {
                username,
                password,
            });

            const userData = response.data;
            localStorage.setItem("token", userData.token);
            localStorage.setItem("user", JSON.stringify(userData));

            if (userData.requiresPasswordChange) {
                setShowChangePassword(true);
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError("Usuario o contraseña incorrectos");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 4) {
            setError("La contraseña debe tener al menos 4 caracteres");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            await axios.post("/api/auth/change-password",
                { password: newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update user in local storage to remove flag
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                user.requiresPasswordChange = false;
                localStorage.setItem("user", JSON.stringify(user));
            }

            router.push("/dashboard");
        } catch (err: any) {
            setError("Error al cambiar contraseña: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (showChangePassword) {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-50 to-amber-50 px-3 py-4 sm:p-4 md:p-6">
                <main className="relative z-10 w-full max-w-md animate-fade-in shadow-2xl">
                    <div className="overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl border border-white/50 p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-black text-slate-800 mb-2">Cambio Requerido</h1>
                            <p className="text-slate-500 font-medium text-sm">Por seguridad, debes cambiar tu contraseña inicial</p>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="new-password" className="text-xs font-black text-slate-400 uppercase tracking-widest">Nueva Contraseña</label>
                                <input
                                    id="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-3 px-4 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                                    placeholder="Nueva contraseña"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirm-password" className="text-xs font-black text-slate-400 uppercase tracking-widest">Confirmar Contraseña</label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-3 px-4 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                                    placeholder="Confirmar contraseña"
                                />
                            </div>

                            {error && (
                                <div role="alert" className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 border-2 border-red-100 animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-500 py-4 font-black text-white shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? "ACTUALIZANDO..." : "CAMBIAR Y CONTINUAR"}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-50 to-amber-50 px-3 py-4 sm:p-4 md:p-6">
            {/* Formas orgánicas decorativas de fondo */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -left-20 -top-20 h-[250px] w-[200px] sm:h-[350px] sm:w-[280px] md:h-[500px] md:w-[400px] rounded-[40%_60%_70%_30%/60%_30%_70%_40%] bg-gradient-to-br from-emerald-400/30 via-emerald-400/20 to-emerald-300/30 blur-3xl animate-blob"></div>
                <div className="absolute -right-20 -bottom-20 h-[225px] w-[225px] sm:h-[320px] sm:w-[320px] md:h-[450px] md:w-[450px] rounded-[60%_40%_30%_70%/40%_70%_30%_60%] bg-gradient-to-tr from-emerald-400/30 via-emerald-300/20 to-green-400/30 blur-3xl animate-blob animation-delay-2000"></div>
                <div className="absolute left-1/2 top-1/2 h-[175px] w-[175px] sm:h-[250px] sm:w-[250px] md:h-[350px] md:w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-[70%_30%_50%_50%/30%_60%_40%_70%] bg-gradient-to-bl from-amber-300/20 via-emerald-300/20 to-emerald-400/20 blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {/* Card principal */}
            <main className="relative z-10 w-full max-w-5xl animate-fade-in shadow-2xl">
                <div className="overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[3rem] bg-white/95 backdrop-blur-xl border border-white/50">
                    <div className="grid md:grid-cols-2">
                        {/* Panel izquierdo - Branding (Oculto en móvil, Visible en PC) */}
                        <div className="hidden md:flex relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-500 p-12 flex-col justify-center items-center min-h-[600px]">
                            <div className="absolute -left-10 -top-10 h-[300px] w-[300px] rounded-[60%_40%_70%_30%/50%_60%_40%_50%] bg-emerald-500/30 blur-2xl" aria-hidden="true"></div>
                            <div className="absolute -right-10 bottom-0 h-[250px] w-[250px] rounded-[40%_60%_30%_70%/60%_40%_70%_30%] bg-emerald-400/30 blur-2xl" aria-hidden="true"></div>

                            <div className="relative z-10 text-center space-y-8">
                                <div className="flex justify-center">
                                    <div className="h-40 w-40 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl border-4 border-white/30 overflow-hidden relative">
                                        <Image
                                            src="/logo-cooperativa.webp"
                                            alt="Logo oficial de Cooperativa Reducto Ltda"
                                            width={144}
                                            height={144}
                                            priority
                                            className="object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-5xl font-black text-white tracking-tight leading-tight">
                                        Cooperativa<br />Reducto Ltda.
                                    </h2>
                                    <div className="h-1 w-24 mx-auto bg-white/40 rounded-full"></div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-emerald-50 text-3xl font-black tracking-widest">
                                        SIGA
                                    </p>
                                    <p className="text-emerald-100 text-lg font-bold">
                                        San Lorenzo Reducto - 2026
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Panel derecho - Formulario */}
                        <div className="flex flex-col min-h-auto">
                            {/* Header Mobile Premium */}
                            <div className="md:hidden relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-500 px-5 py-6 animation-fade-in shadow-lg">
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl border-4 border-white/30 overflow-hidden mb-3">
                                        <Image
                                            src="/logo-cooperativa.webp"
                                            alt="Logo oficial de Cooperativa Reducto Ltda"
                                            width={96}
                                            height={96}
                                            priority
                                            className="object-contain"
                                        />
                                    </div>
                                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                                        Cooperativa Reducto Ltda.
                                    </h1>
                                    <div className="h-0.5 w-16 mx-auto bg-white/40 rounded-full my-2"></div>
                                    <p className="text-emerald-50 text-lg sm:text-xl font-black tracking-widest uppercase">SIGA</p>
                                </div>
                            </div>

                            {/* Formulario */}
                            <div className="p-8 sm:p-10 md:p-12 flex-1 flex flex-col justify-center">
                                <section className="space-y-8">
                                    <div className="text-center md:text-left">
                                        <h3 className="hidden md:block text-2xl md:text-3xl font-black text-slate-800 mb-1">Iniciar Sesión</h3>
                                        <h2 className="md:hidden text-xl font-black text-slate-800 mb-1 text-center">ACCESO AL SISTEMA</h2>
                                        <p className="text-slate-500 font-medium text-sm md:text-base">Ingresa tus credenciales para continuar</p>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-6">
                                        <div className="space-y-2">
                                            <label htmlFor="username" className="text-xs font-black text-slate-400 uppercase tracking-widest">Usuario</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <input
                                                    id="username"
                                                    type="text"
                                                    autoComplete="username"
                                                    required
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-4 pl-12 pr-4 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold"
                                                    placeholder="Usuario del sistema"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="password" className="text-xs font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                                    <Lock className="h-5 w-5" />
                                                </div>
                                                <input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    autoComplete="current-password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-4 pl-12 pr-12 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold"
                                                    placeholder="Tu contraseña"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        {error && (
                                            <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 border-2 border-red-100 animate-shake">
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="group w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-500 py-4 sm:py-5 font-black text-white shadow-xl shadow-emerald-200 hover:shadow-2xl hover:shadow-emerald-300 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden"
                                        >
                                            <span className="relative flex items-center gap-3">
                                                {loading ? (
                                                    <>
                                                        <RefreshCcw className="h-5 w-5 animate-spin" />
                                                        <span>INGRESANDO...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>INGRESAR AL SISTEMA</span>
                                                        <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </span>
                                        </button>
                                    </form>

                                    <footer className="pt-6 border-t border-slate-100 flex flex-col items-center gap-1">
                                        <p className="text-center text-[10px] md:text-xs text-slate-600 font-bold uppercase tracking-widest">
                                            SIGA - Gestión Integral de Asambleas
                                        </p>
                                        <p className="text-center text-[8px] md:text-[10px] text-slate-400 font-semibold tracking-wide">
                                            &copy; 2026 Avanzantec Group SRL
                                        </p>
                                    </footer>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <style jsx global>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -20px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(-10px, -10px) scale(1.05); }
                }
                
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                
                .animate-blob {
                    animation: blob 15s ease-in-out infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                }
                
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
}

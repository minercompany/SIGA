"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, RefreshCcw, Eye, EyeOff, ChevronRight, Sparkles, Shield, Fingerprint } from "lucide-react";
import axios from "axios";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();

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

    // ========================================================================
    // PANTALLA DE CAMBIO DE CONTRASEÑA
    // ========================================================================
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
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nueva Contraseña</label>
                                <input
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
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Confirmar Contraseña</label>
                                <input
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
                                <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 border-2 border-red-100 animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 font-black text-white shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? "ACTUALIZANDO..." : "CAMBIAR Y CONTINUAR"}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

    // ========================================================================
    // PANTALLA DE LOGIN PRINCIPAL
    // ========================================================================
    return (
        <>
            {/* ============================================================ */}
            {/* VERSIÓN MÓVIL - DISEÑO PREMIUM DARK (Solo visible en móvil) */}
            {/* ============================================================ */}
            <div className="md:hidden relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-slate-950">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/50 to-slate-950" />

                {/* Glowing Orbs */}
                <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-emerald-500/20 rounded-full blur-[80px] animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] bg-teal-500/15 rounded-full blur-[80px] animate-pulse-slow animation-delay-2000" />

                {/* Main Container */}
                <main className="relative z-10 w-full px-4 py-6 animate-fade-in">

                    {/* Premium Glass Card */}
                    <div className="overflow-hidden rounded-[2rem] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50">

                        {/* Header - Brand */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8">
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                {/* Logo */}
                                <div className="relative mb-4">
                                    <div className="absolute inset-0 bg-white/30 rounded-full blur-xl scale-150" />
                                    <div className="relative h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border-2 border-white/30 overflow-hidden">
                                        <Image
                                            src="/logo-cooperativa.webp"
                                            alt="Logo Cooperativa Reducto"
                                            width={70}
                                            height={70}
                                            priority
                                            className="object-contain"
                                        />
                                    </div>
                                </div>

                                <h1 className="text-xl font-black text-white tracking-tight leading-tight mb-1">
                                    Cooperativa Reducto
                                </h1>

                                <div className="flex items-center gap-2 my-2">
                                    <div className="h-px w-8 bg-white/40" />
                                    <Sparkles className="h-3 w-3 text-white/80" />
                                    <div className="h-px w-8 bg-white/40" />
                                </div>

                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20">
                                    <span className="text-sm font-black text-white tracking-[0.2em]">SIGA</span>
                                    <span className="text-xs text-emerald-100">2026</span>
                                </div>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="p-6">
                            <div className="text-center mb-5">
                                <h2 className="text-lg font-bold text-white mb-1">Bienvenido</h2>
                                <p className="text-sm text-slate-400">Ingresa tus credenciales</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                {/* Username */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usuario</label>
                                    <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'username' ? 'ring-2 ring-emerald-500/50' : ''}`}>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <Fingerprint className={`h-5 w-5 transition-colors ${focusedField === 'username' ? 'text-emerald-400' : 'text-slate-500'}`} />
                                        </div>
                                        <input
                                            type="text"
                                            autoComplete="username"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            onFocus={() => setFocusedField('username')}
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all font-medium placeholder:text-slate-600"
                                            placeholder="Tu usuario o cédula"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contraseña</label>
                                    <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-emerald-500/50' : ''}`}>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <Lock className={`h-5 w-5 transition-colors ${focusedField === 'password' ? 'text-emerald-400' : 'text-slate-500'}`} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-12 text-white outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all font-medium placeholder:text-slate-600"
                                            placeholder="Tu contraseña"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors p-1"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm font-bold text-red-400 animate-shake flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                        {error}
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-4 font-black text-white shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                                >
                                    <span className="relative flex items-center justify-center gap-2">
                                        {loading ? (
                                            <>
                                                <RefreshCcw className="h-5 w-5 animate-spin" />
                                                <span>INGRESANDO...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="tracking-wide">INGRESAR</span>
                                                <ChevronRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </form>

                            {/* Footer */}
                            <footer className="mt-6 pt-4 border-t border-white/5 text-center">
                                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">
                                    © 2026 Avanzantec Group SRL
                                </p>
                            </footer>
                        </div>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-4 flex justify-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Conexión segura</span>
                        </div>
                    </div>
                </main>
            </div>

            {/* ============================================================ */}
            {/* VERSIÓN DESKTOP - DISEÑO ORIGINAL (Solo visible en PC) */}
            {/* ============================================================ */}
            <div className="hidden md:flex relative min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-50 to-amber-50 p-6">
                {/* Formas decorativas de fondo */}
                <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                    <div className="absolute -left-20 -top-20 h-[500px] w-[400px] rounded-[40%_60%_70%_30%/60%_30%_70%_40%] bg-gradient-to-br from-emerald-400/30 via-emerald-400/20 to-emerald-300/30 blur-3xl animate-blob"></div>
                    <div className="absolute -right-20 -bottom-20 h-[450px] w-[450px] rounded-[60%_40%_30%_70%/40%_70%_30%_60%] bg-gradient-to-tr from-emerald-400/30 via-emerald-300/20 to-green-400/30 blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-[70%_30%_50%_50%/30%_60%_40%_70%] bg-gradient-to-bl from-amber-300/20 via-emerald-300/20 to-emerald-400/20 blur-3xl animate-blob animation-delay-4000"></div>
                </div>

                {/* Card principal */}
                <main className="relative z-10 w-full max-w-5xl animate-fade-in shadow-2xl">
                    <div className="overflow-hidden rounded-[3rem] bg-white/95 backdrop-blur-xl border border-white/50">
                        <div className="grid md:grid-cols-2">
                            {/* Panel izquierdo - Branding */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600 p-12 flex flex-col justify-center items-center min-h-[600px]">
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
                                            San Lorenzo Reducto-2026
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Panel derecho - Formulario */}
                            <div className="flex flex-col">
                                <div className="p-12 flex-1 flex flex-col justify-center">
                                    <section className="space-y-8">
                                        <div className="text-left">
                                            <h3 className="text-3xl font-black text-slate-800 mb-1">Iniciar Sesión</h3>
                                            <p className="text-slate-500 font-medium">Ingresa tus credenciales para continuar</p>
                                        </div>

                                        <form onSubmit={handleLogin} className="space-y-6">
                                            <div className="space-y-2">
                                                <label htmlFor="username-desktop" className="text-xs font-black text-slate-400 uppercase tracking-widest">Usuario</label>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <input
                                                        id="username-desktop"
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
                                                <label htmlFor="password-desktop" className="text-xs font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                                        <Lock className="h-5 w-5" />
                                                    </div>
                                                    <input
                                                        id="password-desktop"
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
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 border-2 border-red-100 animate-shake">
                                                    {error}
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="group w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-5 font-black text-white shadow-xl shadow-emerald-200 hover:shadow-2xl hover:shadow-emerald-300 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                            >
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
                                            </button>
                                        </form>

                                        <footer className="pt-4 border-t border-slate-100 flex flex-col items-center gap-1">
                                            <p className="text-center text-xs text-slate-600 font-bold uppercase tracking-widest">
                                                SIGA - Gestión Integral de Asambleas
                                            </p>
                                            <p className="text-center text-[10px] text-slate-400 font-semibold">
                                                © 2026 Avanzantec Group SRL
                                            </p>
                                        </footer>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

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
                
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
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
                
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
            `}</style>
        </>
    );
}

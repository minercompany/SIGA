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
            <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-slate-950 p-4">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] -mt-60" />

                <main className="relative z-10 w-full max-w-md animate-fade-in">
                    <div className="overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8">
                        <div className="text-center mb-8">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-white mb-2">Cambio Requerido</h1>
                            <p className="text-slate-400 font-medium text-sm">Por seguridad, debes cambiar tu contraseña inicial</p>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 px-4 font-medium text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                    placeholder="Nueva contraseña"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 px-4 font-medium text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                    placeholder="Confirmar contraseña"
                                />
                            </div>

                            {error && (
                                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm font-bold text-red-400 animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-4 font-black text-white shadow-xl shadow-emerald-500/25 hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50"
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
        <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-slate-950">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/50 to-slate-950" />

            {/* Glowing Orbs */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse-slow animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px]" />

            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            />

            {/* Main Container */}
            <main className="relative z-10 w-full max-w-md px-4 py-6 sm:px-6 animate-fade-in">

                {/* Premium Glass Card */}
                <div className="overflow-hidden rounded-[2rem] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50">

                    {/* Header Section - Premium Brand */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8 sm:py-10">
                        {/* Decorative Elements */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl" />

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            {/* Logo Container with Glow */}
                            <div className="relative mb-4">
                                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl scale-150" />
                                <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border-2 border-white/30 overflow-hidden">
                                    <Image
                                        src="/logo-cooperativa.webp"
                                        alt="Logo Cooperativa Reducto"
                                        width={80}
                                        height={80}
                                        priority
                                        className="object-contain scale-90"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight mb-1">
                                Cooperativa Reducto
                            </h1>

                            {/* Separator */}
                            <div className="flex items-center gap-2 my-2">
                                <div className="h-px w-8 bg-white/40" />
                                <Sparkles className="h-3 w-3 text-white/80" />
                                <div className="h-px w-8 bg-white/40" />
                            </div>

                            {/* SIGA Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                                <span className="text-sm font-black text-white tracking-[0.2em]">SIGA</span>
                                <span className="text-xs text-emerald-100">2026</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="p-6 sm:p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Bienvenido</h2>
                            <p className="text-sm text-slate-400">Ingresa tus credenciales para continuar</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Username Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <User className="h-3 w-3" />
                                    Usuario
                                </label>
                                <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'username' ? 'ring-2 ring-emerald-500/50' : ''}`}>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Fingerprint className={`h-5 w-5 transition-colors ${focusedField === 'username' ? 'text-emerald-400' : ''}`} />
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

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Lock className="h-3 w-3" />
                                    Contraseña
                                </label>
                                <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-emerald-500/50' : ''}`}>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Lock className={`h-5 w-5 transition-colors ${focusedField === 'password' ? 'text-emerald-400' : ''}`} />
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

                            {/* Error Message */}
                            {error && (
                                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-bold text-red-400 animate-shake flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 py-4 font-black text-white shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
                            >
                                {/* Button Shimmer */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                <span className="relative flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <RefreshCcw className="h-5 w-5 animate-spin" />
                                            <span>INGRESANDO...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="tracking-wide">INGRESAR</span>
                                            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Footer */}
                        <footer className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-1">
                                Sistema de Gestión de Asambleas
                            </p>
                            <p className="text-[9px] text-slate-600">
                                © 2026 Avanzantec Group SRL
                            </p>
                        </footer>
                    </div>
                </div>

                {/* Floating Badge */}
                <div className="mt-4 flex justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Conexión segura</span>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                
                @keyframes shimmer {
                    100% { transform: translateX(200%); }
                }
                
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                }
                
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
                
                .animate-shimmer {
                    animation: shimmer 3s ease-in-out infinite;
                }
                
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
}

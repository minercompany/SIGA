"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, RefreshCcw, Eye, EyeOff, ChevronRight } from "lucide-react";
import axios from "axios";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await axios.post("/api/auth/login", {
                username,
                password,
            });

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data));

            router.push("/dashboard");
        } catch (err: any) {
            setError("Usuario o contraseña incorrectos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-teal-100 via-emerald-50 to-amber-50 p-4">
            {/* Formas orgánicas decorativas de fondo */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Blob izquierdo superior */}
                <div className="absolute -left-20 -top-20 h-[500px] w-[400px] rounded-[40%_60%_70%_30%/60%_30%_70%_40%] bg-gradient-to-br from-teal-400/30 via-emerald-400/20 to-teal-300/30 blur-3xl animate-blob"></div>

                {/* Blob derecho inferior */}
                <div className="absolute -right-20 -bottom-20 h-[450px] w-[450px] rounded-[60%_40%_30%_70%/40%_70%_30%_60%] bg-gradient-to-tr from-emerald-400/30 via-teal-300/20 to-green-400/30 blur-3xl animate-blob animation-delay-2000"></div>

                {/* Blob central */}
                <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-[70%_30%_50%_50%/30%_60%_40%_70%] bg-gradient-to-bl from-amber-300/20 via-emerald-300/20 to-teal-400/20 blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {/* Card principal */}
            <div className="relative z-10 w-full max-w-5xl animate-fade-in">
                <div className="overflow-hidden rounded-[3rem] bg-white/95 backdrop-blur-xl shadow-2xl border border-white/50">
                    <div className="grid md:grid-cols-2">
                        {/* Panel izquierdo - Branding (Oculto en móvil, Visible en PC) */}
                        <div className="hidden md:flex relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-12 flex-col justify-center items-center min-h-[600px]">
                            {/* Formas decorativas internas */}
                            <div className="absolute -left-10 -top-10 h-[300px] w-[300px] rounded-[60%_40%_70%_30%/50%_60%_40%_50%] bg-teal-500/30 blur-2xl"></div>
                            <div className="absolute -right-10 bottom-0 h-[250px] w-[250px] rounded-[40%_60%_30%_70%/60%_40%_70%_30%] bg-emerald-400/30 blur-2xl"></div>

                            <div className="relative z-10 text-center space-y-8">
                                {/* Logo grande */}
                                <div className="flex justify-center">
                                    <div className="h-40 w-40 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl border-4 border-white/30 overflow-hidden">
                                        <img src="/logo-cooperativa.png" alt="Cooperativa Reducto" className="h-36 w-36 object-contain" />
                                    </div>
                                </div>

                                {/* Nombre de la cooperativa */}
                                <div className="space-y-2">
                                    <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
                                        Cooperativa<br />Reducto Ltda.
                                    </h1>
                                    <div className="h-1 w-24 mx-auto bg-white/40 rounded-full"></div>
                                </div>

                                {/* Subtítulo del sistema */}
                                <div className="space-y-2">
                                    <p className="text-emerald-50 text-3xl font-black tracking-widest">
                                        SIGA
                                    </p>
                                    <p className="text-emerald-100 text-lg font-bold">
                                        San Lorenzo Reducto - 2026
                                    </p>
                                </div>
                            </div>

                            {/* Elementos decorativos */}
                            <div className="relative z-10 flex justify-center gap-3 pt-8">
                                <div className="h-20 w-20 rounded-[40%_60%_50%_50%/60%_40%_60%_40%] bg-white/10 backdrop-blur-sm border border-white/20"></div>
                                <div className="h-20 w-28 rounded-[30%_70%_70%_30%/40%_60%_40%_60%] bg-white/10 backdrop-blur-sm border border-white/20"></div>
                            </div>

                            {/* Iconos decorativos flotantes */}
                            <div className="absolute right-8 bottom-8 opacity-20">
                                <svg className="h-24 w-24" viewBox="0 0 100 100" fill="none">
                                    <circle cx="30" cy="30" r="8" fill="white" />
                                    <circle cx="60" cy="20" r="5" fill="white" />
                                    <circle cx="70" cy="50" r="10" fill="white" />
                                    <circle cx="40" cy="70" r="6" fill="white" />
                                </svg>
                            </div>
                        </div>

                        {/* Panel derecho - Formulario */}
                        {/* Panel derecho - Formulario */}
                        <div className="relative flex flex-col justify-center min-h-[500px] md:min-h-auto bg-white/50 md:bg-transparent">

                            {/* Header Móvil - Diseño Premium Compacto */}
                            <div className="md:hidden relative bg-gradient-to-br from-emerald-600 to-teal-700 pb-8 pt-8 px-6 -mx-0 rounded-b-[2.5rem] shadow-lg mb-6 overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-8 -translate-y-8"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl transform -translate-x-4 translate-y-4"></div>

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-xl border-[3px] border-white/30">
                                        <img src="/logo-cooperativa.png" alt="Logo" className="h-20 w-20 object-contain drop-shadow-md" />
                                    </div>
                                    <h1 className="text-2xl font-black text-white drop-shadow-sm tracking-tight leading-none mb-2">
                                        Cooperativa<br />Reducto Ltda.
                                    </h1>

                                    <div className="h-0.5 w-12 bg-white/30 my-2 rounded-full"></div>

                                    <div className="space-y-0.5">
                                        <p className="text-emerald-50 text-xl font-black tracking-[0.2em] drop-shadow-sm">
                                            SIGA
                                        </p>
                                        <p className="text-emerald-100/90 text-[10px] font-bold tracking-wide">
                                            San Lorenzo Reducto - 2026
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 pb-8 md:p-12 md:pt-12">
                                <div className="space-y-6">
                                    <div className="text-center md:text-left">
                                        <h3 className="text-xl md:text-3xl font-black text-slate-800 mb-1 tracking-tight">¡Bienvenido!</h3>
                                        <p className="text-slate-500 font-medium text-xs md:text-base">Ingresa a tu cuenta para gestionar el sistema</p>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="ml-1 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Usuario</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors duration-300">
                                                    <User className="h-4 w-4 md:h-5 md:w-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="w-full rounded-xl border-2 border-slate-100 bg-white/80 py-3 pl-10 pr-4 text-sm md:text-base text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-bold placeholder:text-slate-300 shadow-sm hover:border-slate-200"
                                                    placeholder="Ej. 4.567.890"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="ml-1 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors duration-300">
                                                    <Lock className="h-4 w-4 md:h-5 md:w-5" />
                                                </div>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full rounded-xl border-2 border-slate-100 bg-white/80 py-3 pl-10 pr-10 text-sm md:text-base text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-bold placeholder:text-slate-300 shadow-sm hover:border-slate-200"
                                                    placeholder="••••••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors p-1 hover:bg-slate-100 rounded-full"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-100 animate-shake flex items-center gap-2 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="group w-full rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 py-3.5 font-black text-white shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2 overflow-hidden text-sm md:text-base"
                                        >
                                            <span className="relative flex items-center gap-2">
                                                {loading ? (
                                                    <>
                                                        <RefreshCcw className="h-4 w-4 animate-spin" />
                                                        <span className="tracking-widest">INGRESANDO...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="tracking-widest">INICIAR SESIÓN</span>
                                                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </span>
                                        </button>
                                    </form>

                                    <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-1">
                                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            Sistema Integral de Gestión
                                        </p>
                                        <div className="flex items-center gap-1.5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                                            <span className="text-[9px] font-semibold text-slate-400">Powered by</span>
                                            <span className="text-[9px] font-black text-slate-600">AVANZANTEC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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

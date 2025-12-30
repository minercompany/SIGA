"use client";

import { AlertTriangle, Cog, MonitorPlay, Hammer, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function MaintenancePage() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-emerald-100 p-4 md:p-6 relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-5%] right-[-5%] w-64 h-64 md:w-96 md:h-96 bg-emerald-200/50 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 md:w-96 md:h-96 bg-emerald-300/30 rounded-full blur-3xl"></div>
            </div>

            <main className="relative z-10 max-w-lg md:max-w-2xl w-full">
                <div className="bg-white/80 backdrop-blur-xl border border-emerald-200 rounded-[2rem] p-8 md:p-14 text-center shadow-2xl shadow-emerald-100/50 relative overflow-hidden group hover:border-emerald-400 transition-colors duration-500">

                    {/* Floating Icons */}
                    <div className="absolute top-5 left-5 md:top-10 md:left-10 opacity-30 animate-bounce duration-[3000ms]">
                        <Cog className="w-8 h-8 md:w-12 md:h-12 text-emerald-500" />
                    </div>
                    <div className="absolute bottom-5 right-5 md:bottom-10 md:right-10 opacity-30 animate-bounce duration-[3000ms] delay-500">
                        <Hammer className="w-8 h-8 md:w-12 md:h-12 text-emerald-500" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col items-center gap-6 md:gap-8">
                        {/* Main Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-30 animate-pulse"></div>
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl rotate-3 flex items-center justify-center shadow-xl shadow-emerald-200 group-hover:rotate-6 transition-transform duration-500 relative z-10">
                                <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-white" />
                            </div>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            <h1 className="text-3xl md:text-5xl font-black text-emerald-900 tracking-tight leading-tight">
                                Mantenimiento <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">
                                    Programado
                                </span>
                            </h1>
                            <p className="text-sm md:text-lg text-emerald-700 font-medium leading-relaxed max-w-xs md:max-w-md mx-auto">
                                Estamos optimizando la plataforma para brindarte una experiencia premium.
                            </p>
                        </div>

                        {/* Status Card */}
                        <div className="w-full bg-emerald-50 rounded-2xl p-4 md:p-6 border border-emerald-200 flex items-center justify-between gap-4 group/status hover:bg-emerald-100/50 transition-colors">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="p-2 md:p-3 bg-emerald-500/10 rounded-xl group-hover/status:bg-emerald-500/20 transition-colors">
                                    <MonitorPlay className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Estado</div>
                                    <div className="text-xs md:text-sm font-bold text-emerald-800">Actualizando Sistema</div>
                                </div>
                            </div>
                            <div className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </div>
                        </div>

                        {/* Admin Login Button */}
                        <div className="pt-4 w-full">
                            <Link href="/login" className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 border border-emerald-400 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 group/btn transition-all duration-300">
                                <ShieldCheck className="w-5 h-5 text-white" />
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] text-emerald-100 uppercase tracking-wider font-bold">Acceso Restringido</span>
                                    <span className="text-sm font-bold">Soy Administrador</span>
                                </div>
                                <span className="ml-auto md:ml-2 group-hover/btn:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-2">
                    <p className="text-emerald-600 text-[10px] uppercase font-bold tracking-widest">
                        Asamblea Cloud &copy; 2025
                    </p>
                </div>
            </main>
        </div>
    );
}

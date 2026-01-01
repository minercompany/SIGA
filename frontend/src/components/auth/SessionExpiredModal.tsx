"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogOut, AlertCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface SessionExpiredModalProps {
    isOpen: boolean;
}

export function SessionExpiredModal({ isOpen }: SessionExpiredModalProps) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        // Forzamos un recargo para limpiar estados residuales si fuera necesario
        window.location.href = "/login";
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
                    >
                        <div className="p-8 text-center">
                            {/* Icon with Ring Animation */}
                            <div className="relative mb-6 flex justify-center">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 rounded-full bg-red-100 opacity-50 blur-xl h-16 w-16 mx-auto"
                                />
                                <div className="relative h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-inner">
                                    <AlertCircle className="h-8 w-8" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
                                ¡Tu sesión ha expirado!
                            </h2>

                            <p className="text-slate-500 leading-relaxed mb-8">
                                Por tu seguridad, la sesión se ha cerrado automáticamente.
                                Debes <strong className="text-emerald-500 font-bold">iniciar sesión de nuevo</strong> para continuar operando en el sistema.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleLogout}
                                    className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:shadow-slate-300 transform hover:-translate-y-0.5"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span>IR AL LOGIN</span>
                                </button>

                                <div className="flex items-center justify-center gap-2 py-2 text-slate-400 text-xs font-medium">
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    <span>SIGA - Sistema de Gestión de Asambleas</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Stripe */}
                        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

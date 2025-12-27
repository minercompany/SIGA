"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";
import { Phone, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";

interface WelcomeModalProps {
    user: any;
    onUpdateUser: (newUser: any) => void;
}

export function WelcomeModal({ user, onUpdateUser }: WelcomeModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Disparar solo si el usuario existe y NO tiene teléfono (o es muy corto)
        if (user) {
            console.log("WelcomeModal check:", user);
            if (!user.telefono || user.telefono.length < 6) {
                setIsOpen(true);
            }
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        console.log("Submitting phone for user:", user);

        if (!user || !user.id) {
            setError("Error: No se encontró el ID de usuario. Reloguearse puede solucionar esto.");
            return;
        }

        if (!phone || phone.length < 8) {
            setError("Por favor ingresa un número válido (+595...)");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            console.log(`Sending PUT to http://192.168.100.123:8081/api/usuarios/${user.id}`);
            await axios.put(`http://192.168.100.123:8081/api/usuarios/${user.id}`,
                { telefono: phone },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Actualizar usuario local REFRESCANDO desde el servidor para garantizar persistencia
            const userRes = await axios.get("http://192.168.100.123:8081/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const freshUser = userRes.data;
            localStorage.setItem("user", JSON.stringify(freshUser));
            onUpdateUser(freshUser);

            setIsOpen(false);

        } catch (err) {
            console.error(err);
            setError("Error al guardar. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
                >
                    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="inline-flex p-4 bg-white/10 rounded-3xl mb-4 backdrop-blur-md shadow-inner border border-white/20 ring-4 ring-white/5">
                                <ShieldCheck className="w-12 h-12 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                ¡Bienvenido a la Asamblea!
                            </h2>
                            <p className="text-indigo-100 text-sm mt-2 font-medium px-4 leading-relaxed">
                                Para una experiencia segura, necesitamos validar tu contacto oficial.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 pt-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                    Número de WhatsApp (Formato Internacional)
                                </label>
                                <div className="relative group">
                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-violet-500 transition-colors" />
                                    <input
                                        type="tel"
                                        placeholder="+595 981 123 456"
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50 transition-all placeholder:font-medium placeholder:text-slate-300 text-center tracking-wide"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex items-start gap-2 bg-indigo-50 p-3 rounded-xl">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-indigo-800 leading-tight">
                                        Te enviaremos notificaciones automáticas vía <strong>Arizar IA</strong> con tus credenciales y resultados.
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !phone}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Registrando...</span>
                                    </>
                                ) : (
                                    <span>Confirmar Acceso</span>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center space-y-2">
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.removeItem("token");
                                    localStorage.removeItem("user");
                                    window.location.href = "/login";
                                }}
                                className="text-[10px] text-slate-400 font-bold hover:text-red-500 transition-colors uppercase tracking-widest"
                            >
                                Cerrar Sesión / Cancelar
                            </button>
                            <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest mt-2">
                                Secured by Arizar Tech
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, CheckCircle } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Verificar si ya está instalada
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Verificar si el usuario ya rechazó la instalación
        const dismissedAt = localStorage.getItem("pwa-dismissed");
        if (dismissedAt) {
            const dismissedDate = new Date(dismissedAt);
            const now = new Date();
            const daysSinceDismiss = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            // No mostrar por 7 días después de rechazar
            if (daysSinceDismiss < 7) {
                setDismissed(true);
                return;
            }
        }

        // Escuchar el evento de instalación
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Mostrar después de 3 segundos de carga
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        // Detectar cuando se instala
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setIsInstalled(true);
        }

        setShowPrompt(false);
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setDismissed(true);
        localStorage.setItem("pwa-dismissed", new Date().toISOString());
    };

    // No mostrar si ya está instalada, rechazada, o no hay prompt disponible
    if (isInstalled || dismissed || !showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.9 }}
                className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-80 z-[200] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Instalar SIGA</h3>
                            <p className="text-sm text-emerald-100">Acceso rápido desde tu pantalla</p>
                        </div>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-4 space-y-3">
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Abre más rápido, sin barra del navegador</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Recibe notificaciones al instante</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>No ocupa espacio como una app normal</span>
                    </div>
                </div>

                {/* Botones */}
                <div className="p-4 pt-0 flex gap-2">
                    <button
                        onClick={handleDismiss}
                        className="flex-1 py-2.5 px-4 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Ahora no
                    </button>
                    <button
                        onClick={handleInstall}
                        className="flex-1 py-2.5 px-4 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                    >
                        <Download className="h-4 w-4" />
                        Instalar
                    </button>
                </div>

                {/* Botón cerrar */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}

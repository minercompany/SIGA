"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Lightbulb, Sparkles } from 'lucide-react';
import { useTour } from './TourContext';

export function TourOverlay() {
    const { isActive, currentStep, steps, nextStep, prevStep, skipTour } = useTour();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isMobile, setIsMobile] = useState(false);

    const currentStepData = steps[currentStep];

    // Detectar móvil
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isActive || !currentStepData) return;

        const updatePosition = () => {
            const target = document.querySelector(currentStepData.target);
            if (target) {
                const rect = target.getBoundingClientRect();
                setTargetRect(rect);

                // Calcular posición del tooltip (Ahora para AMBOS: Móvil y Desktop)
                const isSmallScreen = window.innerWidth < 768;
                const tooltipWidth = isSmallScreen ? window.innerWidth - 32 : 400;
                // Estimación de altura, o dejar que se ajuste y luego corregir.
                // Para simplificar, usaremos una altura fija estimada o cálculo dinámico simple.
                const tooltipHeight = isSmallScreen ? 200 : 280;
                const margin = isSmallScreen ? 12 : 20;

                let top = 0;
                let left = 0;

                // Determinar la mejor posición según dónde está el elemento
                const spaceBottom = window.innerHeight - rect.bottom;
                const spaceTop = rect.top;

                // Lógica simplificada de posicionamiento automático
                // 1. Si es sidebar/menú (izquierda), intentar poner a la derecha (solo desktop)
                if (!isSmallScreen && rect.left < 300) {
                    left = rect.right + margin;
                    top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
                }
                // 2. Si hay espacio abajo, poner abajo (Preferido en móvil para elementos superiores)
                else if (spaceBottom > tooltipHeight + margin) {
                    top = rect.bottom + margin;
                    // Centrar horizontalmente respecto al target
                    left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                }
                // 3. Si no, poner arriba
                else {
                    top = rect.top - tooltipHeight - margin;
                    left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                }

                // Asegurar que no se salga de la pantalla (Horizontal)
                left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

                // Asegurar que no se salga de la pantalla (Vertical)
                // Si se sale por arriba, topar con margen superior
                if (top < 80) top = rect.bottom + margin;

                // CRÍTICO: Si se sale por abajo, pegarlo al fondo
                if (top + tooltipHeight > window.innerHeight - 10) {
                    top = window.innerHeight - tooltipHeight - 20;
                }

                setTooltipPosition({ top, left });

                // Scroll al elemento si está lejos
                const elementCenter = rect.top + rect.height / 2;
                const viewportCenter = window.innerHeight / 2;
                if (Math.abs(elementCenter - viewportCenter) > window.innerHeight * 0.4) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        };

        const timer = setTimeout(updatePosition, 150);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isActive, currentStep, currentStepData, isMobile]);



    // Función inteligente para avanzar
    const handleNext = () => {
        if (isMobile && currentStepData) {
            const sidebarIsOpen = document.querySelector('[data-tour="sidebar-panel"]');

            // CASO 1: Salimos del botón hamburguesa para entrar al menú ("Mis Listas", etc.)
            // Acción: ABRIR la barra si está cerrada.
            if (currentStepData.id === 'sidebar') {
                if (!sidebarIsOpen) {
                    window.dispatchEvent(new Event('toggle-sidebar'));
                }
            }

            // CASO 2: Salimos del último item del menú ("Configuración") hacia el Dashboard
            // Acción: CERRAR la barra para ver los KPIs.
            if (currentStepData.id === 'config-nav') {
                if (sidebarIsOpen) {
                    window.dispatchEvent(new Event('toggle-sidebar'));
                }
            }
        }
        nextStep();
    };

    if (!isActive || !currentStepData) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999]"
            >
                {/* Overlay oscuro con spotlight */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                        <mask id="spotlight-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {targetRect && (
                                <rect
                                    x={targetRect.left - 8}
                                    y={targetRect.top - 8}
                                    width={targetRect.width + 16}
                                    height={targetRect.height + 16}
                                    rx="16"
                                    fill="black"
                                />
                            )}
                        </mask>
                    </defs>
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="rgba(15, 23, 42, 0.85)"
                        mask="url(#spotlight-mask)"
                        style={{ pointerEvents: 'auto' }}
                        onClick={skipTour}
                    />
                </svg>

                {/* Borde luminoso del elemento */}
                {targetRect && (
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute pointer-events-none"
                        style={{
                            top: targetRect.top - 8,
                            left: targetRect.left - 8,
                            width: targetRect.width + 16,
                            height: targetRect.height + 16,
                        }}
                    >
                        <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse" />
                    </motion.div>
                )}

                {/* TOOLTIP UNIFICADO - Flotante y adaptable */}
                <motion.div
                    key={`tooltip-${currentStep}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="absolute z-[10000]"
                    style={{
                        top: tooltipPosition.top,
                        left: tooltipPosition.left,
                        width: isMobile ? 'calc(100vw - 32px)' : '400px',
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                        {/* Header con gradiente */}
                        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-4 md:px-6">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 md:p-2 bg-white/20 backdrop-blur rounded-xl">
                                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                                            Guía Rápida
                                        </p>
                                        <p className="text-white text-xs md:text-sm font-medium">
                                            Paso {currentStep + 1} de {steps.length}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={skipTour}
                                    className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"
                                >
                                    <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </button>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-3 md:mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                    className="h-full bg-white rounded-full"
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 md:p-6">
                            <div className="flex items-start gap-3 mb-2 md:mb-4">
                                <div className="hidden md:block p-2 bg-emerald-100 rounded-xl shrink-0">
                                    <Lightbulb className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-base md:text-lg font-black text-slate-800 mb-1">
                                        {currentStepData.title}
                                    </h3>
                                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                                        {currentStepData.content}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 pb-5 md:px-6 md:pb-6 flex items-center justify-between gap-4">
                            <button
                                onClick={skipTour}
                                className="text-xs md:text-sm text-slate-400 hover:text-slate-600 font-medium whitespace-nowrap"
                            >
                                Omitir
                            </button>

                            <div className="flex items-center gap-2">
                                {currentStep > 0 && (
                                    <button
                                        onClick={prevStep}
                                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-xs md:text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 whitespace-nowrap"
                                >
                                    {currentStep === steps.length - 1 ? '¡Listo!' : 'Siguiente'}
                                    {currentStep < steps.length - 1 && <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

}

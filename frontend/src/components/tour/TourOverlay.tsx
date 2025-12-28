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

                // Solo calcular posición del tooltip para desktop
                if (!isMobile) {
                    const tooltipWidth = 400;
                    const tooltipHeight = 280;
                    const margin = 20;

                    let top = 0;
                    let left = 0;

                    // Determinar la mejor posición según dónde está el elemento
                    const spaceRight = window.innerWidth - rect.right;
                    const spaceBottom = window.innerHeight - rect.bottom;
                    const spaceLeft = rect.left;
                    const spaceTop = rect.top;

                    // Si el elemento está en el lado izquierdo (sidebar), poner tooltip a la derecha
                    if (rect.left < 300) {
                        // Tooltip a la derecha del elemento
                        left = rect.right + margin;
                        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
                    }
                    // Si hay espacio abajo, poner abajo
                    else if (spaceBottom > tooltipHeight + margin) {
                        top = rect.bottom + margin;
                        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                    }
                    // Si no, poner arriba
                    else {
                        top = rect.top - tooltipHeight - margin;
                        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                    }

                    // Asegurar que no se salga de la pantalla
                    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
                    top = Math.max(80, Math.min(top, window.innerHeight - tooltipHeight - 16));

                    setTooltipPosition({ top, left });
                }

                // Scroll al elemento
                const elementCenter = rect.top + rect.height / 2;
                const viewportCenter = window.innerHeight / 2;
                if (Math.abs(elementCenter - viewportCenter) > window.innerHeight * 0.35) {
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
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 blur-sm" />
                    </motion.div>
                )}

                {/* TOOLTIP - Versión diferente para móvil y desktop */}
                {isMobile ? (
                    /* ========== VERSIÓN MÓVIL - Fijo abajo, compacto ========== */
                    <motion.div
                        key={`mobile-tooltip-${currentStep}`}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-0 left-0 right-0 z-[10000] p-3 safe-area-pb"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-white" />
                                    <span className="text-white text-sm font-bold">
                                        Paso {currentStep + 1}/{steps.length}
                                    </span>
                                </div>
                                <button onClick={skipTour} className="p-1 hover:bg-white/20 rounded-lg">
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                            <div className="px-4 py-3">
                                <h3 className="text-sm font-bold text-slate-800 mb-0.5">{currentStepData.title}</h3>
                                <p className="text-xs text-slate-600">{currentStepData.content}</p>
                            </div>
                            <div className="px-4 pb-3 flex items-center justify-between">
                                <button onClick={skipTour} className="text-xs text-slate-400 font-medium">Omitir</button>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1 mr-2">
                                        {steps.map((_, i) => (
                                            <div key={i} className={`h-1.5 rounded-full ${i === currentStep ? 'w-3 bg-emerald-500' : 'w-1.5 bg-slate-300'}`} />
                                        ))}
                                    </div>
                                    {currentStep > 0 && (
                                        <button onClick={prevStep} className="p-1.5 bg-slate-100 rounded-lg">
                                            <ChevronLeft className="w-4 h-4 text-slate-600" />
                                        </button>
                                    )}
                                    <button onClick={nextStep} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                                        {currentStep === steps.length - 1 ? '¡Listo!' : 'Siguiente'}
                                        {currentStep < steps.length - 1 && <ChevronRight className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* ========== VERSIÓN DESKTOP - Grande y premium, cerca del elemento ========== */
                    <motion.div
                        key={`desktop-tooltip-${currentStep}`}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute w-[400px] z-[10000]"
                        style={{
                            top: tooltipPosition.top,
                            left: tooltipPosition.left,
                        }}
                    >
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                            {/* Header con gradiente */}
                            <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-4">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
                                                Guía de Inicio
                                            </p>
                                            <p className="text-white text-sm font-medium">
                                                Paso {currentStep + 1} de {steps.length}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={skipTour}
                                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                        className="h-full bg-white rounded-full"
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                                        <Lightbulb className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 mb-1">
                                            {currentStepData.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {currentStepData.content}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-6 flex items-center justify-between">
                                <button
                                    onClick={skipTour}
                                    className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
                                >
                                    Omitir guía
                                </button>

                                <div className="flex items-center gap-2">
                                    {/* Dots indicator */}
                                    <div className="flex items-center gap-1.5 mr-4">
                                        {steps.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-2 rounded-full transition-all ${i === currentStep
                                                    ? 'w-6 bg-emerald-500'
                                                    : i < currentStep
                                                        ? 'w-2 bg-emerald-300'
                                                        : 'w-2 bg-slate-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    {currentStep > 0 && (
                                        <button
                                            onClick={prevStep}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                                        </button>
                                    )}
                                    <button
                                        onClick={nextStep}
                                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
                                    >
                                        {currentStep === steps.length - 1 ? '¡Entendido!' : 'Siguiente'}
                                        {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}

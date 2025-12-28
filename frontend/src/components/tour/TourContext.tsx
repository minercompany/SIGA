"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface TourStep {
    id: string;
    target: string; // CSS selector del elemento a resaltar
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourContextType {
    isActive: boolean;
    currentStep: number;
    steps: TourStep[];
    startTour: (steps: TourStep[], tourId?: string) => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
    endTour: () => void;
    hasSeenTour: (tourId: string) => boolean;
    resetTour: (tourId: string) => void;
    resetAllTours: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState<TourStep[]>([]);
    const [currentTourId, setCurrentTourId] = useState<string>('');

    const hasSeenTour = useCallback((tourId: string): boolean => {
        if (typeof window === 'undefined') return true;
        const seen = localStorage.getItem(`tour_seen_${tourId}`);
        return seen === 'true';
    }, []);

    const markTourAsSeen = useCallback((tourId: string) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(`tour_seen_${tourId}`, 'true');
    }, []);

    const startTour = useCallback((tourSteps: TourStep[], tourId?: string) => {
        if (tourSteps.length === 0) return;

        const id = tourId || 'default';
        setCurrentTourId(id);
        setSteps(tourSteps);
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            endTour();
        }
    }, [currentStep, steps.length]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const skipTour = useCallback(() => {
        markTourAsSeen(currentTourId);
        setIsActive(false);
        setSteps([]);
        setCurrentStep(0);
    }, [currentTourId, markTourAsSeen]);

    const endTour = useCallback(() => {
        markTourAsSeen(currentTourId);
        setIsActive(false);
        setSteps([]);
        setCurrentStep(0);
    }, [currentTourId, markTourAsSeen]);

    const resetTour = useCallback((tourId: string) => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(`tour_seen_${tourId}`);
    }, []);

    const resetAllTours = useCallback(() => {
        if (typeof window === 'undefined') return;
        // Limpiar todos los tours conocidos
        const tourIds = ['dashboard', 'dashboard-admin', 'asignaciones', 'importar', 'configuracion', 'socios'];
        tourIds.forEach(id => {
            localStorage.removeItem(`tour_seen_${id}`);
        });
    }, []);

    return (
        <TourContext.Provider value={{
            isActive,
            currentStep,
            steps,
            startTour,
            nextStep,
            prevStep,
            skipTour,
            endTour,
            hasSeenTour,
            resetTour,
            resetAllTours
        }}>
            {children}
        </TourContext.Provider>
    );
}

export function useTour() {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
}

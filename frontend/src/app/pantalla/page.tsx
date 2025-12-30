"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, Users, UserCheck } from "lucide-react";
import { motion } from 'framer-motion';
import axios from "axios";

interface Stats {
    totalPadron: number;
    presentes: number;
    presentesVyV: number;
}

interface MetasData {
    meta: number;
    registradosVozYVoto: number;
    porcentajeMeta: number;
    asesores?: { meta: number; registradosVozYVoto: number; porcentajeMeta: number };
    funcionarios?: { meta: number; registradosVozYVoto: number; porcentajeMeta: number };
}

export default function PantallaPublicaPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [metasData, setMetasData] = useState<MetasData | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [totalRegistradosEnListas, setTotalRegistradosEnListas] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, metasRes] = await Promise.all([
                axios.get("/api/public/estadisticas").catch(() => ({ data: null })),
                axios.get("/api/public/metas").catch(() => ({ data: null })),
            ]);

            if (statsRes.data) setStats(statsRes.data);
            if (metasRes.data) {
                setMetasData(metasRes.data);
                // Total registrados = Asesores + Funcionarios
                const asesores = metasRes.data.asesores?.registradosVozYVoto || 0;
                const funcionarios = metasRes.data.funcionarios?.registradosVozYVoto || 0;
                setTotalRegistradosEnListas(asesores + funcionarios);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (isLoading || !stats) {
        return (
            <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="h-20 w-20 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <p className="text-slate-400 text-2xl">Cargando datos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex flex-col">
            {/* Decorativo */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            {/* HEADER */}
            <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-5">
                    <img src="/logo-cooperativa.png" alt="Logo" className="h-20 w-auto" />
                    <div>
                        <h1 className="text-4xl font-black text-white">Asamblea General 2025</h1>
                        <p className="text-slate-400 text-lg flex items-center gap-2 mt-1">
                            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                            En vivo • Actualización cada 10 segundos
                        </p>
                    </div>
                </div>
                <div className="bg-white/5 rounded-3xl px-10 py-4 border border-white/10">
                    <div className="text-6xl font-mono font-black text-white tracking-wider">
                        {currentTime.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </div>
                    <p className="text-center text-slate-400 text-lg mt-1 capitalize">
                        {currentTime.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL - 2 COLUMNAS */}
            <div className="relative z-10 flex-1 grid grid-cols-2 gap-6">

                {/* COLUMNA 1: Progreso Meta (PRINCIPAL) */}
                <div className="bg-slate-800/90 rounded-[2rem] p-8 border border-slate-700/50 flex flex-col">
                    {/* Header del panel */}
                    <div className="flex items-center gap-5 mb-6">
                        <div className="p-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-xl shadow-emerald-500/30">
                            <Target className="h-10 w-10 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-black text-white">Progreso Meta</h2>
                            <p className="text-slate-400 text-lg">Registros en Listas</p>
                        </div>
                        {metasData && (
                            <div className="text-right">
                                <p className="text-6xl font-black text-emerald-400">{metasData.registradosVozYVoto}</p>
                                <p className="text-xl text-slate-400">de {metasData.meta}</p>
                            </div>
                        )}
                    </div>

                    {/* Barra de progreso global */}
                    {metasData && (
                        <div className="mb-8">
                            <div className="flex justify-between mb-3">
                                <span className="text-xl text-slate-300 font-medium">Meta Global</span>
                                <span className="text-3xl font-black text-emerald-400">{metasData.porcentajeMeta.toFixed(1)}%</span>
                            </div>
                            <div className="h-8 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(metasData.porcentajeMeta, 100)}%` }}
                                    transition={{ duration: 1.5 }}
                                    className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-pulse" />
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {/* Segmentos: Asesores vs Funcionarios */}
                    {metasData && (
                        <div className="grid grid-cols-2 gap-6 flex-1">
                            {/* Asesores */}
                            <div className="bg-blue-600/20 rounded-2xl p-6 border border-blue-500/30 flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xl font-bold text-blue-200">Asesores</span>
                                    <span className="text-3xl font-black text-blue-400">{metasData.asesores?.porcentajeMeta.toFixed(0) || 0}%</span>
                                </div>
                                <div>
                                    <p className="text-5xl font-black text-white mb-2">
                                        {metasData.asesores?.registradosVozYVoto || 0}
                                        <span className="text-2xl text-slate-400 font-medium">/{metasData.asesores?.meta || 0}</span>
                                    </p>
                                    <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(metasData.asesores?.porcentajeMeta || 0, 100)}%` }}
                                            transition={{ duration: 1.5, delay: 0.3 }}
                                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Funcionarios */}
                            <div className="bg-emerald-600/20 rounded-2xl p-6 border border-emerald-500/30 flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xl font-bold text-emerald-200">Funcionarios</span>
                                    <span className="text-3xl font-black text-emerald-400">{metasData.funcionarios?.porcentajeMeta.toFixed(0) || 0}%</span>
                                </div>
                                <div>
                                    <p className="text-5xl font-black text-white mb-2">
                                        {metasData.funcionarios?.registradosVozYVoto || 0}
                                        <span className="text-2xl text-slate-400 font-medium">/{metasData.funcionarios?.meta || 0}</span>
                                    </p>
                                    <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(metasData.funcionarios?.porcentajeMeta || 0, 100)}%` }}
                                            transition={{ duration: 1.5, delay: 0.5 }}
                                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* COLUMNA 2: Contador de Asistencia */}
                <div className="flex flex-col gap-6">
                    {/* Socios Ingresando a la Asamblea */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 flex-1 flex flex-col justify-center items-center shadow-2xl shadow-blue-500/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse" />
                        <div className="p-5 bg-white/20 rounded-full mb-4">
                            <Users className="h-16 w-16 text-white" />
                        </div>
                        <p className="text-8xl font-black text-white mb-2">{stats.presentes}</p>
                        <p className="text-2xl text-blue-100 font-bold text-center">Socios Presentes<br />en la Asamblea</p>
                        <p className="text-lg text-blue-200 mt-3">{stats.presentesVyV} con Voz y Voto</p>
                    </div>

                    {/* VS Comparativo */}
                    <div className="bg-slate-800/80 rounded-[2rem] p-6 border border-slate-700/50 flex items-center justify-around">
                        <div className="text-center">
                            <p className="text-5xl font-black text-emerald-400">{totalRegistradosEnListas}</p>
                            <p className="text-lg text-slate-300 mt-1">Registrados en Listas</p>
                            <p className="text-sm text-slate-400">(Asesores + Funcionarios)</p>
                        </div>

                        <div className="text-4xl font-black text-slate-500">VS</div>

                        <div className="text-center">
                            <p className="text-5xl font-black text-blue-400">{stats.presentes}</p>
                            <p className="text-lg text-slate-300 mt-1">Ingresaron Hoy</p>
                            <p className="text-sm text-slate-400">(Check-in Asamblea)</p>
                        </div>
                    </div>

                    {/* Info adicional */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                            <p className="text-3xl font-black text-violet-400">{stats.totalPadron.toLocaleString()}</p>
                            <p className="text-sm text-slate-400">Padrón Total</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                            <p className="text-3xl font-black text-emerald-400">{stats.presentesVyV}</p>
                            <p className="text-sm text-slate-400">Con V&V Hoy</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                            <p className="text-3xl font-black text-amber-400">{stats.presentes - stats.presentesVyV}</p>
                            <p className="text-sm text-slate-400">Solo Voz Hoy</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

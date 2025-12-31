"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { UserCircle2, Download, Printer, Trophy, Medal, Award, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingReportPage() {
    const [ranking, setRanking] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/reportes/ranking-global", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRanking(res.data);
            } catch (error) {
                console.error("Error fetching ranking:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const top1 = ranking[0];
    const top2 = ranking[1];
    const top3 = ranking[2];
    const restOfRanking = ranking.slice(3);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 print:bg-white print:pb-0">
            {/* HERRAMIENTAS FLOTANTES (Oculto al imprimir) */}
            <div className="fixed bottom-8 right-8 flex flex-col gap-3 print:hidden z-50">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrint}
                    className="p-4 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-500/50 hover:bg-black transition-colors"
                    title="Imprimir / Guardar PDF"
                >
                    <Printer className="h-6 w-6" />
                </motion.button>
            </div>

            <div className="max-w-7xl mx-auto p-8 print:p-0 print:max-w-none">
                {/* HEADER DEL REPORTE */}
                <header className="flex items-center justify-between mb-12 border-b-2 border-slate-200 pb-8 print:mb-8">
                    <div className="flex items-center gap-6">
                        <img src="/logo-cooperativa.png" alt="Logo" className="h-20 w-auto object-contain" />
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Ranking de Gestión</h1>
                            <p className="text-slate-500 font-medium">Asamblea General Ordinaria 2025</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-teal-500 rounded-full font-bold text-sm mb-2 print:border print:border-emerald-200">
                            <Crown className="h-4 w-4" />
                            TOP FUNCIONARIOS
                        </div>
                        <p className="text-sm text-slate-400 font-medium">Generado el: {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</p>
                    </div>
                </header>

                {/* PODIUM SECTION (Solo visible si hay al menos 3) */}
                {ranking.length >= 3 && (
                    <div className="mb-16 print:mb-8 print:break-inside-avoid">
                        <div className="flex items-end justify-center gap-6 min-h-[450px] pt-12">
                            {/* 2nd Place */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-1/4 flex flex-col items-center z-10"
                            >
                                <div className="mb-8 text-center relative z-30">
                                    <h3 className="font-bold text-slate-700 line-clamp-1 text-lg px-2">{top2.nombreCompleto}</h3>
                                </div>
                                <div className="w-full h-[200px] bg-gradient-to-t from-slate-300 to-slate-200 rounded-t-3xl relative shadow-xl border-t border-slate-100 flex flex-col items-center pt-6 print:bg-slate-200 print:bg-none">
                                    {/* Avatar and Badge inside podium */}
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-white border-4 border-slate-300 shadow-lg flex items-center justify-center overflow-hidden">
                                            <UserCircle2 className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-slate-400 text-white w-7 h-7 rounded-full flex items-center justify-center font-black border-2 border-white text-sm">2</div>
                                    </div>
                                    {/* Sucursal Badge */}
                                    <p className="mt-3 px-3 py-1 bg-white/80 rounded-lg text-[10px] text-slate-500 font-bold uppercase border border-slate-200">{top2.sucursal || 'N/A'}</p>
                                    {/* Registration Count */}
                                    <div className="mt-3 px-4 py-2 bg-white rounded-full text-slate-700 font-black text-lg border-2 border-slate-300 shadow-md">
                                        {top2.registrados} <span className="text-sm font-bold">Reg.</span>
                                    </div>
                                    <Medal className="absolute bottom-3 h-12 w-12 text-slate-400 opacity-20" />
                                </div>
                            </motion.div>

                            {/* 1st Place */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="w-1/3 flex flex-col items-center z-20 -mx-4"
                            >
                                <div className="mb-8 text-center relative z-30">
                                    <div className="mb-2">
                                        <Crown className="h-8 w-8 text-amber-400 mx-auto fill-amber-400 animate-bounce print:animate-none" />
                                    </div>
                                    <h3 className="font-black text-slate-800 text-2xl line-clamp-1 px-2">{top1.nombreCompleto}</h3>
                                </div>
                                <div className="w-full h-[260px] bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-3xl relative shadow-2xl shadow-amber-500/20 border-t border-amber-200 flex flex-col items-center pt-6 print:bg-amber-300 print:bg-none">
                                    {/* Avatar inside podium */}
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-white border-4 border-amber-300 shadow-xl flex items-center justify-center overflow-hidden">
                                            <UserCircle2 className="h-12 w-12 text-amber-200" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-white">1</div>
                                    </div>
                                    {/* Sucursal Badge */}
                                    <p className="mt-4 px-4 py-1.5 bg-white/90 rounded-lg text-sm text-amber-700 font-bold uppercase border border-amber-200 shadow-sm">{top1.sucursal || 'N/A'}</p>
                                    {/* Registration Count */}
                                    <div className="mt-4 px-6 py-3 bg-white rounded-full text-amber-600 font-black text-2xl border-2 border-amber-300 shadow-lg">
                                        {top1.registrados} <span className="text-base font-bold">Registros</span>
                                    </div>
                                    <Trophy className="absolute bottom-4 h-16 w-16 text-amber-600 opacity-20" />
                                </div>
                            </motion.div>

                            {/* 3rd Place */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="w-1/4 flex flex-col items-center z-10"
                            >
                                <div className="mb-8 text-center relative z-30">
                                    <h3 className="font-bold text-slate-700 line-clamp-1 text-lg px-2">{top3.nombreCompleto}</h3>
                                </div>
                                <div className="w-full h-[160px] bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-3xl relative shadow-xl border-t border-orange-100 flex flex-col items-center pt-5 print:bg-orange-200 print:bg-none">
                                    {/* Avatar inside podium */}
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full bg-white border-4 border-orange-300 shadow-lg flex items-center justify-center overflow-hidden">
                                            <UserCircle2 className="h-8 w-8 text-orange-200" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-white text-xs">3</div>
                                    </div>
                                    {/* Sucursal Badge */}
                                    <p className="mt-2 px-2 py-0.5 bg-white/80 rounded text-[9px] text-orange-600 font-bold uppercase border border-orange-200">{top3.sucursal || 'N/A'}</p>
                                    {/* Registration Count */}
                                    <div className="mt-2 px-3 py-1.5 bg-white rounded-full text-orange-700 font-black text-base border-2 border-orange-300 shadow-md">
                                        {top3.registrados} <span className="text-xs font-bold">Reg.</span>
                                    </div>
                                    <Medal className="absolute bottom-2 h-10 w-10 text-orange-500 opacity-20" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* DETAILED LIST */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 print:hidden">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <Award className="h-5 w-5 text-indigo-500" />
                            Listado Completo de Gestión
                        </h2>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-black text-slate-400 uppercase tracking-wider print:bg-slate-100">
                                <th className="p-4 w-20 text-center">#</th>
                                <th className="p-4">Funcionario / Asesor</th>
                                <th className="p-4">Sucursal</th>
                                <th className="p-4 w-32 text-center">Registros</th>
                                <th className="p-4 w-48 text-center print:hidden">Progreso Meta</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {ranking.map((user, index) => (
                                <tr key={index} className={`border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors ${index < 3 ? 'bg-yellow-50/30 print:bg-white' : ''}`}>
                                    <td className="p-4 text-center font-black text-slate-400">
                                        {index < 3 ? (
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {index + 1}
                                            </span>
                                        ) : (
                                            <span>{index + 1}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 text-base">{user.nombreCompleto}</div>
                                        <div className="text-xs text-slate-400 font-medium">@{user.username} • {user.cargo || 'Funcionario'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600 uppercase">
                                            {user.sucursal}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-black text-xl text-slate-800">{user.registrados}</div>
                                    </td>
                                    <td className="p-4 print:hidden">
                                        {user.meta > 0 && (
                                            <div className="w-full">
                                                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                                    <span>{user.porcentaje.toFixed(0)}%</span>
                                                    <span>Meta: {user.meta}</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${user.porcentaje >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${Math.min(user.porcentaje, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {user.meta === 0 && <span className="text-xs text-slate-400 italic">Sin meta</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 text-center print:mt-12">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cooperativa Reducto Ltda • Sistema de Gestión de Asambleas</p>
                </div>
            </div>

            {/* ESTILOS PARA IMPRESIÓN */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        background-color: white !important;
                    }
                }
            `}</style>
        </div >
    );
}

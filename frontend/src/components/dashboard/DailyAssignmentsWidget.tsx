"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Calendar, Eye } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

interface DailyAssignmentsWidgetProps {
    onOpenModal: () => void;
}

export function DailyAssignmentsWidget({ onOpenModal }: DailyAssignmentsWidgetProps) {
    const [totalHoy, setTotalHoy] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodayStats();
    }, []);

    const fetchTodayStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("/api/asignaciones/stats-dia-hoy", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTotalHoy(res.data.totalHoy || 0);
        } catch (error) {
            console.error("Error fetching today's assignments:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={onOpenModal}
            className="relative group cursor-pointer h-full"
        >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-xl rounded-3xl" />

            {/* Card Content */}
            <div className="relative bg-white/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/60 shadow-xl overflow-hidden h-full flex flex-col">
                {/* Decorative Background Icon */}
                <Calendar className="absolute -right-4 -bottom-4 h-32 w-32 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-500 text-blue-600" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 transform group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                            Hoy
                        </span>
                    </div>

                    {/* Main Number */}
                    <div className="flex-1 flex flex-col justify-center">
                        <h2 className="text-6xl font-black text-slate-800 tracking-tight leading-none mb-2">
                            {loading ? "...":totalHoy}
                        </h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">
                            Nuevos Socios Asignados
                        </p>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={onOpenModal}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold text-sm hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40"
                    >
                        <Eye className="h-4 w-4" />
                        Ver Historial
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, TrendingUp, Sparkles, Target, Star, Users } from "lucide-react";

interface RankMotivationWidgetProps {
    ranking: any[];
    currentUsername: string;
}

export const RankMotivationWidget: React.FC<RankMotivationWidgetProps> = ({ ranking, currentUsername }) => {
    const userRankInfo = useMemo(() => {
        if (!ranking || ranking.length === 0 || !currentUsername) return null;

        // Buscar posición del usuario. Ranking viene ordenado por totalAsignados desc.
        const index = ranking.findIndex(u => u.username === currentUsername);
        if (index === -1) return null;

        const rank = index + 1;
        const totalUsers = ranking.length;
        const userData = ranking[index];

        let config = {
            title: "¡Buen trabajo!",
            message: "Tu aporte es fundamental para el éxito de la asamblea. ¡Sigue adelante!",
            icon: Sparkles,
            color: "slate",
            gradient: "from-slate-500 to-slate-600",
            bgLight: "bg-slate-50",
            textColor: "text-slate-700",
            iconColor: "text-slate-400"
        };

        if (rank === 1) {
            config = {
                title: "¡LÍDER ABSOLUTO!",
                message: "¡Increíble! Eres el número 1 en asignaciones. Tu liderazgo e iniciativa son un ejemplo para todo el equipo.",
                icon: Crown,
                color: "amber",
                gradient: "from-amber-400 via-yellow-500 to-amber-600",
                bgLight: "bg-amber-50",
                textColor: "text-amber-900",
                iconColor: "text-amber-500"
            };
        } else if (rank <= 3) {
            config = {
                title: "¡ESTÁS EN EL PODIO!",
                message: "Excelente desempeño. Estás entre los mejores 3 del ranking global. ¡Tu esfuerzo está dando grandes frutos!",
                icon: Trophy,
                color: "blue",
                gradient: "from-blue-400 via-indigo-500 to-blue-600",
                bgLight: "bg-blue-50",
                textColor: "text-blue-900",
                iconColor: "text-blue-500"
            };
        } else if (rank <= 10) {
            config = {
                title: "¡TOP 10 ALCANZADO!",
                message: "¡Felicidades! Estás en la élite de los 10 mejores. Mantén el ritmo para alcanzar los primeros puestos.",
                icon: Medal,
                color: "emerald",
                gradient: "from-emerald-400 via-teal-500 to-emerald-600",
                bgLight: "bg-emerald-50",
                textColor: "text-emerald-900",
                iconColor: "text-emerald-500"
            };
        } else if (rank <= totalUsers / 2) {
            config = {
                title: "¡VA POR EXCELENTE CAMINO!",
                message: "Estás superando el promedio. Sigue con esa energía para escalar más posiciones en el ranking.",
                icon: TrendingUp,
                color: "violet",
                gradient: "from-violet-400 via-purple-500 to-violet-600",
                bgLight: "bg-violet-50",
                textColor: "text-violet-900",
                iconColor: "text-violet-500"
            };
        } else {
            config = {
                title: "¡VAMOS POR MÁS!",
                message: "Cada registro cuenta. Tu compromiso es la clave para que esta asamblea sea un éxito total. ¡Tú puedes!",
                icon: Target,
                color: "indigo",
                gradient: "from-indigo-400 via-blue-500 to-indigo-600",
                bgLight: "bg-indigo-50",
                textColor: "text-indigo-900",
                iconColor: "text-indigo-500"
            };
        }

        return { rank, config, userData };
    }, [ranking, currentUsername]);

    if (!userRankInfo) return null;

    const { rank, config, userData } = userRankInfo;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-3xl p-6 mb-8 border border-white/40 shadow-xl ${config.bgLight}`}
        >
            {/* Background Effects */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${config.gradient} opacity-[0.05] rounded-full -mr-20 -mt-20 blur-3xl`} />
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/50 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                {/* Rank Badge */}
                <div className="relative group">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br ${config.gradient} flex flex-col items-center justify-center text-white shadow-2xl relative overflow-hidden`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 -mb-1">Puesto</span>
                        <span className="text-4xl md:text-5xl font-black drop-shadow-md">#{rank}</span>
                    </motion.div>

                    {/* Floating Ornaments for top ranks */}
                    {rank <= 3 && (
                        <>
                            <motion.div
                                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-3 -right-3 text-amber-400"
                            >
                                <Star className="h-6 w-6 fill-amber-400" />
                            </motion.div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                                className="absolute -bottom-2 -left-2 text-white/50"
                            >
                                <Sparkles className="h-5 w-5" />
                            </motion.div>
                        </>
                    )}
                </div>

                {/* Message Content */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <Icon className={`h-5 w-5 ${config.iconColor}`} />
                        <h3 className={`text-lg md:text-xl font-black ${config.textColor} tracking-tight`}>
                            {config.title}
                        </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-sm md:text-base leading-relaxed max-w-2xl">
                        {config.message}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                        <div className="px-3 py-1.5 bg-white/60 rounded-xl border border-slate-100 flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs font-bold text-slate-700">
                                {userData.totalRegistros || userData.totalAsignados || 0} Registros
                            </span>
                        </div>
                        {rank > 1 && (
                            <div className="px-3 py-1.5 bg-white/60 rounded-xl border border-slate-100/50 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-indigo-500" />
                                <span className="text-xs font-bold text-slate-500 italic">
                                    ¡Estas a poco de subir al siguiente nivel!
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default RankMotivationWidget;

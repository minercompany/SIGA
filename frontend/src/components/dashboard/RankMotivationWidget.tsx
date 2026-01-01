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
                icon: Trophy,
                color: "amber",
                gradient: "from-amber-400 via-yellow-500 to-amber-600",
                bgLight: "bg-amber-50/50",
                textColor: "text-amber-950",
                iconColor: "text-amber-500",
                shadow: "shadow-amber-200/50"
            };
        } else if (rank === 2) {
            config = {
                title: "¡SEGUNDO LUGAR GLOBAL!",
                message: "¡Excelente! Estás en la cima, solo un paso más para el liderato absoluto. ¡Sigue así!",
                icon: Trophy,
                color: "slate",
                gradient: "from-slate-300 via-slate-400 to-slate-500",
                bgLight: "bg-slate-50/80",
                textColor: "text-slate-900",
                iconColor: "text-slate-400",
                shadow: "shadow-slate-200/50"
            };
        } else if (rank === 3) {
            config = {
                title: "¡TERCER LUGAR - PODIO!",
                message: "¡Felicidades! Estás en el prestigioso podio de la asamblea. Un gran logro para tu sucursal.",
                icon: Trophy,
                color: "orange",
                gradient: "from-orange-400 via-orange-500 to-orange-600",
                bgLight: "bg-orange-50/50",
                textColor: "text-orange-950",
                iconColor: "text-orange-500",
                shadow: "shadow-orange-200/50"
            };
        } else if (rank <= 10) {
            config = {
                title: "¡ÉLITE TOP 10!",
                message: "¡Felicidades! Estás en el prestigioso Top 10. Mantén este ritmo para subir al podio.",
                icon: Medal,
                color: "emerald",
                gradient: "from-emerald-400 via-teal-500 to-emerald-600",
                bgLight: "bg-emerald-50/50",
                textColor: "text-emerald-950",
                iconColor: "text-emerald-500",
                shadow: "shadow-emerald-200/50"
            };
        } else if (rank <= totalUsers / 2) {
            config = {
                title: "¡SUPERANDO EL PROMEDIO!",
                message: "Estás por encima de la media. ¡Gran trabajo! Sigue escalando hacia el Top 10.",
                icon: Star,
                color: "violet",
                gradient: "from-violet-400 via-purple-500 to-violet-600",
                bgLight: "bg-violet-50/50",
                textColor: "text-violet-950",
                iconColor: "text-violet-500",
                shadow: "shadow-violet-200/50"
            };
        } else {
            config = {
                title: "¡PASO A PASO!",
                message: "Cada registro suma. Tu participación es vital para el éxito de la asamblea. ¡A por más!",
                icon: Target,
                color: "indigo",
                gradient: "from-indigo-400 via-blue-500 to-indigo-600",
                bgLight: "bg-indigo-50/50",
                textColor: "text-indigo-950",
                iconColor: "text-indigo-500",
                shadow: "shadow-indigo-200/50"
            };
        }

        return { rank, config, userData };
    }, [ranking, currentUsername]);

    if (!userRankInfo) return null;

    const { rank, config, userData } = userRankInfo;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className={`relative overflow-hidden rounded-[2.5rem] p-6 lg:p-8 mb-8 border border-white/60 shadow-2xl backdrop-blur-md ${config.bgLight} ${config.shadow}`}
        >
            {/* Glossy Overlay */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

            {/* Shine Animation Effect */}
            <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 5, ease: "linear" }}
                className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
            />

            {/* Background Ornaments */}
            <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${config.gradient} opacity-[0.08] rounded-full -mr-32 -mt-32 blur-[60px] pointer-events-none`} />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/40 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Rank Badge Container */}
                <div className="relative">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: rank <= 3 ? [0, -5, 5, 0] : 0 }}
                        transition={{ duration: 0.5 }}
                        className={`w-32 h-32 md:w-36 md:h-36 rounded-[2.5rem] bg-gradient-to-br ${config.gradient} flex flex-col items-center justify-center text-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden group border-4 border-white/30`}
                    >
                        {/* Shimmer inside badge */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                        <Icon className="h-8 md:h-10 w-8 md:w-10 mb-1 drop-shadow-md animate-bounce" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] opacity-90 drop-shadow-sm">Puesto</span>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-4xl md:text-5xl lg:text-6xl font-black drop-shadow-2xl tracking-tighter">#{rank}</span>
                        </div>
                    </motion.div>

                    {/* Floating Ornaments - Only for Top ranks */}
                    {rank <= 10 && (
                        <div className="absolute -inset-4 pointer-events-none">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        y: [0, -20, 0],
                                        x: [0, (i % 2 === 0 ? 10 : -10), 0],
                                        opacity: [0, 0.8, 0],
                                        scale: [0.5, 1, 0.5]
                                    }}
                                    transition={{
                                        duration: 2 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: i * 0.4
                                    }}
                                    className="absolute text-amber-400"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`
                                    }}
                                >
                                    {rank <= 3 ? <Sparkles className="h-4 w-4" /> : <Star className="h-3 w-3" />}
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Podium Label for Top 3 */}
                    {rank <= 3 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white border-2 border-slate-100 rounded-full shadow-lg z-20"
                        >
                            <span className={`text-[10px] font-black uppercase tracking-widest ${config.textColor}`}>
                                PODIO GLOBAL
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Message Content */}
                <div className="flex-1 text-center md:text-left pt-4 md:pt-0">
                    <div className="flex flex-col gap-1 mb-4">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-center justify-center md:justify-start gap-3"
                        >
                            <div className={`p-2 rounded-xl ${config.bgLight} border border-white shadow-sm`}>
                                <Icon className={`h-6 w-6 ${config.iconColor}`} strokeWidth={2.5} />
                            </div>
                            <h3 className={`text-2xl md:text-3xl font-black ${config.textColor} tracking-tight leading-none uppercase italic`}>
                                {config.title}
                            </h3>
                        </motion.div>
                        <div className={`h-1 w-20 bg-gradient-to-r ${config.gradient} rounded-full mx-auto md:mx-0 mt-1`} />
                    </div>

                    <p className="text-slate-600 font-semibold text-base md:text-lg leading-relaxed max-w-2xl mb-6">
                        {config.message}
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        {/* Stats Capsule */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="px-6 py-3 bg-white/80 backdrop-blur-md rounded-2xl border-2 border-white shadow-xl shadow-slate-200/50 flex items-center gap-3 group"
                        >
                            <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                                <Users className="h-5 w-5" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros Totales</span>
                                <span className="text-lg font-black text-slate-800 leading-none">
                                    {(userData.totalRegistros || userData.totalAsignados || 0).toLocaleString()} <span className="text-xs text-slate-400 font-medium tracking-normal">Unidades</span>
                                </span>
                            </div>
                        </motion.div>

                        {/* Motivational Info */}
                        {rank > 1 && (
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="px-6 py-3 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-2xl border-2 border-indigo-400/30 shadow-xl shadow-indigo-500/20 flex items-center gap-3 text-white"
                            >
                                <TrendingUp className="h-5 w-5 animate-pulse" strokeWidth={2.5} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Siguiente Nivel</span>
                                    <span className="text-sm font-bold italic tracking-tight uppercase">
                                        ¡A un paso de la gloria!
                                    </span>
                                </div>
                            </motion.div>
                        )}

                        {/* Final Ornament for rank 1 */}
                        {rank === 1 && (
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="px-6 py-3 bg-amber-500 rounded-2xl border-2 border-amber-300 shadow-xl shadow-amber-500/20 flex items-center gap-3 text-white"
                            >
                                <Crown className="h-5 w-5" strokeWidth={3} />
                                <span className="text-sm font-black uppercase tracking-wider">EL REY DE LA ASAMBLEA</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Glow Particle Effects - Extra for Top 3 */}
            {rank <= 3 && (
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_70%)]" />
                </div>
            )}
        </motion.div>
    );
};

export default RankMotivationWidget;

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
            iconColor: "text-slate-400",
            shadow: "shadow-slate-200/50"
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
        } else if (rank <= totalUsers /2) {
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

    // Lógica de Metas Dinámicas
    const currentTotal = userData.totalRegistros || userData.totalAsignados || 0;

    const goalInfo = useMemo(() => {
        const milestones = [50, 100, 150, 200, 300, 400, 500, 750, 1000];
        let nextGoal = milestones.find(m => m> currentTotal) || Math.ceil((currentTotal + 100) /100) * 100;
        const progress = Math.min((currentTotal /nextGoal) * 100, 100);
        const remaining = nextGoal-currentTotal;

        let goalShadow = "shadow-slate-200/50";
        let goalBarColor = "bg-slate-200";
        let goalMessage = "";

        if (remaining <= 5 && remaining> 0) {
            goalMessage = `¡ESTÁS A SOLO ${remaining} DE TU META DE ${nextGoal}!`;
            goalShadow = "shadow-orange-200/50";
            goalBarColor = "bg-orange-500 animate-pulse";
        } else if (progress>= 80) {
            goalMessage = "¡Casi llegas! Un último esfuerzo para el siguiente nivel.";
        } else {
            goalMessage = `Próximo objetivo: ${nextGoal} registros`;
        }

        return { nextGoal, progress, remaining, goalMessage, goalShadow, goalBarColor };
    }, [currentTotal]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className={`relative overflow-hidden rounded-[2.5rem] p-6 lg:p-10 mb-8 border border-white/60 shadow-2xl backdrop-blur-md ${config.bgLight} ${config.shadow}`}
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

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                {/* Rank Badge Container */}
                <div className="relative">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: rank <= 3 ? [0, -5, 5, 0]:0 }}
                        transition={{ duration: 0.5 }}
                        className={`w-32 h-32 md:w-40 md:h-40 rounded-[3rem] bg-gradient-to-br ${config.gradient} flex flex-col items-center justify-center text-white shadow-[0_30px_60px_rgba(0,0,0,0.15)] relative overflow-hidden group border-4 border-white/40`}
                    >
                        {/* Shimmer inside badge */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                        <Icon className="h-10 md:h-12 w-10 md:w-12 mb-1 drop-shadow-md animate-bounce" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] opacity-90 drop-shadow-sm">Puesto</span>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-5xl md:text-6xl lg:text-7xl font-black drop-shadow-2xl tracking-tighter">#{rank}</span>
                        </div>
                    </motion.div>

                    {/* Floating Ornaments - Only for Top ranks */}
                    {rank <= 10 && (
                        <div className="absolute -inset-4 pointer-events-none">
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        y: [0, -30, 0],
                                        x: [0, (i % 2 === 0 ? 15:-15), 0],
                                        opacity: [0, 1, 0],
                                        scale: [0.5, 1.2, 0.5]
                                    }}
                                    transition={{
                                        duration: 2.5 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: i * 0.3
                                    }}
                                    className="absolute text-amber-400"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`
                                    }}
                                >
                                    {rank <= 3 ? <Sparkles className="h-5 w-5" />:<Star className="h-4 w-4" />}
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Podium Label for Top 3 */}
                    {rank <= 3 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            className="absolute -bottom-8 -right-8 px-5 py-2 bg-white border-2 border-slate-100 rounded-full shadow-2xl z-20 flex items-center gap-2"
                        >
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${config.textColor}`}>
                                PODIO GLOBAL
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Message Content */}
                <div className="flex-1 text-center md:text-left pt-6 md:pt-0">
                    <div className="flex flex-col gap-1 mb-4">
                        <motion.div
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-center justify-center md:justify-start gap-4"
                        >
                            <div className={`p-2.5 rounded-2xl ${config.bgLight} border-2 border-white shadow-md`}>
                                <Icon className={`h-7 w-7 ${config.iconColor}`} strokeWidth={3} />
                            </div>
                            <h3 className={`text-3xl md:text-4xl lg:text-5xl font-black ${config.textColor} tracking-tight leading-none uppercase italic`}>
                                {config.title}
                            </h3>
                        </motion.div>
                        <div className={`h-1.5 w-24 bg-gradient-to-r ${config.gradient} rounded-full mx-auto md:mx-0 mt-2 shadow-sm`} />
                    </div>

                    <p className="text-slate-600 font-bold text-lg md:text-xl leading-relaxed max-w-2xl mb-8">
                        {config.message}
                    </p>

                    {/* DYNAMIC PROGRESS SECTION */}
                    <div className="mb-8 p-6 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 shadow-lg">
                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tu Progreso Actual</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-800 tracking-tighter">{currentTotal}</span>
                                    <span className="text-sm font-bold text-slate-400 italic">registros de {goalInfo.nextGoal}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-black px-3 py-1.5 rounded-xl border-2 ${goalInfo.goalShadow} ${config.textColor} bg-white shadow-sm inline-block`}>
                                    {goalInfo.goalMessage}
                                </span>
                            </div>
                        </div>

                        <div className="relative h-6 bg-slate-200/50 rounded-2xl overflow-hidden border border-white/40 p-1">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${goalInfo.progress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={`h-full rounded-xl relative shadow-lg overflow-hidden ${goalInfo.remaining <= 5 ? 'bg-gradient-to-r from-orange-400 to-amber-500':`bg-gradient-to-r ${config.gradient}`}`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
                            </motion.div>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-5">
                        {/* Stats Capsule */}
                        <motion.div
                            whileHover={{ y: -5, scale: 1.05 }}
                            className="px-6 py-4 bg-white/90 backdrop-blur-md rounded-[2rem] border-2 border-white shadow-2xl shadow-slate-200/60 flex items-center gap-4 group"
                        >
                            <div className="p-2.5 bg-emerald-50 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                <Users className="h-6 w-6" strokeWidth={3} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Rendimiento Total</span>
                                <span className="text-xl font-black text-slate-800 leading-none">
                                    {currentTotal.toLocaleString()} <span className="text-xs text-slate-400 font-bold tracking-normal italic uppercase">unidades</span>
                                </span>
                            </div>
                        </motion.div>

                        {/* Motivational Level Badge */}
                        <motion.div
                            whileHover={{ y: -5, scale: 1.05 }}
                            className={`px-6 py-4 bg-gradient-to-br ${config.gradient} rounded-[2rem] border-2 border-white/30 shadow-2xl flex items-center gap-4 text-white group`}
                        >
                            <Sparkles className="h-6 w-6 animate-pulse group-hover:rotate-12 transition-transform" strokeWidth={3} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.15em]">Nivel Actual</span>
                                <span className="text-base font-black italic tracking-tight uppercase leading-none">
                                    {rank <= 3 ? "LEYENDA GLOBAL":rank <= 10 ? "ÉLITE DE ASAMBLEA":"COLABORADOR EXPERTO"}
                                </span>
                            </div>
                        </motion.div>

                        {/* Special Rank Indicator */}
                        {rank === 1 && (
                            <motion.div
                                animate={{ rotate: [0, 1, -1, 0] }}
                                transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 3 }}
                                className="px-6 py-4 bg-slate-900 rounded-[2rem] border-2 border-amber-400 shadow-2xl shadow-amber-500/30 flex items-center gap-4 text-amber-400"
                            >
                                <Crown className="h-6 w-6" strokeWidth={3} />
                                <span className="text-xs font-black uppercase tracking-widest italic">INVICTO</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ambient Particle Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-20 right-20 w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="absolute top-1/2 left-2/3 w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDuration: '4s' }} />
            </div>
        </motion.div>
    );
};

export default RankMotivationWidget;

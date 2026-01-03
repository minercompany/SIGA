import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityWidgetProps {
    data: number[]; // Array de 24 horas
    labels: string[]; // Labels de 00 a 23
}

export function ActivityWidget({ data, labels }: ActivityWidgetProps) {
    const chartData = labels.map((label, index) => ({
        hour: label, // Formato "00", "01"...
        fullLabel: `${label}:00`,
        users: data[index] || 0
    }));

    const maxUsers = Math.max(...data, 0);
    const totalLogins = data.reduce((a, b) => a + b, 0);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 p-3 rounded-xl shadow-2xl">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Clock size={10} /> {payload[0].payload.fullLabel} HS
                    </p>
                    <p className="text-white text-base font-bold flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
                        {payload[0].value} <span className="text-xs text-slate-500 font-normal">usuarios</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-6 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden h-full flex flex-col"
        >
            {/* Fondo decorativo sutil */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-violet-100/30 via-transparent to-transparent opacity-50 pointer-events-none rounded-full blur-3xl -mr-20 -mt-20" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-lg shadow-violet-200/50 text-white transform transition-transform hover:scale-105 duration-300">
                        <Activity size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Actividad</h3>
                        <p className="text-violet-500 text-[10px] font-bold bg-violet-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                            HOY
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{totalLogins}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">accesos</span>
                    </div>
                </div>
            </div>

            <div className="w-full relative z-10 h-[260px] overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorUsersPremium" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#a78bfa" />
                                <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="hour"
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(tick) => `${tick}:00`}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                            dy={10}
                            interval="preserveStartEnd"
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                            allowDecimals={false}
                            domain={[0, 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                            type="monotone"
                            dataKey="users"
                            stroke="url(#strokeGradient)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorUsersPremium)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-50 text-amber-500">
                        <Zap size={12} fill="currentColor" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Pico Máximo</p>
                        <p className="text-sm font-black text-slate-700 leading-none mt-1">{maxUsers} <span className="text-[10px] font-medium text-slate-400">usuarios</span></p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

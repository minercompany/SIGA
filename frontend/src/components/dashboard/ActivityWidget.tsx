"use client";

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Zap, Clock, X, User, Building, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface ActivityWidgetProps {
    data: number[]; // Array de 24 horas
    labels: string[]; // Labels de 00 a 23
}

interface UsuarioHora {
    id: number;
    username: string;
    nombreCompleto: string;
    rol: string;
    sucursal: string;
    horaExacta: string;
}

export function ActivityWidget({ data, labels }: ActivityWidgetProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [usuariosHora, setUsuariosHora] = useState<UsuarioHora[]>([]);
    const [loading, setLoading] = useState(false);
    const [horaFormateada, setHoraFormateada] = useState('');

    const chartData = labels.map((label, index) => ({
        hour: label, // Formato "00", "01"...
        fullLabel: `${label}:00`,
        users: data[index] || 0,
        hourIndex: index
    }));

    const maxUsers = Math.max(...data, 0);
    const totalLogins = data.reduce((a, b) => a + b, 0);

    const handleChartClick = async (chartPayload: any) => {
        if (!chartPayload || !chartPayload.activePayload || chartPayload.activePayload.length === 0) return;

        const clickedData = chartPayload.activePayload[0].payload;
        const hora = clickedData.hourIndex;
        const usuarios = clickedData.users;

        if (usuarios === 0) return; // No abrir si no hay usuarios

        setSelectedHour(hora);
        setModalOpen(true);
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/usuarios/stats-actividad/${hora}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuariosHora(response.data.usuarios || []);
            setHoraFormateada(response.data.horaFormateada || `${String(hora).padStart(2, '0')}:00 hs`);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            setUsuariosHora([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePointClick = async (hora: number, usuarios: number) => {
        if (usuarios === 0) return;

        setSelectedHour(hora);
        setModalOpen(true);
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/usuarios/stats-actividad/${hora}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuariosHora(response.data.usuarios || []);
            setHoraFormateada(response.data.horaFormateada || `${String(hora).padStart(2, '0')}:00 hs`);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            setUsuariosHora([]);
        } finally {
            setLoading(false);
        }
    };

    const getRolStyle = (rol: string) => {
        switch (rol) {
            case 'SUPER_ADMIN':
                return 'bg-gradient-to-r from-red-500 to-orange-500 text-white';
            case 'DIRECTIVO':
                return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white';
            case 'OPERADOR':
                return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
            default:
                return 'bg-slate-200 text-slate-600';
        }
    };

    const getRolLabel = (rol: string) => {
        switch (rol) {
            case 'SUPER_ADMIN': return 'Admin';
            case 'DIRECTIVO': return 'Directivo';
            case 'OPERADOR': return 'Operador';
            default: return rol;
        }
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const usuarios = payload[0].value;
            return (
                <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 p-3 rounded-xl shadow-2xl">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Clock size={10} /> {payload[0].payload.fullLabel} HS
                    </p>
                    <p className="text-white text-base font-bold flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
                        {usuarios} <span className="text-xs text-slate-500 font-normal">usuarios</span>
                    </p>
                    {usuarios > 0 && (
                        <p className="text-violet-400 text-[10px] mt-1 font-medium">
                            Click para ver detalles →
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <>
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

                <div className="w-full relative z-10 flex-1 min-h-[200px] cursor-pointer">
                    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                            onClick={handleChartClick}
                        >
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
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    if (payload.users === 0) return null;
                                    return (
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={6}
                                            fill="#8b5cf6"
                                            stroke="#fff"
                                            strokeWidth={2}
                                            style={{ cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePointClick(payload.hourIndex, payload.users);
                                            }}
                                        />
                                    );
                                }}
                                activeDot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    if (payload.users === 0) return null;
                                    return (
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={10}
                                            fill="#7c3aed"
                                            stroke="#fff"
                                            strokeWidth={3}
                                            style={{ cursor: 'pointer', filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.5))' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePointClick(payload.hourIndex, payload.users);
                                            }}
                                        />
                                    );
                                }}
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
                    <p className="text-[10px] text-slate-400 font-medium">
                        Click en el gráfico para ver detalles
                    </p>
                </div>
            </motion.div>

            {/* Modal de usuarios por hora */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-xl">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Usuarios activos</h3>
                                            <p className="text-violet-200 text-sm">{horaFormateada}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 overflow-y-auto max-h-[60vh]">
                                {loading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-200 border-t-violet-600"></div>
                                    </div>
                                ) : usuariosHora.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400">
                                        <User size={40} className="mx-auto mb-3 opacity-50" />
                                        <p>No hay usuarios en esta hora</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-500 mb-4">
                                            <span className="font-bold text-slate-800">{usuariosHora.length}</span> usuario{usuariosHora.length !== 1 ? 's' : ''} iniciaron sesión
                                        </p>
                                        {usuariosHora.map((usuario, index) => (
                                            <motion.div
                                                key={usuario.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="bg-slate-50 hover:bg-slate-100 rounded-2xl p-4 transition-colors border border-slate-100"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-200">
                                                        {usuario.nombreCompleto?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-800 truncate">
                                                            {usuario.nombreCompleto || usuario.username}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getRolStyle(usuario.rol)}`}>
                                                                <Shield size={8} className="inline mr-1" />
                                                                {getRolLabel(usuario.rol)}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                                <Building size={10} />
                                                                {usuario.sucursal}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full">
                                                            {usuario.horaExacta?.substring(0, 5)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

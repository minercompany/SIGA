'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, MessageSquare, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';

interface Aviso {
    id: number;
    destinatarioId: number;
    titulo: string | null;
    contenido: string;
    prioridad: 'NORMAL' | 'ALTA' | 'CRITICA';
    mostrarModal: boolean;
    requiereConfirmacion: boolean;
    requiereRespuesta: boolean;
    enviadoAt: string;
    leidoAt: string | null;
    confirmadoAt: string | null;
    respondidoAt: string | null;
    estado: string;
    emisorNombre: string;
}

const RESPUESTAS_RAPIDAS = [
    'Leído',
    'Entendido',
    'A la orden',
    'En proceso',
    'Verifico'
];

export default function AvisosBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [avisos, setAvisos] = useState<Aviso[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedAviso, setSelectedAviso] = useState<Aviso | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [respuestaTexto, setRespuestaTexto] = useState('');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Inicializar y polling
    useEffect(() => {
        audioRef.current = new Audio('/sounds/notification.mp3');
        audioRef.current.volume = 0.6;

        loadAvisos();
        const interval = setInterval(loadAvisos, 5000);
        return () => clearInterval(interval);
    }, []);

    // Mostrar modal automático para avisos prioritarios
    useEffect(() => {
        const pendingCritical = avisos.find(
            a => !a.leidoAt && (a.prioridad === 'CRITICA' || a.prioridad === 'ALTA' || a.mostrarModal)
        );
        if (pendingCritical && !showModal) {
            setSelectedAviso(pendingCritical);
            setShowModal(true);
        }
    }, [avisos]);

    const loadAvisos = async () => {
        try {
            const token = localStorage.getItem('token');
            const [avisosRes, countRes] = await Promise.all([
                axios.get('http://localhost:8081/api/avisos/mis-avisos', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:8081/api/avisos/unread-count', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const newCount = countRes.data.unreadCount || 0;

            // Reproducir sonido si hay nuevos
            if (newCount > unreadCount && soundEnabled && audioRef.current) {
                audioRef.current.play().catch(() => { });
            }

            setAvisos(avisosRes.data || []);
            setUnreadCount(newCount);
        } catch (error) {
            console.error('Error loading avisos:', error);
        }
    };

    const marcarLeido = async (avisoId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:8081/api/avisos/${avisoId}/leido`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadAvisos();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const confirmarAviso = async (avisoId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:8081/api/avisos/${avisoId}/confirmar`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            setSelectedAviso(null);
            loadAvisos();
        } catch (error) {
            console.error('Error confirming:', error);
        }
    };

    const responderAviso = async (avisoId: number, tipo: string, texto?: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:8081/api/avisos/${avisoId}/responder`,
                { tipo, texto },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowModal(false);
            setSelectedAviso(null);
            setRespuestaTexto('');
            loadAvisos();
        } catch (error) {
            console.error('Error responding:', error);
        }
    };

    const getPrioridadIcon = (prioridad: string) => {
        switch (prioridad) {
            case 'CRITICA': return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'ALTA': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getPrioridadStyle = (prioridad: string) => {
        switch (prioridad) {
            case 'CRITICA': return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20';
            case 'ALTA': return 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20';
            default: return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20';
        }
    };

    return (
        <>
            {/* Bell Button */}
            <div className="relative">
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <Bell className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </motion.button>

                {/* Dropdown */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-between">
                                <h3 className="text-white font-bold">Avisos</h3>
                                <button onClick={() => setIsOpen(false)}>
                                    <X className="h-5 w-5 text-white/80 hover:text-white" />
                                </button>
                            </div>

                            {/* List */}
                            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                {avisos.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                        <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                        <p>No tenés avisos</p>
                                    </div>
                                ) : (
                                    avisos.map((aviso) => (
                                        <motion.div
                                            key={aviso.id}
                                            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                                            onClick={() => {
                                                setSelectedAviso(aviso);
                                                setShowModal(true);
                                                if (!aviso.leidoAt) marcarLeido(aviso.id);
                                            }}
                                            className={`px-4 py-3 cursor-pointer ${!aviso.leidoAt ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                                                } ${getPrioridadStyle(aviso.prioridad)}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {getPrioridadIcon(aviso.prioridad)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-slate-800 dark:text-white truncate">
                                                        {aviso.titulo || 'Aviso'}
                                                    </p>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                                                        {aviso.contenido}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                                                        <span>{new Date(aviso.enviadoAt).toLocaleDateString('es-PY')}</span>
                                                        {aviso.confirmadoAt && (
                                                            <span className="flex items-center gap-1 text-green-500">
                                                                <CheckCheck className="h-3 w-3" /> Confirmado
                                                            </span>
                                                        )}
                                                        {aviso.respondidoAt && !aviso.confirmadoAt && (
                                                            <span className="flex items-center gap-1 text-blue-500">
                                                                <MessageSquare className="h-3 w-3" /> Respondido
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {!aviso.leidoAt && (
                                                    <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-2"></span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal para aviso detallado */}
            <AnimatePresence>
                {showModal && selectedAviso && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !selectedAviso.requiereConfirmacion && setShowModal(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className={`px-6 py-4 flex items-center gap-3 ${selectedAviso.prioridad === 'CRITICA' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                                    selectedAviso.prioridad === 'ALTA' ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                                        'bg-gradient-to-r from-violet-500 to-purple-600'
                                }`}>
                                {getPrioridadIcon(selectedAviso.prioridad)}
                                <div className="flex-1">
                                    <h2 className="text-white font-bold text-lg">
                                        {selectedAviso.titulo || 'Aviso'}
                                    </h2>
                                    <p className="text-white/80 text-sm">De: {selectedAviso.emisorNombre}</p>
                                </div>
                                {!selectedAviso.requiereConfirmacion && (
                                    <button onClick={() => setShowModal(false)}>
                                        <X className="h-6 w-6 text-white/80 hover:text-white" />
                                    </button>
                                )}
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {selectedAviso.contenido}
                                </p>

                                <p className="text-xs text-slate-400 mt-4">
                                    Enviado: {new Date(selectedAviso.enviadoAt).toLocaleString('es-PY')}
                                </p>
                            </div>

                            {/* Modal Actions */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                                {selectedAviso.requiereRespuesta && !selectedAviso.respondidoAt && (
                                    <>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Respondé el mensaje:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {RESPUESTAS_RAPIDAS.map((resp) => (
                                                <motion.button
                                                    key={resp}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => responderAviso(selectedAviso.id, resp)}
                                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
                                                >
                                                    {resp}
                                                </motion.button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <input
                                                type="text"
                                                value={respuestaTexto}
                                                onChange={(e) => setRespuestaTexto(e.target.value)}
                                                placeholder="O escribí una respuesta..."
                                                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => responderAviso(selectedAviso.id, 'texto_libre', respuestaTexto)}
                                                disabled={!respuestaTexto.trim()}
                                                className="px-4 py-2 bg-violet-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                                            >
                                                Enviar
                                            </motion.button>
                                        </div>
                                    </>
                                )}

                                {selectedAviso.requiereConfirmacion && !selectedAviso.confirmadoAt && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => confirmarAviso(selectedAviso.id)}
                                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30"
                                    >
                                        <Check className="h-5 w-5 inline mr-2" />
                                        Entendido
                                    </motion.button>
                                )}

                                {!selectedAviso.requiereConfirmacion && !selectedAviso.requiereRespuesta && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowModal(false)}
                                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                                    >
                                        Cerrar
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

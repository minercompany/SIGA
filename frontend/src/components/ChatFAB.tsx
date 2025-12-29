'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, ChevronLeft, User } from 'lucide-react';
import axios from 'axios';

interface Mensaje {
    id: number;
    senderId: number;
    senderRole: 'ADMIN' | 'USUARIO';
    contenido: string;
    createdAt: string;
    readAt: string | null;
}

interface Conversacion {
    id: number;
    usuarioNombre?: string;
    lastMessageAt: string | null;
    unreadCount: number;
}

export default function ChatFAB() {
    const [isOpen, setIsOpen] = useState(false);
    const [conversacion, setConversacion] = useState<Conversacion | null>(null);
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cargar conversación al abrir
    useEffect(() => {
        if (isOpen) {
            loadConversacion();
        }
    }, [isOpen]);

    // Polling para nuevos mensajes
    useEffect(() => {
        const interval = setInterval(() => {
            loadUnreadCount();
            if (isOpen && conversacion) {
                loadMensajes(conversacion.id);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isOpen, conversacion]);

    // Scroll al final cuando hay nuevos mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    // Inicializar audio
    useEffect(() => {
        audioRef.current = new Audio('/sounds/chat-notification.mp3');
        audioRef.current.volume = 0.5;
        loadUnreadCount();
    }, []);

    const loadUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/chat/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newCount = res.data.unreadCount || 0;

            // Reproducir sonido si hay nuevos mensajes
            if (newCount > unreadCount && soundEnabled && audioRef.current) {
                audioRef.current.play().catch(() => { });
            }

            setUnreadCount(newCount);
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    const loadConversacion = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/chat/mi-conversacion', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversacion(res.data.conversacion);
            setMensajes(res.data.mensajes || []);
            setUnreadCount(0);
        } catch (error) {
            console.error('Error loading conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMensajes = async (convId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/chat/conversacion/${convId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newMensajes = res.data.mensajes || [];
            if (newMensajes.length > mensajes.length && soundEnabled && audioRef.current) {
                audioRef.current.play().catch(() => { });
            }

            setMensajes(newMensajes);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const enviarMensaje = async () => {
        if (!nuevoMensaje.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/chat/mensaje',
                {
                    contenido: nuevoMensaje,
                    conversacionId: conversacion?.id
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setMensajes([...mensajes, res.data.mensaje]);
                setNuevoMensaje('');
                if (!conversacion) {
                    setConversacion({ id: res.data.conversacionId, unreadCount: 0, lastMessageAt: null });
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    };

    return (
        <>
            {/* FAB Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center hover:scale-110 transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
            >
                <MessageCircle className="h-7 w-7 text-white" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </motion.button>

            {/* Chat Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed right-0 top-0 h-full w-full sm:w-96 lg:w-[420px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4 flex items-center gap-3">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="lg:hidden p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <ChevronLeft className="h-5 w-5 text-white" />
                                </button>
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-white font-bold text-lg">Administración</h2>
                                    <p className="text-white/80 text-sm flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                                        En línea
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="hidden lg:block p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5 text-white" />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-800/50">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                    </div>
                                ) : mensajes.length === 0 ? (
                                    <div className="text-center text-slate-500 dark:text-slate-400 py-10">
                                        <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p className="font-medium">Escribí tu consulta a Administración</p>
                                        <p className="text-sm mt-1">Tu mensaje será respondido a la brevedad</p>
                                    </div>
                                ) : (
                                    mensajes.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.senderRole === 'USUARIO' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm ${msg.senderRole === 'USUARIO'
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md'
                                                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-md'
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.contenido}</p>
                                                <p className={`text-xs mt-1 ${msg.senderRole === 'USUARIO' ? 'text-white/70' : 'text-slate-400'
                                                    }`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString('es-PY', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                    {msg.senderRole === 'USUARIO' && msg.readAt && (
                                                        <span className="ml-2">✓✓</span>
                                                    )}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={nuevoMensaje}
                                        onChange={(e) => setNuevoMensaje(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Escribí tu mensaje..."
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                                    />
                                    <motion.button
                                        onClick={enviarMensaje}
                                        disabled={!nuevoMensaje.trim()}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
                                    >
                                        <Send className="h-5 w-5" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

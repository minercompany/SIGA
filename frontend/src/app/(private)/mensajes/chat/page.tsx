'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, User, MessageCircle, Clock, Check, CheckCheck, Sparkles } from 'lucide-react';
import axios from 'axios';

interface Conversacion {
    id: number;
    usuarioId: number;
    usuarioNombre: string;
    lastMessageAt: string | null;
    unreadCount: number;
    estado: string;
}

interface Mensaje {
    id: number;
    senderId: number;
    senderRole: 'ADMIN' | 'USUARIO';
    contenido: string;
    createdAt: string;
    readAt: string | null;
}

export default function AdminChatPage() {
    const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversacion | null>(null);
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Cargar conversaciones inicial y polling
    useEffect(() => {
        loadConversaciones();
        const interval = setInterval(() => {
            loadConversaciones();
            if (selectedConv) {
                loadMensajes(selectedConv.id);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedConv]);

    // Scroll al fondo al recibir mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    const loadConversaciones = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:8081/api/chat/conversaciones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversaciones(res.data);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const loadMensajes = async (convId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:8081/api/chat/conversacion/${convId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMensajes(res.data.mensajes || []);
            // Actualizar unread count localmente
            setConversaciones(prev => prev.map(c =>
                c.id === convId ? { ...c, unreadCount: 0 } : c
            ));
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const enviarMensaje = async () => {
        if (!nuevoMensaje.trim() || !selectedConv) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:8081/api/chat/mensaje',
                {
                    contenido: nuevoMensaje,
                    conversacionId: selectedConv.id
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setMensajes([...mensajes, res.data.mensaje]);
                setNuevoMensaje('');
                loadConversaciones(); // Actualizar orden
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

    const filteredConversaciones = conversaciones.filter(c =>
        c.usuarioNombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Ayer';
        } else {
            return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' });
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 pb-20">
            {/* Header Premium */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl shadow-lg shadow-teal-200">
                            <MessageCircle className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Centro de <span className="text-teal-600 italic">Mensajería</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium">Conversaciones con socios en tiempo real</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">En Línea</span>
                    </div>
                </div>
            </motion.div>

            {/* Chat Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="h-[calc(100vh-14rem)] flex bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
                {/* Sidebar Lista de Conversaciones */}
                <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
                    {/* Search Header */}
                    <div className="p-5 border-b border-slate-100 bg-white">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar socio..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversaciones.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="text-slate-400 font-medium">Sin conversaciones</p>
                            </div>
                        ) : (
                            filteredConversaciones.map((conv) => (
                                <motion.button
                                    key={conv.id}
                                    whileHover={{ backgroundColor: 'rgba(20, 184, 166, 0.05)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setSelectedConv(conv);
                                        loadMensajes(conv.id);
                                    }}
                                    className={`w-full p-4 flex items-start gap-4 border-b border-slate-50 transition-all ${selectedConv?.id === conv.id
                                            ? 'bg-teal-50 border-l-4 border-l-teal-500'
                                            : 'border-l-4 border-l-transparent hover:border-l-slate-200'
                                        }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg ${selectedConv?.id === conv.id
                                                ? 'bg-gradient-to-br from-teal-500 to-emerald-500 shadow-teal-200'
                                                : 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-200'
                                            }`}>
                                            {conv.usuarioNombre?.charAt(0)}
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-lg">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold text-sm truncate ${selectedConv?.id === conv.id ? 'text-teal-700' : 'text-slate-700'
                                                }`}>
                                                {conv.usuarioNombre}
                                            </span>
                                            {conv.lastMessageAt && (
                                                <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap ml-2 bg-slate-100 px-2 py-0.5 rounded-full">
                                                    {formatDate(conv.lastMessageAt)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 truncate font-medium">
                                            Toca para ver conversación
                                        </p>
                                    </div>
                                </motion.button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-white">
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-teal-200">
                                        {selectedConv.usuarioNombre?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-lg">
                                            {selectedConv.usuarioNombre}
                                        </h3>
                                        <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                            Socio activo
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chat Privado</span>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {mensajes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <Sparkles className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <p className="text-slate-400 font-medium">Sin mensajes aún</p>
                                        <p className="text-slate-300 text-sm">Iniciá la conversación</p>
                                    </div>
                                ) : (
                                    mensajes.map((msg, idx) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className={`flex ${msg.senderRole === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] px-5 py-3 ${msg.senderRole === 'ADMIN'
                                                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl rounded-br-md shadow-lg shadow-teal-200'
                                                        : 'bg-white text-slate-700 rounded-2xl rounded-bl-md border border-slate-100 shadow-sm'
                                                    }`}
                                            >
                                                <p className="text-sm leading-relaxed">{msg.contenido}</p>
                                                <div className={`flex items-center justify-end gap-1.5 mt-2 text-[10px] font-semibold ${msg.senderRole === 'ADMIN' ? 'text-teal-100' : 'text-slate-400'
                                                    }`}>
                                                    <span>
                                                        {new Date(msg.createdAt).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {msg.senderRole === 'ADMIN' && (
                                                        msg.readAt ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-5 bg-white border-t border-slate-100">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={nuevoMensaje}
                                        onChange={(e) => setNuevoMensaje(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Escribí un mensaje..."
                                        className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                    />
                                    <motion.button
                                        onClick={enviarMensaje}
                                        disabled={!nuevoMensaje.trim()}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-200 font-bold"
                                    >
                                        <Send className="h-5 w-5" />
                                    </motion.button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center"
                            >
                                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-full flex items-center justify-center mb-6 mx-auto border-4 border-white shadow-xl">
                                    <MessageCircle className="h-12 w-12 text-slate-300" />
                                </div>
                                <p className="text-xl font-black text-slate-700 mb-2">Seleccioná una conversación</p>
                                <p className="text-slate-400 font-medium">Para ver el historial de mensajes</p>
                            </motion.div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

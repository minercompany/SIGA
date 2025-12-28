'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, User, MessageCircle, Clock, Check, CheckCheck } from 'lucide-react';
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
            const res = await axios.get('/api/api/chat/conversaciones', {
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
            const res = await axios.get(`/api/api/chat/conversacion/${convId}`, {
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
            const res = await axios.post('/api/api/chat/mensaje',
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

    return (
        <div className="h-[calc(100vh-8rem)] flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Sidebar Lista de Conversaciones */}
            <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-200 bg-white">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-emerald-500" />
                        Mensajes
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar socio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversaciones.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => {
                                setSelectedConv(conv);
                                loadMensajes(conv.id);
                            }}
                            className={`w-full p-4 flex items-start gap-3 border-b border-slate-100 transition-colors hover:bg-slate-100 ${selectedConv?.id === conv.id ? 'bg-emerald-50' : ''
                                }`}
                        >
                            <div className="relative">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                                    {conv.usuarioNombre?.charAt(0)}
                                </div>
                                {conv.unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                                        {conv.unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-semibold text-sm truncate ${selectedConv?.id === conv.id ? 'text-emerald-700' : 'text-slate-700'}`}>
                                        {conv.usuarioNombre}
                                    </span>
                                    {conv.lastMessageAt && (
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                            {new Date(conv.lastMessageAt).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                    Ver conversación
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50/50">
                {selectedConv ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                                    {selectedConv.usuarioNombre?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">
                                        {selectedConv.usuarioNombre}
                                    </h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        Socio activo
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {mensajes.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.senderRole === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${msg.senderRole === 'ADMIN'
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-br-none'
                                                : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.contenido}</p>
                                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${msg.senderRole === 'ADMIN' ? 'text-emerald-100' : 'text-slate-400'
                                            }`}>
                                            <span>
                                                {new Date(msg.createdAt).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.senderRole === 'ADMIN' && (
                                                msg.readAt ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={nuevoMensaje}
                                    onChange={(e) => setNuevoMensaje(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Escribí un mensaje..."
                                    className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                />
                                <button
                                    onClick={enviarMensaje}
                                    disabled={!nuevoMensaje.trim()}
                                    className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="h-10 w-10 text-slate-300" />
                        </div>
                        <p className="text-lg font-medium">Seleccioná una conversación</p>
                        <p className="text-sm">Para ver el historial de mensajes</p>
                    </div>
                )}
            </div>
        </div>
    );
}

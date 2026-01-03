'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, ChevronLeft, User, Search, Plus, Smile, Paperclip, Check, CheckCheck } from 'lucide-react';
import axios from 'axios';

interface Mensaje {
    id: number;
    senderId: number;
    senderRole: 'ADMIN' | 'USUARIO';
    contenido: string;
    createdAt: string;
    readAt: string | null;
    sentAt: string;
}

interface Conversacion {
    id: number;
    usuarioId?: number;
    usuarioNombre?: string;
    lastMessageAt: string | null;
    unreadCount: number;
    lastMessage?: string;
}

interface Usuario {
    id: number;
    nombreCompleto: string;
    username: string;
    cargo?: string;
    rol?: string;
}

// Emojis organizados por categorías
const EMOJI_CATEGORIES = {
    'Caritas': ['😀', '😃', '�', '😁', '�😊', '🥰', '�', '🤩', '😘', '😜', '🤔', '😴', '😅', '😂', '🥹', '😢', '😭', '😤', '🤬', '😱'],
    'Gestos': ['�👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '✌️', '🤞', '👋', '👊', '✋', '🤙', '👆', '👇'],
    'Corazones': ['❤️', '🧡', '💛', '�', '�', '💜', '🖤', '🤍', '💔', '❤️‍🔥', '�', '💖', '💗', '💘'],
    'Símbolos': ['✅', '❌', '⭐', '🔥', '💡', '📌', '⚠️', '❓', '❗', '🎉', '🎊', '🏆', '📎', '📍', '🔔', '�']
};


export default function ChatFAB() {
    // Estados principales
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'list' | 'chat' | 'newChat'>('list');

    // Datos
    const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversacion | null>(null);
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Búsqueda de usuarios
    const [searchTerm, setSearchTerm] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<Usuario[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Input de mensaje
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [showEmojis, setShowEmojis] = useState(false);
    const [emojiCategory, setEmojiCategory] = useState('Caritas');

    // UI
    const [loading, setLoading] = useState(false);
    const [soundEnabled] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Inicializar y cargar datos
    useEffect(() => {
        audioRef.current = new Audio('/sounds/chat-notification.mp3');
        audioRef.current.volume = 0.5;
        loadUnreadCount();

        // Obtener ID del usuario actual desde localStorage
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUserId(user.id);
            }
        } catch (e) {
            console.error('Error parsing user from localStorage:', e);
        }
    }, []);

    // Cargar conversaciones cuando se abre
    useEffect(() => {
        if (isOpen) {
            loadConversaciones();
        }
    }, [isOpen]);

    // Polling para nuevos mensajes
    useEffect(() => {
        const interval = setInterval(() => {
            const token = localStorage.getItem('token');
            if (!token) return;

            loadUnreadCount();
            if (isOpen && view === 'chat' && selectedConv) {
                loadMensajes(selectedConv.id);
            }
            if (isOpen && view === 'list') {
                loadConversaciones();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [isOpen, view, selectedConv]);

    // Scroll al final cuando hay nuevos mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    // Búsqueda de usuarios con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length>= 1 && view === 'newChat') {
                searchUsers(searchTerm);
            } else {
                setUserSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, view]);

    const loadUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return; // Silent return if no token

            const res = await axios.get('/api/chat/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newCount = res.data.unreadCount || 0;
            if (newCount> unreadCount && soundEnabled && audioRef.current) {
                audioRef.current.play().catch(() => { });
            }
            setUnreadCount(newCount);
        } catch (error) {
            // Ignore 403/401 logging to prevent console spam during logout
            if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
                return;
            }
            console.error('Error loading unread count:', error);
        }
    };

    const loadConversaciones = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/chat/conversaciones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversaciones(res.data || []);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const loadMensajes = async (convId: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/chat/conversacion/${convId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newMensajes = res.data.mensajes || [];
            if (newMensajes.length> mensajes.length && soundEnabled && audioRef.current) {
                audioRef.current.play().catch(() => { });
            }
            setMensajes(newMensajes);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const searchUsers = async (term: string) => {
        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/usuarios/buscar?term=${term}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserSearchResults(res.data || []);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const openConversation = async (conv: Conversacion) => {
        setSelectedConv(conv);
        setView('chat');
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/chat/conversacion/${conv.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMensajes(res.data.mensajes || []);
        } catch (error) {
            console.error('Error opening conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    const startNewConversation = async (usuario: Usuario) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`/api/chat/iniciar-con-usuario/${usuario.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.conversacion) {
                setSelectedConv(res.data.conversacion);
                setMensajes(res.data.mensajes || []);
                setView('chat');
                setSearchTerm('');
                setUserSearchResults([]);
                loadConversaciones();
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    const enviarMensaje = async () => {
        if (!nuevoMensaje.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/chat/mensaje',
                { contenido: nuevoMensaje, conversacionId: selectedConv?.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setMensajes([...mensajes, res.data.mensaje]);
                setNuevoMensaje('');
                setShowEmojis(false);
                if (!selectedConv) {
                    setSelectedConv({ id: res.data.conversacionId, unreadCount: 0, lastMessageAt: null });
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

    const insertEmoji = (emoji: string) => {
        setNuevoMensaje(prev => prev + emoji);
        inputRef.current?.focus();
    };

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) /(1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('es-PY', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' });
        }
    };

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    };

    return (
        <>
            {/* FAB Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-500 rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center hover:scale-110 transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
            >
                <MessageCircle className="h-7 w-7 text-white" />
                {unreadCount> 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg"
                    >
                        {unreadCount> 9 ? '9+':unreadCount}
                    </motion.span>
                )}
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop para móvil */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
                        />

                        {/* Panel principal */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed right-0 top-0 h-full w-full sm:w-96 lg:w-[420px] bg-white shadow-2xl z-50 flex flex-col"
                        >
                            {/* ===== VISTA: LISTA DE CONVERSACIONES ===== */}
                            {view === 'list' && (
                                <>
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-500 p-4 flex items-center justify-between">
                                        <h2 className="text-white font-bold text-lg">Mensajes</h2>
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setView('newChat')}
                                                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                            >
                                                <Plus className="h-5 w-5 text-white" />
                                            </motion.button>
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                            >
                                                <X className="h-5 w-5 text-white" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Lista de conversaciones */}
                                    <div className="flex-1 overflow-y-auto">
                                        {conversaciones.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
                                                <MessageCircle className="h-16 w-16 mb-4 opacity-30" />
                                                <p className="font-medium text-center">No tenés conversaciones</p>
                                                <p className="text-sm text-center mt-1">Tocá + para iniciar una nueva</p>
                                            </div>
                                        ):(
                                            conversaciones.map((conv) => (
                                                <motion.button
                                                    key={conv.id}
                                                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                                                    onClick={() => openConversation(conv)}
                                                    className="w-full p-4 flex items-center gap-3 border-b border-slate-100 text-left"
                                                >
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                        {getInitials(conv.usuarioNombre || 'U')}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-slate-800 truncate">
                                                                {conv.usuarioNombre || 'Usuario'}
                                                            </span>
                                                            <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                                                                {formatTime(conv.lastMessageAt)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-0.5">
                                                            <span className="text-sm text-slate-500 truncate">
                                                                {conv.lastMessage || 'Sin mensajes'}
                                                            </span>
                                                            {conv.unreadCount> 0 && (
                                                                <span className="w-5 h-5 bg-emerald-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 ml-2">
                                                                    {conv.unreadCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ===== VISTA: NUEVA CONVERSACIÓN ===== */}
                            {view === 'newChat' && (
                                <>
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-500 p-4 flex items-center gap-3">
                                        <button
                                            onClick={() => { setView('list'); setSearchTerm(''); setUserSearchResults([]); }}
                                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                        >
                                            <ChevronLeft className="h-5 w-5 text-white" />
                                        </button>
                                        <h2 className="text-white font-bold text-lg">Nueva conversación</h2>
                                    </div>

                                    {/* Buscador */}
                                    <div className="p-4 border-b border-slate-100">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar por nombre o cédula..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Resultados */}
                                    <div className="flex-1 overflow-y-auto">
                                        {isSearching ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ):userSearchResults.length> 0 ? (
                                            userSearchResults.map((user) => (
                                                <motion.button
                                                    key={user.id}
                                                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                                                    onClick={() => startNewConversation(user)}
                                                    className="w-full p-4 flex items-center gap-3 border-b border-slate-100 text-left"
                                                >
                                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {getInitials(user.nombreCompleto)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-800 truncate">{user.nombreCompleto}</p>
                                                        <p className="text-sm text-slate-500 truncate">
                                                            {user.username} {user.cargo && `• ${user.cargo}`}
                                                        </p>
                                                    </div>
                                                </motion.button>
                                            ))
                                        ):searchTerm.length> 0 ? (
                                            <div className="text-center py-8 text-slate-400">
                                                <User className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                                <p>No se encontraron usuarios</p>
                                            </div>
                                        ):(
                                            <div className="text-center py-8 text-slate-400">
                                                <Search className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                                <p>Buscá un usuario para chatear</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ===== VISTA: CONVERSACIÓN ===== */}
                            {view === 'chat' && (
                                <>
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-500 p-4 flex items-center gap-3">
                                        <button
                                            onClick={() => { setView('list'); setSelectedConv(null); setMensajes([]); }}
                                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                        >
                                            <ChevronLeft className="h-5 w-5 text-white" />
                                        </button>
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-white font-bold">{selectedConv?.usuarioNombre || 'Chat'}</h2>
                                            <p className="text-white/70 text-xs flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                                                En línea
                                            </p>
                                        </div>
                                    </div>

                                    {/* Mensajes */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                                        {loading ? (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                                            </div>
                                        ):mensajes.length === 0 ? (
                                            <div className="text-center text-slate-400 py-10">
                                                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                                <p className="font-medium">Iniciá la conversación</p>
                                                <p className="text-sm mt-1">Enviá un mensaje para comenzar</p>
                                            </div>
                                        ):(
                                            mensajes.map((msg) => {
                                                // Mensaje mío = a la derecha, mensaje del otro = a la izquierda
                                                const isMyMessage = msg.senderId === currentUserId;
                                                return (
                                                    <motion.div
                                                        key={msg.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`flex ${isMyMessage ? 'justify-end':'justify-start'}`}
                                                    >
                                                        <div
                                                            className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm ${isMyMessage
                                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md'
                                                               :'bg-white text-slate-800 rounded-bl-md'
                                                                }`}
                                                        >
                                                            <p className="text-sm whitespace-pre-wrap">{msg.contenido}</p>
                                                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMyMessage ? 'text-white/70':'text-slate-400'
                                                                }`}>
                                                                <span className="text-xs">
                                                                    {new Date(msg.createdAt).toLocaleTimeString('es-PY', {
                                                                        hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </span>
                                                                {isMyMessage && (
                                                                    msg.readAt ? (
                                                                        <CheckCheck className="h-3.5 w-3.5" />
                                                                    ):(
                                                                        <Check className="h-3.5 w-3.5" />
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Selector de Emojis con categorías */}
                                    <AnimatePresence>
                                        {showEmojis && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="bg-slate-50 border-t border-slate-200"
                                            >
                                                {/* Tabs de categorías */}
                                                <div className="flex border-b border-slate-200 bg-white">
                                                    {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                                                        <button
                                                            key={cat}
                                                            onClick={() => setEmojiCategory(cat)}
                                                            className={`flex-1 py-2 text-xs font-medium transition-colors ${emojiCategory === cat
                                                                ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-50'
                                                               :'text-slate-500 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                                {/* Grid de emojis */}
                                                <div className="p-3 grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                                                    {(EMOJI_CATEGORIES[emojiCategory as keyof typeof EMOJI_CATEGORIES] || []).map((emoji: string) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => insertEmoji(emoji)}
                                                            className="text-xl hover:bg-white rounded-lg p-1.5 transition-colors hover:scale-110"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Input */}
                                    <div className="p-3 bg-white border-t border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setShowEmojis(!showEmojis)}
                                                className={`p-2.5 rounded-full transition-colors ${showEmojis ? 'bg-emerald-100 text-emerald-500':'text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                <Smile className="h-5 w-5" />
                                            </motion.button>
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={nuevoMensaje}
                                                onChange={(e) => setNuevoMensaje(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Escribí un mensaje..."
                                                className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <motion.button
                                                onClick={enviarMensaje}
                                                disabled={!nuevoMensaje.trim()}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white disabled:opacity-50 shadow-lg"
                                            >
                                                <Send className="h-4 w-4" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

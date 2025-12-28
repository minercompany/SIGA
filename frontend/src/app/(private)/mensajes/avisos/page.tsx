'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Bell,
    Filter,
    Users,
    User,
    AlertTriangle,
    CheckCircle,
    BarChart2,
    Search,
    X,
    Megaphone,
    Sparkles,
    Check,
    AlertCircle,
    Info,
    ChevronRight
} from 'lucide-react';
import axios from 'axios';

interface Aviso {
    id: number;
    titulo: string;
    contenido: string;
    tipo: 'MASIVO' | 'INDIVIDUAL' | 'POR_FILTRO';
    prioridad: 'NORMAL' | 'ALTA' | 'CRITICA';
    createdAt: string;
    emisorNombre: string;
    estadoGeneral: string;
}

interface UserResult {
    id: number | null;
    idSocio?: number;
    nombreCompleto: string;
    cedula?: string;
    username?: string;
}

export default function AdminAvisosPage() {
    const [activeTab, setActiveTab] = useState<'crear' | 'historial'>('crear');
    const [avisos, setAvisos] = useState<Aviso[]>([]);

    // Form State
    const [tipo, setTipo] = useState<'MASIVO' | 'INDIVIDUAL' | 'POR_FILTRO'>('MASIVO');
    const [prioridad, setPrioridad] = useState<'NORMAL' | 'ALTA' | 'CRITICA'>('NORMAL');
    const [titulo, setTitulo] = useState('');
    const [contenido, setContenido] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);
    const [requiereConfirmacion, setRequiereConfirmacion] = useState(false);
    const [requiereRespuesta, setRequiereRespuesta] = useState(false);

    // Filtros
    const [filtroRol, setFiltroRol] = useState('');

    // Individual Search
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Initial Load
    useEffect(() => {
        if (activeTab === 'historial') {
            loadAvisos();
        }
    }, [activeTab]);

    // Search Users
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 3 && !selectedUser) {
                setIsSearching(true);
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`http://localhost:8081/api/usuarios/unificados?term=${searchTerm}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSearchResults(res.data);
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedUser]);

    const loadAvisos = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:8081/api/avisos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAvisos(res.data);
        } catch (error) {
            console.error('Error loading avisos:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!titulo || !contenido) return;
        if (tipo === 'INDIVIDUAL' && !selectedUser) return;

        setIsSending(true);
        try {
            const token = localStorage.getItem('token');
            const payload: any = {
                tipo,
                prioridad,
                titulo,
                contenido,
                mostrarModal,
                requiereConfirmacion,
                requiereRespuesta
            };

            if (tipo === 'INDIVIDUAL') {
                if (!selectedUser?.id) {
                    alert("Este socio no es un usuario del sistema (ID nulo). No se le puede enviar aviso.");
                    setIsSending(false);
                    return;
                }
                payload.usuarioId = selectedUser.id;
            } else if (tipo === 'POR_FILTRO') {
                if (filtroRol) payload.filtroRol = filtroRol;
            }

            const res = await axios.post('http://localhost:8081/api/avisos', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // Show custom success modal
                setSuccessMessage(`Aviso enviado exitosamente a ${res.data.destinatarios} usuarios.`);
                setShowSuccessModal(true);

                // Reset form
                setTitulo('');
                setContenido('');
                setSelectedUser(null);
                setSearchTerm('');
                // setActiveTab('historial'); // Wait for user to close modal or redirect? 
                // Better to stay on 'crear' or let modal close trigger tab switch?
                // Logic: Modal appears. User clicks "Aceptar". Then switch to history.
            }
        } catch (error) {
            console.error('Error creating aviso:', error);
            alert('Error al enviar el aviso');
        } finally {
            setIsSending(false);
        }
    };

    const priorities = {
        NORMAL: { color: 'bg-emerald-500', label: 'Normal', icon: Info },
        ALTA: { color: 'bg-amber-500', label: 'Alta', icon: AlertTriangle },
        CRITICA: { color: 'bg-red-500', label: 'Crítica', icon: AlertCircle },
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Megaphone className="h-64 w-64 text-white transform rotate-12" />
                </div>
                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-2"
                    >
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                            Panel Administrativo
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
                    >
                        Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Comunicación</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-lg max-w-2xl"
                    >
                        Redactá y enviá avisos oficiales a socios y operadores. Gestioná prioridades, confirmaciones de lectura y respuestas rápidas.
                    </motion.p>
                </div>
            </div>

            {/* Custom Tabs */}
            <div className="flex justify-center">
                <div className="bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 inline-flex relative">
                    {['crear', 'historial'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`relative px-8 py-3 rounded-xl text-sm font-bold transition-colors z-10 ${activeTab === tab
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-100 dark:border-slate-700"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-20 flex items-center gap-2">
                                {tab === 'crear' ? <Send className="h-4 w-4" /> : <BarChart2 className="h-4 w-4" />}
                                {tab === 'crear' ? 'Redactar Aviso' : 'Historial de Envíos'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'crear' ? (
                    <motion.div
                        key="crear"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Card: Tipo de Envío */}
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-purple-500" />
                                    1. Seleccioná el Alcance
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { id: 'MASIVO', icon: Users, label: 'Masivo Generál', desc: 'Enviar a toda la base de usuarios activas.', color: 'emerald' },
                                        { id: 'POR_FILTRO', icon: Filter, label: 'Por Filtro', desc: 'Segmentar por Rol (Directivos, Operadores, Socios).', color: 'blue' },
                                        { id: 'INDIVIDUAL', icon: User, label: 'Individual', desc: 'Mensaje directo a un usuario específico.', color: 'violet' }
                                    ].map((option) => (
                                        <div
                                            key={option.id}
                                            onClick={() => setTipo(option.id as any)}
                                            className={`relative cursor-pointer group p-6 rounded-2xl border-2 transition-all duration-300 ${tipo === option.id
                                                ? `border-${option.color}-500 bg-${option.color}-50/50 dark:bg-${option.color}-900/10`
                                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                                }`}
                                        >
                                            <div className={`h-12 w-12 rounded-xl mb-4 flex items-center justify-center transition-colors ${tipo === option.id ? `bg-${option.color}-500 text-white shadow-lg shadow-${option.color}-500/30` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                <option.icon className="h-6 w-6" />
                                            </div>
                                            <h4 className={`font-bold text-lg mb-1 ${tipo === option.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {option.label}
                                            </h4>
                                            <p className="text-sm text-slate-500">
                                                {option.desc}
                                            </p>
                                            {tipo === option.id && (
                                                <motion.div
                                                    layoutId="check"
                                                    className={`absolute top-4 right-4 h-6 w-6 rounded-full bg-${option.color}-500 flex items-center justify-center text-white`}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </motion.div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Dynamic Filters */}
                                <AnimatePresence>
                                    {tipo !== 'MASIVO' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-8 mt-4 border-t border-slate-100 dark:border-slate-800">
                                                {tipo === 'INDIVIDUAL' && (
                                                    <div className="max-w-xl">
                                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Buscar Usuario</label>
                                                        <div className="relative">
                                                            {selectedUser ? (
                                                                <motion.div
                                                                    initial={{ scale: 0.95, opacity: 0 }}
                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                    className="flex items-center justify-between p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl"
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-10 w-10 rounded-full bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-200 flex items-center justify-center font-bold text-lg">
                                                                            {selectedUser.nombreCompleto.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-violet-900 dark:text-violet-200">{selectedUser.nombreCompleto}</p>
                                                                            <p className="text-sm text-violet-600 dark:text-violet-400">CI: {selectedUser.cedula}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setSelectedUser(null)}
                                                                        className="p-2 hover:bg-violet-200 dark:hover:bg-violet-800 rounded-lg transition-colors"
                                                                    >
                                                                        <X className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                                                    </button>
                                                                </motion.div>
                                                            ) : (
                                                                <>
                                                                    <div className="relative group">
                                                                        <input
                                                                            type="text"
                                                                            value={searchTerm}
                                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                                            placeholder="Buscar por Nombre, Céndula o Usuario..."
                                                                            className="w-full pl-12 pr-10 py-4 bg-white dark:bg-slate-950/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 outline-none transition-all font-bold text-lg text-slate-800 dark:text-white placeholder:text-slate-400 backdrop-blur-sm"
                                                                        />
                                                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-violet-500" />
                                                                        {isSearching && (
                                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                                <div className="h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}

                                                            <AnimatePresence>
                                                                {searchResults.length > 0 ? (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0 }}
                                                                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto z-20"
                                                                    >
                                                                        {searchResults.map((u, i) => (
                                                                            <motion.div
                                                                                key={u.id || i}
                                                                                initial={{ opacity: 0, x: -10 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                transition={{ delay: i * 0.05 }}
                                                                                onClick={() => { setSelectedUser(u); setSearchResults([]); setSearchTerm(''); }}
                                                                                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700 last:border-0 flex items-center justify-between group"
                                                                            >
                                                                                <div>
                                                                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{u.nombreCompleto}</p>
                                                                                    <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                                                                                        {u.cedula ? `CI: ${u.cedula}` : `Usuario: ${u.username || 'N/A'}`}
                                                                                    </p>
                                                                                </div>
                                                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                                                                            </motion.div>
                                                                        ))}
                                                                    </motion.div>
                                                                ) : searchTerm.length >= 3 && !isSearching && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0 }}
                                                                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 z-20 text-center"
                                                                    >
                                                                        <p className="text-slate-500 dark:text-slate-400 text-sm">No se encontraron usuarios</p>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                )}
                                                {tipo === 'POR_FILTRO' && (
                                                    <div className="max-w-xl">
                                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Seleccionar Rol</label>
                                                        <select
                                                            value={filtroRol}
                                                            onChange={(e) => setFiltroRol(e.target.value)}
                                                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-950/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 outline-none transition-all font-medium text-slate-900 dark:text-white appearance-none"
                                                        >
                                                            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Todos los roles</option>
                                                            <option value="DIRECTIVO" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Directivo</option>
                                                            <option value="OPERADOR" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Operador</option>
                                                            <option value="USUARIO_SOCIO" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Socio</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Card: Contenido */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                        <Megaphone className="h-5 w-5 text-emerald-500" />
                                        2. Componé tu Mensaje
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título</label>
                                            <input
                                                type="text"
                                                value={titulo}
                                                onChange={(e) => setTitulo(e.target.value)}
                                                placeholder="Ingresá un título para el aviso..."
                                                className="w-full px-4 py-3 text-xl font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
                                            />
                                        </div>
                                        <div>
                                            <textarea
                                                rows={8}
                                                value={contenido}
                                                onChange={(e) => setContenido(e.target.value)}
                                                placeholder="Escribí el contenido detallado aquí..."
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl text-lg text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-400 resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Configuración */}
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Configuración</h3>

                                        <div className="space-y-6">
                                            {/* Prioridad */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Prioridad</label>
                                                <div className="flex gap-2">
                                                    {(Object.keys(priorities) as Array<keyof typeof priorities>).map((p) => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => setPrioridad(p)}
                                                            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${prioridad === p
                                                                ? `border-${priorities[p].color.split('-')[1]}-500 bg-${priorities[p].color.split('-')[1]}-50 dark:bg-opacity-10 text-slate-900 dark:text-white`
                                                                : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            {prioridad === p && (
                                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-1">
                                                                    {(() => {
                                                                        const Icon = priorities[p].icon;
                                                                        return <Icon className={`h-5 w-5 text-${priorities[p].color.split('-')[1]}-500`} />;
                                                                    })()}
                                                                </motion.div>
                                                            )}
                                                            <span className="text-xs font-bold">{priorities[p].label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Toggles */}
                                            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                {[
                                                    { label: 'Mostrar Popup (Modal)', desc: 'Interrumpe la navegación del usuario', checked: mostrarModal, set: setMostrarModal },
                                                    { label: 'Requerir Confirmación', desc: 'Obliga a dar clic en "Entendido"', checked: requiereConfirmacion, set: setRequiereConfirmacion },
                                                    { label: 'Permitir Respuesta', desc: 'Habilita chat rápido en el aviso', checked: requiereRespuesta, set: setRequiereRespuesta }
                                                ].map((opt, i) => (
                                                    <label key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                                        <div className="relative flex items-center mt-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={opt.checked}
                                                                onChange={(e) => opt.set(e.target.checked)}
                                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition-all checked:border-emerald-500 checked:bg-emerald-500 hover:border-emerald-400"
                                                            />
                                                            <Check className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{opt.label}</p>
                                                            <p className="text-xs text-slate-400 leading-tight">{opt.desc}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <motion.button
                                        type="submit"
                                        disabled={!titulo || !contenido || isSending}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black text-xl shadow-xl shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out skew-y-12" />
                                        {isSending ? (
                                            <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="h-6 w-6" />
                                                <span>Enviar Aviso</span>
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="historial"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        {/* Custom Table Component */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        {['Aviso Detalles', 'Destinatarios', 'Fecha / Hora', 'Estado', 'Acciones'].map((h) => (
                                            <th key={h} className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {avisos.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-slate-400">
                                                <div className="flex flex-col items-center">
                                                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                        <Bell className="h-8 w-8 text-slate-300" />
                                                    </div>
                                                    <p>Aún no hay avisos enviados</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        avisos.map((aviso, i) => (
                                            <motion.tr
                                                key={aviso.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${aviso.prioridad === 'CRITICA' ? 'bg-red-500' : aviso.prioridad === 'ALTA' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                        <div>
                                                            <div className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1">{aviso.titulo}</div>
                                                            <div className="text-sm text-slate-500 line-clamp-2 max-w-md">{aviso.contenido}</div>
                                                            <div className="flex gap-2 mt-3">
                                                                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold tracking-tight">
                                                                    {aviso.tipo}
                                                                </span>
                                                                {aviso.prioridad !== 'NORMAL' && (
                                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-tight ${aviso.prioridad === 'CRITICA' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                        {aviso.prioridad}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center -space-x-2">
                                                        {/* Mock users avatars */}
                                                        {[1, 2, 3].map((u) => (
                                                            <div key={u} className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900" />
                                                        ))}
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs text-slate-500 font-bold">
                                                            +
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(aviso.createdAt).toLocaleDateString('es-PY')}</span>
                                                        <span className="text-xs text-slate-400">{new Date(aviso.createdAt).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold shadow-sm">
                                                        <CheckCircle className="h-4 w-4" /> Enviado
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2.5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg rounded-xl text-slate-500 transition-all transform hover:-translate-y-1">
                                                            <BarChart2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative"
                        >
                            {/* Decoración de fondo */}
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-10" />
                            <div className="absolute -top-10 -right-10 h-32 w-32 bg-emerald-500/20 rounded-full blur-2xl" />

                            <div className="p-8 text-center relative z-10">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                                    className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6"
                                >
                                    <Check className="h-10 w-10 text-white stroke-[3]" />
                                </motion.div>

                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                                    ¡Envío Exitoso!
                                </h3>

                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                                    {successMessage}
                                </p>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        setActiveTab('historial');
                                    }}
                                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 transition-all"
                                >
                                    Excelente, continuar
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

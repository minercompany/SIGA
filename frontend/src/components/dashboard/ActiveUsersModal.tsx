import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Clock, Shield, Search } from "lucide-react";
import { useState } from "react";

interface ActiveUser {
    id: number;
    nombre: string;
    username: string;
    foto?: string;
    rol: string;
    sucursal: string;
    ultimoHeartbeat: string;
}

interface ActiveUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: ActiveUser[];
}

export function ActiveUsersModal({ isOpen, onClose, users }: ActiveUsersModalProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = users.filter(
        (u) =>
            u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.rol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto overflow-hidden border border-slate-100">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800">Usuarios Activos en Tiempo Real</h2>
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                            </span>
                                            <p className="text-sm font-bold text-emerald-600">{users.length} Conectados ahora</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar usuario..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="overflow-y-auto p-2">
                                {filteredUsers.length > 0 ? (
                                    <div className="grid gap-2">
                                        {filteredUsers.map((user) => (
                                            <motion.div
                                                layout
                                                key={user.id}
                                                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                                            >
                                                {/* Avatar */}
                                                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                                                    {user.foto ? (
                                                        <img src={user.foto} alt={user.nombre} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="font-black text-slate-400 text-lg">{user.nombre.charAt(0)}</span>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 truncate">{user.nombre}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-slate-600 border border-slate-200">
                                                            {user.sucursal}
                                                        </span>
                                                        <span>@{user.username}</span>
                                                    </div>
                                                </div>

                                                {/* Role & Time */}
                                                <div className="text-right">
                                                    <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-1 ${user.rol === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-600' :
                                                            user.rol === 'DIRECTIVO' ? 'bg-blue-100 text-blue-600' :
                                                                'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                        {user.rol.replace('USUARIO_', '')}
                                                    </span>
                                                    <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Activo</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Users className="h-12 w-12 mb-3 opacity-20" />
                                        <p className="font-medium">No se encontraron usuarios</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

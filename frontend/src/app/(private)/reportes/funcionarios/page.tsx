'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Briefcase,
    Download,
    Search,
    Shield,
    UserCheck,
    FileText,
    Loader2,
    Building2,
    CheckCircle,
    XCircle
} from 'lucide-react';
import axios from 'axios';

interface Funcionario {
    id: number;
    nombreCompleto: string;
    cargo: string;
    departamento: string;
    numeroSocio: string;
    cedula: string;
    telefono: string;
    email: string;
    fechaIngreso: string;
    activo: boolean;
}

interface Stats {
    total: number;
    directivos: number;
    funcionarios: number;
    activos: number;
}

export default function ReporteFuncionariosPage() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState<Stats>({ total: 0, directivos: 0, funcionarios: 0, activos: 0 });

    useEffect(() => {
        loadFuncionarios();
    }, []);

    const loadFuncionarios = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/funcionarios', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = res.data || [];
            setFuncionarios(data);

            // Calcular estadísticas
            const directivos = data.filter((f: any) =>
                f.cargo?.toLowerCase().includes('directivo') ||
                f.cargo?.toLowerCase().includes('director') ||
                f.cargo?.toLowerCase().includes('presidente') ||
                f.cargo?.toLowerCase().includes('gerente')
            ).length;

            setStats({
                total: data.length,
                directivos: directivos,
                funcionarios: data.length - directivos,
                activos: data.filter((f: any) => f.activo !== false).length
            });
        } catch (error) {
            console.error('Error loading funcionarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredFuncionarios = funcionarios.filter(f =>
        f.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cedula?.includes(searchTerm) ||
        f.numeroSocio?.includes(searchTerm)
    );

    const handleExportExcel = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/funcionarios/export/excel', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'funcionarios_directivos.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Error al exportar. Verifique que el endpoint esté disponible.');
        }
    };

    return (
        <div className="mx-auto space-y-6" style={{ maxWidth: 'clamp(320px, 98vw, 1400px)', padding: 'clamp(0.5rem, 2vw, 1.5rem)' }}>
            {/* Header Premium */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-5 sm:p-8 shadow-2xl"
            >
                {/* Formas decorativas */}
                <div className="absolute -left-10 -top-10 h-[150px] w-[150px] sm:h-[200px] sm:w-[200px] rounded-[60%_40%_70%_30%/50%_60%_40%_50%] bg-teal-500/30 blur-2xl"></div>
                <div className="absolute -right-10 -bottom-10 h-[120px] w-[120px] sm:h-[180px] sm:w-[180px] rounded-[40%_60%_30%_70%/60%_40%_70%_30%] bg-emerald-400/30 blur-2xl"></div>

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full mb-3">
                                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                <span className="text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest">Reporte Oficial</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                                Funcionarios y <span className="text-emerald-100">Directivos</span>
                            </h1>
                            <p className="text-emerald-100/80 text-sm sm:text-base mt-2 max-w-xl">
                                Listado completo del personal administrativo y directivo de la cooperativa.
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white rounded-xl font-bold text-sm transition-all shadow-lg"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Exportar Excel</span>
                            <span className="sm:hidden">Excel</span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
                {[
                    { label: 'Total Personal', value: stats.total, icon: Users, color: 'teal' },
                    { label: 'Directivos', value: stats.directivos, icon: Shield, color: 'emerald' },
                    { label: 'Funcionarios', value: stats.funcionarios, icon: Briefcase, color: 'blue' },
                    { label: 'Activos', value: stats.activos, icon: UserCheck, color: 'green' }
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-${stat.color}-100`}>
                                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${stat.color}-600`} />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className={`text-2xl sm:text-3xl font-black text-${stat.color}-600`}>{stat.value}</p>
                    </div>
                ))}
            </motion.div>

            {/* Search & Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
            >
                {/* Search Bar */}
                <div className="p-4 sm:p-6 border-b border-slate-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, cargo, CI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="h-10 w-10 text-teal-500 animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Cargando funcionarios...</p>
                    </div>
                ) : filteredFuncionarios.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="h-10 w-10 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium text-lg">No se encontraron funcionarios</p>
                        <p className="text-slate-400 text-sm mt-1">Intenta con otro término de búsqueda o importa el padrón de funcionarios</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Funcionario</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Cédula</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">N° Socio</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredFuncionarios.map((func, i) => (
                                    <motion.tr
                                        key={func.id || i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-teal-200">
                                                    {func.nombreCompleto?.charAt(0) || 'F'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm sm:text-base">{func.nombreCompleto}</p>
                                                    {func.email && <p className="text-xs text-slate-400">{func.email}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <span className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs sm:text-sm font-bold border border-teal-100">
                                                {func.cargo || 'Sin cargo'}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <span className="font-mono text-sm text-slate-600">{func.cedula || '-'}</span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <span className="font-bold text-sm text-slate-700">#{func.numeroSocio || '-'}</span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            {func.activo !== false ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Inactivo
                                                </span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                {filteredFuncionarios.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando <span className="font-bold text-slate-700">{filteredFuncionarios.length}</span> de <span className="font-bold text-slate-700">{funcionarios.length}</span> registros
                        </p>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reporte Funcionarios</span>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

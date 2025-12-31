"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserCircle2, Printer, Trophy, Medal, Award, Crown, ChevronDown, ChevronUp, Users, CheckCircle, AlertCircle, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RankingReportPage() {
    const [ranking, setRanking] = useState<any[]>([]);
    // Mapa para guardar el ID real del usuario basado en su username: { 'admin': 1, 'pepe': 45 }
    const [userIdMap, setUserIdMap] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Estado para búsqueda
    const [searchTerm, setSearchTerm] = useState("");

    // Mapa para sucursales: { 'VILLARRICA': 5, 'CASA CENTRAL': 1 }
    const [sucursalMap, setSucursalMap] = useState<Record<string, number>>({});

    // Estado para expansión
    const [expandedUsername, setExpandedUsername] = useState<string | null>(null);
    const [sociosDetalle, setSociosDetalle] = useState<any[]>([]);
    const [visibleCount, setVisibleCount] = useState(10); // Límite inicial
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [statsDetalle, setStatsDetalle] = useState<any>(null);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const token = localStorage.getItem("token");

                // 1. Obtener Ranking
                const resRanking = await axios.get("/api/reportes/ranking-global", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRanking(resRanking.data);

                // 2. Obtener IDs de usuarios
                try {
                    const resIds = await axios.get("/api/asignaciones/ranking-usuarios", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const map: Record<string, number> = {};
                    resIds.data.forEach((u: any) => {
                        if (u.username) map[u.username] = u.id;
                    });
                    setUserIdMap(map);
                } catch (err) {
                    console.warn("Error IDs usuarios:", err);
                }

                // 3. Obtener lista de sucursales para mapear Nombres -> IDs
                try {
                    const resSuc = await axios.get("/api/reportes/sucursales-lista", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const sMap: Record<string, number> = {};
                    resSuc.data.forEach((s: any) => {
                        if (s.nombre) sMap[s.nombre.toUpperCase()] = s.id;
                    });
                    setSucursalMap(sMap);
                } catch (err) {
                    console.warn("Error obteniendo sucursales:", err);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const toggleExpand = async (user: any) => {
        const username = user.username;

        if (expandedUsername === username) {
            setExpandedUsername(null);
            setSociosDetalle([]);
            return;
        }

        const userId = userIdMap[username];
        if (!userId) {
            alert("No se pudo identificar el ID de este usuario para ver detalles.");
            return;
        }

        // Obtener ID de sucursal
        const sucursalNombre = user.sucursal?.toUpperCase();
        const sucursalId = sucursalMap[sucursalNombre];

        if (!sucursalId) {
            // Si no tiene sucursal, es difícil filtrar por el endpoint de sucursal.
            // Intentamos con sucursal 1 (Casa Central) por defecto o fallamos.
            // Ojo: podriamos intentar otro endpoint, pero por ahora avisamos.
            console.warn("Usuario sin sucursal mapeada:", sucursalNombre);
            // alert("Este usuario no tiene una sucursal válida asignada para consultar el reporte.");
            // return;
        }

        // Si no hay sucursal ID, usamos un fallback a Casa Central (ID 1 típicamente) o abortamos.
        // Asumiremos que si no se encuentra, intentamos buscar en TODAS (si el endpoint soporta 'todas' o null... no parece).
        // HACK: Si no hay sucursalId, no podremos usar este endpoint.
        if (!sucursalId) {
            alert("No se puede cargar el detalle: Sucursal no identificada.");
            return;
        }

        setExpandedUsername(username);
        setLoadingDetalle(true);
        setSociosDetalle([]);
        setVisibleCount(10);
        setStatsDetalle(null);

        try {
            const token = localStorage.getItem("token");
            // Nueva estrategia: Usar reporte de sucursal filtrado por operador
            const res = await axios.get(`/api/reportes/por-sucursal/${sucursalId}?operadorId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Mapeamos la respuesta de este endpoint a la estructura que espera la tabla
            // El endpoint devuelve { data: [...], stats: ... }
            // Los items tienen: socioNombre, cedula, estado (PRESENTE/AUSENTE), vozVoto (HABILITADO...), fechaHora (ingreso)
            const mappedSocios = res.data.data.map((s: any) => ({
                id: s.id,
                nombreCompleto: s.socioNombre,
                cedula: s.cedula,
                numeroSocio: s.socioNro,
                esVyV: s.vozVoto === "HABILITADO",
                fechaHoraIngreso: s.fechaHora, // null si ausente
                // Agregamos campos extra si se necesitan
            }));

            setSociosDetalle(mappedSocios);

            // Ajustamos stats
            setStatsDetalle({
                vyv: res.data.stats.habilitados,
                soloVoz: res.data.stats.observados,
                total: res.data.stats.totalRegistros
            });

        } catch (error) {
            console.error("Error cargando detalle:", error);
            setSociosDetalle([]);
        } finally {
            setLoadingDetalle(false);
        }
    };

    const filteredRanking = ranking.filter(user =>
        user.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Ordenamos el ranking para el podio (top 3) y lista según la query original
    const top1 = ranking[0];
    const top2 = ranking[1];
    const top3 = ranking[2];
    // La lista completa para la tabla

    return (
        <div className="min-h-screen bg-slate-50 pb-20 print:bg-white print:pb-0">
            {/* HERRAMIENTAS FLOTANTES (Oculto al imprimir) */}
            <div className="fixed bottom-8 right-8 flex flex-col gap-3 print:hidden z-50">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrint}
                    className="p-4 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-500/50 hover:bg-black transition-colors"
                    title="Imprimir / Guardar PDF"
                >
                    <Printer className="h-6 w-6" />
                </motion.button>
            </div>

            <div className="max-w-7xl mx-auto p-8 print:p-0 print:max-w-none">
                {/* HEADER DEL REPORTE */}
                <header className="flex items-center justify-between mb-12 border-b-2 border-slate-200 pb-8 print:mb-8">
                    <div className="flex items-center gap-6">
                        <img src="/logo-cooperativa.png" alt="Logo" className="h-20 w-auto object-contain" />
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Ranking de Gestión</h1>
                            <p className="text-slate-500 font-medium">Asamblea General Ordinaria 2025</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-teal-500 rounded-full font-bold text-sm mb-2 print:border print:border-emerald-200">
                            <Crown className="h-4 w-4" />
                            TOP FUNCIONARIOS
                        </div>
                        <p className="text-sm text-slate-400 font-medium">Generado el: {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</p>
                    </div>
                </header>

                {/* PODIUM SECTION (Solo visible si hay al menos 3) */}
                {ranking.length >= 3 && (
                    <div className="mb-16 print:mb-8 print:break-inside-avoid">
                        <div className="flex items-end justify-center gap-6 min-h-[450px] pt-12">
                            {/* 2nd Place */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-1/4 flex flex-col items-center z-10"
                            >
                                <div className="mb-8 text-center relative z-30">
                                    <h3 className="font-bold text-slate-700 line-clamp-1 text-lg px-2">{top2.nombreCompleto}</h3>
                                </div>
                                <div className="w-full h-[200px] bg-gradient-to-t from-slate-300 to-slate-200 rounded-t-3xl relative shadow-xl border-t border-slate-100 flex flex-col items-center pt-6 print:bg-slate-200 print:bg-none">
                                    {/* Avatar and Badge inside podium */}
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-white border-4 border-slate-300 shadow-lg flex items-center justify-center overflow-hidden">
                                            <UserCircle2 className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-slate-400 text-white w-7 h-7 rounded-full flex items-center justify-center font-black border-2 border-white text-sm">2</div>
                                    </div>
                                    <p className="mt-3 px-3 py-1 bg-white/80 rounded-lg text-[10px] text-slate-500 font-bold uppercase border border-slate-200">{top2.sucursal || 'N/A'}</p>
                                    <div className="mt-3 px-4 py-2 bg-white rounded-full text-slate-700 font-black text-lg border-2 border-slate-300 shadow-md">
                                        {top2.registrados} <span className="text-sm font-bold">Reg.</span>
                                    </div>
                                    <Medal className="absolute bottom-3 h-12 w-12 text-slate-400 opacity-20" />
                                </div>
                            </motion.div>

                            {/* 1st Place */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="w-1/3 flex flex-col items-center z-20 -mx-4"
                            >
                                <div className="mb-8 text-center relative z-30">
                                    <div className="mb-2">
                                        <Crown className="h-8 w-8 text-amber-400 mx-auto fill-amber-400 animate-bounce print:animate-none" />
                                    </div>
                                    <h3 className="font-black text-slate-800 text-2xl line-clamp-1 px-2">{top1.nombreCompleto}</h3>
                                </div>
                                <div className="w-full h-[260px] bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-3xl relative shadow-2xl shadow-amber-500/20 border-t border-amber-200 flex flex-col items-center pt-6 print:bg-amber-300 print:bg-none">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-white border-4 border-amber-300 shadow-xl flex items-center justify-center overflow-hidden">
                                            <UserCircle2 className="h-12 w-12 text-amber-200" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-white">1</div>
                                    </div>
                                    <p className="mt-4 px-4 py-1.5 bg-white/90 rounded-lg text-sm text-amber-700 font-bold uppercase border border-amber-200 shadow-sm">{top1.sucursal || 'N/A'}</p>
                                    <div className="mt-4 px-6 py-3 bg-white rounded-full text-amber-600 font-black text-2xl border-2 border-amber-300 shadow-lg">
                                        {top1.registrados} <span className="text-base font-bold">Registros</span>
                                    </div>
                                    <Trophy className="absolute bottom-4 h-16 w-16 text-amber-600 opacity-20" />
                                </div>
                            </motion.div>

                            {/* 3rd Place */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="w-1/4 flex flex-col items-center z-10"
                            >
                                <div className="mb-8 text-center relative z-30">
                                    <h3 className="font-bold text-slate-700 line-clamp-1 text-lg px-2">{top3.nombreCompleto}</h3>
                                </div>
                                <div className="w-full h-[160px] bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-3xl relative shadow-xl border-t border-orange-100 flex flex-col items-center pt-5 print:bg-orange-200 print:bg-none">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full bg-white border-4 border-orange-300 shadow-lg flex items-center justify-center overflow-hidden">
                                            <UserCircle2 className="h-8 w-8 text-orange-200" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-white text-xs">3</div>
                                    </div>
                                    <p className="mt-2 px-2 py-0.5 bg-white/80 rounded text-[9px] text-orange-600 font-bold uppercase border border-orange-200">{top3.sucursal || 'N/A'}</p>
                                    <div className="mt-2 px-3 py-1.5 bg-white rounded-full text-orange-700 font-black text-base border-2 border-orange-300 shadow-md">
                                        {top3.registrados} <span className="text-xs font-bold">Reg.</span>
                                    </div>
                                    <Medal className="absolute bottom-2 h-10 w-10 text-orange-500 opacity-20" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* DETAILED LIST */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 print:hidden flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <Award className="h-5 w-5 text-indigo-500" />
                            Listado Completo de Gestión
                        </h2>

                        {/* BUSCADOR */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar funcionario..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-black text-slate-400 uppercase tracking-wider print:bg-slate-100">
                                <th className="p-4 w-12 text-center">#</th>
                                <th className="p-4">Funcionario / Asesor</th>
                                <th className="p-4">Sucursal</th>
                                <th className="p-4 w-32 text-center">Registrados</th>
                                <th className="p-4 w-48 text-center print:hidden">Progreso</th>
                                <th className="p-4 w-12 print:hidden"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredRanking.map((user, index) => {
                                const isExpanded = expandedUsername === user.username;
                                const hasId = !!userIdMap[user.username];

                                return (
                                    <React.Fragment key={user.username}>
                                        <tr
                                            onClick={() => hasId && toggleExpand(user)}
                                            className={`border-b border-slate-50 last:border-none transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'
                                                } ${index < 3 ? 'bg-yellow-50/30 print:bg-white' : ''}`}
                                        >
                                            <td className="p-4 text-center font-black text-slate-400">
                                                {index < 3 ? (
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {index + 1}
                                                    </span>
                                                ) : <span>{index + 1}</span>}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 text-base">{user.nombreCompleto}</div>
                                                <div className="text-xs text-slate-400 font-medium">@{user.username} • {user.cargo || 'Funcionario'}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600 uppercase">
                                                    {user.sucursal}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="font-black text-xl text-slate-800">{user.registrados}</div>
                                            </td>
                                            <td className="p-4 print:hidden">
                                                {user.meta > 0 ? (
                                                    <div className="w-full">
                                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                                            <span>{user.porcentaje.toFixed(0)}%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${user.porcentaje >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(user.porcentaje, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                ) : <span className="text-xs text-slate-400 italic">Sin meta</span>}
                                            </td>
                                            <td className="p-4 text-center print:hidden">
                                                {hasId && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Evitar doble trigger
                                                            if (hasId) toggleExpand(user);
                                                        }}
                                                        className="text-slate-400 hover:text-slate-600"
                                                    >
                                                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>

                                        {/* DETALLE EXPANDIDO */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={6} className="p-0 border-b border-slate-100 bg-slate-50/50 print:table-row">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-6">
                                                                {loadingDetalle ? (
                                                                    <div className="flex justify-center p-4">
                                                                        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                                                        {/* STATS DEL DETALLE */}
                                                                        {statsDetalle && (
                                                                            <div className="flex divide-x divide-slate-100 border-b border-slate-100 bg-slate-50">
                                                                                <div className="flex-1 p-3 text-center">
                                                                                    <div className="text-xs font-bold text-slate-400 uppercase">Total Asignados</div>
                                                                                    <div className="text-xl font-black text-slate-800">{statsDetalle.total || 0}</div>
                                                                                </div>
                                                                                <div className="flex-1 p-3 text-center bg-emerald-50/50">
                                                                                    <div className="text-xs font-bold text-emerald-600 uppercase">Voz y Voto</div>
                                                                                    <div className="text-xl font-black text-emerald-700">{statsDetalle.vyv || 0}</div>
                                                                                </div>
                                                                                <div className="flex-1 p-3 text-center bg-amber-50/50">
                                                                                    <div className="text-xs font-bold text-amber-600 uppercase">Solo Voz</div>
                                                                                    <div className="text-xl font-black text-amber-700">{statsDetalle.soloVoz || 0}</div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <table className="w-full text-sm">
                                                                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                                                                <tr>
                                                                                    <th className="p-3 text-left w-16"># Socio</th>
                                                                                    <th className="p-3 text-left">Socio</th>
                                                                                    <th className="p-3 text-center">Condición</th>
                                                                                    <th className="p-3 text-center">Asistencia</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100">
                                                                                {sociosDetalle.slice(0, visibleCount).map((socio) => (
                                                                                    <tr key={socio.id} className="hover:bg-slate-50">
                                                                                        <td className="p-3 font-mono text-xs text-slate-500">{socio.numeroSocio}</td>
                                                                                        <td className="p-3">
                                                                                            <div className="font-bold text-slate-700">{socio.nombreCompleto}</div>
                                                                                            <div className="text-[10px] text-slate-400">CI: {socio.cedula}</div>
                                                                                        </td>
                                                                                        <td className="p-3 text-center">
                                                                                            {socio.esVyV ? (
                                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                                                                                    <Users className="h-3 w-3" /> V+V
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                                                                                                    <AlertCircle className="h-3 w-3" /> Solo Voz
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="p-3 text-center">
                                                                                            {socio.fechaHoraIngreso ? (
                                                                                                <div className="flex flex-col items-center">
                                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase mb-0.5">
                                                                                                        <CheckCircle className="h-3 w-3" />
                                                                                                        Presente
                                                                                                    </span>
                                                                                                    <span className="text-[9px] text-emerald-600 font-medium">
                                                                                                        {new Date(socio.fechaHoraIngreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                                    </span>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold uppercase">
                                                                                                    Ausente
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                                {sociosDetalle.length === 0 && (
                                                                                    <tr>
                                                                                        <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                                                                                            No se encontraron socios asignados.
                                                                                        </td>
                                                                                    </tr>
                                                                                )}
                                                                            </tbody>
                                                                        </table>

                                                                        {/* LOAD MORE BUTTON */}
                                                                        {sociosDetalle.length > visibleCount && (
                                                                            <div className="p-3 flex justify-center bg-slate-50 border-t border-slate-100">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setVisibleCount(prev => prev + 20);
                                                                                    }}
                                                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-4 py-2 rounded-full transition-colors"
                                                                                >
                                                                                    Mostrar más socios ({sociosDetalle.length - visibleCount} restantes)
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 text-center print:mt-12">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cooperativa Reducto Ltda • Sistema de Gestión de Asambleas</p>
                </div>
            </div>

            {/* ESTILOS PARA IMPRESIÓN */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        background-color: white !important;
                    }
                }
            `}</style>
        </div >
    );
}

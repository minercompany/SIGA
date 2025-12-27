"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    FileDown,
    ShieldCheck,
    AlertTriangle,
    Eye,
    Building2,
    Edit,
    Trash2,
    X
} from "lucide-react";

interface Socio {
    id: number;
    numeroSocio: string;
    nombreCompleto: string;
    cedula: string;
    telefono: string | null;
    direccion: string | null;
    sucursal: { id: number; nombre: string; codigo: string } | null;
    aporteAlDia: boolean;
    solidaridadAlDia: boolean;
    fondoAlDia: boolean;
    incoopAlDia: boolean;
    creditoAlDia: boolean;
    activo: boolean;
}

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export default function SociosPage() {
    const [socios, setSocios] = useState<Socio[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [error, setError] = useState<string | null>(null);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchSocios = useCallback(async (page: number, term: string) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            let url = `http://192.168.100.123:8081/api/socios?page=${page}&size=${pageSize}`;
            if (term) {
                // Ajuste para búsqueda según backend real
                url = `http://192.168.100.123:8081/api/socios/buscar?term=${encodeURIComponent(term)}`;
            }

            const response = await axios.get(url, { headers });

            // El backend ahora devuelve una Page para el listado general 
            // y una Lista simple para las búsquedas. Manejamos ambos casos:
            if (response.data.content) {
                // Caso Pageable (Listado general)
                setSocios(response.data.content);
                setTotalPages(response.data.totalPages);
                setTotalElements(response.data.totalElements);
            } else if (Array.isArray(response.data)) {
                // Caso Array (Búsqueda o listado viejo)
                setSocios(response.data);
                setTotalElements(response.data.length);
                setTotalPages(1);
            } else {
                setSocios([]);
                setTotalElements(0);
                setTotalPages(0);
            }
        } catch (err) {
            console.error("Error cargando socios:", err);
            setError("No se pudieron cargar los datos del padrón.");
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchSocios(currentPage, searchTerm);
    }, [currentPage, fetchSocios]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setCurrentPage(0);
            fetchSocios(0, val);
        }, 500);
    };

    const tieneVozYVoto = (socio: Socio) => {
        return socio.aporteAlDia && socio.solidaridadAlDia && socio.fondoAlDia && socio.incoopAlDia && socio.creditoAlDia;
    };

    const displayedSocios = searchTerm && Array.isArray(socios) && socios.length > pageSize
        ? socios.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
        : socios;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Padrón de Socios</h1>
                    <p className="text-slate-500 text-sm">Gestión y visualización del padrón electoral</p>
                </div>
                {/* Botones de acción, ocultos en móvil para limpiar la vista, o adaptados */}
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm">
                        <FileDown className="h-4 w-4" />
                        <span className="hidden sm:inline">Exportar</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">Filtros</span>
                    </button>
                </div>
            </div>

            {/* Barra de búsqueda Premium */}
            <div className="bg-white p-2 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center">
                <div className="pl-4 pr-3 text-slate-400">
                    <Search className="h-5 w-5" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar socio..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full py-3 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
                />
                {searchTerm && (
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            fetchSocios(0, "");
                        }}
                        className="mr-2 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-bold">{error}</p>
                </div>
            ) : (
                <>
                    {/* PC View (Tabla Clásica) */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">#</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Socio</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Documento</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sucursal</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {displayedSocios.map((socio) => (
                                        <tr key={socio.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 text-sm font-bold text-slate-400">
                                                {socio.numeroSocio}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{socio.nombreCompleto}</div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 font-medium">
                                                {socio.cedula}
                                            </td>
                                            <td className="p-4 text-sm text-slate-600">
                                                {socio.sucursal?.nombre || '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                {tieneVozYVoto(socio) ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        Voz y Voto
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Solo Voz
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Premium View (Tarjetas Modernas) */}
                    <div className="md:hidden space-y-5 px-1 pb-20">
                        {displayedSocios.map((socio) => (
                            <div key={socio.id} className="group relative bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 border border-slate-50 overflow-hidden">

                                {/* Decoración de fondo sutil */}
                                <div className="absolute top-0 right-0 p-5 opacity-[0.03] transform translate-x-1/3 -translate-y-1/4">
                                    <ShieldCheck className="h-32 w-32 text-slate-900 rotate-12" />
                                </div>

                                {/* Header de la tarjeta */}
                                <div className="relative flex justify-between items-start gap-4 mb-5">
                                    <div className="flex gap-4 items-center">
                                        {/* Avatar Generado */}
                                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ring-white ${tieneVozYVoto(socio)
                                            ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-200/50'
                                            : 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-200/50'
                                            }`}>
                                            {socio.nombreCompleto.substring(0, 2).toUpperCase()}
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">
                                                {socio.nombreCompleto.split(' ')[0]}
                                                <span className="font-medium text-slate-400 text-sm block">
                                                    {socio.nombreCompleto.split(' ').slice(1).join(' ')}
                                                </span>
                                            </h3>
                                            <span className="inline-block mt-1 bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                Socio #{socio.numeroSocio}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Estado Icono */}
                                    <div className={`flex items-center justify-center h-10 w-10 rounded-full shadow-inner ${tieneVozYVoto(socio)
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-amber-50 text-amber-600'
                                        }`}>
                                        {tieneVozYVoto(socio) ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                                    </div>
                                </div>

                                {/* Info Grid Floating */}
                                <div className="bg-slate-50/80 rounded-2xl p-4 grid grid-cols-2 gap-4 mb-4 backdrop-blur-sm relative z-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Documento</p>
                                        <p className="font-bold text-slate-700 font-mono tracking-tight text-sm">{socio.cedula}</p>
                                    </div>
                                    <div className="space-y-1 border-l border-slate-200 pl-4">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sucursal</p>
                                        <div className="flex items-center gap-1 overflow-hidden">
                                            <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                            <p className="font-bold text-slate-700 truncate text-xs">{socio.sucursal?.nombre || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2 pt-3 border-t border-slate-200 mt-1 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500">Aporte Mensual</span>
                                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wide ${socio.aporteAlDia
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {socio.aporteAlDia ? 'AL DÍA' : 'EN MORA'}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-2">
                                    <button className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                        <Edit className="h-4 w-4" />
                                        <span>Editar Ficha</span>
                                    </button>
                                    <button className="h-12 w-12 flex items-center justify-center bg-white border border-slate-100 text-slate-300 rounded-xl hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500 transition-all shadow-sm active:scale-95">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginación - Premium Mobile */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-6 pb-20 md:pb-0">
                        <p className="text-sm text-slate-500 font-medium hidden sm:block">
                            Mostrando {displayedSocios.length} de {totalElements} registros
                        </p>
                        <p className="text-xs font-bold text-slate-400 sm:hidden uppercase tracking-wide px-2">
                            {displayedSocios.length} de {totalElements}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:shadow-none shadow-sm transition-all"
                            >
                                <ChevronLeft className="h-5 w-5 text-slate-600" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= totalPages - 1 && (!searchTerm || displayedSocios.length < pageSize)}
                                className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:shadow-none shadow-sm transition-all"
                            >
                                <ChevronRight className="h-5 w-5 text-slate-600" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

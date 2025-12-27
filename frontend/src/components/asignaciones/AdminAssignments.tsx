"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Users, ChevronRight, LayoutGrid, List as ListIcon, Trash2 } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

interface Lista {
    id: number;
    nombre: string;
    responsable: string;
    responsableUser: string;
    activa: boolean;
    total: number;
}

interface Socio {
    id: number;
    nombreCompleto: string;
    numeroSocio: string;
    cedula: string;
}

export default function AdminAssignments() {
    const [listas, setListas] = useState<Lista[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLista, setSelectedLista] = useState<Lista | null>(null);
    const [sociosLista, setSociosLista] = useState<Socio[]>([]);
    const [loadingSocios, setLoadingSocios] = useState(false);

    useEffect(() => {
        fetchListas();
    }, []);

    const fetchListas = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8081/api/asignaciones/admin/todas-las-listas", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setListas(res.data);
        } catch (error) {
            console.error("Error fetching listas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectList = async (lista: Lista) => {
        setSelectedLista(lista);
        setLoadingSocios(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:8081/api/asignaciones/${lista.id}/socios`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSociosLista(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSocios(false);
        }
    };

    // Filtered lists
    const filteredListas = listas.filter(l =>
        l.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Panel de Gestión de Listas</h1>
                    <p className="text-slate-500 text-sm">Administra todas las listas de asignación del sistema.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por responsable..."
                        className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUMNA IZQUIERDA: LISTAS */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center">
                        <span>Listas ({filteredListas.length})</span>
                        <LayoutGrid className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" /></div>
                        ) : (
                            filteredListas.map(lista => (
                                <button
                                    key={lista.id}
                                    onClick={() => handleSelectList(lista)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${selectedLista?.id === lista.id ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50'}`}
                                >
                                    <div className="font-bold text-slate-800 text-sm">{lista.responsable}</div>
                                    <div className="text-xs text-slate-500 mb-1">{lista.nombre}</div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${lista.activa ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {lista.activa ? 'ACTIVA' : 'INACTIVA'}
                                        </span>
                                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 flex items-center gap-1">
                                            <Users className="h-3 w-3" /> {lista.total}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: DETALLE */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                    {selectedLista ? (
                        <>
                            <div className="p-6 border-b border-slate-100 bg-slate-50">
                                <h2 className="text-xl font-bold text-slate-800">{selectedLista.nombre}</h2>
                                <p className="text-sm text-slate-500">Responsable: <span className="font-semibold text-slate-700">{selectedLista.responsable}</span></p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-0">
                                {loadingSocios ? (
                                    <div className="flex justify-center items-center h-40">
                                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                    </div>
                                ) : (
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3">Socio</th>
                                                <th className="px-6 py-3">Cédula</th>
                                                <th className="px-6 py-3">N° Socio</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sociosLista.map((socio, idx) => (
                                                <tr key={`${socio.id}-${idx}`} className="border-b hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-900">{socio.nombreCompleto}</td>
                                                    <td className="px-6 py-4 font-mono text-slate-500">{socio.cedula}</td>
                                                    <td className="px-6 py-4 font-mono text-slate-500">{socio.numeroSocio}</td>
                                                </tr>
                                            ))}
                                            {sociosLista.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-10 text-slate-400">
                                                        Esta lista no tiene socios asignados.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300">
                            <ListIcon className="h-16 w-16 mb-4 opacity-50" />
                            <p className="font-medium">Selecciona una lista para ver detalles</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

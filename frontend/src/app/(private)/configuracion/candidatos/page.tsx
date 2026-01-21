"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    Save,
    Plus,
    Trash2,
    Camera,
    User,
    Award,
    Shield,
    Users,
    CheckCircle2,
    XCircle,
    Edit3,
    Loader2
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";

const getCroppedImg = async (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<string | null> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL("image/jpeg");
};

interface Socio {
    id: number;
    nombreCompleto: string;
    numeroSocio: string;
    cedula: string;
    telefono?: string;
    sucursal?: {
        id: number;
        nombre: string;
        codigo?: string;
    };
    aporteAlDia: boolean;
    solidaridadAlDia: boolean;
    fondoAlDia: boolean;
    incoopAlDia: boolean;
    creditoAlDia: boolean;
    vozYVoto: boolean;
}

interface Candidato {
    id?: number;
    socio: Socio;
    organo: string;
    tipo: string;
    foto?: string;
    biografia?: string;
    orden: number;
    activo: boolean;
}

const ORGANOS = [
    { value: "CONSEJO_ADMINISTRACION", label: "Consejo de Administración" },
    { value: "JUNTA_VIGILANCIA", label: "Junta de Vigilancia" },
    { value: "JUNTA_ELECTORAL", label: "Junta Electoral" }
];

const TIPOS = [
    { value: "TITULAR", label: "Titular" },
    { value: "SUPLENTE", label: "Suplente" }
];

export default function GestionCandidatosPage() {
    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState(1);
    const [showCropModal, setShowCropModal] = useState(false);

    // Cropping state
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [isSearchingSocio, setIsSearchingSocio] = useState(false);

    // Form state
    const [searchTerm, setSearchTerm] = useState("");
    const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);
    const [resultadosBusqueda, setResultadosBusqueda] = useState<Socio[]>([]);
    const [form, setForm] = useState({
        organo: "CONSEJO_ADMINISTRACION",
        tipo: "TITULAR",
        biografia: "",
        foto: "",
        orden: 0
    });

    useEffect(() => {
        cargarCandidatos();
    }, []);

    const cargarCandidatos = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("/api/candidatos", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCandidatos(res.data);
        } catch (error) {
            console.error("Error al cargar candidatos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim()) {
                ejecutarBusquedaSocio(searchTerm);
            } else {
                setResultadosBusqueda([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const ejecutarBusquedaSocio = async (val: string) => {
        setIsSearchingSocio(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`/api/socios/buscar?term=${encodeURIComponent(val)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResultadosBusqueda(res.data);
        } catch (error) {
            console.error("Error buscando socio:", error);
        } finally {
            setIsSearchingSocio(false);
        }
    };

    const buscarSocio = (val: string) => {
        setSearchTerm(val);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = (croppedArea: { x: number; y: number; width: number; height: number }, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropSave = async () => {
        if (tempImage && croppedAreaPixels) {
            const cropped = await getCroppedImg(tempImage, croppedAreaPixels);
            if (cropped) {
                setForm({ ...form, foto: cropped });
                setShowCropModal(false);
                setTempImage(null);
            }
        }
    };

    const handleSave = async () => {
        if (!socioSeleccionado) {
            Swal.fire("Error", "Debe seleccionar un socio", "error");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.post("/api/candidatos", {
                socioId: socioSeleccionado.id,
                ...form
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire("¡Éxito!", "Candidato registrado correctamente", "success");
            setShowModal(false);
            setSocioSeleccionado(null);
            setSearchTerm("");
            setStep(1);
            setForm({
                organo: "CONSEJO_ADMINISTRACION",
                tipo: "TITULAR",
                biografia: "",
                foto: "",
                orden: 0
            });
            cargarCandidatos();
        } catch (error: any) {
            Swal.fire("Error", error.response?.data || "No se pudo guardar", "error");
        }
    };

    const eliminarCandidato = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar candidato?',
            text: "Esta acción lo desactivará de la lista pública",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`/api/candidatos/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                cargarCandidatos();
                Swal.fire('Eliminado', 'El candidato ha sido removido.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-8">
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="h-24 w-24 rounded-[2rem] border-[3px] border-emerald-500/10 border-t-emerald-500"
                    />
                    <Award className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-emerald-500 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-black text-slate-800 tracking-tighter italic uppercase">Cargando Panel</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Preparando sistema de candidatos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-100/50 border border-emerald-50">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Award className="h-10 w-10 text-emerald-500" />
                        Gestión de Candidatos
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Configura los postulantes para los órganos de la asamblea.</p>
                </div>
                <button
                    onClick={() => {
                        setStep(1);
                        setShowModal(true);
                    }}
                    className="group bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg hover:shadow-emerald-200"
                >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    Agregar Candidato
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-emerald-100/50 border border-emerald-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-emerald-50 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                <th className="px-8 py-6">Candidato</th>
                                <th className="px-8 py-6">Órgano</th>
                                <th className="px-8 py-6">Tipo</th>
                                <th className="px-8 py-6 text-center">Orden</th>
                                <th className="px-8 py-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50">
                            {candidatos.length > 0 ? (
                                candidatos.map((can: Candidato) => (
                                    <tr key={can.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    {can.foto ? (
                                                        <img src={can.foto} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md" />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-md">
                                                            <User className="h-6 w-6 text-slate-400" />
                                                        </div>
                                                    )}
                                                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 text-sm">{can.socio?.nombreCompleto}</div>
                                                    <div className="text-xs font-bold text-slate-400">CI: {can.socio?.cedula}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${can.organo === 'CONSEJO_ADMINISTRACION' ? 'bg-blue-50 text-blue-600' :
                                                can.organo === 'JUNTA_VIGILANCIA' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
                                                }`}>
                                                {ORGANOS.find(o => o.value === can.organo)?.label}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`font-bold text-xs ${can.tipo === 'TITULAR' ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                {can.tipo}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="font-black text-slate-400">{can.orden}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => eliminarCandidato(can.id!)}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
                                                <Award className="h-10 w-10 text-slate-200" />
                                            </div>
                                            <div className="font-black text-slate-300 uppercase tracking-widest text-sm">No hay candidatos registrados</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/30">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Nuevo Candidato</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Registrar postulante para asamblea</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 rounded-2xl hover:bg-white transition-colors">
                                <Plus className="h-6 w-6 text-slate-400 rotate-45" />
                            </button>
                        </div>

                        {/* Modal Body - Compacto para evitar scroll */}
                        <div className="p-4 md:p-8 overflow-y-auto space-y-4 md:space-y-8 min-h-[350px]">
                            {/* Progress Bar */}
                            <div className="flex items-center gap-2 mb-4">
                                {[1, 2, 3].map((s) => (
                                    <div
                                        key={s}
                                        className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-emerald-500 px-4' : 'bg-slate-100'}`}
                                    />
                                ))}
                            </div>

                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 block px-1 text-center">PASO 1: SELECCIONAR SOCIO</label>
                                        {!socioSeleccionado ? (
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                    {isSearchingSocio ? (
                                                        <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                                                    ) : (
                                                        <Search className="h-5 w-5 text-slate-300" />
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={searchTerm}
                                                    onChange={(e) => buscarSocio(e.target.value)}
                                                    placeholder="Cédula o número de socio..."
                                                    className="w-full bg-slate-50 border-none rounded-2xl md:rounded-3xl py-4 md:py-6 pl-12 md:pl-14 pr-6 font-black text-lg md:text-xl text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                                                    autoFocus
                                                />

                                                {resultadosBusqueda.length > 0 && (
                                                    <div className="absolute w-full mt-4 bg-white rounded-[2rem] shadow-2xl border border-emerald-50 z-20 max-h-60 overflow-hidden overflow-y-auto">
                                                        {resultadosBusqueda.map((socio: Socio) => (
                                                            <button
                                                                key={socio.id}
                                                                onClick={() => {
                                                                    setSocioSeleccionado(socio);
                                                                    setResultadosBusqueda([]);
                                                                    setStep(2);
                                                                }}
                                                                className="w-full px-8 py-5 text-left hover:bg-emerald-50 transition-colors border-b border-emerald-50 last:border-0 flex items-center justify-between group"
                                                            >
                                                                <div>
                                                                    <div className="font-black text-slate-900 text-base">{socio.nombreCompleto}</div>
                                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nº Socio: {socio.numeroSocio} | CI: {socio.cedula}</div>
                                                                </div>
                                                                <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                                    <Plus className="h-5 w-5" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-emerald-500 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-between text-white shadow-xl shadow-emerald-200 animate-in zoom-in-95 duration-300">
                                                <div className="flex items-center gap-4 md:gap-6">
                                                    <div className="h-12 w-12 md:h-16 md:w-16 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl text-white italic shadow-inner shrink-0">
                                                        {socioSeleccionado.nombreCompleto.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-black text-base md:text-2xl leading-tight truncate">{socioSeleccionado.nombreCompleto}</div>
                                                        <div className="text-emerald-50 text-[10px] md:text-xs font-black mt-0.5 uppercase tracking-[0.1em] md:tracking-[0.2em] opacity-80">Socio Seleccionado</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSocioSeleccionado(null);
                                                        setStep(1);
                                                    }}
                                                    className="p-3 bg-white/20 hover:bg-white/40 rounded-2xl transition-all"
                                                >
                                                    <XCircle className="h-6 w-6" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {socioSeleccionado && (
                                        <button
                                            onClick={() => setStep(2)}
                                            className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                                        >
                                            Continuar al paso 2
                                        </button>
                                    )}
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 block px-1 text-center">PASO 2: FOTO DEL CANDIDATO</label>

                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative group">
                                            <div className="h-48 w-48 rounded-[3rem] bg-slate-50 border-4 border-dashed border-emerald-100 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-300">
                                                {form.foto ? (
                                                    <img src={form.foto} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="text-center p-6">
                                                        <Camera className="h-12 w-12 text-emerald-100 mx-auto mb-2" />
                                                        <p className="text-[10px] font-black text-emerald-300 uppercase italic">Sin foto</p>
                                                    </div>
                                                )}
                                            </div>
                                            <label className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-4 rounded-2xl cursor-pointer shadow-xl hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95">
                                                <Plus className="h-6 w-6" />
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                        </div>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center px-12">
                                            Se recomienda una foto de frente con fondo claro para una mejor visualización.
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="flex-1 bg-slate-50 text-slate-400 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            onClick={() => setStep(3)}
                                            className="flex-[2] bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 block px-1 text-center">PASO 3: DETALLES Y BIOGRAFÍA</label>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">Órgano</label>
                                            <select
                                                value={form.organo}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, organo: e.target.value })}
                                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-700 focus:ring-4 focus:ring-emerald-100 transition-all outline-none appearance-none"
                                            >
                                                {ORGANOS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">Tipo</label>
                                            <select
                                                value={form.tipo}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, tipo: e.target.value })}
                                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-700 focus:ring-4 focus:ring-emerald-100 transition-all outline-none appearance-none"
                                            >
                                                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">Biografía / Propuestas</label>
                                        <textarea
                                            value={form.biografia}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, biografia: e.target.value })}
                                            rows={4}
                                            placeholder="Escribe un breve resumen profesional o propuesta principal..."
                                            className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-100 transition-all outline-none resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="flex-1 bg-slate-50 text-slate-400 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="flex-[2] bg-emerald-500 text-white py-5 rounded-3xl font-black font-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-emerald-200"
                                        >
                                            <Save className="h-5 w-5" />
                                            Finalizar Registro
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Crop Modal */}
            {showCropModal && tempImage && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-100 flex flex-col">
                        <div className="p-8 border-b border-emerald-50 text-center">
                            <h2 className="text-xl font-black text-slate-900 uppercase italic">Recortar Fotografía</h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Ajusta la imagen para el perfil</p>
                        </div>
                        <div className="relative h-96 bg-slate-100">
                            <Cropper
                                image={tempImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="p-8 space-y-6 bg-white">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center block">Zoom</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowCropModal(false)}
                                    className="flex-1 bg-slate-50 text-slate-500 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCropSave}
                                    className="flex-[2] bg-emerald-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200"
                                >
                                    Aplicar Recorte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

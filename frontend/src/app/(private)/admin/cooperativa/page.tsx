"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Building2,
    Save,
    Upload,
    RefreshCw,
    ArrowLeft,
    Globe,
    Phone,
    Mail,
    MapPin,
    Palette,
    Calendar,
    FileText,
    Facebook,
    Instagram,
    Twitter,
    MessageCircle,
    Clock,
    Image as ImageIcon,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

interface CooperativaData {
    id?: number;
    nombre: string;
    nombreCorto: string;
    logo: string;
    eslogan: string;
    direccion: string;
    ciudad: string;
    pais: string;
    telefono: string;
    telefonoSecundario: string;
    email: string;
    emailSoporte: string;
    sitioWeb: string;
    ruc: string;
    colorPrimario: string;
    colorSecundario: string;
    colorAcento: string;
    anioFundacion: number | null;
    numeroResolucion: string;
    facebookUrl: string;
    instagramUrl: string;
    twitterUrl: string;
    whatsappNumero: string;
    horarioAtencion: string;
    textoFooter: string;
    updatedAt?: string;
    updatedBy?: string;
}

const defaultData: CooperativaData = {
    nombre: "",
    nombreCorto: "",
    logo: "/logo.png",
    eslogan: "",
    direccion: "",
    ciudad: "",
    pais: "Paraguay",
    telefono: "",
    telefonoSecundario: "",
    email: "",
    emailSoporte: "",
    sitioWeb: "",
    ruc: "",
    colorPrimario: "#10b981",
    colorSecundario: "#064e3b",
    colorAcento: "#f59e0b",
    anioFundacion: null,
    numeroResolucion: "",
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    whatsappNumero: "",
    horarioAtencion: "",
    textoFooter: ""
};

export default function CooperativaPage() {
    const router = useRouter();
    const [data, setData] = useState<CooperativaData>(defaultData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/api/cooperativa", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setData({ ...defaultData, ...result });
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleChange = (field: keyof CooperativaData, value: string | number | null) => {
        setData((prev: CooperativaData) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/api/cooperativa", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al guardar");
            }

            toast.success("Datos guardados correctamente");
            setHasChanges(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Error al guardar datos");
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Solo se permiten imágenes");
            return;
        }

        setUploadingLogo(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/api/cooperativa/logo", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al subir logo");
            }

            const result = await response.json();
            setData((prev: CooperativaData) => ({ ...prev, logo: result.logo }));
            toast.success("Logo actualizado correctamente");
        } catch (error: any) {
            toast.error(error.message || "Error al subir logo");
        } finally {
            setUploadingLogo(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando datos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4">
            <Toaster position="top-center" richColors />

            {/* Header */}
            <div className="pt-4 sm:pt-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors mb-4 text-sm font-bold"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Volver</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                                Datos de la <span className="text-emerald-500">Cooperativa</span>
                            </h1>
                            <p className="text-slate-400 text-sm">
                                Configura la información que se mostrará en todo el sistema
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                    >
                        {saving ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>

                {hasChanges && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-amber-700 text-sm font-bold"
                    >
                        <AlertCircle className="h-4 w-4" />
                        Tienes cambios sin guardar
                    </motion.div>
                )}
            </div>

            {/* Logo Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-100"
            >
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-emerald-500" />
                    Logo de la Cooperativa
                </h2>

                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                        {data.logo ? (
                            <img
                                src={data.logo}
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <ImageIcon className="h-12 w-12 text-slate-300" />
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <p className="text-slate-500 text-sm mb-4">
                            Sube el logo de tu cooperativa. Formatos: PNG, JPG, SVG. Tamaño recomendado: 512x512px
                        </p>
                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors">
                            {uploadingLogo ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            {uploadingLogo ? "Subiendo..." : "Subir Logo"}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                                disabled={uploadingLogo}
                            />
                        </label>
                    </div>
                </div>
            </motion.div>

            {/* Información General */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-100"
            >
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-emerald-500" />
                    Información General
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Nombre Completo *
                        </label>
                        <input
                            type="text"
                            value={data.nombre}
                            onChange={(e) => handleChange("nombre", e.target.value)}
                            placeholder="Cooperativa Ejemplo Ltda."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Nombre Corto
                        </label>
                        <input
                            type="text"
                            value={data.nombreCorto}
                            onChange={(e) => handleChange("nombreCorto", e.target.value)}
                            placeholder="Ejemplo"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Eslogan
                        </label>
                        <input
                            type="text"
                            value={data.eslogan}
                            onChange={(e) => handleChange("eslogan", e.target.value)}
                            placeholder="Tu cooperativa de confianza"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            RUC
                        </label>
                        <input
                            type="text"
                            value={data.ruc}
                            onChange={(e) => handleChange("ruc", e.target.value)}
                            placeholder="80012345-6"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Año de Fundación
                        </label>
                        <input
                            type="number"
                            value={data.anioFundacion || ""}
                            onChange={(e) => handleChange("anioFundacion", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="1990"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Número de Resolución
                        </label>
                        <input
                            type="text"
                            value={data.numeroResolucion}
                            onChange={(e) => handleChange("numeroResolucion", e.target.value)}
                            placeholder="Res. INCOOP N° 123/2000"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Ubicación y Contacto */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-100"
            >
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-emerald-500" />
                    Ubicación y Contacto
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Dirección
                        </label>
                        <input
                            type="text"
                            value={data.direccion}
                            onChange={(e) => handleChange("direccion", e.target.value)}
                            placeholder="Av. Principal 1234"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Ciudad
                        </label>
                        <input
                            type="text"
                            value={data.ciudad}
                            onChange={(e) => handleChange("ciudad", e.target.value)}
                            placeholder="Asunción"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            País
                        </label>
                        <input
                            type="text"
                            value={data.pais}
                            onChange={(e) => handleChange("pais", e.target.value)}
                            placeholder="Paraguay"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Teléfono Principal
                        </label>
                        <input
                            type="text"
                            value={data.telefono}
                            onChange={(e) => handleChange("telefono", e.target.value)}
                            placeholder="(021) 123-4567"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Teléfono Secundario
                        </label>
                        <input
                            type="text"
                            value={data.telefonoSecundario}
                            onChange={(e) => handleChange("telefonoSecundario", e.target.value)}
                            placeholder="(021) 765-4321"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Email Principal
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="info@cooperativa.com"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Email de Soporte
                        </label>
                        <input
                            type="email"
                            value={data.emailSoporte}
                            onChange={(e) => handleChange("emailSoporte", e.target.value)}
                            placeholder="soporte@cooperativa.com"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Sitio Web
                        </label>
                        <input
                            type="url"
                            value={data.sitioWeb}
                            onChange={(e) => handleChange("sitioWeb", e.target.value)}
                            placeholder="https://www.cooperativa.com"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Horario de Atención
                        </label>
                        <input
                            type="text"
                            value={data.horarioAtencion}
                            onChange={(e) => handleChange("horarioAtencion", e.target.value)}
                            placeholder="Lun-Vie 8:00 - 17:00"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Redes Sociales */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-100"
            >
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-3">
                    <Globe className="h-5 w-5 text-emerald-500" />
                    Redes Sociales
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" /> Facebook
                        </label>
                        <input
                            type="url"
                            value={data.facebookUrl}
                            onChange={(e) => handleChange("facebookUrl", e.target.value)}
                            placeholder="https://facebook.com/cooperativa"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-600" /> Instagram
                        </label>
                        <input
                            type="url"
                            value={data.instagramUrl}
                            onChange={(e) => handleChange("instagramUrl", e.target.value)}
                            placeholder="https://instagram.com/cooperativa"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-sky-500" /> Twitter / X
                        </label>
                        <input
                            type="url"
                            value={data.twitterUrl}
                            onChange={(e) => handleChange("twitterUrl", e.target.value)}
                            placeholder="https://twitter.com/cooperativa"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp
                        </label>
                        <input
                            type="text"
                            value={data.whatsappNumero}
                            onChange={(e) => handleChange("whatsappNumero", e.target.value)}
                            placeholder="+595981123456"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Personalización Visual */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-100"
            >
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-3">
                    <Palette className="h-5 w-5 text-emerald-500" />
                    Personalización Visual
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Color Primario
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={data.colorPrimario}
                                onChange={(e) => handleChange("colorPrimario", e.target.value)}
                                className="w-12 h-12 rounded-xl cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={data.colorPrimario}
                                onChange={(e) => handleChange("colorPrimario", e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Color Secundario
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={data.colorSecundario}
                                onChange={(e) => handleChange("colorSecundario", e.target.value)}
                                className="w-12 h-12 rounded-xl cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={data.colorSecundario}
                                onChange={(e) => handleChange("colorSecundario", e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                            Color Acento
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={data.colorAcento}
                                onChange={(e) => handleChange("colorAcento", e.target.value)}
                                className="w-12 h-12 rounded-xl cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={data.colorAcento}
                                onChange={(e) => handleChange("colorAcento", e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview de colores */}
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Vista Previa</p>
                    <div className="flex items-center gap-4">
                        <div
                            className="w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-xs"
                            style={{ backgroundColor: data.colorPrimario }}
                        >
                            Primario
                        </div>
                        <div
                            className="w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-xs"
                            style={{ backgroundColor: data.colorSecundario }}
                        >
                            Secundario
                        </div>
                        <div
                            className="w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-xs"
                            style={{ backgroundColor: data.colorAcento }}
                        >
                            Acento
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Texto para Reportes */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-100"
            >
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-3">
                    <FileText className="h-5 w-5 text-emerald-500" />
                    Texto para Reportes
                </h2>

                <div>
                    <label className="block text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">
                        Pie de Página en Reportes/PDFs
                    </label>
                    <textarea
                        value={data.textoFooter}
                        onChange={(e) => handleChange("textoFooter", e.target.value)}
                        placeholder="Este documento es generado automáticamente por el Sistema de Asambleas..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-400 resize-none"
                    />
                </div>
            </motion.div>

            {/* Última actualización */}
            {data.updatedAt && (
                <div className="text-center text-slate-400 text-xs font-bold">
                    Última actualización: {new Date(data.updatedAt).toLocaleString("es-PY")}
                    {data.updatedBy && ` por ${data.updatedBy}`}
                </div>
            )}
        </div>
    );
}

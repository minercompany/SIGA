"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
    Download,
    FileSpreadsheet,
    Printer,
    User,
    Users,
    ChevronDown,
    Search,
    Loader2,
    Building2,
    ClipboardList,
    UserX,
    BarChart3,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    LayoutGrid
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface ReporteItem {
    id: number;
    fechaHora: string;
    socioNombre: string;
    socioNro: string;
    cedula: string;
    sucursal: string;
    vozVoto: string;
    operador: string;
    estado?: string;
    fechaAsignacion?: string;
    asignadoPor?: string;
    operadorId?: string | number;
    motivos?: string;
    totalPresentes?: number;
    habilitados?: number;
    soloVoz?: number;
    fechaIngreso?: string;
}

type ReportType = 'ASISTENCIA' | 'PADRON' | 'SIN_ASIGNAR' | 'SUCURSALES' | 'OBSERVADOS' | 'POR_SUCURSAL' | 'ASIGNACIONES';

const reportConfig: Record<ReportType, { title: string; description: string; adminOnly: boolean; icon: any; color: string }> = {
    'ASISTENCIA': {
        title: 'Asistencia General',
        description: 'Ingresos a la asamblea',
        adminOnly: false,
        icon: ClipboardList,
        color: 'emerald'
    },
    'PADRON': {
        title: 'Mi Padrón',
        description: 'Socios asignados',
        adminOnly: false,
        icon: Users,
        color: 'blue'
    },
    'POR_SUCURSAL': {
        title: 'Por Sucursal',
        description: 'Filtrado por sede',
        adminOnly: true,
        icon: Building2,
        color: 'violet'
    },
    'SIN_ASIGNAR': {
        title: 'Sin Asignar',
        description: 'Socios pendientes',
        adminOnly: true,
        icon: UserX,
        color: 'orange'
    },
    'SUCURSALES': {
        title: 'Estadísticas',
        description: 'Resumen agrupado',
        adminOnly: true,
        icon: BarChart3,
        color: 'rose'
    },
    'OBSERVADOS': {
        title: 'Solo Voz',
        description: 'Observados con motivo',
        adminOnly: true,
        icon: AlertCircle,
        color: 'slate'
    },
    'ASIGNACIONES': {
        title: 'Asignaciones',
        description: 'Distribución general',
        adminOnly: true,
        icon: LayoutGrid,
        color: 'indigo'
    },
};

export default function ReportesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ReporteItem[]>([]);
    const [stats, setStats] = useState<any>({ totalRegistros: 0, habilitados: 0, observados: 0 });
    const [user, setUser] = useState<any>(null);
    const [operadores, setOperadores] = useState<any[]>([]);
    const [selectedOperador, setSelectedOperador] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [reportView, setReportView] = useState<ReportType>('ASISTENCIA');
    const [sucursales, setSucursales] = useState<any[]>([]);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedSucursalFilter, setSelectedSucursalFilter] = useState<string>("");
    const [filteredOperadores, setFilteredOperadores] = useState<any[]>([]);
    const [step, setStep] = useState(1);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            cargarOperadores(parsedUser);
            const initialView: ReportType = parsedUser.rol === 'USUARIO_SOCIO' ? 'PADRON' : 'ASISTENCIA';
            setReportView(initialView);
            fetchReporte(parsedUser, "", initialView);
        }
    }, []);

    const cargarOperadores = async (usuario: any) => {
        if (usuario.rol === "SUPER_ADMIN" || usuario.rol === "DIRECTIVO") {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/usuarios/operadores", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOperadores(res.data);
            } catch (error) { console.error(error); }

            try {
                const token = localStorage.getItem("token");
                const resSuc = await axios.get("/api/reportes/sucursales-lista", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSucursales(resSuc.data);
            } catch (error) { console.error(error); }
        }
    };

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase().trim();
        const filtered = operadores.filter(op => {
            if (selectedSucursalFilter && op.sucursalId?.toString() !== selectedSucursalFilter) return false;

            if (!lowerTerm) return true;

            const nombre = op.nombreCompleto?.toLowerCase() || "";
            const username = op.username?.toString().toLowerCase() || "";
            const cedula = op.cedula?.toString().toLowerCase() || "";
            const nroSocio = op.numeroSocio?.toString().toLowerCase() || "";

            return (
                nombre.includes(lowerTerm) ||
                username.includes(lowerTerm) ||
                cedula.includes(lowerTerm) ||
                nroSocio.includes(lowerTerm)
            );
        });
        setFilteredOperadores(filtered);

        // Auto-select logic if exact match or single result
        if (lowerTerm.length >= 2 && filtered.length === 1) {
            const foundId = filtered[0].id.toString();
            // Avoid loop if already selected
            if (selectedOperador !== foundId) {
                setSelectedOperador(foundId);
                fetchReporte(user, foundId, reportView, selectedSucursalFilter);
            }
        }
        // If user clears search, reset selection but keep filtered list (handled above)
        else if (searchTerm === "" && selectedOperador !== "") {
            setSelectedOperador("");
            fetchReporte(user, "", reportView, selectedSucursalFilter);
        }
    }, [searchTerm, operadores, selectedSucursalFilter]);

    const fetchReporte = async (currentUser: any, opId?: string, view: ReportType = reportView, sucursalIdOverride?: string) => {
        setLoading(true);
        setData([]);
        try {
            const token = localStorage.getItem("token");
            let url = "/api/reportes";

            const finalOpId = opId !== undefined ? opId : selectedOperador;
            const finalSucId = sucursalIdOverride !== undefined ? sucursalIdOverride : selectedSucursalFilter;

            switch (view) {
                case 'PADRON': url += "/mis-asignados"; break;
                case 'SIN_ASIGNAR': url += "/socios-sin-asignar"; break;
                case 'SUCURSALES': url += "/estadisticas-sucursal"; break;
                case 'OBSERVADOS': url += "/socios-observados"; break;
                case 'ASIGNACIONES': url += "/asignaciones-general"; break;
                case 'POR_SUCURSAL':
                    const sId = finalSucId || selectedSucursalFilter;
                    if (!sId) { setLoading(false); return; }
                    url += `/por-sucursal/${sId}`;
                    break;
                default: url += "/asistencia"; break;
            }

            const response = await axios.get(url, {
                params: {
                    operadorId: finalOpId || undefined,
                    sucursalId: finalSucId || undefined
                },
                headers: { Authorization: `Bearer ${token}` }
            });

            setData(response.data.data);
            setStats(response.data.stats);
        } catch (error: any) {
            toast.error("Error al cargar los datos del reporte.");
        } finally {
            setLoading(false);
        }
    };

    const handleOperadorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVal = e.target.value;
        setSelectedOperador(newVal);
        fetchReporte(user, newVal, reportView);
    };

    const handleSucursalFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedSucursalFilter(val);
        setSelectedOperador("");
        fetchReporte(user, "", reportView, val);
        if (val) setStep(3);
    };

    const handleViewChange = (view: ReportType) => {
        setReportView(view);
        setStep(2);
        fetchReporte(user, selectedOperador, view);
    };

    const formatSafeTime = (dateValue: any) => {
        if (!dateValue) return "-";
        try {
            let d = Array.isArray(dateValue) ? new Date(dateValue[0], dateValue[1] - 1, dateValue[2], dateValue[3] || 0, dateValue[4] || 0, dateValue[5] || 0) : new Date(dateValue);
            return isNaN(d.getTime()) ? "-" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return "-"; }
    };

    const formatSafeDateTime = (dateValue: any) => {
        if (!dateValue) return "-";
        try {
            let d = Array.isArray(dateValue) ? new Date(dateValue[0], dateValue[1] - 1, dateValue[2], dateValue[3] || 0, dateValue[4] || 0, dateValue[5] || 0) : new Date(dateValue);
            return isNaN(d.getTime()) ? "-" : format(d, "dd/MM/yyyy HH:mm", { locale: es });
        } catch { return "-"; }
    };

    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

    const handleExportPDF = async () => {
        if (!data || data.length === 0) { toast.error("No hay datos para exportar."); return; }
        setGenerating(true); setProgress(10);
        try {
            await new Promise(r => setTimeout(r, 500));
            // @ts-ignore
            const doc = new jsPDF(orientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
            let logoBase64 = '';
            try {
                const res = await fetch('/logo-cooperativa.png');
                const blob = await res.blob();
                logoBase64 = await new Promise((res) => {
                    const reader = new FileReader();
                    reader.onloadend = () => res(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch { }

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            doc.setFillColor(31, 41, 55);
            doc.rect(0, 0, pageWidth, 45, 'F');
            if (logoBase64) doc.addImage(logoBase64, 'PNG', 10, 5, 35, 35);
            doc.setFontSize(22); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
            doc.text("COOPERATIVA REDUCTO LTDA", 50, 18);
            doc.setFontSize(11); doc.setTextColor(16, 185, 129); doc.text("SIGA - Sistema Integral de Gestión de Asamblea", 50, 26);
            doc.setFontSize(9); doc.setTextColor(200, 200, 200); doc.text("Documento Oficial", 50, 33);
            doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 14, 38, { align: 'right' });

            const titulos: Record<ReportType, string> = {
                'ASISTENCIA': 'REPORTE OFICIAL DE ASISTENCIA',
                'PADRON': 'REPORTE DE PADRÓN Y ASISTENCIA',
                'POR_SUCURSAL': `REPORTE DE ASISTENCIA - ${stats.sucursalNombre || 'SUCURSAL'}`,
                'SIN_ASIGNAR': 'REPORTE DE SOCIOS SIN ASIGNAR',
                'SUCURSALES': 'ESTADÍSTICAS POR SUCURSAL',
                'OBSERVADOS': 'REPORTE DE SOCIOS (SOLO VOZ)',
                'ASIGNACIONES': 'REPORTE GENERAL DE ASIGNACIONES'
            };
            doc.setFontSize(16); doc.setTextColor(31, 41, 55); doc.text(titulos[reportView], 14, 58);
            doc.setFontSize(11); doc.text(`Total: ${stats.totalRegistros}`, 14, 66);

            let columns: any[] = [];
            let rows: any[] = [];

            if (reportView === 'SUCURSALES') {
                columns = [{ header: 'SUCURSAL', dataKey: 'suc' }, { header: 'TOTAL', dataKey: 'tot' }, { header: 'VOZ/VOTO', dataKey: 'vv' }, { header: 'SOLO VOZ', dataKey: 'sv' }];
                rows = data.map((item: any) => ({ suc: item.sucursal, tot: item.totalPresentes, vv: item.habilitados, sv: item.soloVoz }));
            } else if (reportView === 'OBSERVADOS') {
                columns = [{ header: 'CI', dataKey: 'ci' }, { header: 'SOCIO', dataKey: 'nom' }, { header: 'MOTIVO', dataKey: 'mot' }, { header: 'INGRESO', dataKey: 'f' }];
                rows = data.map((item: any) => ({ ci: item.cedula, nom: item.socioNombre, mot: item.motivos || '-', f: item.fechaIngreso ? new Date(item.fechaIngreso).toLocaleString() : '-' }));
            } else if (reportView === 'ASIGNACIONES' || reportView === 'ASISTENCIA') {
                // ADDED: sucursal column
                columns = [
                    { header: 'CÉDULA', dataKey: 'ci' },
                    { header: 'NRO SOCIO', dataKey: 'nro' },
                    { header: 'SOCIO', dataKey: 'nom' },
                    { header: 'SUCURSAL', dataKey: 'suc' },
                    { header: 'COLABORADOR', dataKey: 'op' },
                    { header: 'INGRESO', dataKey: 'f' },
                    { header: 'CONDICIÓN', dataKey: 'c' }
                ];
                rows = data.map(item => ({
                    ci: item.cedula,
                    nro: item.socioNro,
                    nom: item.socioNombre,
                    suc: item.sucursal,
                    op: item.operador,
                    f: item.fechaHora ? new Date(item.fechaHora).toLocaleString() : '-',
                    c: item.vozVoto === 'HABILITADO' ? 'VOZ Y VOTO' : 'SOLO VOZ',
                    rawStatus: item.vozVoto
                }));
            } else {
                columns = [{ header: 'CÉDULA', dataKey: 'ci' }, { header: 'SOCIO', dataKey: 'nom' }, { header: 'NRO', dataKey: 'nro' }, { header: 'INGRESO', dataKey: 'f' }, { header: 'CONDICIÓN', dataKey: 'c' }];
                rows = data.map(item => ({ ci: item.cedula, nom: item.socioNombre, nro: item.socioNro, f: item.fechaHora ? new Date(item.fechaHora).toLocaleString() : '-', c: item.vozVoto === 'HABILITADO' ? 'VOZ Y VOTO' : 'SOLO VOZ', rawStatus: item.vozVoto }));
            }

            // @ts-ignore
            autoTable(doc, {
                startY: 75, columns: columns, body: rows,
                headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
                bodyStyles: { fontSize: 8, textColor: [0, 0, 0] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { top: 75 }
            });

            // === PIE CHART GENERATION (Only for ASISTENCIA and if data exists) ===
            if (reportView === 'ASISTENCIA' && data.length > 0) {
                // Calculate Stats
                const sucursalStats: Record<string, number> = {};
                let totalForChart = 0;
                data.forEach(d => {
                    const s = d.sucursal || 'Sin Sucursal';
                    sucursalStats[s] = (sucursalStats[s] || 0) + 1;
                    totalForChart++;
                });

                // Check space
                // @ts-ignore
                let finalY = doc.lastAutoTable.finalY + 10;
                if (finalY + 70 > pageHeight) {
                    doc.addPage();
                    finalY = 20;
                }

                doc.setFontSize(14);
                doc.setTextColor(31, 41, 55);
                doc.text("Distribución por Sucursal", 14, finalY);

                const renderPie = (cx: number, cy: number, r: number, dataStats: Record<string, number>) => {
                    let startAngle = 0;
                    const colors = [
                        [16, 185, 129], // Emerald
                        [59, 130, 246], // Blue
                        [245, 158, 11], // Amber
                        [239, 68, 68],  // Red
                        [139, 92, 246], // Violet
                        [236, 72, 153], // Pink
                        [99, 102, 241], // Indigo
                        [100, 116, 139] // Slate
                    ];
                    let colorIdx = 0;

                    // Legend setup
                    let legendY = cy - r + 10;
                    const legendX = cx + r + 20;

                    Object.entries(dataStats).forEach(([suc, count]) => {
                        const percent = count / totalForChart;
                        const angle = percent * 360;
                        const endAngle = startAngle + angle;

                        // Pick color
                        const rgb = colors[colorIdx % colors.length];
                        doc.setFillColor(rgb[0], rgb[1], rgb[2]);

                        // Draw Sector (Triangle Fan approximation for PDF)
                        // Center is (cx, cy)
                        // We step every 5 degrees for smoothness
                        const steps = Math.ceil(angle / 2); // 2 degree precision

                        // We need to construct a path
                        // Using triangle fan manually
                        for (let i = 0; i < steps; i++) {
                            const a1 = (startAngle + (i * (angle / steps))) * (Math.PI / 180);
                            const a2 = (startAngle + ((i + 1) * (angle / steps))) * (Math.PI / 180);

                            const x1 = cx + r * Math.cos(a1);
                            const y1 = cy + r * Math.sin(a1);
                            const x2 = cx + r * Math.cos(a2);
                            const y2 = cy + r * Math.sin(a2);

                            doc.triangle(cx, cy, x1, y1, x2, y2, 'F');
                        }

                        // Legend
                        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
                        doc.rect(legendX, legendY, 5, 5, 'F');
                        doc.setFontSize(9);
                        doc.setTextColor(50, 50, 50);
                        const percentStr = (percent * 100).toFixed(1);
                        doc.text(`${suc} - ${count} (${percentStr}%)`, legendX + 8, legendY + 4);

                        legendY += 8;
                        startAngle += angle;
                        colorIdx++;
                    });
                };

                // Draw centered
                renderPie(50, finalY + 35, 25, sucursalStats);
            }

            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const printWindow = window.open(pdfUrl, '_blank');
            if (!printWindow) doc.save(`reporte_${reportView.toLowerCase()}.pdf`);
            setProgress(100);
        } catch (e) {
            console.error(e);
            toast.error("Error al generar PDF.");
        }
        finally { setGenerating(false); setProgress(0); }
    };

    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data.map(item => ({
            "CI": item.cedula, "Nombre": item.socioNombre, "Sucursal": item.sucursal, "Estado": item.estado || 'PRESENTE', "Condicion": item.vozVoto === 'HABILITADO' ? 'VOZ Y VOTO' : 'SOLO VOZ', "Operador": item.operador
        })));
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Reporte");
        XLSX.writeFile(wb, "reporte_siga.xlsx");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <Toaster position="top-center" richColors />

            {/* Minimal Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Centro de Reportes</h1>
                    <p className="text-slate-500 text-sm">Configura y genera documentos oficiales</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                        className="bg-white border border-slate-200 text-slate-600 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 font-bold cursor-pointer"
                    >
                        <option value="landscape">Horizontal</option>
                        <option value="portrait">Vertical</option>
                    </select>
                    <button onClick={handleExportPDF} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all flex items-center gap-2 text-sm font-bold">
                        <Printer className="w-4 h-4" /> PDF
                    </button>
                    <button onClick={handleExportExcel} className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-emerald-100">
                        <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                </div>
            </div>

            {/* Re-invented Configurator Card */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                    {/* Step 1: Type */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
                            <span className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">1</span>
                            Tipo de Reporte
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(reportConfig) as ReportType[]).map(t => {
                                const active = reportView === t;
                                const Icon = reportConfig[t].icon;
                                return (
                                    <button
                                        key={t}
                                        onClick={() => handleViewChange(t)}
                                        className={`flex items-center gap-2.5 p-3 rounded-xl transition-all text-left ${active
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-black truncate">{reportConfig[t].title}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Sucursal */}
                    <div className={`p-6 space-y-4 transition-opacity ${step < 2 ? 'opacity-30' : 'opacity-100'}`}>
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                            <span className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">2</span>
                            Sucursal
                        </div>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                disabled={user?.rol !== 'SUPER_ADMIN' || step < 2}
                                value={selectedSucursalFilter}
                                onChange={handleSucursalFilterChange}
                                className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            >
                                <option value="">🏢 Todas las Sucursales</option>
                                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 italic px-2">Selecciona una para filtrar por una sede específica</p>
                    </div>

                    {/* Step 3: Specific Collaborator */}
                    <div className={`p-6 space-y-4 transition-opacity ${step < 3 ? 'opacity-30' : 'opacity-100'}`}>
                        <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-widest">
                            <span className="w-6 h-6 rounded-full bg-violet-50 flex items-center justify-center border border-violet-100">3</span>
                            Colaborador
                        </div>
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    disabled={step < 3}
                                    type="text"
                                    placeholder="Buscar por Nombre o CI..."
                                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-violet-500 outline-none"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    disabled={step < 3}
                                    value={selectedOperador}
                                    onChange={handleOperadorChange}
                                    className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                                >
                                    <option value="">👤 Todos los de esta sucursal</option>
                                    {filteredOperadores.length === 0 ? (
                                        <option value="" disabled>No se encontraron resultados</option>
                                    ) : (
                                        filteredOperadores.map(op => (
                                            <option key={op.id} value={op.id}>
                                                {op.nombreCompleto} {op.cedula ? `(CI: ${op.cedula})` : ''} {op.numeroSocio ? `(Socio: ${op.numeroSocio})` : ''}
                                            </option>
                                        ))
                                    )}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Header / Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Registros</p>
                    <p className="text-2xl font-black text-slate-800">{stats.totalRegistros}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Habilitados</p>
                    <p className="text-2xl font-black text-emerald-700">{stats.habilitados}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Observados</p>
                    <p className="text-2xl font-black text-amber-700">{stats.observados}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Carga Activa</p>
                    <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-white font-bold text-sm">Sincronizado</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            {loading ? (
                <div className="py-20 text-center">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Buscando información...</p>
                </div>
            ) : data.length > 0 ? (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Socio / Información</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cédula</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingreso</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                    {(reportView === 'ASIGNACIONES' || reportView === 'ASISTENCIA') && (
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                                    )}
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Condición</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{item.socioNombre}</p>
                                            <p className="text-[10px] text-slate-400">SOCIO NRO: {item.socioNro}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{item.cedula}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{formatSafeTime(item.fechaHora || item.fechaIngreso)}</span>
                                                <span className="text-[10px] text-slate-400">{formatSafeDateTime(item.fechaHora || item.fechaIngreso).split(' ')[0]}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.estado === 'AUSENTE' ? 'bg-red-50 text-red-600' :
                                                item.estado === 'SIN ASIGNAR' ? 'bg-slate-100 text-slate-500' :
                                                    'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                {item.estado || 'PRESENTE'}
                                            </span>
                                        </td>
                                        {(reportView === 'ASIGNACIONES' || reportView === 'ASISTENCIA') && (
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-bold text-slate-700 leading-tight">{item.operador}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase font-black">{item.sucursal}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.vozVoto === 'HABILITADO' ? 'bg-blue-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                {item.vozVoto === 'HABILITADO' ? 'VOZ Y VOTO' : 'SOLO VOZ'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <LayoutGrid className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">No hay registros para los filtros seleccionados</p>
                    <p className="text-slate-300 text-sm">Prueba ajustando el tipo de reporte o la sucursal</p>
                </div>
            )}
        </div>
    );
}

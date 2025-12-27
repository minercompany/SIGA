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
    Search
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

interface ReporteItem {
    id: number;
    fechaHora: string;
    socioNombre: string;
    socioNro: string;
    cedula: string;
    sucursal: string;
    vozVoto: string;
    operador: string;
    estado?: string; // Para reporte de padrón (PRESENTE/AUSENTE)
    fechaAsignacion?: string;
    operadorId?: string | number;
}

type ReportType = 'ASISTENCIA' | 'PADRON' | 'SIN_ASIGNAR' | 'SUCURSALES' | 'OBSERVADOS' | 'POR_SUCURSAL';

// Configuración de cada tipo de reporte
const reportConfig: Record<ReportType, { title: string; description: string; adminOnly: boolean }> = {
    'ASISTENCIA': { title: 'Asistencia General', description: 'Registro de ingreso a la asamblea', adminOnly: false },
    'PADRON': { title: 'Mi Padrón (Asignados)', description: 'Lista de socios asignados y su asistencia', adminOnly: false },
    'POR_SUCURSAL': { title: 'Por Sucursal', description: 'Asistencia filtrada por sucursal', adminOnly: true },
    'SIN_ASIGNAR': { title: 'Socios Sin Asignar', description: 'Socios que no están en ninguna lista', adminOnly: true },
    'SUCURSALES': { title: 'Estadísticas por Sucursal', description: 'Resumen agrupado por sucursal', adminOnly: true },
    'OBSERVADOS': { title: 'Socios Observados', description: 'Socios con Solo Voz y motivos', adminOnly: true },
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
    const [selectedSucursal, setSelectedSucursal] = useState<string>("");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            cargarOperadores(parsedUser);

            // Default view logic
            const initialView: ReportType = parsedUser.rol === 'USUARIO_SOCIO' ? 'PADRON' : 'ASISTENCIA';
            setReportView(initialView);
            fetchReporte(parsedUser, "", initialView);
        }
    }, []);

    const cargarOperadores = async (usuario: any) => {
        if (usuario.rol === "SUPER_ADMIN") {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://192.168.100.123:8081/api/usuarios", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Filtramos para mostrar usuarios relevantes
                setOperadores(res.data);
            } catch (error) {
                console.error("Error cargando operadores", error);
            }

            // Cargar sucursales para el filtro
            try {
                const token = localStorage.getItem("token");
                const resSuc = await axios.get("http://192.168.100.123:8081/api/reportes/sucursales-lista", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSucursales(resSuc.data);
            } catch (error) {
                console.error("Error cargando sucursales", error);
            }
        }
    };

    const fetchReporte = async (currentUser: any, opId: string, view: ReportType = reportView) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            let url = "http://192.168.100.123:8081/api/reportes";

            switch (view) {
                case 'PADRON':
                    url += "/mis-asignados";
                    break;
                case 'SIN_ASIGNAR':
                    url += "/socios-sin-asignar";
                    break;
                case 'SUCURSALES':
                    url += "/estadisticas-sucursal";
                    break;
                case 'OBSERVADOS':
                    url += "/socios-observados";
                    break;
                case 'POR_SUCURSAL':
                    if (selectedSucursal) {
                        url += `/por-sucursal/${selectedSucursal}`;
                    } else {
                        setLoading(false);
                        return; // No hacer fetch si no hay sucursal seleccionada
                    }
                    break;
                default: // ASISTENCIA
                    url += "/asistencia";
                    if (opId) {
                        url += `?operadorId=${opId}`;
                    }
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setData(response.data.data);
            setStats(response.data.stats);

        } catch (error: any) {
            console.error("Error al obtener reporte", error);
            if (error.response?.status === 403) {
                console.warn("No tienes permisos para este reporte o hubo un error.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOperadorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVal = e.target.value;
        setSelectedOperador(newVal);
        fetchReporte(user, newVal, reportView);
    };

    const handleViewChange = (view: ReportType) => {
        // POR_SUCURSAL tiene su propia página
        if (view === 'POR_SUCURSAL') {
            router.push('/reportes/por-sucursal');
            return;
        }
        setReportView(view);
        fetchReporte(user, selectedOperador, view);
    };

    const handleExportPDF = async () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

        // --- CARGAR LOGO ---
        let logoBase64 = '';
        try {
            const response = await fetch('/logo-cooperativa.png');
            const blob = await response.blob();
            logoBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("No se pudo cargar el logo", e);
        }

        // --- ENCABEZADO PREMIUM (UNIFORME PARA TODOS) ---
        doc.setFillColor(31, 41, 55);
        doc.rect(0, 0, 297, 45, 'F');

        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 10, 5, 35, 35);
        }

        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("COOPERATIVA REDUCTO LTDA", 50, 18);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(16, 185, 129);
        doc.text("SIGA - Sistema Integral de Gestión de Asamblea", 50, 26);

        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200);
        doc.text("Documento Oficial", 50, 33);

        doc.setFontSize(9);
        doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 283, 38, { align: 'right' });

        // --- TÍTULO DINÁMICO ---
        const titulos: Record<ReportType, string> = {
            'ASISTENCIA': 'REPORTE OFICIAL DE ASISTENCIA',
            'PADRON': 'REPORTE DE PADRÓN Y ASISTENCIA (MIS ASIGNADOS)',
            'POR_SUCURSAL': `REPORTE DE ASISTENCIA - ${stats.sucursalNombre || 'SUCURSAL'}`,
            'SIN_ASIGNAR': 'REPORTE DE SOCIOS SIN ASIGNAR',
            'SUCURSALES': 'ESTADÍSTICAS DE ASISTENCIA POR SUCURSAL',
            'OBSERVADOS': 'REPORTE DE SOCIOS OBSERVADOS (SOLO VOZ)'
        };

        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.setFont("helvetica", "bold");
        doc.text(titulos[reportView], 14, 58);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(75, 85, 99);
        doc.text(`Total: ${stats.totalRegistros}`, 14, 66);

        doc.setFontSize(9);
        doc.setTextColor(120, 130, 140);
        doc.text(`Operador: ${user?.nombreCompleto || 'Sistema'}`, 283, 66, { align: 'right' });

        // --- COLUMNAS Y DATOS DINÁMICOS ---
        let columns: any[] = [];
        let rows: any[] = [];

        if (reportView === 'SUCURSALES') {
            columns = [
                { header: 'SUCURSAL', dataKey: 'sucursal' },
                { header: 'TOTAL PRESENTES', dataKey: 'totalPresentes' },
                { header: 'VOZ Y VOTO', dataKey: 'habilitados' },
                { header: 'SOLO VOZ', dataKey: 'soloVoz' },
            ];
            rows = data.map((item: any) => ({
                sucursal: item.sucursal,
                totalPresentes: item.totalPresentes,
                habilitados: item.habilitados,
                soloVoz: item.soloVoz
            }));
        } else if (reportView === 'OBSERVADOS') {
            columns = [
                { header: 'CÉDULA', dataKey: 'cedula' },
                { header: 'SOCIO', dataKey: 'socio' },
                { header: 'NRO', dataKey: 'nro' },
                { header: 'SUCURSAL', dataKey: 'sucursal' },
                { header: 'MOTIVO OBSERVACIÓN', dataKey: 'motivos' },
                { header: 'INGRESO', dataKey: 'fechaIngreso' },
            ];
            rows = data.map((item: any) => ({
                cedula: item.cedula,
                socio: item.socioNombre,
                nro: item.socioNro,
                sucursal: item.sucursal,
                motivos: item.motivos || 'Sin especificar',
                fechaIngreso: item.fechaIngreso ? new Date(item.fechaIngreso).toLocaleString() : '-'
            }));
        } else if (reportView === 'SIN_ASIGNAR') {
            columns = [
                { header: 'CÉDULA', dataKey: 'cedula' },
                { header: 'SOCIO', dataKey: 'socio' },
                { header: 'NRO', dataKey: 'nro' },
                { header: 'SUCURSAL', dataKey: 'sucursal' },
                { header: 'CONDICIÓN', dataKey: 'condicion' },
            ];
            rows = data.map((item: any) => ({
                cedula: item.cedula,
                socio: item.socioNombre,
                nro: item.socioNro,
                sucursal: item.sucursal,
                condicion: item.vozVoto === 'HABILITADO' ? 'VOZ Y VOTO' : 'SOLO VOZ',
                rawStatus: item.vozVoto
            }));
        } else if (reportView === 'POR_SUCURSAL') {
            columns = [
                { header: 'CÉDULA', dataKey: 'cedula' },
                { header: 'SOCIO', dataKey: 'socio' },
                { header: 'NRO', dataKey: 'nro' },
                { header: 'REGISTRADO EN LISTA', dataKey: 'fechaAsig' },
                { header: 'INGRESO ASAMBLEA', dataKey: 'fechaIngreso' },
                { header: 'OPERADOR', dataKey: 'operador' },
                { header: 'ESTADO', dataKey: 'estado' },
                { header: 'CONDICIÓN', dataKey: 'condicion' },
            ];
            rows = data.map((item: any) => ({
                cedula: item.cedula,
                socio: item.socioNombre,
                nro: item.socioNro,
                fechaAsig: item.fechaAsignacion ? new Date(item.fechaAsignacion).toLocaleString() : '-',
                fechaIngreso: item.fechaHora ? new Date(item.fechaHora).toLocaleString() : '-',
                operador: item.operador,
                estado: item.estado,
                condicion: item.vozVoto === 'HABILITADO' ? 'VOZ Y VOTO' : 'SOLO VOZ',
                rawStatus: item.vozVoto,
                rawPresence: item.estado
            }));
        } else {
            // ASISTENCIA y PADRON (ya existente)
            columns = [
                { header: 'CÉDULA', dataKey: 'cedula' },
                { header: 'SOCIO', dataKey: 'socio' },
                { header: 'NRO', dataKey: 'nro' },
                { header: 'FECHA/HORA REGISTRO LISTA', dataKey: 'fechaAsig' },
                { header: 'FECHA/HORA INGRESO ASAMBLEA', dataKey: 'fechaIngreso' },
                { header: 'REGISTRADO POR', dataKey: 'operador' },
                { header: 'CONDICIÓN', dataKey: 'condicion' },
            ];
            rows = data.map(item => {
                const esHabilitado = item.vozVoto === 'HABILITADO';
                return {
                    cedula: item.cedula,
                    socio: item.socioNombre,
                    nro: item.socioNro,
                    fechaAsig: item.fechaAsignacion ? new Date(item.fechaAsignacion).toLocaleString() : '-',
                    fechaIngreso: item.fechaHora ? new Date(item.fechaHora).toLocaleString() : '-',
                    operador: item.operador,
                    condicion: esHabilitado ? 'VOZ Y VOTO' : 'SOLO VOZ',
                    rawStatus: item.vozVoto,
                    rawPresence: item.estado || ''
                };
            });
        }

        autoTable(doc, {
            startY: 75,
            columns: columns,
            body: rows,
            headStyles: {
                fillColor: [31, 41, 55],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                valign: 'middle',
                fontSize: 8
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            didParseCell: function (cellData: any) {
                if (cellData.section === 'body') {
                    const row = cellData.row.raw as any;
                    if (row.rawStatus === 'HABILITADO') {
                        cellData.cell.styles.fillColor = [209, 250, 229];
                        cellData.cell.styles.textColor = [6, 78, 59];
                    } else if (row.rawStatus === 'OBSERVADO') {
                        cellData.cell.styles.fillColor = [254, 243, 199];
                        cellData.cell.styles.textColor = [120, 53, 15];
                    }
                    if (row.rawPresence === 'AUSENTE') {
                        cellData.cell.styles.textColor = [156, 163, 175];
                    }
                }
            }
        });

        // Pie de página
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount} - SIGA - Sistema Integral de Gestión de Asamblea`, 148, 200, { align: 'center' });
        }

        const fileName = `reporte_${reportView.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };

    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data.map(item => ({
            "Fecha": item.fechaHora ? new Date(item.fechaHora).toLocaleDateString() : '-',
            "Hora": item.fechaHora ? new Date(item.fechaHora).toLocaleTimeString() : '-',
            "Nro Socio": item.socioNro,
            "Nombre Completo": item.socioNombre,
            "Cédula": item.cedula,
            "Sucursal": item.sucursal,
            "Estado Asistencia": item.estado || 'PRESENTE',
            "Condicion": item.vozVoto === 'HABILITADO' ? 'VOZ Y VOTO' : 'SOLO VOZ',
            "Operador": item.operador
        })));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte");
        XLSX.writeFile(wb, "reporte_asistencia.xlsx");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header Premium */}
            <div className="text-center space-y-3 py-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full mb-2">
                    <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider">SIGA Premium</span>
                </div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">
                    Centro de Reportes
                </h1>
                <p className="text-slate-500 max-w-lg mx-auto">Generación de documentos oficiales, estadísticas y actas de asamblea</p>
            </div>

            {/* Selector de Tipo de Reporte - Premium */}
            <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-[2rem] shadow-xl border border-slate-100/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">Seleccionar Tipo de Reporte</h2>
                        <p className="text-slate-400 text-xs">Elige el documento que deseas generar</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(Object.keys(reportConfig) as ReportType[])
                        .filter(type => {
                            const config = reportConfig[type];
                            return !(config.adminOnly && user?.rol !== 'SUPER_ADMIN');
                        })
                        .map(type => {
                            const config = reportConfig[type];
                            const isActive = reportView === type;

                            // Colores personalizados por tipo
                            const colorSchemes: Record<ReportType, {
                                gradient: string;
                                border: string;
                                shadow: string;
                                icon: string;
                                iconBg: string;
                                hoverBg: string;
                            }> = {
                                'ASISTENCIA': {
                                    gradient: 'from-blue-500 to-cyan-500',
                                    border: 'border-blue-300',
                                    shadow: 'shadow-blue-200',
                                    icon: '📋',
                                    iconBg: 'from-blue-500 to-cyan-600',
                                    hoverBg: 'hover:bg-blue-50'
                                },
                                'PADRON': {
                                    gradient: 'from-emerald-500 to-teal-500',
                                    border: 'border-emerald-300',
                                    shadow: 'shadow-emerald-200',
                                    icon: '👥',
                                    iconBg: 'from-emerald-500 to-teal-600',
                                    hoverBg: 'hover:bg-emerald-50'
                                },
                                'POR_SUCURSAL': {
                                    gradient: 'from-violet-500 to-purple-500',
                                    border: 'border-violet-300',
                                    shadow: 'shadow-violet-200',
                                    icon: '🏛️',
                                    iconBg: 'from-violet-500 to-purple-600',
                                    hoverBg: 'hover:bg-violet-50'
                                },
                                'SIN_ASIGNAR': {
                                    gradient: 'from-amber-500 to-orange-500',
                                    border: 'border-amber-300',
                                    shadow: 'shadow-amber-200',
                                    icon: '❓',
                                    iconBg: 'from-amber-500 to-orange-600',
                                    hoverBg: 'hover:bg-amber-50'
                                },
                                'SUCURSALES': {
                                    gradient: 'from-rose-500 to-pink-500',
                                    border: 'border-rose-300',
                                    shadow: 'shadow-rose-200',
                                    icon: '📊',
                                    iconBg: 'from-rose-500 to-pink-600',
                                    hoverBg: 'hover:bg-rose-50'
                                },
                                'OBSERVADOS': {
                                    gradient: 'from-slate-500 to-gray-600',
                                    border: 'border-slate-300',
                                    shadow: 'shadow-slate-200',
                                    icon: '⚠️',
                                    iconBg: 'from-slate-500 to-gray-700',
                                    hoverBg: 'hover:bg-slate-50'
                                }
                            };

                            const colors = colorSchemes[type];

                            return (
                                <button
                                    key={type}
                                    onClick={() => handleViewChange(type)}
                                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden transform
                                        ${isActive
                                            ? `${colors.border} bg-gradient-to-br ${colors.gradient.replace('to-', 'to-').replace('from-', 'from-').split(' ')[0]}-50 ${colors.gradient.replace('to-', 'to-').replace('from-', 'from-').split(' ')[1]?.replace('-500', '-50') || ''} shadow-2xl ${colors.shadow} scale-[1.03] -translate-y-1`
                                            : `border-slate-200 bg-white ${colors.hoverBg} hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02]`
                                        }`}
                                >
                                    {/* Fondo gradiente sutil para activo */}
                                    {isActive && (
                                        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-5`} />
                                    )}

                                    {/* Efecto de brillo hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                    {/* Indicador activo con color */}
                                    {isActive && (
                                        <div className="absolute top-4 right-4">
                                            <span className="flex h-4 w-4">
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r ${colors.gradient} opacity-75`}></span>
                                                <span className={`relative inline-flex rounded-full h-4 w-4 bg-gradient-to-r ${colors.gradient}`}></span>
                                            </span>
                                        </div>
                                    )}

                                    <div className="relative z-10">
                                        {/* Icono con fondo gradiente */}
                                        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${colors.iconBg} shadow-lg ${colors.shadow} mb-4`}>
                                            <span className="text-2xl filter drop-shadow-sm">{colors.icon}</span>
                                        </div>

                                        <p className={`font-bold text-base leading-tight mb-2 ${isActive ? `bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent` : 'text-slate-800 group-hover:text-slate-900'}`}>
                                            {config.title}
                                        </p>
                                        <p className="text-xs text-slate-400 leading-relaxed">{config.description}</p>

                                        {/* Barra de progreso decorativa */}
                                        <div className={`mt-4 h-1 rounded-full overflow-hidden ${isActive ? `bg-gradient-to-r ${colors.gradient}` : 'bg-slate-100'}`}>
                                            <div className={`h-full ${isActive ? 'w-full' : 'w-0 group-hover:w-full'} bg-gradient-to-r ${colors.gradient} transition-all duration-500`} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                </div>
            </div>

            {/* Panel de Control Simplificado */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">

                {/* Selector de Usuario (Solo Admin) */}
                <div className="w-full md:w-1/2 space-y-3">
                    <label className="text-sm font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Filtrar por Operador / Terminal
                    </label>
                    <div className="space-y-2">
                        {user?.rol === "SUPER_ADMIN" && (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por Nombre, CI o Socio..."
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold text-slate-700 placeholder:font-normal"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="relative">
                            {user?.rol === "SUPER_ADMIN" ? (
                                <select
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-lg rounded-xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-medium cursor-pointer"
                                    value={selectedOperador}
                                    onChange={handleOperadorChange}
                                >
                                    <option value="">★ CONSOLIDADO GENERAL (TODOS)</option>
                                    {operadores
                                        .filter(op => {
                                            if (!searchTerm) return true;
                                            const term = searchTerm.toLowerCase();
                                            return (
                                                op.nombreCompleto.toLowerCase().includes(term) ||
                                                (op.cedula && op.cedula.includes(term)) ||
                                                (op.numeroSocio && op.numeroSocio.includes(term))
                                            );
                                        })
                                        .map(op => (
                                            <option key={op.id} value={op.id}>
                                                {op.nombreCompleto} {op.cedula ? `(CI: ${op.cedula})` : ''}
                                            </option>
                                        ))}
                                </select>
                            ) : (
                                <div className="w-full bg-slate-50 border border-slate-200 text-slate-500 text-lg rounded-xl px-6 py-4 font-medium flex items-center gap-2">
                                    <User className="w-5 h-5 text-emerald-500" />
                                    {user?.nombreCompleto || "Mi Terminal"} {user?.rol === "USUARIO_SOCIO" ? "(Mis Asignados)" : "(Mis Registros)"}
                                </div>
                            )}
                            {/* Icono flecha para select */}
                            {user?.rol === "SUPER_ADMIN" && (
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Botones de Acción */}
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                    <label className="text-sm font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Exportar Documentos
                    </label>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportPDF}
                            className="flex-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-xl shadow-lg shadow-red-200 font-bold flex items-center justify-center gap-3 transition-transform hover:-translate-y-1 active:scale-95"
                        >
                            <Printer className="w-6 h-6" />
                            <div>
                                <span className="block text-xs opacity-80 uppercase tracking-wider">Acta / Listado</span>
                                <span className="text-lg">PDF</span>
                            </div>
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl shadow-lg shadow-emerald-200 font-bold flex items-center justify-center gap-3 transition-transform hover:-translate-y-1 active:scale-95"
                        >
                            <FileSpreadsheet className="w-6 h-6" />
                            <div>
                                <span className="block text-xs opacity-80 uppercase tracking-wider">Planilla de Control</span>
                                <span className="text-lg">Excel</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Selector de VISTA (Solo USUARIO_SOCIO) */}
            {user?.rol === 'USUARIO_SOCIO' && (
                <div className="flex p-1 bg-slate-100 rounded-xl w-fit mx-auto">
                    <button
                        onClick={() => handleViewChange('PADRON')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${reportView === 'PADRON'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Mi Padrón (Total Asignados)
                    </button>
                    <button
                        onClick={() => handleViewChange('ASISTENCIA')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${reportView === 'ASISTENCIA'
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Asistencia Confirmada
                    </button>
                </div>
            )}

            {/* Resumen Visual */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
                        {reportView === 'PADRON' ? 'Total Asignados' : 'Total Registrados'}
                    </p>
                    <p className="text-4xl font-black text-slate-800">{stats.totalRegistros}</p>
                </div>
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 text-center">
                    <p className="text-emerald-600 text-sm font-medium uppercase tracking-wider mb-1">
                        {reportView === 'PADRON' ? 'Presentes' : 'Habilitados'}
                    </p>
                    <p className="text-4xl font-black text-emerald-700">{stats.habilitados}</p>
                </div>
                <div className={`p-5 rounded-2xl border text-center ${reportView === 'PADRON' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <p className={`text-sm font-medium uppercase tracking-wider mb-1 ${reportView === 'PADRON' ? 'text-red-600' : 'text-amber-600'}`}>
                        {reportView === 'PADRON' ? 'Ausentes' : 'Observados'}
                    </p>
                    <p className={`text-4xl font-black ${reportView === 'PADRON' ? 'text-red-700' : 'text-amber-700'}`}>{stats.observados}</p>
                </div>
            </div>

            {/* Tabla Simple (Preview) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Previsualización de Datos ({data.length})</h3>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hora</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Socio</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Operador</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Cargando...</td></tr>
                            ) :
                                data.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50 ${item.estado === 'AUSENTE' ? 'bg-red-50/30' : ''}`}>
                                        <td className="px-6 py-3 text-sm text-slate-600 font-mono">
                                            {item.fechaHora
                                                ? new Date(item.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : <span className="text-slate-300">-</span>
                                            }
                                        </td>
                                        <td className="px-6 py-3 text-sm">
                                            <div className="font-bold text-slate-700">{item.socioNombre}</div>
                                            <div className="text-xs text-slate-400">CI: {item.cedula}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            {reportView === 'PADRON' ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold w-fit ${item.estado === "PRESENTE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                        }`}>
                                                        {item.estado}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {item.vozVoto}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.vozVoto === "HABILITADO"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {item.vozVoto}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-500">
                                            {item.operador}
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

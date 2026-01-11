"use client";

import { useEffect, useState, useRef } from "react";
import { X, Bell, Clock, AlertTriangle, CalendarClock } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

const MESSAGES_TEMPLATES = [
    "¡Hola {user}! 🚀 ¡Apresúrate! El tiempo vuela. La carga de listas finaliza el {date}. ¡No te quedes fuera!",
    "¡Atención {user}! ⏳ El reloj no se detiene. Tienes hasta el {dateText} para cargar tu lista. ¡Hazlo ahora!",
    "¡Hola {user}! 🔔 Recordatorio urgente: El sistema de carga se cerrará el {date}. ¡Evita contratiempos!",
    "¡Saludos {user}! 🌟 Queda muy poco tiempo. El {dateText} es el ÚLTIMO día. ¡Carga tu lista ya!",
    "¡Hey {user}! ⚡ ¡Actúa rápido! Solo tienes hasta el {date}. ¡Asegura tu participación!",
    "¡Hola {user}! 📅 Marca tu calendario: {dateText}, fecha límite. ¡No dejes para mañana lo que puedes cargar hoy!",
    "¡Importante {user}! 🚨 El sistema se deshabilitará el {date} a las 00:00. ¡Carga tu lista antes!",
    "¡Hola {user}! 🏃‍♂️ ¡Corre! El tiempo se agota. El {dateText} es el cierre definitivo. ¡Vamos!",
    "¡Atento {user}! 🛑 No esperes al último minuto. La fecha límite es el {date}. ¡Carga ahora!",
    "¡Hola {user}! ✨ Asegúrate de tener todo listo antes del {dateText}. ¡El tiempo es oro!",
    "¡Aviso {user}! 🕒 Tic-tac, tic-tac... El plazo vence el {date}. ¡No pierdas la oportunidad!",
    "¡Hola {user}! 📝 Recuerda: El {dateText} ya será tarde. ¡Carga tu lista hoy mismo!",
    "¡Ojo {user}! 👀 El cierre es inminente. Tienes hasta el {date}. ¡Dile adiós al estrés cargando ahora!",
    "¡Hola {user}! 🚀 Despegamos hacia el cierre. {dateText}, último día. ¡Sube tu lista!",
    "¡Urgente {user}! ⚠️ El sistema se bloqueará el {date}. ¡Que no te tome por sorpresa!",
    "¡Hola {user}! 💡 Consejo del día: Carga tu lista antes del {dateText} y relájate. ¡Tú puedes!",
    "¡Vamos {user}! 💪 ¡Estás a tiempo! Pero no te confíes, el {date} es el límite.",
    "¡Hola {user}! 🗓️ Fecha crítica: {dateText}. ¡Asegura tu carga antes del bloqueo!",
    "¡Atención {user}! ⏳ La cuenta regresiva ha comenzado. Cierre definitivo el {date}. ¡Apúrate!",
    "¡Hola {user}! 🌟 ¡Última llamada! El sistema de cargas cerrará el {dateText}. ¡Hazlo ya!"
];

const POSITIONS = [
    "bottom-4 right-4",
    "bottom-4 left-4",
    "top-20 right-4",
    "top-20 left-4",
    "bottom-4 left-1/2 -translate-x-1/2",
    "top-24 left-1/2 -translate-x-1/2"
];

export function DeadlineNotification() {
    const { fechaAsamblea } = useConfig();
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [positionClass, setPositionClass] = useState("bottom-4 right-4");
    const [timeLeft, setTimeLeft] = useState("");
    const [user, setUser] = useState<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Calcular fecha límite basada en la configuración
    // Por defecto asumimos las 00:00 del día SIGUIENTE a la fecha de asamblea (o el mismo día a las 23:59:59)
    // Para simplificar, usamos fechaAsamblea + 1 día a las 00:00 como "Cierre"

    const assembleDateObj = new Date(fechaAsamblea);
    // Ajustar zona horaria si es necesario, pero new Date(string) suele usar UTC o local. 
    // Vamos a asegurar que sea "fin del día" o "inicio del día" según lógica de negocio.
    // Usualmente cierre de cargas es antes del evento. Asumiremos que es el mismo día del evento a las 00:00 (empieza el evento, termina carga).

    // Si la fecha es "2026-01-15", el deadline es 2026-01-15T00:00:00
    const DEADLINE = new Date(fechaAsamblea + "T00:00:00").getTime();

    // Formatos de fecha para los mensajes
    const dateFormatted = new Date(fechaAsamblea).toLocaleDateString("es-PY"); // 15/01/2026
    const dateText = new Date(fechaAsamblea).toLocaleDateString("es-PY", { day: 'numeric', month: 'long' }); // 15 de enero

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }

        // Selección inicial aleatoria
        const randomMsgTemplate = MESSAGES_TEMPLATES[Math.floor(Math.random() * MESSAGES_TEMPLATES.length)];
        const randomPos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];

        // Personalizar mensaje
        const userName = userData ? JSON.parse(userData).nombreCompleto.split(' ')[0] : "Usuario";

        const personalizedMsg = randomMsgTemplate
            .replace("{user}", userName)
            .replace("{date}", dateFormatted)
            .replace("{dateText}", dateText);

        setMessage(personalizedMsg);
        setPositionClass(randomPos);

        // Mostrar después de un breve delay
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, [fechaAsamblea, dateFormatted, dateText]);

    // Countdown Timer
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = DEADLINE - now;

            if (distance < 0) {
                setTimeLeft("¡TIEMPO AGOTADO!");
                clearInterval(interval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [DEADLINE]);

    return (
        <div className={`fixed z-[100] transition-all duration-500 bottom-0 left-0 right-0 px-2 pb-2 md:left-auto md:right-4 md:w-auto md:max-w-sm ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-3 md:p-4 shadow-2xl border border-white/10 relative overflow-hidden">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-white/40 hover:text-white bg-white/5 rounded-full p-1 transition-all z-20"
                >
                    <X size={14} />
                </button>

                {/* Layout responsive: columna en móvil, fila en desktop */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 pr-6">
                    {/* Header con icono y texto */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="bg-amber-500 p-1.5 md:p-2 rounded-lg flex-shrink-0">
                            <CalendarClock className="text-white h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-black text-white text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                CIERRE DE CARGAS
                            </h4>
                            <p className="text-indigo-100/90 text-[10px] md:text-xs font-medium">
                                Finaliza el {new Date(fechaAsamblea).toLocaleDateString("es-PY", { day: '2-digit', month: '2-digit' })}. ¡Carga ya!
                            </p>
                        </div>
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center justify-between md:justify-end gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                        <span className="text-[8px] text-indigo-300 font-bold uppercase tracking-tighter md:hidden">RESTAN</span>
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-amber-400" />
                            <span className="text-xs md:text-sm font-black text-white font-mono tabular-nums">
                                {timeLeft}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

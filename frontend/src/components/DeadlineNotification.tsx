"use client";

import { useEffect, useState, useRef } from "react";
import { X, Bell, Clock, AlertTriangle, CalendarClock } from "lucide-react";

const MESSAGES = [
    "¡Hola {user}! 🚀 ¡Apresúrate! El tiempo vuela. La carga de listas finaliza el 05/01/2026. ¡No te quedes fuera!",
    "¡Atención {user}! ⏳ El reloj no se detiene. Tienes hasta el 5 de enero para cargar tu lista. ¡Hazlo ahora!",
    "¡Hola {user}! 🔔 Recordatorio urgente: El sistema de carga se cerrará el 06/01/2026. ¡Evita contratiempos!",
    "¡Saludos {user}! 🌟 Queda muy poco tiempo. El 5 de enero es el ÚLTIMO día. ¡Carga tu lista ya!",
    "¡Hey {user}! ⚡ ¡Actúa rápido! Solo tienes hasta el 05/01/2026. ¡Asegura tu participación!",
    "¡Hola {user}! 📅 Marca tu calendario: 5 de enero, fecha límite. ¡No dejes para mañana lo que puedes cargar hoy!",
    "¡Importante {user}! 🚨 El sistema se deshabilitará el 06/01/2026 a las 00:00. ¡Carga tu lista antes!",
    "¡Hola {user}! 🏃‍♂️ ¡Corre! El tiempo se agota. El 5 de enero es el cierre definitivo. ¡Vamos!",
    "¡Atento {user}! 🛑 No esperes al último minuto. La fecha límite es el 05/01/2026. ¡Carga ahora!",
    "¡Hola {user}! ✨ Asegúrate de tener todo listo antes del 5 de enero. ¡El tiempo es oro!",
    "¡Aviso {user}! 🕒 Tic-tac, tic-tac... El plazo vence el 05/01/2026. ¡No pierdas la oportunidad!",
    "¡Hola {user}! 📝 Recuerda: El 6 de enero ya será tarde. ¡Carga tu lista hoy mismo!",
    "¡Ojo {user}! 👀 El cierre es inminente. Tienes hasta el 05/01/2026. ¡Dile adiós al estrés cargando ahora!",
    "¡Hola {user}! 🚀 Despegamos hacia el cierre. 5 de enero, último día. ¡Sube tu lista!",
    "¡Urgente {user}! ⚠️ El sistema se bloqueará el 06/01/2026. ¡Que no te tome por sorpresa!",
    "¡Hola {user}! 💡 Consejo del día: Carga tu lista antes del 5 de enero y relájate. ¡Tú puedes!",
    "¡Vamos {user}! 💪 ¡Estás a tiempo! Pero no te confíes, el 05/01/2026 es el límite.",
    "¡Hola {user}! 🗓️ Fecha crítica: 5 de enero de 2026. ¡Asegura tu carga antes del bloqueo!",
    "¡Atención {user}! ⏳ La cuenta regresiva ha comenzado. Cierre definitivo el 05/01/2026. ¡Apúrate!",
    "¡Hola {user}! 🌟 ¡Última llamada! El sistema de cargas cerrará el 6 de enero. ¡Hazlo ya!"
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
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [positionClass, setPositionClass] = useState("bottom-4 right-4");
    const [timeLeft, setTimeLeft] = useState("");
    const [user, setUser] = useState<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Configurar fecha límite: 6 de Enero 2026 a las 00:00:00 (Fin del 5)
    // Meses en JS son 0-indexados (Enero = 0)
    const DEADLINE = new Date(2026, 0, 6, 0, 0, 0).getTime();

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }

        // Selección inicial aleatoria
        const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        const randomPos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];

        // Personalizar mensaje
        const personalizedMsg = userData
            ? randomMsg.replace("{user}", JSON.parse(userData).nombreCompleto.split(' ')[0])
            : randomMsg.replace("{user}", "Usuario");

        setMessage(personalizedMsg);
        setPositionClass(randomPos);

        // Mostrar después de un breve delay
        const timer = setTimeout(() => {
            setIsVisible(true);
            // Intentar reproducir sonido suave
            // if (audioRef.current) {
            //     audioRef.current.volume = 0.5;
            //     audioRef.current.play().catch(() => { });
            // }
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

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
                                Finaliza el 05/01. ¡Carga ya!
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

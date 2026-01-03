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

    if (!isVisible) return null;

    return (
        <div className={`fixed ${positionClass} z-[60] animate-in slide-in-from-bottom-5 fade-in duration-500 max-w-sm w-full md:w-auto`}>
            {/* Audio oculto para notificación */}
            {/* Audio oculto para notificación - Desactivado por falta de archivo
            <audio ref={audioRef} src="/sounds/notification_simple.mp3" />
            */}

            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-0.5 shadow-2xl overflow-hidden hover:scale-105 transition-transform duration-300">
                <div className="bg-white/10 backdrop-blur-md rounded-[14px] p-4 relative overflow-hidden">

                    {/* Efecto de brillo de fondo */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-purple-500/30 rounded-full blur-xl"></div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-2 right-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1 transition-colors z-20"
                    >
                        <X size={14} />
                    </button>

                    <div className="flex gap-4 items-start relative z-10">
                        <div className="bg-white/20 p-2.5 rounded-xl flex-shrink-0 animate-bounce">
                            <CalendarClock className="text-white h-6 w-6" />
                        </div>

                        <div className="flex-1 mr-4">
                            <h4 className="font-black text-white text-sm mb-1 flex items-center gap-2">
                                <AlertTriangle size={14} className="text-yellow-300" />
                                CIERRE DE CARGAS
                            </h4>

                            <p className="text-white/90 text-xs font-medium leading-relaxed mb-3">
                                {message}
                            </p>

                            <div className="bg-black/30 rounded-lg p-2.5 flex items-center justify-between border border-white/10">
                                <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Tiempo Restante</span>
                                <div className="flex items-center gap-2">
                                    <Clock size={12} className="text-yellow-400 animate-pulse" />
                                    <span className="text-sm font-black text-white font-mono tracking-wide tabular-nums">
                                        {timeLeft}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Barra de progreso decorativa */}
                <div className="h-1 w-full bg-black/20 mt-[-1px]">
                    <div className="h-full bg-yellow-400 w-[85%] animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}

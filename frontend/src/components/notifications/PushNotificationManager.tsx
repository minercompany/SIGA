"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushNotificationManager({ userRole }: { userRole?: string }) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        // Solo para administradores
        if (userRole !== 'SUPER_ADMIN') return;

        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setPermission(Notification.permission);

            // Registrar el service worker explícitamente
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then((registration) => {
                    console.log('Push: Service Worker registrado correctamente con scope:', registration.scope);
                    return registration;
                })
                .then(async (registration) => {
                    const subscription = await registration.pushManager.getSubscription();

                    if (subscription) {
                        try {
                            console.log('Push: Se encontró suscripción existente, verificando validez...');
                            const response = await axios.get('/api/push/public-key', {
                                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                            });
                            setIsSubscribed(true);
                        } catch (error) {
                            console.error('Push: Error verificando suscripción:', error);
                            setIsSubscribed(false);
                        }
                    } else {
                        console.log('Push: No se encontró suscripción activa en el navegador.');
                        setIsSubscribed(false);
                    }
                })
                .catch((error) => {
                    console.error('Push: Error al registrar Service Worker:', error);
                });
        }
    }, []);

    const subscribeUser = async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                console.log('Push: Iniciando proceso de suscripción...');
                const registration = await navigator.serviceWorker.ready;

                const permissionResult = await Notification.requestPermission();
                setPermission(permissionResult);

                if (permissionResult === 'granted') {
                    // 1. Obtener clave pública
                    const response = await axios.get('/api/push/public-key', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    const publicKey = response.data.publicKey;
                    console.log('Push: Clave pública obtenida del servidor');

                    // 2. Si ya hay una suscripción, intentar desuscribirla primero para asegurar que usamos la nueva clave
                    const existingSub = await registration.pushManager.getSubscription();
                    if (existingSub) {
                        console.log('Push: Limpiando suscripción antigua antes de renovar...');
                        await existingSub.unsubscribe();
                    }

                    // 3. Suscribirse con la nueva clave
                    const convertedVapidKey = urlBase64ToUint8Array(publicKey);
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey
                    });

                    console.log('Push: Suscripción de navegador exitosa');

                    // 4. Enviar al backend
                    const subJson = subscription.toJSON();
                    await axios.post('/api/push/subscribe', {
                        endpoint: subJson.endpoint,
                        keys_p256dh: subJson.keys?.p256dh,
                        keys_auth: subJson.keys?.auth
                    }, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });

                    setIsSubscribed(true);
                    console.log('Push: Suscripción guardada en el servidor');
                    new Notification("Suscripción exitosa", {
                        body: "Ahora recibirás notificaciones push del sistema.",
                        icon: '/images/notification-banner.jpg'
                    });
                } else {
                    console.warn('Push: Permiso denegado por el usuario');
                }
            } catch (error) {
                console.error('Push: Error crítico en suscripción:', error);
                alert("Error al activar notificaciones. Por favor, asegúrate de permitir notificaciones en tu navegador.");
            }
        } else {
            alert("Tu navegador no soporta notificaciones push.");
        }
    };

    if (userRole !== 'SUPER_ADMIN') {
        return null;
    }

    if (permission === 'denied') {
        return null; // O mostrar un mensaje de ayuda
    }

    if (isSubscribed) {
        return null; // Ya está suscrito, no molestar pero se mantiene activo
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col gap-2 max-w-sm animate-fade-in-up">
            <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900">Activar Notificaciones</h4>
                    <p className="text-sm text-gray-600 mt-1">Recibe alertas importantes del sistema incluso con la web cerrada.</p>
                </div>
            </div>
            <button
                onClick={subscribeUser}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
            >
                Activar Notificaciones
            </button>
        </div>
    );
}

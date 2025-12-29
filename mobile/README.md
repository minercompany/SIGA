# SIGA Mobile - Instrucciones de Instalación

## Opción Rápida: Expo Go (Desarrollo)

1. Instala **Expo Go** desde Google Play Store
2. Ejecuta en el servidor:
```bash
cd /home/SIGA/mobile
npx expo start --tunnel
```
3. Escanea el código QR con tu celular

## Generar APK con EAS Build

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Iniciar sesión (necesitas cuenta en expo.dev)
eas login

# Generar APK
cd /home/SIGA/mobile
eas build --platform android --profile preview
```

## Estructura del Proyecto

- `/app/(auth)/login.tsx` - Pantalla de login
- `/app/(tabs)/dashboard.tsx` - Dashboard principal
- `/app/(tabs)/socios.tsx` - Gestión de socios
- `/app/(tabs)/asistencia.tsx` - Registro de asistencia
- `/app/(tabs)/config.tsx` - Configuración

## Servidor API

La app se conecta a: `https://asamblea.cloud/api`

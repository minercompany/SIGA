@echo off
echo Iniciando Sistema de Asamblea...

echo Iniciando Backend (Spring Boot)...
start "Backend SIGA" cmd /k "cd backend && mvnw spring-boot:run"

timeout /t 10

echo Iniciando App Movil (Expo)...
cd mobile
if exist android rmdir /s /q android
cmd /k "npx expo start --android"

@echo off
echo Cambiando perfil de red de 'Publico' a 'Privado' para permitir conexiones locales...
PowerShell -Command "Set-NetConnectionProfile -InterfaceIndex 4 -NetworkCategory Private"
echo.
echo Red configurada como PRIVADA.
echo Intenta acceder ahora desde tu celular.
pause

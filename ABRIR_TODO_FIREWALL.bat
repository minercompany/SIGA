@echo off
echo Abriendo puertos 6001 y 8081 en TODOS los perfiles de red...
netsh advfirewall firewall add rule name="Asamblea GLOBAL" dir=in action=allow protocol=TCP localport=6001,8081 profile=any
echo.
echo Regla aplicada. Intenta de nuevo.
echo Si falla, revisa si tienes Antivirus (Avast, AVG, etc) y desactivalo.
pause

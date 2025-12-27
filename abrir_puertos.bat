@echo off
echo Abriendo puertos del sistema en el Firewall de Windows...
netsh advfirewall firewall add rule name="Asamblea App" dir=in action=allow protocol=TCP localport=6001,8081
echo.
echo ¡Puertos 6001 y 8081 abiertos correctamente!
echo Ahora intenta acceder desde tu celular.
pause

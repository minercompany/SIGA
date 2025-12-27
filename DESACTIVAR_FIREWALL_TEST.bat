@echo off
echo PRECAUCION: Se desactivara el Firewall temporalmente para probar conexion.
NetSh Advfirewall set allprofiles state off
echo.
echo Firewall DESACTIVADO.
echo Intenta conectar desde tu celular ahora.
echo.
echo Si funciona, vuelve a activarlo mas tarde con el otro script que creare.
pause

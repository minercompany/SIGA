# Script para ejecutar el backend de Asamblea
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.9.10-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Set-Location "c:\SISTEMA_ASAMBLEA\backend"

# Verificar Java
Write-Host "Usando Java: $(java -version 2>&1 | Select-Object -First 1)"

# Ejecutar Maven
& "$env:JAVA_HOME\bin\java.exe" -cp ".mvn/wrapper/maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain spring-boot:run

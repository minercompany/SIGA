@echo off
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.9.10-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "c:\SISTEMA_ASAMBLEA\backend"
call mvnw.cmd spring-boot:run

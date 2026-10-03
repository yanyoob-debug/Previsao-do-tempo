@echo off
setlocal
cd /d "%~dp0"

call mvnw.cmd -f backend\pom.xml spring-boot:run

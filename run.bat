@echo off
chcp 65001 >nul
color 0A
title ميزان POS
node --version >nul 2>&1
if errorlevel 1 ( echo خطأ: ثبّت Node.js من nodejs.org & pause & exit /b 1 )
if not exist "node_modules" (
    echo ⏳ تثبيت المتطلبات (مرة واحدة)...
    call npm install --legacy-peer-deps
)
echo ✅ تشغيل ميزان POS...
call npm start

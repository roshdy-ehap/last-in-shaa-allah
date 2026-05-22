@echo off
chcp 65001 >nul
color 0B
title ميزان POS — بناء التطبيق
echo.
echo  ══════════════════════════════════════════
echo  ميزان POS — بناء ملف التثبيت .exe
echo  ══════════════════════════════════════════
echo.
node --version >nul 2>&1
if errorlevel 1 ( echo خطأ: ثبّت Node.js من nodejs.org & pause & exit /b 1 )
echo ⏳ تثبيت المتطلبات...
call npm install --legacy-peer-deps
if errorlevel 1 ( echo خطأ في التثبيت & pause & exit /b 1 )
echo.
echo ⏳ بناء 64-bit...
call npm run build
echo.
echo ⏳ بناء 32-bit (Win7)...
call npm run build32
if errorlevel 1 ( echo خطأ في البناء & pause & exit /b 1 )
echo.
echo  ✅ تم البناء بنجاح! الملفات في مجلد: dist\
echo.
start "" dist
pause

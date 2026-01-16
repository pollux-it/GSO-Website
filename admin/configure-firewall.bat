@echo off
echo ========================================
echo   GSO Admin Server - Firewall Configuration
echo ========================================
echo.
echo This script will add a Windows Firewall rule to allow
echo incoming connections on port 3000 for the admin server.
echo.
echo NOTE: This requires Administrator privileges.
echo.
pause

netsh advfirewall firewall add rule name="GSO Admin Server Port 3000" dir=in action=allow protocol=TCP localport=3000

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Firewall rule added successfully!
    echo ========================================
    echo.
    echo The admin server should now be accessible from other devices
    echo on your local network at: http://192.168.1.171:3000
    echo.
) else (
    echo.
    echo ========================================
    echo   ERROR: Failed to add firewall rule
    echo ========================================
    echo.
    echo Please make sure you're running this script as Administrator.
    echo Right-click and select "Run as administrator"
    echo.
)

pause

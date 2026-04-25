@echo off
chcp 65001 >nul 2>&1
title AWP 配置產生器 - 一鍵打包

echo ========================================
echo   AWP 配置產生器 - 一鍵打包腳本
echo ========================================
echo.

:: 步驟 0：詢問是否清除舊打包
set /p CLEAN="是否清除舊的打包檔案？(Y/N): "
if /i "%CLEAN%"=="Y" (
    echo [清除] 正在刪除 dist/ 和 release/ ...
    if exist dist rmdir /s /q dist
    if exist release rmdir /s /q release
    echo [清除] 完成。
)
echo.

:: 步驟 1：環境檢查
echo [檢查] 確認 Node.js 環境...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [錯誤] 找不到 Node.js，請先安裝 Node.js。
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo   Node.js 版本: %%i

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [錯誤] 找不到 npm，請確認 Node.js 安裝完整。
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do echo   npm 版本: %%i
echo.

:: 步驟 2：安裝依賴
echo [安裝] 正在執行 npm install ...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [錯誤] npm install 失敗，請檢查網路連線或 package.json。
    pause
    exit /b 1
)
echo [安裝] 完成。
echo.

:: 步驟 3：前端編譯
echo [編譯] 正在執行 vite build ...
call npx vite build
if %ERRORLEVEL% neq 0 (
    echo [錯誤] vite build 失敗，請檢查前端程式碼。
    pause
    exit /b 1
)
echo [編譯] 完成。
echo.

:: 步驟 4：Electron 打包
echo [打包] 正在執行 electron-builder ...
call npx electron-builder --win portable
if %ERRORLEVEL% neq 0 (
    echo [錯誤] electron-builder 打包失敗，請檢查 Electron 設定。
    pause
    exit /b 1
)
echo [打包] 完成。
echo.

:: 步驟 5：完成
echo ========================================
echo   打包完成！
echo   輸出位置: release/
echo ========================================
echo.

:: 開啟 release 資料夾
if exist release (
    explorer release
) else (
    echo [警告] release/ 資料夾不存在，請確認打包是否成功。
)

pause

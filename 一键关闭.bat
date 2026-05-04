@echo off
chcp 65001 >nul
title 逆熵 — 一键关闭

echo ⏻ 正在关闭逆熵平台...

:: 关闭一键启动时打开的终端窗口
echo  · 关闭启动窗口...
taskkill /fi "WINDOWTITLE eq 逆熵-前端" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq 逆熵-后端" /f >nul 2>&1

:: 结束所有 Node.js 进程（npm run dev / node server.js / vite）
echo  · 停止 Node 进程...
taskkill /f /im node.exe >nul 2>&1

:: 再按端口精准清理（收尾）
echo  · 清理端口 5000 和 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 "') do (
  taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
  taskkill /f /pid %%a >nul 2>&1
)

echo ✓ 所有服务已关闭
echo.
timeout /t 2 /nobreak >nul

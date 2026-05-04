# 逆熵 — 一键关闭 (PowerShell)
Write-Host "⏻ 正在关闭逆熵平台..." -ForegroundColor Cyan

# 停止所有 Node.js 进程（npm run dev / node server.js / vite）
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host " ✓ Node.js 进程已终止" -ForegroundColor Green

# 确认端口释放
$ports = @(5000, 5173)
foreach ($port in $ports) {
    $conn = netstat -ano | Select-String ":$port "
    if ($conn) {
        $pid = ($conn -split '\s+')[-1]
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host " ✓ 端口 $port 已释放" -ForegroundColor Green
    }
}

Write-Host "`n✅ 所有服务已关闭" -ForegroundColor Green
Start-Sleep -Seconds 2

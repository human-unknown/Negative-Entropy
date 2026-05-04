# 逆熵 — 一键启动 (PowerShell 版，最可靠)
# 右键 → 使用 PowerShell 运行

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "⏳ 正在启动逆熵平台..." -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "❌ 未检测到 Node.js" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}
Write-Host "✓ Node.js $($node.Version)" -ForegroundColor Green

# 检查/安装前端依赖
if (-not (Test-Path "$Root\frontend\node_modules")) {
    Write-Host "📦 安装前端依赖..." -ForegroundColor Yellow
    Push-Location "$Root\frontend"
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 前端依赖安装失败" -ForegroundColor Red
        Read-Host "按回车退出"
        exit 1
    }
    Pop-Location
}

# 检查/安装后端依赖
if (-not (Test-Path "$Root\backend\node_modules")) {
    Write-Host "📦 安装后端依赖..." -ForegroundColor Yellow
    Push-Location "$Root\backend"
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 后端依赖安装失败" -ForegroundColor Red
        Read-Host "按回车退出"
        exit 1
    }
    Pop-Location
}

Write-Host ""
Write-Host "🚀 启动中..." -ForegroundColor Cyan
Write-Host "  后端 → http://localhost:5000"
Write-Host "  前端 → http://localhost:5173"
Write-Host ""

# 启动后端（新窗口）
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; npm run dev" -WindowStyle Normal -PassThru

Start-Sleep -Seconds 2

# 启动前端（新窗口）
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; npm run dev" -WindowStyle Normal -PassThru

Start-Sleep -Seconds 4

# 打开浏览器
Start-Process "http://localhost:5173"

Write-Host "✅ 启动完成！浏览器已自动打开" -ForegroundColor Green
Write-Host ""
Write-Host "  🔒 关闭方式: 关闭两个 PowerShell 窗口即可"
Write-Host "     或运行「一键关闭.ps1」"
Write-Host ""

Read-Host "按回车关闭此窗口（服务仍在后台运行）"

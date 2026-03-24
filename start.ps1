# ResearchSphere - Start Script
# This script starts both the Express backend and React frontend

Write-Host "🚀 Starting ResearchSphere..." -ForegroundColor Cyan
Write-Host ""

# Start backend in a new PowerShell window
Write-Host "📡 Starting Express Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; Write-Host '🔧 Express Backend Server' -ForegroundColor Green; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start frontend in a new PowerShell window
Write-Host "⚛️  Starting React Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host '⚛️  React Frontend' -ForegroundColor Blue; npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 URLs:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Check the new terminal windows for server logs" -ForegroundColor Cyan

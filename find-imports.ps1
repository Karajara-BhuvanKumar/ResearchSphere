# Script to find all files that need to be updated
# This searches for imports from '@/services/api'

Write-Host "🔍 Searching for files that import from '@/services/api'..." -ForegroundColor Cyan
Write-Host ""

$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | 
    Select-String -Pattern "from ['\`"]@/services/api['\`"]" | 
    Select-Object -ExpandProperty Path -Unique

if ($files.Count -eq 0) {
    Write-Host "✅ No files found! Migration might be complete." -ForegroundColor Green
} else {
    Write-Host "📝 Found $($files.Count) file(s) to update:" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($file in $files) {
        $relativePath = $file -replace [regex]::Escape($PWD), "."
        Write-Host "   - $relativePath" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "💡 To update these files:" -ForegroundColor Cyan
    Write-Host "   1. Open each file" -ForegroundColor White
    Write-Host "   2. Change: import { ... } from '@/services/api'" -ForegroundColor Red
    Write-Host "   3. To:     import { ... } from '@/services/apiClient'" -ForegroundColor Green
    Write-Host ""
    Write-Host "Or use Find & Replace in your IDE:" -ForegroundColor Cyan
    Write-Host "   Find:    from '@/services/api'" -ForegroundColor Red
    Write-Host "   Replace: from '@/services/apiClient'" -ForegroundColor Green
}

Write-Host ""
Write-Host "📚 See MIGRATION_GUIDE.md for detailed instructions" -ForegroundColor Cyan

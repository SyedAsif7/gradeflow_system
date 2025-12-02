# Script to fix merge conflict in C:\Desktop\Mini\backend\server.py
$filePath = "C:\Desktop\Mini\backend\server.py"

if (Test-Path $filePath) {
    Write-Host "Reading file: $filePath"
    $content = Get-Content $filePath -Raw
    
    # Remove merge conflict markers
    $content = $content -replace '<<<<<<< Current \(Your changes\)\r?\n', ''
    $content = $content -replace '<<<<<<< HEAD\r?\n', ''
    $content = $content -replace '=======\r?\n', ''
    $content = $content -replace '>>>>>>> .+\r?\n', ''
    
    # Ensure file starts with proper imports
    if (-not $content.TrimStart().StartsWith('from fastapi')) {
        Write-Host "Warning: File doesn't start with expected imports. Please check manually."
    }
    
    # Write back
    Set-Content -Path $filePath -Value $content -NoNewline
    Write-Host "Fixed merge conflict markers in $filePath"
} else {
    Write-Host "File not found: $filePath"
    Write-Host "Please ensure the file exists or update the path in this script."
}


# 打包 server 目录为云托管 zip(文件在 zip 根目录,不要 server 子文件夹)
$serverDir = $PSScriptRoot
$zipPath = Join-Path (Split-Path $serverDir -Parent) "tradedna-api.zip"

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$files = @(
    "Dockerfile", "requirements.txt", ".dockerignore",
    "config.py", "db_store.py", "personality_store.py",
    "wechat_http.py", "app.py"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
foreach ($f in $files) {
    $full = Join-Path $serverDir $f
    if (Test-Path $full) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $full, $f) | Out-Null
        Write-Host "  + $f"
    } else {
        Write-Host "  ! missing: $f" -ForegroundColor Yellow
    }
}
$zip.Dispose()
Write-Host ""
Write-Host "已生成: $zipPath"
Write-Host "上传到云托管,Dockerfile 路径填: Dockerfile"

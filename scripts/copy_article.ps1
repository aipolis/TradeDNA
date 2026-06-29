# 复制公众号发布版 md 内容到剪贴板,绕过 Cursor 的复制问题
# 用法:
#   .\scripts\copy_article.ps1
#   然后输入 DNA 码(如 XECF / XEGD / RTCD),回车

$base = Join-Path $PSScriptRoot "..\docs\marketing\公众号发布版"
$base = (Resolve-Path $base).Path

# 列出所有可选 DNA 码
$files = Get-ChildItem -Path $base -Filter "人格详解_*.md"
Write-Host ""
Write-Host "=== 公众号发布版 16 篇 ===" -ForegroundColor Cyan
foreach ($f in $files) {
    $name = $f.BaseName -replace "^人格详解_",""
    Write-Host "  - $name" -ForegroundColor Gray
}
Write-Host ""

while ($true) {
    $dna = Read-Host "输入 DNA 码(如 XECF / XEGD,直接回车退出)"
    if ([string]::IsNullOrWhiteSpace($dna)) {
        Write-Host "退出。" -ForegroundColor Gray
        break
    }

    $dna = $dna.Trim().ToUpper()
    $target = Get-ChildItem -Path $base -Filter "人格详解_${dna}_*.md" | Select-Object -First 1

    if ($null -eq $target) {
        Write-Host "  ✗ 未找到 $dna 的 md 文件,DNA 码拼错了?" -ForegroundColor Red
        continue
    }

    $content = Get-Content -Raw -Encoding UTF8 $target.FullName
    Set-Clipboard -Value $content
    $size = [math]::Round((Get-Item $target.FullName).Length / 1KB, 1)
    Write-Host "  ✓ 已复制 [$($target.Name)] $size KB 到剪贴板" -ForegroundColor Green
    Write-Host "    现在去 mdnice 编辑区 Ctrl+V" -ForegroundColor DarkGray
    Write-Host ""
}

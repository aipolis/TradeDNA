# 把 DALL-E 3 生成的 1792x1024 横版图裁切成公众号需要的尺寸
#
# 用法:
#   1. 把 ChatGPT 出的图统一放到 F:\startup\TradeDNA\brand\covers\
#   2. 文件名建议:cover_XECF.png / cover_XEGD.png 等(对应 DNA 码)
#   3. 跑这个脚本,自动处理所有 .png/.jpg
#
# 输出位置: F:\startup\TradeDNA\brand\covers\output\
#   <原名>_900x500.png    公众号主头图(1.8:1)
#   <原名>_1000x1000.png  方图(朋友圈分享/抖音封面)
#   <原名>_200x200.png    公众号次条小图

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$src = Join-Path $root "brand\covers"
$dst = Join-Path $src "output"

if (-not (Test-Path $src)) {
    New-Item -ItemType Directory -Force -Path $src | Out-Null
    Write-Host "已创建目录: $src" -ForegroundColor Yellow
    Write-Host "请把 ChatGPT 生成的图片放进去后再跑本脚本" -ForegroundColor Yellow
    exit
}

if (-not (Test-Path $dst)) {
    New-Item -ItemType Directory -Force -Path $dst | Out-Null
}

$files = Get-ChildItem -Path $src -File | Where-Object { $_.Extension -in '.png', '.jpg', '.jpeg', '.webp' }

if ($files.Count -eq 0) {
    Write-Host "未找到任何图片在 $src" -ForegroundColor Yellow
    Write-Host "把图放进去后再跑" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "=== 找到 $($files.Count) 张原图 ===" -ForegroundColor Cyan
foreach ($f in $files) {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    Write-Host "  $($f.Name)  ($($img.Width)x$($img.Height))" -ForegroundColor Gray
    $img.Dispose()
}
Write-Host ""

# 中心裁切到指定比例 + 缩放到目标尺寸
function Crop-Resize($srcPath, $outPath, $targetW, $targetH) {
    $img = [System.Drawing.Image]::FromFile($srcPath)
    $srcW = $img.Width
    $srcH = $img.Height
    $targetRatio = $targetW / $targetH
    $srcRatio = $srcW / $srcH

    if ($srcRatio -gt $targetRatio) {
        # 原图太宽,裁左右
        $cropH = $srcH
        $cropW = [int]($srcH * $targetRatio)
        $cropX = [int](($srcW - $cropW) / 2)
        $cropY = 0
    } else {
        # 原图太高,裁上下
        $cropW = $srcW
        $cropH = [int]($srcW / $targetRatio)
        $cropX = 0
        $cropY = [int](($srcH - $cropH) / 2)
    }

    $bmp = New-Object System.Drawing.Bitmap $targetW, $targetH
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $srcRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH
    $dstRect = New-Object System.Drawing.Rectangle 0, 0, $targetW, $targetH
    $g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}

$sizes = @(
    @{ Name = "900x500";     W = 900;  H = 500  },  # 公众号主头图 1.8:1
    @{ Name = "1000x1000";   W = 1000; H = 1000 },  # 方图(朋友圈分享/抖音封面)
    @{ Name = "200x200";     W = 200;  H = 200  }   # 公众号次条小图
)

foreach ($f in $files) {
    $base = $f.BaseName
    Write-Host "处理 $($f.Name)" -ForegroundColor Yellow
    foreach ($sz in $sizes) {
        $outName = "${base}_$($sz.Name).png"
        $outPath = Join-Path $dst $outName
        try {
            Crop-Resize $f.FullName $outPath $sz.W $sz.H
            $kb = [math]::Round((Get-Item $outPath).Length / 1KB, 1)
            Write-Host "  ✓ $outName  ($kb KB)" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ $outName  失败: $_" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "完成!输出目录: $dst" -ForegroundColor Cyan
Write-Host ""
Write-Host "使用提示:" -ForegroundColor Gray
Write-Host "  - 公众号头图上传 *_900x500.png" -ForegroundColor Gray
Write-Host "  - 朋友圈/抖音封面用 *_1000x1000.png" -ForegroundColor Gray
Write-Host "  - 公众号次条小图(自动生成,通常不用手动)*_200x200.png" -ForegroundColor Gray

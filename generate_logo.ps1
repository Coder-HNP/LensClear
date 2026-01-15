Add-Type -AssemblyName System.Drawing

$width = 200
$height = 50
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Draw Blue Circle
$brush = [System.Drawing.Brushes]::DodgerBlue
$g.FillEllipse($brush, 5, 5, 40, 40)

# Draw "Lens" text
$font = New-Object System.Drawing.Font("Arial", 20, [System.Drawing.FontStyle]::Bold)
$brushText = [System.Drawing.Brushes]::DimGray
$g.DrawString("Lens", $font, $brushText, 50, 8)

# Draw "Clear" text
$brushTextBlue = [System.Drawing.Brushes]::DodgerBlue
$g.DrawString("Clear", $font, $brushTextBlue, 115, 8)

# Save
$bmp.Save("c:\BossHNP\Coding Done by harshil\Intern_Projects\LensClear\lensclear-project\public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()

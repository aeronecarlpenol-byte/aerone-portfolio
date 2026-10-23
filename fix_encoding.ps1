$bytes = [System.IO.File]::ReadAllBytes("index.html")
$latin1 = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($bytes)

$fixed = $latin1
$fixed = $fixed.Replace("â€"", "–")
$fixed = $fixed.Replace("â€™", "'")
$fixed = $fixed.Replace("Â·", "·")
$fixed = $fixed.Replace("Ã±", "ñ")
$fixed = $fixed.Replace("Ã'", "Ñ")
$fixed = $fixed.Replace("Ã"", '"')
$fixed = $fixed.Replace("â€œ", '"')
$fixed = $fixed.Replace("â€", '"')

[System.IO.File]::WriteAllText("index.html", $fixed, [System.Text.Encoding]::UTF8)
Write-Host "Done"

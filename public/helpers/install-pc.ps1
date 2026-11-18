# Wiser OS - one-time Windows PC setup.
# Right-click this file > Run with PowerShell. No admin needed.
# Registers the wiser-open:// link type so the Open on PC buttons launch your local video in one tap.
$dir = Join-Path $env:LOCALAPPDATA 'WiserOpen'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$handler = @'
param([string]$url)
Add-Type -AssemblyName System.Web
Add-Type -AssemblyName PresentationFramework
$q = ($url -split '\?', 2)[1]
$path = [System.Web.HttpUtility]::ParseQueryString($q)['path']
if (-not $path) { exit }
if ($path.StartsWith('~/') -or $path.StartsWith('~\')) { $path = Join-Path $env:USERPROFILE $path.Substring(2) }
$ok = @('.mp4','.mov','.m4v','.mkv','.avi','.webm')
if ($ok -notcontains ([System.IO.Path]::GetExtension($path).ToLower())) {
  [System.Windows.MessageBox]::Show("Wiser OS only opens video files:`n$path") | Out-Null; exit
}
if (Test-Path -LiteralPath $path) { Start-Process -FilePath $path }
else { [System.Windows.MessageBox]::Show("File not found on this PC:`n$path") | Out-Null }
'@
Set-Content -Path (Join-Path $dir 'open.ps1') -Value $handler -Encoding UTF8
$k = 'HKCU:\Software\Classes\wiser-open'
New-Item -Path $k -Force | Out-Null
Set-ItemProperty -Path $k -Name '(Default)' -Value 'URL:Wiser Open'
Set-ItemProperty -Path $k -Name 'URL Protocol' -Value ''
New-Item -Path "$k\shell\open\command" -Force | Out-Null
$cmd = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$dir\open.ps1`" `"%1`""
Set-ItemProperty -Path "$k\shell\open\command" -Name '(Default)' -Value $cmd
Write-Host "Done. Wiser OS 'Open on PC' buttons now work."

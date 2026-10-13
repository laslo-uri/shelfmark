# Creates Shelfmark.lnk on the Windows Desktop.
# Priority: release exe > installed NSIS app > browser app-mode URL.

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "Shelfmark.lnk"
$WshShell = New-Object -ComObject WScript.Shell

function New-Shortcut($TargetPath, $Arguments, $WorkingDirectory, $IconLocation) {
    $shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $shortcut.TargetPath = $TargetPath
    if ($Arguments) { $shortcut.Arguments = $Arguments }
    if ($WorkingDirectory) { $shortcut.WorkingDirectory = $WorkingDirectory }
    if ($IconLocation) { $shortcut.IconLocation = $IconLocation }
    $shortcut.Description = "Shelfmark - personal bookshelf"
    $shortcut.Save()
}

$ReleaseExe = Join-Path $ProjectRoot "src-tauri\target\release\shelfmark.exe"
$IconIco = Join-Path $ProjectRoot "src-tauri\icons\icon.ico"
if (Test-Path $ReleaseExe) {
    $icon = if (Test-Path $IconIco) { "$IconIco,0" } else { "$ReleaseExe,0" }
    New-Shortcut $ReleaseExe $null (Split-Path $ReleaseExe) $icon
    Write-Host "Desktop shortcut -> $ReleaseExe"
    Write-Host "Shortcut icon -> $icon"
    exit 0
}

$LocalApp = $env:LOCALAPPDATA
$InstalledCandidates = @(
    (Join-Path $LocalApp "Programs\com.shelfmark.app\Shelfmark.exe"),
    (Join-Path $LocalApp "Shelfmark\Shelfmark.exe"),
    (Join-Path $LocalApp "Programs\Shelfmark\Shelfmark.exe")
)
foreach ($exe in $InstalledCandidates) {
    if (Test-Path $exe) {
        New-Shortcut $exe $null (Split-Path $exe) $exe
        Write-Host "Desktop shortcut -> $exe"
        exit 0
    }
}

$Url = if ($env:SHELFMARK_URL) { $env:SHELFMARK_URL } else { "http://localhost:5173" }
$Browsers = @(
    @{ Path = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"; Name = "Chrome" },
    @{ Path = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"; Name = "Chrome" },
    @{ Path = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"; Name = "Edge" },
    @{ Path = "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"; Name = "Edge" }
)

foreach ($browser in $Browsers) {
    if (Test-Path $browser.Path) {
        $args = "--app=$Url"
        New-Shortcut $browser.Path $args $ProjectRoot $browser.Path
        Write-Host "Desktop shortcut -> $($browser.Name) app mode ($Url)"
        Write-Host "For native desktop app, run: npm run tauri:build"
        exit 0
    }
}

Write-Error "No Shelfmark.exe or Chrome/Edge found. Install a browser or run npm run tauri:build first."

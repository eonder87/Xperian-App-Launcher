$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$distRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot 'dist'))

if (-not (Test-Path -LiteralPath $distRoot)) { return }
if ((Get-Item -LiteralPath $distRoot).Attributes -band [IO.FileAttributes]::ReparsePoint) {
    throw 'Refusing to clean a linked dist directory.'
}

foreach ($name in @('win-unpacked', '.icon-ico', 'builder-debug.yml', 'builder-effective-config.yaml')) {
    $target = [IO.Path]::GetFullPath((Join-Path $distRoot $name))
    if ((Split-Path $target -Parent) -ne $distRoot) {
        throw 'Cleanup target must be directly inside the project dist directory.'
    }
    if (Test-Path -LiteralPath $target) {
        Remove-Item -LiteralPath $target -Recurse -Force
    }
}

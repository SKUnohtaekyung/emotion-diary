param(
    [ValidateSet("quick", "full")]
    [string]$Mode = "full"
)

& node (Join-Path $PSScriptRoot "verify.mjs") --mode $Mode
exit $LASTEXITCODE


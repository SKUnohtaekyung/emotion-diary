# Fill the school HWP form through Hangul COM automation.
# All Korean text lives in the JSON plan (UTF-8); this file stays ASCII so Windows PowerShell 5.1 reads it correctly.
# Usage: powershell -ExecutionPolicy Bypass -File _양식-채우기.ps1 -PlanPath <양식-채우기.json>
param([Parameter(Mandatory = $true)][string]$PlanPath)
$ErrorActionPreference = 'Stop'
$plan = Get-Content -Raw -Encoding UTF8 -LiteralPath $PlanPath | ConvertFrom-Json

function Log($m) { Write-Output ("[" + (Get-Date -Format 'HH:mm:ss') + "] " + $m) }

Copy-Item -LiteralPath $plan.src -Destination $plan.out -Force
Log "copied form -> out"

$hwp = New-Object -ComObject HWPFrame.HwpObject
function Run([string]$a) { [void]$hwp.HAction.Run($a) }
function Ins([string]$t) {
  if ($t.Length -eq 0) { return }
  $p = $hwp.HParameterSet.HInsertText
  [void]$hwp.HAction.GetDefault("InsertText", $p.HSet)
  $p.Text = $t
  [void]$hwp.HAction.Execute("InsertText", $p.HSet)
}
function SetFind($p, [string]$t, [int]$dir) {
  $p.FindString = $t; $p.Direction = $dir; $p.IgnoreMessage = 1
  $p.FindRegExp = 0; $p.MatchCase = 0; $p.WholeWordOnly = 0; $p.UseWildCards = 0
  $p.SeveralWords = 0; $p.AllWordForms = 0; $p.FindJaso = 0
}
function FindNext([string]$t) {
  $p = $hwp.HParameterSet.HFindReplace
  [void]$hwp.HAction.GetDefault("RepeatFind", $p.HSet)
  SetFind $p $t 0
  return $hwp.HAction.Execute("RepeatFind", $p.HSet)
}
function ReplaceAll([string]$a, [string]$b) {
  $p = $hwp.HParameterSet.HFindReplace
  [void]$hwp.HAction.GetDefault("AllReplace", $p.HSet)
  SetFind $p $a 2
  $p.ReplaceString = $b
  return $hwp.HAction.Execute("AllReplace", $p.HSet)
}
function Put($item) {
  switch ($item.t) {
    "h" { Run "CharShapeBold"; Ins $item.v; Run "CharShapeBold"; Run "BreakPara" }
    "p" { Ins $item.v; Run "BreakPara" }
    "last" { Ins $item.v }
    "img" {
      $w = [int][math]::Round([double]$item.w); $h = [int][math]::Round([double]$item.h)
      [void]$hwp.InsertPicture($item.path, $true, 1, $false, $false, 0, $w, $h)
      Run "BreakPara"
    }
    "lastimg" {
      $w = [int][math]::Round([double]$item.w); $h = [int][math]::Round([double]$item.h)
      [void]$hwp.InsertPicture($item.path, $true, 1, $false, $false, 0, $w, $h)
    }
  }
}

try {
  [void]$hwp.RegisterModule("FilePathCheckDLL", "FilePathCheckerModule")
  $hwp.XHwpWindows.Item(0).Visible = $true
  if (-not $hwp.Open($plan.out, "HWP", "forceopen:true")) { throw "Open failed" }
  Log "opened"

  # The content table (last top-level table) is "treat as char" in the form, which keeps it from
  # flowing onto the next page. Turn that off so the long cells continue across pages.
  $ctrl = $hwp.HeadCtrl; $last = $null
  while ($ctrl) { if ($ctrl.CtrlID -eq "tbl") { $last = $ctrl }; $ctrl = $ctrl.Next }
  if ($last) {
    $props = $last.Properties
    Log ("table before: TreatAsChar=" + $props.Item("TreatAsChar") + " PageBreak=" + $props.Item("PageBreak"))
    $props.SetItem("TreatAsChar", 0)
    $props.SetItem("PageBreak", 2)
    $last.Properties = $props
    $after = $last.Properties
    Log ("table after: TreatAsChar=" + $after.Item("TreatAsChar") + " PageBreak=" + $after.Item("PageBreak"))
  } else { Log "no table found" }

  foreach ($r in $plan.replace) {
    $ok = ReplaceAll $r[0] $r[1]
    Log ("replace " + $ok + " : " + $r[0].Length + " chars")
  }

  foreach ($word in $plan.check) {
    Run "MoveDocBegin"
    if (FindNext $word) {
      Run "Cancel"; Run "MoveLineBegin"; Run "MoveSelRight"; Run "Delete"
      Ins ([string][char]0x25A0)
      Log "checkbox set"
    } else { Log "checkbox word NOT FOUND" }
  }

  $i = 0
  foreach ($c in $plan.cells) {
    $i++
    Run "MoveDocBegin"
    $found = $true
    for ($k = 0; $k -lt [int]$c.n; $k++) { if (-not (FindNext $c.find)) { $found = $false } }
    if (-not $found) { Log ("cell " + $i + " NOT FOUND"); continue }
    Run "Cancel"
    foreach ($m in $c.moves) { Run $m }
    Run "Cancel"
    if ($c.clear) { Run "MoveListBegin"; Run "MoveSelListEnd"; Run "Delete" }
    foreach ($it in $c.items) { Put $it }
    Log ("cell " + $i + " filled (" + $c.items.Count + " items)")
  }

  if (-not $hwp.SaveAs($plan.out, "HWP", "")) { throw "SaveAs HWP failed" }
  Log "saved hwp"
  if (-not $hwp.SaveAs($plan.pdf, "PDF", "")) { Log "PDF export failed" } else { Log "saved pdf" }
}
finally {
  try { $hwp.Clear(1) } catch {}
  try { $hwp.Quit() } catch {}
  Log "hangul closed"
}

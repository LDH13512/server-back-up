[CmdletBinding()]
param(
  [string]$DestinationUrl = "https://backup.example/api/cron/minigame-daily-reset"
)

$ErrorActionPreference = "Stop"

function Read-SecretText {
  param([Parameter(Mandatory = $true)][string]$Prompt)

  $secureValue = Read-Host $Prompt -AsSecureString
  return [System.Net.NetworkCredential]::new("", $secureValue).Password
}

function Normalize-EnvironmentSecret {
  param(
    [Parameter(Mandatory = $true)][string]$Value,
    [Parameter(Mandatory = $true)][string]$VariableName
  )

  $normalized = $Value.Trim()
  $assignmentPrefix = "${VariableName}="
  if ($normalized.StartsWith($assignmentPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    $normalized = $normalized.Substring($assignmentPrefix.Length).Trim()
  }

  return $normalized.Trim('"').Trim("'").Trim()
}

function Test-QStashToken {
  param(
    [Parameter(Mandatory = $true)][string]$Token,
    [Parameter(Mandatory = $true)][string]$BaseUrl
  )

  try {
    $null = Invoke-RestMethod `
      -Method Get `
      -Uri "$BaseUrl/v2/schedules" `
      -Headers @{ Authorization = "Bearer $Token" } `
      -TimeoutSec 30
    return $true
  }
  catch {
    $statusCode = $null
    if ($null -ne $_.Exception.Response -and $null -ne $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }
    if ($statusCode -eq 401 -or $statusCode -eq 403) { return $false }
    throw
  }
}

$regionMode = (Read-Host "Enter 1 for EU Region, or 2 for US Region").Trim()
if ($regionMode -eq "1") {
  $qstashBaseUrl = "https://qstash-eu-central-1.upstash.io"
}
elseif ($regionMode -eq "2") {
  $qstashBaseUrl = "https://qstash-us-east-1.upstash.io"
}
else {
  throw "Choose QStash region 1 or 2."
}

$qstashToken = Normalize-EnvironmentSecret `
  (Read-SecretText "Paste only the QSTASH_TOKEN value") `
  "QSTASH_TOKEN"
$cronSecret = Normalize-EnvironmentSecret `
  (Read-SecretText "Paste only the BACKUP_CRON_SECRET value") `
  "BACKUP_CRON_SECRET"

if ([string]::IsNullOrWhiteSpace($qstashToken)) { throw "QSTASH_TOKEN is empty." }
if ([string]::IsNullOrWhiteSpace($cronSecret)) { throw "BACKUP_CRON_SECRET is empty." }
if (-not (Test-QStashToken $qstashToken $qstashBaseUrl)) {
  throw "The QStash token was rejected."
}

$separator = if ($DestinationUrl.Contains("?")) { "&" } else { "?" }
$resetVerificationUrl = "${DestinationUrl}${separator}dryRun=1"
$resetVerification = Invoke-RestMethod `
  -Method Get `
  -Uri $resetVerificationUrl `
  -Headers @{ Authorization = "Bearer $cronSecret" } `
  -TimeoutSec 60

if ($resetVerification.ok -ne $true -or $resetVerification.dryRun -ne $true) {
  throw "The backup minigame reset endpoint did not pass its dry run."
}

$scheduleEndpoint = "$qstashBaseUrl/v2/schedules/$DestinationUrl"
$scheduleHeaders = @{
  Authorization                    = "Bearer $qstashToken"
  "Upstash-Cron"                  = "CRON_TZ=Asia/Seoul 0 0 * * *"
  "Upstash-Schedule-Id"           = "backup-minigame-daily-reset-v1"
  "Upstash-Forward-Authorization" = "Bearer $cronSecret"
  "Upstash-Method"                = "GET"
  "Upstash-Retries"               = "3"
  "Upstash-Timeout"               = "55s"
  "Upstash-Redact-Fields"         = "header[Authorization]"
  "Upstash-Label"                 = "backup-minigame-reset"
}

try {
  $scheduleResult = Invoke-RestMethod `
    -Method Post `
    -Uri $scheduleEndpoint `
    -Headers $scheduleHeaders `
    -ContentType "text/plain" `
    -Body ""
}
finally {
  $scheduleHeaders.Authorization = ""
  $scheduleHeaders["Upstash-Forward-Authorization"] = ""
  $qstashToken = ""
  $cronSecret = ""
}

if ([string]::IsNullOrWhiteSpace([string]$scheduleResult.scheduleId)) {
  throw "QStash did not return a scheduleId."
}

Write-Host "Backup minigame reset schedule registered."
Write-Host "Schedule ID: $($scheduleResult.scheduleId)"
Write-Host "Destination: $DestinationUrl"
Write-Host "Time: every day at 00:00 Asia/Seoul"

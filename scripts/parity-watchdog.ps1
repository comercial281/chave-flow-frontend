# =============================================================================
# Parity Watchdog - LM Flow
# =============================================================================
# Compara o tenant RAIZ contra cada cliente em:
#   - SHA do deploy Vercel (frontend) + estado (READY/QUEUED/BUILDING/ERROR)
#   - SHA do deploy Railway (backend) + status (SUCCESS/CRASHED/FAILED/REMOVED)
#   - Conjunto de chaves de env vars Vercel
#   - Conjunto de chaves de env vars Railway
#   - Smoke test em rotas criticas (HTTP code)
#
# Ignora deltas legitimos via masterOnlyKeys/tenantOnlyKeys/autoKeys em tenants.json.
#
# USO:
#   .\scripts\parity-watchdog.ps1                   # roda + escreve relatorio
#   .\scripts\parity-watchdog.ps1 -Notify           # tambem manda WhatsApp se drift
#   .\scripts\parity-watchdog.ps1 -Quiet            # sem prints, so escreve arquivo
#
# Tokens: pega de env primeiro (VERCEL_TOKEN, RAILWAY_TOKEN, EVOLUTION_API_KEY),
# fallback pra ler do vault (Empresa/SECRETS).
#
# Exit code: 0 = paridade OK | 1 = drift detectado | 2 = falha grave
# =============================================================================

[CmdletBinding()]
param(
    [string]$TenantsFile,
    [string]$ReportDir   = 'C:\Users\giova\Desktop\Cofre obsidian\Relatorios Matinais',
    [switch]$Notify,
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

# Resolve script-relative paths after param block (PSScriptRoot pode estar vazio em modo -File)
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } elseif ($MyInvocation.MyCommand.Path) { Split-Path -Parent $MyInvocation.MyCommand.Path } else { Get-Location }
if (-not $TenantsFile) { $TenantsFile = Join-Path $scriptDir 'tenants.json' }

# ----------------------------- helpers ---------------------------------------

function W($msg, $color = 'White') {
    if (-not $Quiet) { Write-Host $msg -ForegroundColor $color }
}

function GetTokenFromVault($headerPattern, $tokenPattern) {
    # Localiza o SECRETS por wildcard pra evitar problema de encoding com o emoji 🔐 no path do arquivo .ps1
    $vaultDir = 'C:\Users\giova\Desktop\Cofre obsidian\Empresa'
    if (-not (Test-Path $vaultDir)) { return $null }
    $vault = Get-ChildItem -LiteralPath $vaultDir -Filter '*SECRETS*Commitar*.md' -File | Select-Object -First 1 -ExpandProperty FullName
    if (-not $vault) { return $null }
    $content = Get-Content -LiteralPath $vault -Raw -Encoding UTF8
    $h = [regex]::Match($content, $headerPattern)
    if (-not $h.Success) { return $null }
    $start = $h.Index
    $window = $content.Substring($start, [Math]::Min(1200, $content.Length - $start))
    $t = [regex]::Match($window, $tokenPattern)
    if ($t.Success) { return $t.Value }
    return $null
}

# ----------------------------- tokens ----------------------------------------

$vercelToken  = $env:VERCEL_TOKEN
if (-not $vercelToken)  { $vercelToken  = GetTokenFromVault '## Vercel API Token'  'vcp_[a-zA-Z0-9]{40,}' }
$railwayToken = $env:RAILWAY_TOKEN
if (-not $railwayToken) { $railwayToken = GetTokenFromVault '## Railway API Token' '\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b' }
$evoKey       = $env:EVOLUTION_API_KEY
if (-not $evoKey)       { $evoKey       = GetTokenFromVault '## Evolution API'     '\b[a-f0-9]{60,}\b' }

if (-not $vercelToken)  { Write-Host 'FALTA VERCEL_TOKEN'  -ForegroundColor Red; exit 2 }
if (-not $railwayToken) { Write-Host 'FALTA RAILWAY_TOKEN' -ForegroundColor Red; exit 2 }

# ----------------------------- load config -----------------------------------

if (-not (Test-Path $TenantsFile)) { Write-Host "FALTA $TenantsFile" -ForegroundColor Red; exit 2 }
$cfg = Get-Content $TenantsFile -Raw -Encoding UTF8 | ConvertFrom-Json

$raiz = $cfg.tenants | Where-Object { $_.key -eq $cfg.raizKey }
if (-not $raiz) { Write-Host 'raizKey nao bate com nenhum tenant' -ForegroundColor Red; exit 2 }

# ----------------------------- collectors ------------------------------------

function GetVercelDeploy($projectId) {
    if (-not $projectId) { return $null }
    try {
        $u = 'https://api.vercel.com/v6/deployments?projectId=' + $projectId + '&teamId=' + $cfg.vercel.orgId + '&limit=10&target=production'
        $r = Invoke-RestMethod -Uri $u -Headers @{ Authorization = 'Bearer ' + $vercelToken } -TimeoutSec 20
        $ready = $r.deployments | Where-Object { $_.state -eq 'READY' } | Select-Object -First 1
        $latest = $r.deployments | Select-Object -First 1
        if (-not $latest) { return @{ ok = $false; reason = 'sem deploys' } }
        # meta tem 2 variantes: 'githubCommitSha' (via webhook GitHub) ou 'gitCommitSha' (via CLI Vercel)
        $latSha = if ($latest.meta.githubCommitSha) { $latest.meta.githubCommitSha } else { $latest.meta.gitCommitSha }
        $rdySha = $null
        if ($ready) {
            $rdySha = if ($ready.meta.githubCommitSha) { $ready.meta.githubCommitSha } else { $ready.meta.gitCommitSha }
        }
        return @{
            ok          = $true
            latestState = $latest.state
            latestSha   = $latSha
            readySha    = $rdySha
            readyAt     = if ($ready) { [DateTimeOffset]::FromUnixTimeMilliseconds([int64]$ready.created).UtcDateTime } else { $null }
        }
    } catch {
        return @{ ok = $false; reason = $_.Exception.Message }
    }
}

function GetVercelEnvs($projectId) {
    if (-not $projectId) { return @() }
    try {
        $u = 'https://api.vercel.com/v9/projects/' + $projectId + '/env?teamId=' + $cfg.vercel.orgId
        $r = Invoke-RestMethod -Uri $u -Headers @{ Authorization = 'Bearer ' + $vercelToken } -TimeoutSec 20
        return ($r.envs | Where-Object { $_.target -contains 'production' } | ForEach-Object { $_.key } | Sort-Object -Unique)
    } catch {
        return @()
    }
}

function GetRailwayDeploy($serviceId, $envId) {
    if (-not $serviceId -or -not $envId) { return $null }
    $q = '{"query":"query($s:String!,$e:String!){deployments(first:1,input:{serviceId:$s,environmentId:$e}){edges{node{id status meta createdAt}}}}","variables":{"s":"' + $serviceId + '","e":"' + $envId + '"}}'
    try {
        $r = Invoke-RestMethod -Method Post -Uri $cfg.railway.apiUrl `
            -Headers @{ Authorization = 'Bearer ' + $railwayToken; 'Content-Type' = 'application/json' } `
            -Body $q -TimeoutSec 20
        $d = $r.data.deployments.edges[0].node
        if (-not $d) { return @{ ok = $false; reason = 'sem deploys' } }
        return @{
            ok       = $true
            status   = $d.status
            sha      = $d.meta.commitHash
            msg      = $d.meta.commitMessage
            createdAt = $d.createdAt
        }
    } catch {
        return @{ ok = $false; reason = $_.Exception.Message }
    }
}

function GetRailwayEnvs($serviceId, $envId) {
    if (-not $serviceId -or -not $envId) { return @() }
    $q = '{"query":"query($s:String!,$e:String!){variables(projectId:\"\",serviceId:$s,environmentId:$e)}","variables":{"s":"' + $serviceId + '","e":"' + $envId + '"}}'
    try {
        $r = Invoke-RestMethod -Method Post -Uri $cfg.railway.apiUrl `
            -Headers @{ Authorization = 'Bearer ' + $railwayToken; 'Content-Type' = 'application/json' } `
            -Body $q -TimeoutSec 20
        $names = @($r.data.variables.PSObject.Properties.Name) | Sort-Object -Unique
        $auto = @($cfg.railway.autoKeys)
        return ($names | Where-Object { $auto -notcontains $_ })
    } catch {
        return @()
    }
}

function SmokeTest($baseUrl, $routes) {
    $out = @{}
    if (-not $baseUrl) { return $out }
    foreach ($p in $routes) {
        try {
            $r = Invoke-WebRequest -Uri ($baseUrl + $p) -Method Get -UseBasicParsing -TimeoutSec 10
            $out[$p] = [int]$r.StatusCode
        } catch {
            if ($_.Exception.Response) {
                $out[$p] = [int]$_.Exception.Response.StatusCode
            } else {
                $out[$p] = -1
            }
        }
    }
    return $out
}

# ----------------------------- collect raiz ----------------------------------

W ''
W '== Coletando RAIZ ==' Cyan
$raizFE  = GetVercelDeploy   $raiz.frontend.projectId
$raizFEenv = GetVercelEnvs   $raiz.frontend.projectId
$raizBE  = GetRailwayDeploy  $raiz.backend.serviceId $raiz.backend.environmentId
$raizBEenv = GetRailwayEnvs  $raiz.backend.serviceId $raiz.backend.environmentId
$raizSmoke = SmokeTest       $raiz.backend.url $cfg.smokeRoutes

# ----------------------------- collect tenants -------------------------------

$rows = @()
foreach ($t in $cfg.tenants) {
    if ($t.key -eq $cfg.raizKey) { continue }
    W ('== Coletando ' + $t.label + ' ==') Cyan
    $fe    = GetVercelDeploy   $t.frontend.projectId
    $feenv = GetVercelEnvs     $t.frontend.projectId
    $be    = GetRailwayDeploy  $t.backend.serviceId $t.backend.environmentId
    $beenv = GetRailwayEnvs    $t.backend.serviceId $t.backend.environmentId
    $smoke = SmokeTest         $t.backend.url $cfg.smokeRoutes

    # ---- diff env Vercel ----
    $masterOnlyV = @($cfg.vercel.masterOnlyKeys)
    $expectedV   = @($raizFEenv | Where-Object { $masterOnlyV -notcontains $_ })
    $missingV    = @($expectedV | Where-Object { $feenv -notcontains $_ })
    $extraV      = @($feenv | Where-Object { $raizFEenv -notcontains $_ -and $masterOnlyV -notcontains $_ })

    # ---- diff env Railway ----
    $masterOnlyR = @($cfg.railway.masterOnlyKeys)
    $tenantOnlyR = @($cfg.railway.tenantOnlyKeys)
    $expectedR   = @($raizBEenv | Where-Object { $masterOnlyR -notcontains $_ })
    $missingR    = @($expectedR | Where-Object { $beenv -notcontains $_ })
    $extraR      = @($beenv | Where-Object { $raizBEenv -notcontains $_ -and $tenantOnlyR -notcontains $_ })

    # ---- diff SHA frontend ----
    $feShaDrift = $false
    if ($raizFE.readySha -and $fe.readySha -and $raizFE.readySha -ne $fe.readySha) { $feShaDrift = $true }

    # ---- diff SHA backend ----
    $beShaDrift = $false
    if ($raizBE.sha -and $be.sha -and $raizBE.sha -ne $be.sha) { $beShaDrift = $true }

    # ---- diff smoke ----
    $smokeDrift = @()
    foreach ($p in $cfg.smokeRoutes) {
        if ($raizSmoke[$p] -ne $smoke[$p]) {
            $smokeDrift += ($p + ': raiz=' + $raizSmoke[$p] + ' tenant=' + $smoke[$p])
        }
    }

    $rows += [pscustomobject]@{
        Tenant         = $t.label
        Key            = $t.key
        FE_state       = $fe.latestState
        FE_sha         = if ($fe.readySha) { $fe.readySha.Substring(0,7) } else { 'n/a' }
        FE_sha_drift   = $feShaDrift
        BE_status      = $be.status
        BE_sha         = if ($be.sha) { $be.sha.Substring(0,7) } else { 'n/a' }
        BE_sha_drift   = $beShaDrift
        MissingVercel  = $missingV
        ExtraVercel    = $extraV
        MissingRailway = $missingR
        ExtraRailway   = $extraR
        SmokeDrift     = $smokeDrift
    }
}

# ----------------------------- compute drift flag ---------------------------

$anyDrift = $false
foreach ($r in $rows) {
    if ($r.FE_sha_drift -or $r.BE_sha_drift -or
        $r.BE_status -in @('CRASHED','FAILED','REMOVED') -or
        $r.MissingVercel.Count -gt 0 -or $r.MissingRailway.Count -gt 0 -or
        $r.SmokeDrift.Count -gt 0) {
        $anyDrift = $true; break
    }
}
$raizBackendBroken = $raizBE.status -in @('CRASHED','FAILED','REMOVED')
if ($raizBackendBroken) { $anyDrift = $true }

# ----------------------------- write report ---------------------------------

if (-not (Test-Path $ReportDir)) { New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null }

$today = (Get-Date).ToString('yyyy-MM-dd')
$nowIso = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
$reportPath = Join-Path $ReportDir ('parity-' + $today + '.md')

$md = New-Object System.Text.StringBuilder
$null = $md.AppendLine('---')
$null = $md.AppendLine('tipo: relatorio')
$null = $md.AppendLine('data: ' + $today)
$null = $md.AppendLine('tags: [lm-flow, paridade, watchdog]')
$null = $md.AppendLine('---')
$null = $md.AppendLine('')
$null = $md.AppendLine('# Paridade LM Flow - ' + $today)
$null = $md.AppendLine('')
$null = $md.AppendLine('Gerado em ' + $nowIso + '. Compara cada tenant contra o RAIZ (' + $raiz.label + ').')
$null = $md.AppendLine('')
$null = $md.AppendLine('## Resumo')
$null = $md.AppendLine('')
if ($anyDrift) {
    $null = $md.AppendLine('**STATUS: DRIFT DETECTADO** - veja detalhes abaixo.')
} else {
    $null = $md.AppendLine('**STATUS: PARIDADE OK** - todos os tenants alinhados com o raiz.')
}
$null = $md.AppendLine('')

# raiz state
$null = $md.AppendLine('## Estado do raiz')
$null = $md.AppendLine('')
$null = $md.AppendLine('| Camada | SHA | Estado |')
$null = $md.AppendLine('|---|---|---|')
$raizFEsha = if ($raizFE.readySha) { $raizFE.readySha.Substring(0,7) } else { 'n/a' }
$raizBEsha = if ($raizBE.sha) { $raizBE.sha.Substring(0,7) } else { 'n/a' }
$raizFEreadyAt = if ($raizFE.readySha) { [string]$raizFE.readyAt } else { 'sem' }
$null = $md.AppendLine('| Frontend (Vercel) | ' + $raizFEsha + ' | ' + $raizFE.latestState + ' (ultimo) / READY: ' + $raizFEreadyAt + ' |')
$null = $md.AppendLine('| Backend (Railway) | ' + $raizBEsha + ' | ' + $raizBE.status + ' |')
$null = $md.AppendLine('')

if ($raizBackendBroken) {
    $null = $md.AppendLine('> ALERTA: backend do raiz esta em ' + $raizBE.status + '. Ultima mensagem: ' + ($raizBE.msg -replace "`r?`n.*",'') )
    $null = $md.AppendLine('')
}

# table per tenant
$null = $md.AppendLine('## Tenants vs raiz')
$null = $md.AppendLine('')
$null = $md.AppendLine('| Tenant | FE estado | FE SHA | BE status | BE SHA | Drift FE | Drift BE | Vars FE faltando | Vars BE faltando | Smoke |')
$null = $md.AppendLine('|---|---|---|---|---|---|---|---|---|---|')
foreach ($r in $rows) {
    $missV = if ($r.MissingVercel.Count -gt 0)  { ($r.MissingVercel -join ', ') } else { '-' }
    $missR = if ($r.MissingRailway.Count -gt 0) { ($r.MissingRailway -join ', ') } else { '-' }
    $smk   = if ($r.SmokeDrift.Count -gt 0)     { ($r.SmokeDrift -join '; ') }    else { '-' }
    $line  = '| ' + $r.Tenant + ' | ' + $r.FE_state + ' | ' + $r.FE_sha + ' | ' + $r.BE_status + ' | ' + $r.BE_sha + ' | '
    $line += $(if ($r.FE_sha_drift) { 'SIM' } else { 'nao' }) + ' | '
    $line += $(if ($r.BE_sha_drift) { 'SIM' } else { 'nao' }) + ' | '
    $line += $missV + ' | ' + $missR + ' | ' + $smk + ' |'
    $null = $md.AppendLine($line)
}
$null = $md.AppendLine('')

# detail per drifted tenant
foreach ($r in $rows) {
    $hasDrift = $r.FE_sha_drift -or $r.BE_sha_drift -or
        $r.BE_status -in @('CRASHED','FAILED','REMOVED') -or
        $r.MissingVercel.Count -gt 0 -or $r.MissingRailway.Count -gt 0 -or
        $r.ExtraVercel.Count -gt 0 -or $r.ExtraRailway.Count -gt 0 -or
        $r.SmokeDrift.Count -gt 0
    if (-not $hasDrift) { continue }

    $null = $md.AppendLine('### ' + $r.Tenant)
    $null = $md.AppendLine('')
    if ($r.FE_sha_drift)   { $null = $md.AppendLine('- Frontend SHA divergente do raiz') }
    if ($r.BE_sha_drift)   { $null = $md.AppendLine('- Backend SHA divergente do raiz') }
    if ($r.BE_status -in @('CRASHED','FAILED','REMOVED')) {
        $null = $md.AppendLine('- Backend em ' + $r.BE_status)
    }
    if ($r.MissingVercel.Count -gt 0)  { $null = $md.AppendLine('- Vercel: faltam ' + ($r.MissingVercel  -join ', ')) }
    if ($r.ExtraVercel.Count -gt 0)    { $null = $md.AppendLine('- Vercel: sobram '  + ($r.ExtraVercel    -join ', ')) }
    if ($r.MissingRailway.Count -gt 0) { $null = $md.AppendLine('- Railway: faltam ' + ($r.MissingRailway -join ', ')) }
    if ($r.ExtraRailway.Count -gt 0)   { $null = $md.AppendLine('- Railway: sobram ' + ($r.ExtraRailway  -join ', ')) }
    if ($r.SmokeDrift.Count -gt 0)     { $null = $md.AppendLine('- Smoke: ' + ($r.SmokeDrift -join '; ')) }
    $null = $md.AppendLine('')
}

Set-Content -Path $reportPath -Value $md.ToString() -Encoding UTF8
W ''
W ('Relatorio gravado: ' + $reportPath) Green

# ----------------------------- whatsapp notify ------------------------------

if ($Notify -and $anyDrift -and $evoKey) {
    $msg = "[LM Flow Watchdog $today]`n"
    if ($raizBackendBroken) { $msg += "* RAIZ backend $($raizBE.status)`n" }
    foreach ($r in $rows) {
        $bits = @()
        if ($r.FE_sha_drift) { $bits += 'FE SHA' }
        if ($r.BE_sha_drift) { $bits += 'BE SHA' }
        if ($r.BE_status -in @('CRASHED','FAILED','REMOVED')) { $bits += ('BE ' + $r.BE_status) }
        if ($r.MissingRailway.Count -gt 0) { $bits += ($r.MissingRailway.Count.ToString() + ' vars BE') }
        if ($r.MissingVercel.Count -gt 0)  { $bits += ($r.MissingVercel.Count.ToString()  + ' vars FE') }
        if ($r.SmokeDrift.Count -gt 0)     { $bits += 'smoke' }
        if ($bits.Count -gt 0) { $msg += ('- ' + $r.Tenant + ': ' + ($bits -join ', ') + "`n") }
    }
    $msg += "`nDetalhes: $reportPath"

    try {
        $body = @{ number = $cfg.notify.whatsappNumber; text = $msg } | ConvertTo-Json -Compress
        $url  = $cfg.notify.evolutionUrl + '/message/sendText/' + [uri]::EscapeDataString($cfg.notify.evolutionInstance)
        Invoke-RestMethod -Method Post -Uri $url -Headers @{ apikey = $evoKey; 'Content-Type' = 'application/json' } -Body $body -TimeoutSec 15 | Out-Null
        W 'WhatsApp enviado.' Green
    } catch {
        W ('Falha WhatsApp: ' + $_.Exception.Message) Yellow
    }
}

# ----------------------------- exit code ------------------------------------

if ($anyDrift) {
    W ''
    W 'DRIFT DETECTADO. Veja o relatorio.' Red
    exit 1
} else {
    W ''
    W 'PARIDADE OK.' Green
    exit 0
}

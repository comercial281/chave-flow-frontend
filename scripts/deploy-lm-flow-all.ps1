# =============================================================================
# Deploy LM Flow em TODOS os tenants (Vercel frontend + Railway backend)
# =============================================================================
#
# USO BASICO (dentro de lm-flow-frontend):
#   .\scripts\deploy-lm-flow-all.ps1                  # deploya frontend + backend em todos
#   .\scripts\deploy-lm-flow-all.ps1 -Target frontend # so frontend
#   .\scripts\deploy-lm-flow-all.ps1 -Target backend  # so backend
#   .\scripts\deploy-lm-flow-all.ps1 -DryRun          # mostra o que faria, sem deployar
#
# PRE-REQUISITOS:
#   - npm/npx instalado (vercel via npx)
#   - $env:RAILWAY_TOKEN setado (pega no vault: Empresa/SECRETS)
#   - logado no Vercel CLI (rodar `npx vercel login` 1x)
#   - main do backend ja pushado (a menos que voce passe -BackendSha custom)
#
# FLUXO:
#   1. Le scripts/tenants.json (fonte unica)
#   2. Se -Target inclui backend: pega SHA do lm-flow-rails (ou param), dispara
#      mutation Railway pra cada tenant, loga deployment IDs
#   3. Se -Target inclui frontend: roda npm run build 1x, depois `npx vercel
#      --prod` em loop pra cada PROJECT_ID
#   4. Smoke test: GET nas URLs publicas, checa 200/401 (ok) vs 500 (quebrado)
#   5. Relatorio final: tabela tenant x camada x status
# =============================================================================

[CmdletBinding()]
param(
    [ValidateSet('frontend','backend','both')]
    [string]$Target = 'both',

    [string]$BackendRepo = 'C:\Users\giova\Desktop\Projetos Claude Code\lm-flow-rails',

    [string]$BackendSha = '',

    [string]$TenantsFile = (Join-Path $PSScriptRoot 'tenants.json'),

    [switch]$SkipBuild,

    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# ----------------------------- helpers ---------------------------------------

function Write-Section($title) {
    Write-Host ''
    Write-Host ('=' * 78) -ForegroundColor DarkCyan
    Write-Host (' ' + $title) -ForegroundColor Cyan
    Write-Host ('=' * 78) -ForegroundColor DarkCyan
}

function Write-Step($msg) {
    Write-Host "  > $msg" -ForegroundColor White
}

function Write-Ok($msg) {
    Write-Host "  OK  $msg" -ForegroundColor Green
}

function Write-Fail($msg) {
    Write-Host "  X   $msg" -ForegroundColor Red
}

function Write-Skip($msg) {
    Write-Host "  -   $msg" -ForegroundColor DarkGray
}

# ----------------------------- load tenants ----------------------------------

if (-not (Test-Path $TenantsFile)) {
    throw "tenants.json nao encontrado em: $TenantsFile"
}

$config = Get-Content $TenantsFile -Raw | ConvertFrom-Json
$tenants = $config.tenants
$results = @()

Write-Section "LM Flow Deploy -> $($tenants.Count) tenants | Target=$Target | DryRun=$DryRun"

# ----------------------------- backend deploys -------------------------------

if ($Target -in @('backend','both')) {
    Write-Section "BACKEND (Railway)"

    if (-not $env:RAILWAY_TOKEN) {
        throw "RAILWAY_TOKEN nao setado. Pegue no vault em Empresa/SECRETS e rode: `$env:RAILWAY_TOKEN='...'"
    }

    if (-not $BackendSha) {
        Write-Step "Pegando HEAD de $BackendRepo"
        Push-Location $BackendRepo
        try {
            $BackendSha = (git rev-parse HEAD).Trim()
            $branch = (git rev-parse --abbrev-ref HEAD).Trim()
            Write-Ok "SHA=$BackendSha branch=$branch"
        } finally {
            Pop-Location
        }
    } else {
        Write-Step "Usando SHA passado: $BackendSha"
    }

    $deployments = @{}

    foreach ($t in $tenants) {
        $svc = $t.backend.serviceId
        $env_ = $t.backend.environmentId

        if (-not $svc -or -not $env_) {
            Write-Skip "$($t.label): sem backend configurado, pulando"
            $results += [pscustomobject]@{ tenant=$t.key; layer='backend'; status='skipped'; detail='no-config' }
            continue
        }

        $mutation = @{
            query = "mutation { serviceInstanceDeployV2(serviceId: `"$svc`", environmentId: `"$env_`", commitSha: `"$BackendSha`") }"
        } | ConvertTo-Json -Compress

        if ($DryRun) {
            Write-Skip ($t.label + ': (DRYRUN) mutation pronta')
            $results += [pscustomobject]@{ tenant=$t.key; layer='backend'; status='dryrun'; detail=$BackendSha.Substring(0,7) }
            continue
        }

        try {
            $resp = Invoke-RestMethod -Method Post `
                -Uri $config.railway.apiUrl `
                -Headers @{ Authorization = "Bearer $($env:RAILWAY_TOKEN)"; 'Content-Type' = 'application/json' } `
                -Body $mutation
            $depId = $resp.data.serviceInstanceDeployV2
            $deployments[$t.key] = $depId
            Write-Ok "$($t.label) -> deployment $depId"
            $results += [pscustomobject]@{ tenant=$t.key; layer='backend'; status='triggered'; detail=$depId }
        } catch {
            Write-Fail "$($t.label) -> $($_.Exception.Message)"
            $results += [pscustomobject]@{ tenant=$t.key; layer='backend'; status='failed'; detail=$_.Exception.Message }
        }
    }

    # poll status (max 6 min por deploy)
    if ($deployments.Count -gt 0 -and -not $DryRun) {
        Write-Section "Aguardando builds Railway terminarem"
        $pollQuery = 'query($id: String!) { deployment(id: $id) { status } }'
        $deadline = (Get-Date).AddMinutes(8)

        while ($deployments.Count -gt 0 -and (Get-Date) -lt $deadline) {
            Start-Sleep -Seconds 15
            $finished = @()
            foreach ($k in $deployments.Keys) {
                $body = @{ query = $pollQuery; variables = @{ id = $deployments[$k] } } | ConvertTo-Json -Compress -Depth 5
                try {
                    $r = Invoke-RestMethod -Method Post `
                        -Uri $config.railway.apiUrl `
                        -Headers @{ Authorization = "Bearer $($env:RAILWAY_TOKEN)"; 'Content-Type' = 'application/json' } `
                        -Body $body
                    $st = $r.data.deployment.status
                    if ($st -in @('SUCCESS','FAILED','REMOVED','CRASHED')) {
                        if ($st -eq 'SUCCESS') { Write-Ok  "$k -> $st" }
                        else                   { Write-Fail "$k -> $st" }
                        # atualiza linha de resultados
                        $results | Where-Object { $_.tenant -eq $k -and $_.layer -eq 'backend' } | ForEach-Object {
                            $_.status = $st.ToLower()
                        }
                        $finished += $k
                    } else {
                        Write-Step "$k ainda em $st"
                    }
                } catch {
                    Write-Fail "$k poll erro: $($_.Exception.Message)"
                }
            }
            foreach ($f in $finished) { $deployments.Remove($f) }
        }

        if ($deployments.Count -gt 0) {
            foreach ($k in $deployments.Keys) {
                Write-Fail "$k -> timeout (8 min)"
                $results | Where-Object { $_.tenant -eq $k -and $_.layer -eq 'backend' } | ForEach-Object {
                    $_.status = 'timeout'
                }
            }
        }
    }
}

# ----------------------------- frontend deploys ------------------------------

if ($Target -in @('frontend','both')) {
    Write-Section "FRONTEND (Vercel)"

    $frontendRoot = Split-Path $PSScriptRoot -Parent
    Push-Location $frontendRoot

    try {
        if (-not $SkipBuild -and -not $DryRun) {
            Write-Step "Rodando npm run build (1x, compartilhado)"
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "npm run build falhou" }
            Write-Ok "build concluido"
        }

        foreach ($t in $tenants) {
            $pid_ = $t.frontend.projectId
            if (-not $pid_) {
                Write-Skip "$($t.label): sem frontend configurado, pulando"
                $results += [pscustomobject]@{ tenant=$t.key; layer='frontend'; status='skipped'; detail='no-config' }
                continue
            }

            if ($DryRun) {
                Write-Skip ($t.label + ': (DRYRUN) deploy Vercel ' + $pid_)
                $results += [pscustomobject]@{ tenant=$t.key; layer='frontend'; status='dryrun'; detail=$pid_ }
                continue
            }

            Write-Step "Deployando $($t.label) ($pid_)"
            $env:VERCEL_ORG_ID = $config.vercel.orgId
            $env:VERCEL_PROJECT_ID = $pid_

            $logFile = Join-Path $env:TEMP "vercel-deploy-$($t.key).log"
            & npx vercel --prod --yes 2>&1 | Tee-Object -FilePath $logFile | Out-Null
            $exit = $LASTEXITCODE

            if ($exit -eq 0) {
                Write-Ok "$($t.label) deployado"
                $results += [pscustomobject]@{ tenant=$t.key; layer='frontend'; status='success'; detail=$logFile }
            } else {
                Write-Fail ($t.label + ' falhou (exit ' + $exit + ') - log: ' + $logFile)
                $results += [pscustomobject]@{ tenant=$t.key; layer='frontend'; status='failed'; detail=$logFile }
            }
        }
    } finally {
        Pop-Location
        Remove-Item Env:VERCEL_ORG_ID -ErrorAction SilentlyContinue
        Remove-Item Env:VERCEL_PROJECT_ID -ErrorAction SilentlyContinue
    }
}

# ----------------------------- smoke test ------------------------------------

if (-not $DryRun) {
    Write-Section "SMOKE TEST (HTTP)"

    foreach ($t in $tenants) {
        foreach ($layer in @('frontend','backend')) {
            $url = $t.$layer.url
            $tag = '[' + $layer + ']'
            if (-not $url) {
                Write-Skip ($t.label + ' ' + $tag + ': sem URL pra checar')
                continue
            }
            # backend: tenta /api/public/v1/site (404 = ok, ja tem rota)
            # frontend: tenta / (200 = ok)
            if ($layer -eq 'backend') { $probeUrl = $url + '/api/public/v1/site' } else { $probeUrl = $url }
            try {
                $r = Invoke-WebRequest -Uri $probeUrl -Method Get -UseBasicParsing -TimeoutSec 15
                $code = $r.StatusCode
                if ($code -ge 200 -and $code -lt 500) {
                    Write-Ok ($t.label + ' ' + $tag + ' HTTP ' + $code)
                } else {
                    Write-Fail ($t.label + ' ' + $tag + ' HTTP ' + $code + ' -> ' + $probeUrl)
                }
            } catch {
                # WebException com status 4xx/5xx cai aqui em PS 5.1; extrair codigo
                $code = 0
                if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
                if ($code -ge 200 -and $code -lt 500) {
                    Write-Ok ($t.label + ' ' + $tag + ' HTTP ' + $code)
                } else {
                    Write-Fail ($t.label + ' ' + $tag + ' erro: ' + $_.Exception.Message)
                }
            }
        }
    }
}

# ----------------------------- relatorio final -------------------------------

Write-Section "RESUMO"

$results | Format-Table tenant, layer, status, detail -AutoSize

$failed = @($results | Where-Object { $_.status -in @('failed','timeout','crashed') })
if ($failed.Count -gt 0) {
    Write-Host ''
    Write-Host ('FAIL: ' + $failed.Count + ' deploy(s) com problema. Investigar antes de declarar no ar.') -ForegroundColor Red
    exit 1
} else {
    Write-Host ''
    Write-Host 'OK: todos os deploys passaram.' -ForegroundColor Green
    exit 0
}

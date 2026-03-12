# -----------------------------------------------------------
# scripts/test-docker.ps1 - Local integration tests for the
# Docker image build, smoke test, and basic security checks.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\test-docker.ps1
#
# Prerequisites: docker, curl.exe (ships with Windows 10+)
# -----------------------------------------------------------
$ErrorActionPreference = "Continue"

$ImageName = "musicblocks-test"
$ContainerName = "mb-integration-test"
$Port = 3000
$SleepSeconds = 5
$Pass = 0
$Fail = 0

function Write-Pass($msg) { Write-Host "  [PASS] $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }

function Cleanup {
    docker stop $ContainerName 2>$null | Out-Null
    docker rm $ContainerName 2>$null | Out-Null
}

function Assert {
    param([string]$Desc, [scriptblock]$Test)
    try {
        $null = & $Test 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Pass $Desc
            $script:Pass++
        } else {
            Write-Fail $Desc
            $script:Fail++
        }
    } catch {
        Write-Fail $Desc
        $script:Fail++
    }
}

# --- 1. Build -----------------------------------------------
Write-Host ""
Write-Host "==> Building Docker image..." -ForegroundColor Cyan
docker build -f dockerfile -t $ImageName .
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Docker image build failed - aborting"
    exit 1
}
Write-Pass "Docker image builds successfully"
$Pass++

# --- 2. Image structure -------------------------------------
Assert "Image runs as non-root user (appuser)" {
    $user = docker run --rm $ImageName whoami
    if ($user -notmatch "appuser") { throw "not appuser" }
}

Assert "Image exposes port $Port" {
    $info = docker inspect $ImageName --format="{{json .Config.ExposedPorts}}"
    if ($info -notmatch "$Port") { throw "port not found" }
}

Assert "Image has a CMD defined" {
    $info = docker inspect $ImageName --format="{{json .Config.Cmd}}"
    if ($info -notmatch "http.server") { throw "no CMD" }
}

# --- 3. Smoke test ------------------------------------------
Write-Host ""
Write-Host "==> Starting container..." -ForegroundColor Cyan
Cleanup
docker run -d --name $ContainerName -p "${Port}:${Port}" $ImageName | Out-Null
Write-Host "    Waiting ${SleepSeconds}s for container to start..." -ForegroundColor DarkGray
Start-Sleep -Seconds $SleepSeconds

Assert "Container is running" {
    $status = docker ps --filter "name=$ContainerName" --format "{{.Status}}"
    if ($status -notmatch "Up") { throw "not running" }
}

Assert "HTTP 200 on localhost:$Port" {
    curl.exe --fail --silent --max-time 10 "http://localhost:$Port" -o NUL
    if ($LASTEXITCODE -ne 0) { throw "curl failed" }
}

Assert "Response contains HTML content" {
    $body = (curl.exe --silent --max-time 10 "http://localhost:$Port") -join "`n"
    if ($body -notmatch "(?i)(<!DOCTYPE html|<html)") { throw "no HTML" }
}

# --- 4. No secrets / env leaks -----------------------------
Assert "No environment variable leaks (no GITHUB_TOKEN)" {
    $envOut = docker exec $ContainerName env
    if ($envOut -match "GITHUB_TOKEN") { throw "leak" }
}

# --- 5. Container stops cleanly ----------------------------
Assert "Container stops within 10s" {
    docker stop $ContainerName | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "stop failed" }
}

# --- Cleanup ------------------------------------------------
docker rm $ContainerName 2>$null | Out-Null

# --- Summary ------------------------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($Fail -eq 0) {
    Write-Host " Results: $Pass passed, $Fail failed" -ForegroundColor Green
} else {
    Write-Host " Results: $Pass passed, $Fail failed" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Fail -ne 0) { exit 1 }

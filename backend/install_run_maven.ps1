$ErrorActionPreference = "Stop"

# Paths
$scriptDir = $PSScriptRoot
$toolsDir = Join-Path (Get-Item $scriptDir).Parent.FullName "tools"
$mavenVersion = "3.9.6"
$mavenDir = Join-Path $toolsDir "maven"
$mavenHome = Join-Path $mavenDir "apache-maven-$mavenVersion"
$mavenBin = Join-Path $mavenHome "bin\mvn.cmd"
$url = "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$mavenVersion/apache-maven-$mavenVersion-bin.zip"
$zipPath = Join-Path $toolsDir "maven.zip"

# Ensure tools dir exists
if (-not (Test-Path $toolsDir)) { New-Item -ItemType Directory -Path $toolsDir | Out-Null }

# Download and Install Maven if not present
if (-not (Test-Path $mavenBin)) {
    Write-Host "Maven not found in $mavenDir. Downloading..."
    
    # Clean up potentially partial installs
    if (Test-Path $mavenDir) { Remove-Item -Path $mavenDir -Recurse -Force }
    New-Item -ItemType Directory -Path $mavenDir | Out-Null

    try {
        Invoke-WebRequest -Uri $url -OutFile $zipPath
        Write-Host "Extracting Maven..."
        Expand-Archive -Path $zipPath -DestinationPath $mavenDir -Force
    }
    finally {
        if (Test-Path $zipPath) { Remove-Item $zipPath }
    }
} else {
    Write-Host "Maven found at $mavenBin"
}

# Set Java Home (Using the one from run_backend.ps1 if valid, otherwise rely on system or try to find it)
$configuredJavaHome = "C:\Program Files\Microsoft\jdk-21.0.9.10-hotspot"
if (Test-Path $configuredJavaHome) {
    $env:JAVA_HOME = $configuredJavaHome
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
    Write-Host "Using JAVA_HOME: $env:JAVA_HOME"
} else {
    Write-Warning "Configured JAVA_HOME ($configuredJavaHome) not found. Relying on system PATH."
}

# Run Backend
Write-Host "Starting Backend..."
Set-Location $scriptDir
& $mavenBin spring-boot:run

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
}
else {
    Write-Host "Maven found at $mavenBin"
}

# Set Java Home (Provision portable JDK 21 if not present)
$jdkVersion = "21.0.4"
$jdkUrl = "https://aka.ms/download-jdk/microsoft-jdk-$jdkVersion-windows-x64.zip"
$jdkDir = Join-Path $toolsDir "jdk-$jdkVersion"
$jdkZip = Join-Path $toolsDir "jdk.zip"

if (-not (Test-Path $jdkDir)) {
    Write-Host "JDK 21 not found in $jdkDir. Downloading..."
    try {
        Invoke-WebRequest -Uri $jdkUrl -OutFile $jdkZip
        Write-Host "Extracting JDK..."
        Expand-Archive -Path $jdkZip -DestinationPath $toolsDir -Force
        
        # Renaissance of folder name might be needed as zip usually extracts to 'jdk-21.0.4+7' or similar
        # simpler: just identify the new folder
        $extracted = Get-ChildItem -Path $toolsDir -Directory | Where-Object { $_.Name -like "jdk-21*" -and $_.Name -ne "jdk-$jdkVersion" } | Select-Object -First 1
        if ($extracted) {
            Rename-Item -Path $extracted.FullName -NewName "jdk-$jdkVersion"
        }
    }
    finally {
        if (Test-Path $jdkZip) { Remove-Item $jdkZip }
    }
}

if (Test-Path $jdkDir) {
    $env:JAVA_HOME = $jdkDir
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
    Write-Host "Using Portable JAVA_HOME: $env:JAVA_HOME"
}
else {
    Write-Warning "Failed to provision portable JDK. Relying on system PATH (Risk of incompatibility)."
}

# Run Backend
Write-Host "Starting Backend..."
Set-Location $scriptDir
& $mavenBin spring-boot:run

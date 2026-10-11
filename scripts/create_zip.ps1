$stageDir = "dist_source"
$destZip = "public\ai-studymate.zip"

if (Test-Path $stageDir) { Remove-Item -Recurse -Force $stageDir }
if (Test-Path $destZip) { Remove-Item -Force $destZip }

New-Item -ItemType Directory -Force -Path $stageDir | Out-Null
New-Item -ItemType Directory -Force -Path "$stageDir\prisma" | Out-Null

# Copy source trees
Copy-Item -Recurse -Force "src" "$stageDir\src"
Copy-Item -Recurse -Force "tests" "$stageDir\tests"
Copy-Item -Force "prisma\schema.prisma" "$stageDir\prisma\schema.prisma"
if (Test-Path "prisma\migrations") {
    Copy-Item -Recurse -Force "prisma\migrations" "$stageDir\prisma\migrations"
}

# Copy root configs
$rootFiles = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "next.config.ts",
    ".env.example",
    "README.md"
)
foreach ($f in $rootFiles) {
    if (Test-Path $f) { Copy-Item -Force $f "$stageDir\$f" }
}

Compress-Archive -Path "$stageDir\*" -DestinationPath $destZip -Force
Remove-Item -Recurse -Force $stageDir

if (Test-Path $destZip) {
    $item = Get-Item $destZip
    Write-Host "Created $destZip successfully! Size: $([math]::Round($item.Length / 1KB, 2)) KB"
}

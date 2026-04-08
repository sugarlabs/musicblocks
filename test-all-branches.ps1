# test-all-branches.ps1
Write-Host "Testing all your branches..." -ForegroundColor Green

$branches = @(
    "drum-palette-tests",
    "tone-palette-tests",
    "ornament-palette-tests",
    "meter-palette-tests",
    "intervals-palette-tests",
    "rhythm-advanced-tests",
    "pitch-advanced-tests"
)

$results = @{}

foreach ($branch in $branches) {
    Write-Host "Testing branch: $branch" -ForegroundColor Yellow
    
    # Switch to branch
    git checkout $branch
    
    # Run the tests and capture output
    $output = npm test -- --testPathPattern=palette 2>&1
    
    # Check if tests passed
    if ($output -match "Tests:.*?(\d+)\s+passed") {
        $passed = $matches[1]
        if ($output -match "Tests:.*?(\d+)\s+failed") {
            $failed = $matches[1]
        } else {
            $failed = 0
        }
        $results[$branch] = @{ Passed = $passed; Failed = $failed }
        Write-Host "Passed: $passed, Failed: $failed" -ForegroundColor Green
    } else {
        $results[$branch] = @{ Passed = 0; Failed = "Error" }
        Write-Host "Test run failed" -ForegroundColor Red
    }
}

# Summary
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
foreach ($branch in $branches) {
    $result = $results[$branch]
    Write-Host "$branch : Passed: $($result.Passed), Failed: $($result.Failed)"
}

# Script to update documentation path references
Write-Host "Updating documentation path references..."

# Find all files that might contain old documentation paths
$files = Get-ChildItem -Recurse -Include "*.js", "*.html", "*.md", "*.json" | 
         Where-Object { $_.FullName -notmatch "node_modules|\.git|Docs" }

$updatedFiles = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content
        
        # Update all documentation paths with properly escaped patterns
        $content = $content -replace 'documentation/', 'Docs/documentation/'
        $content = $content -replace 'documentation-es/', 'Docs/documentation-es/'
        $content = $content -replace 'documentation-he/', 'Docs/documentation-he/'
        $content = $content -replace 'documentation-ja/', 'Docs/documentation-ja/'
        $content = $content -replace 'documentation-kana/', 'Docs/documentation-kana/'
        $content = $content -replace 'documentation-pt/', 'Docs/documentation-pt/'
        $content = $content -replace 'guide/', 'Docs/guide/'
        $content = $content -replace 'guide-es/', 'Docs/guide-es/'
        $content = $content -replace 'guide-ja/', 'Docs/guide-ja/'
        $content = $content -replace 'guide-pt/', 'Docs/guide-pt/'
        $content = $content -replace 'guide-zhCN/', 'Docs/guide-zhCN/'
        $content = $content -replace 'examples/', 'Docs/examples/'
        $content = $content -replace 'FAQ/', 'Docs/FAQ/'
        
        # Update quoted patterns
        $content = $content -replace '"(documentation/)', '"(Docs/documentation/'
        $content = $content -replace '"(guide/)', '"(Docs/guide/'
        $content = $content -replace '"(examples/)', '"(Docs/examples/'
        $content = $content -replace '"(FAQ/)', '"(Docs/FAQ/'
        
        $content = $content -replace "'documentation/", "'Docs/documentation/"
        $content = $content -replace "'guide/", "'Docs/guide/"
        $content = $content -replace "'examples/", "'Docs/examples/"
        $content = $content -replace "'FAQ/", "'Docs/FAQ/"
        
        # Update template literal patterns
        $content = $content -replace '`documentation/', '`Docs/documentation/'
        $content = $content -replace '`guide/', '`Docs/guide/'
        $content = $content -replace '`examples/', '`Docs/examples/'
        $content = $content -replace '`FAQ/', '`Docs/FAQ/'
        
        if ($content -ne $originalContent) {
            Write-Host "Updating paths in: $($file.FullName)"
            Set-Content $file.FullName $content -Encoding UTF8
            $updatedFiles++
        }
    } catch {
        Write-Host "Error processing $($file.FullName): $($_.Exception.Message)"
    }
}

Write-Host "Updated $updatedFiles files"
Write-Host "Path update complete!"

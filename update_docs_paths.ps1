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
        
        # Update all documentation paths with various patterns
        $replacements = @{
            'documentation/' = 'Docs/documentation/'
            'documentation-es/' = 'Docs/documentation-es/'
            'documentation-he/' = 'Docs/documentation-he/'
            'documentation-ja/' = 'Docs/documentation-ja/'
            'documentation-kana/' = 'Docs/documentation-kana/'
            'documentation-pt/' = 'Docs/documentation-pt/'
            'guide/' = 'Docs/guide/'
            'guide-es/' = 'Docs/guide-es/'
            'guide-ja/' = 'Docs/guide-ja/'
            'guide-pt/' = 'Docs/guide-pt/'
            'guide-zhCN/' = 'Docs/guide-zhCN/'
            'examples/' = 'Docs/examples/'
            'FAQ/' = 'Docs/FAQ/'
            '"(documentation/' = '"(Docs/documentation/'
            '"(guide/' = '"(Docs/guide/'
            '"(examples/' = '"(Docs/examples/'
            '"(FAQ/' = '"(Docs/FAQ/'
            "'documentation/" = "'Docs/documentation/"
            "'guide/" = "'Docs/guide/"
            "'examples/" = "'Docs/examples/"
            "'FAQ/" = "'Docs/FAQ/"
            '`documentation/' = '`Docs/documentation/'
            '`guide/' = '`Docs/guide/'
            '`examples/' = '`Docs/examples/'
            '`FAQ/' = '`Docs/FAQ/'
        }
        
        foreach ($pattern in $replacements.Keys) {
            $replacement = $replacements[$pattern]
            $content = $content -replace $pattern, $replacement
        }
        
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

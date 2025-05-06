$content = Get-Content -Path "admin\views\products.php"
# Make backup if not exists
if (-not (Test-Path -Path "admin\views\products.php.bak")) {
    Copy-Item -Path "admin\views\products.php" -Destination "admin\views\products.php.bak"
}

# Creating a fixed version for the problematic section
$fixedLines = @(
    '        <?php /* Debug section for tables */ ?>',
    '        <div class="printful-table-debug" style="margin: 20px 0; padding: 10px; background: #f8f8f8; border: 1px solid #ddd; display: <?php',
    '        if (isset($_GET[''debug'']) || (defined(''WP_DEBUG'') && WP_DEBUG)) {',
    '            echo ''block'';',
    '        } else {',
    '            echo ''none'';',
    '        }',
    '        ?>">',
    '            <h3>Table Debug Information</h3>'
)

# Replace lines 106-113 with our fixed version
$newContent = $content[0..105] + $fixedLines + $content[114..($content.Length-1)]

# Write content back
$newContent | Set-Content -Path "admin\views\products.php"

Write-Host "File has been fixed with proper line breaks!" 
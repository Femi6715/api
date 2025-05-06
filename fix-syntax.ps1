$content = Get-Content -Path "admin\views\products.php"
# Make backup
Copy-Item -Path "admin\views\products.php" -Destination "admin\views\products.php.bak"

# Fix line 107 and 108 - The issue is likely because of a missing newline or space
$content[107] = '        <div class="printful-table-debug" style="margin: 20px 0; padding: 10px; background: #f8f8f8; border: 1px solid #ddd; display: <?php'
$content[108] = "        if (isset(`$_GET['debug']) || (defined('WP_DEBUG') && WP_DEBUG)) {"

# Write content back
$content | Set-Content -Path "admin\views\products.php"

Write-Host "File has been fixed!" 
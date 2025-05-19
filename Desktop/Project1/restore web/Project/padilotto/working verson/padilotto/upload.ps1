$ftpServer = "ftp.padilotto.com"
$ftpUsername = "admin@padilotto.com"
$ftpPassword = "d!T+?RIkjl7E"
$localPath = "dist/simplelottto/*"
$remotePath = "/"

# Create FTP request
$ftp = [System.Net.WebRequest]::Create("ftp://$ftpServer")
$ftp.Credentials = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)
$ftp.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory

# Get all files from local directory
$files = Get-ChildItem -Path $localPath -Recurse

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($file.FullName.IndexOf("dist\simplelottto\") + 18)
    $relativePath = $relativePath.Replace("\", "/")
    
    if ($file.PSIsContainer) {
        # Create directory
        $ftp = [System.Net.WebRequest]::Create("ftp://$ftpServer/$relativePath")
        $ftp.Credentials = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)
        $ftp.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        try {
            $response = $ftp.GetResponse()
            Write-Host "Created directory: $relativePath"
        } catch {
            Write-Host "Directory might already exist: $relativePath"
        }
    } else {
        # Upload file
        $ftp = [System.Net.WebRequest]::Create("ftp://$ftpServer/$relativePath")
        $ftp.Credentials = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)
        $ftp.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $ftp.UseBinary = $true
        
        $fileStream = $file.OpenRead()
        $ftpStream = $ftp.GetRequestStream()
        
        $buffer = New-Object System.Byte[] 1024
        $read = 0
        
        while (($read = $fileStream.Read($buffer, 0, 1024)) -gt 0) {
            $ftpStream.Write($buffer, 0, $read)
        }
        
        $ftpStream.Close()
        $fileStream.Close()
        
        Write-Host "Uploaded: $relativePath"
    }
}

Write-Host "Upload completed!" 
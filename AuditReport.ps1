# Define the path to the SQLite database and the JSON file
$databasePath = "C:\Code\COVReactCodeCheck\COVReactCodeCheck.db"
$jsonFilePath = "C:\Code\COVReactCodeCheck\my-react-app\audit-report.json"
$packagePath = "C:\Code\COVReactCodeCheck\my-react-app\package.json"
$tempSqlFile = "C:\Code\COVReactCodeCheck\temp_insert.sql"

# Read the contents of the JSON file
$jsonContent = Get-Content -Path $jsonFilePath -Raw

# Read the package.json to get the app name
$packageJson = Get-Content -Path $packagePath -Raw | ConvertFrom-Json
$appName = $packageJson.name

# Get current date and time in ISO format (YYYY-MM-DD HH:MM:SS)
$currentDateTime = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

# Build SQL insert command with Report, ReportDateTime, and AppName columns
$sqlCommands = @"
-- Insert the JSON data with current date and time and app name
INSERT INTO AuditReports (Report, ReportDateTime, AppName) 
VALUES ('$(($jsonContent -replace "'", "''") -replace "\r?\n", " ")', '$currentDateTime', '$appName');
"@

# Write the SQL commands to a temporary file
$sqlCommands | Out-File -FilePath $tempSqlFile -Encoding utf8

# Execute the SQL commands using the .read directive
& "C:\Code\COVReactCodeCheck\sqlite3.exe" $databasePath ".read $tempSqlFile"

# Clean up the temporary file
Remove-Item -Path $tempSqlFile

# Check if the JSON file contains any vulnerabilities
$jsonObject = $jsonContent | ConvertFrom-Json
if ($jsonObject.vulnerabilities.PSObject.Properties.Count -gt 0) {
  Write-Host "ERROR: Vulnerabilities found in the audit report!" -ForegroundColor Red
  Write-Host "Total vulnerabilities: $($jsonObject.metadata.vulnerabilities.total)" -ForegroundColor Red
    
  # Display a summary of vulnerabilities by severity
  Write-Host "Vulnerability summary:" -ForegroundColor Yellow
  $jsonObject.metadata.vulnerabilities | Format-Table -AutoSize
    
  # List the vulnerable packages
  Write-Host "Vulnerable packages:" -ForegroundColor Yellow
  foreach ($package in $jsonObject.vulnerabilities.PSObject.Properties) {
    Write-Host "- $($package.Name) (Severity: $($package.Value.severity)): $($package.Value.via[0].title)" -ForegroundColor Yellow
  }
    
  throw "Security vulnerabilities detected in your dependencies. Please fix them before proceeding."
}


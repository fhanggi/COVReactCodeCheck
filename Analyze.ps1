# Define the path to the SQLite database
$databasePath = "C:\Code\COVReactCodeCheck\COVReactCodeCheck.db"
$outputFile = "C:\Code\COVReactCodeCheck\VulnerabilityReport.txt"

# SQL query to extract vulnerability data from JSON
$sqlQuery = @"
WITH json_rows AS (
  SELECT 
    Id AS ReportId,
    ReportDateTime,
    AppName,
    json_extract(Report, '$.auditReportVersion') AS AuditVersion,
    Report
  FROM AuditReports
),
package_keys AS (
  SELECT 
    jr.ReportId, 
    jr.ReportDateTime,
    jr.AuditVersion,
    jr.AppName,
    json_each.key AS PackageName
  FROM json_rows jr, 
  json_each(json_extract(jr.Report, '$.vulnerabilities'))
)
SELECT 
  pk.ReportId,
  pk.ReportDateTime,
  pk.AppName,
  pk.AuditVersion,
  pk.PackageName,
  json_extract(jr.Report, '$.vulnerabilities.' || pk.PackageName || '.severity') AS Severity,
  json_extract(jr.Report, '$.vulnerabilities.' || pk.PackageName || '.isDirect') AS IsDirect,
  json_extract(jr.Report, '$.vulnerabilities.' || pk.PackageName || '.range') AS AffectedRange,
  json_extract(jr.Report, '$.vulnerabilities.' || pk.PackageName || '.fixAvailable') AS FixAvailable,
  json_extract(jr.Report, '$.vulnerabilities.' || pk.PackageName || '.nodes[0]') AS NodePath
FROM package_keys pk
JOIN json_rows jr ON pk.ReportId = jr.ReportId
ORDER BY pk.ReportDateTime DESC, pk.PackageName;
"@

# Execute the SQL query and save results to a file
& "C:\Code\COVReactCodeCheck\sqlite3.exe" -header -column $databasePath $sqlQuery | Out-File -FilePath $outputFile

# Display the results in the console
Write-Host "Vulnerability Report:"
Get-Content $outputFile

# Alternative query to get individual vulnerabilities (each advisory)
$detailedQuery = @"
WITH json_rows AS (
  SELECT 
    Id AS ReportId,
    ReportDateTime,
    AppName,
    json_extract(Report, '$.auditReportVersion') AS AuditVersion,
    Report
  FROM AuditReports
),
package_keys AS (
  SELECT 
    jr.ReportId, 
    jr.ReportDateTime,
    jr.AuditVersion,
    jr.AppName,
    json_each.key AS PackageName
  FROM json_rows jr, 
  json_each(json_extract(jr.Report, '$.vulnerabilities'))
)
SELECT 
  pk.ReportId,
  pk.ReportDateTime,
  pk.AppName,
  pk.PackageName,
  json_extract(jr.Report, '$.vulnerabilities.' || pk.PackageName || '.severity') AS PackageSeverity,
  json_extract(v.value, '$.title') AS VulnerabilityTitle,
  json_extract(v.value, '$.severity') AS AdvisorySeverity,
  json_extract(v.value, '$.url') AS AdvisoryURL,
  json_extract(v.value, '$.source') AS AdvisorySource,
  json_extract(v.value, '$.range') AS AffectedVersionRange
FROM package_keys pk
JOIN json_rows jr ON pk.ReportId = jr.ReportId
JOIN json_each(json_extract(jr.Report, '$.vulnerabilities.' || pk.PackageName || '.via')) v
ORDER BY pk.ReportDateTime DESC, pk.PackageName;
"@

# Execute the detailed query and save results to a detailed report file
$detailedOutputFile = "C:\Code\COVReactCodeCheck\DetailedVulnerabilityReport.txt"
& "C:\Code\COVReactCodeCheck\sqlite3.exe" -header -column $databasePath $detailedQuery | Out-File -FilePath $detailedOutputFile

# Display information about the reports
Write-Host "`nDetailed vulnerability advisories saved to: $detailedOutputFile"
Write-Host "Package summary saved to: $outputFile"
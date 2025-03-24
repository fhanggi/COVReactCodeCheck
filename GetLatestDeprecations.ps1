# Get the script's directory for absolute paths

# Define the path to the SQLite database
$databasePath = "\\covtoolsprd01\SAS\COVReactCodeCheck\COVReactCodeCheck.db"
$outputFile = "\\covtoolsprd01\SAS\COVReactCodeCheck\LastDeprecationsReport.txt"
$sqlitePath = "\\covtoolsprd01\SAS\COVReactCodeCheck\sqlite3.exe"


# SQL query to get the latest deprecation status for each GitRepo
$sqlQuery = @"
WITH LatestChecks AS (
    SELECT
        DeprecationCheckId, 
        GitRepo,
        Component,
        MAX(CreatedDateTime) as LatestCreatedDateTime
    FROM DeprecationChecks
    GROUP BY GitRepo, Component
)
SELECT 
    d.DeprecationCheckId,
    d.GitRepo,
    l.LatestCreatedDateTime,
    d.Parent,
    d.Component,
    d.Version,
    d.Message,
    d.StatusMessage
FROM DeprecationChecks d
INNER JOIN LatestChecks l 
    ON d.DeprecationCheckId = l.DeprecationCheckId 
ORDER BY d.GitRepo, d.Component;
"@

# Execute the detailed query and save results to a detailed report file
& $sqlitePath -header -column $databasePath $sqlQuery | Out-File -FilePath $outputFile


# Display information about the reports
Write-Host "`nDetailed vulnerability advisories saved to: $outputFile"
Write-Host "Package summary saved to: $outputFile"
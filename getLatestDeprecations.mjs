import { execSync } from "child_process";
import { unlinkSync, writeFileSync } from "fs";

const databasePath = "\\\\covtoolsprd01\\SAS\\COVReactCodeCheck\\COVReactCodeCheck.db";
const outputFile = "\\\\covtoolsprd01\\SAS\\COVReactCodeCheck\\LastDeprecationsReport.txt";
const sqlitePath = "\\\\covtoolsprd01\\SAS\\COVReactCodeCheck\\sqlite3.exe";
const tempSqlFile = "temp_query.sql";

const sqlQuery = `
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
`;

console.log(sqlQuery);

try {
  // Write the query to a temporary file
  writeFileSync(tempSqlFile, sqlQuery, "utf8");

  // Execute SQLite query using the temp file
  const result = execSync(`"${sqlitePath}" "${databasePath}" ".read ${tempSqlFile}"`, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  });

  console.log("Query executed successfully");
  console.log("Result length:", result.length);

  if (!result.trim()) {
    console.log("Warning: Query returned no data");
  }

  // Write results to output file
  writeFileSync(outputFile, result);

  console.log(`\nDetailed vulnerability advisories saved to: ${outputFile}`);
  console.log(`Package summary saved to: ${outputFile}`);

  // Clean up temp file
  unlinkSync(tempSqlFile);
} catch (error) {
  console.error("Error details:", error.message);
  if (error.stdout) console.log("stdout:", error.stdout);
  if (error.stderr) console.log("stderr:", error.stderr);
}

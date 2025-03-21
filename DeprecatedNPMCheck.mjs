// looks at the package-lock.json file and finds all deprecated packages
// and writes them to a csv file
// that csv file is then used by the DeprecatedNPMUpdateInventory script to update the inventory
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

//example useage
//node ldp.mjs "C:\FabianWorkSpaceGit\sys.CAMS.CAMS.REACT\cams\package-lock.json" "./deprecated-packages.csv" "sys.CAMS.CAMS.REACT"
//node ldp.mjs "C:\FabianWorkSpaceGit\sys.APOS.ArchivesPhotoProcessing.REACT\archive-photo-app\package-lock.json" "./deprecated-packages.csv" "sys.APOS.ArchivesPhotoProcessing.REACT"

//const packageLockPath = "package-lock.json";
//const packageLockPath = "C:\\FabianWorkSpaceGit\\sys.HUMIDEX.Humidex.REACT\\humidex\\package-lock.json";
//const packageLockPath = "C:\\FabianWorkSpaceGit\\sys.CAMS.CAMS.REACT\\cams\\package-lock.json";
//const csvFilePath = "deprecated-packages.csv";
//const gitRepo = "sys.CAMS.CAMS.REACT";

// Retrieve command line arguments
const packageLockPath = process.argv[2];
const csvFilePath = process.argv[3];
const gitRepo = process.argv[4];

// Simplified paths - since they're all in the same directory
const databasePath = "\\\\covtoolsprd01\\SAS\\COVReactCodeCheck\\COVReactCodeCheck.db";
const tempSqlFile = "temp_insert.sql";
const sqlLitePath = "\\\\covtoolsprd01\\SAS\\COVReactCodeCheck\\sqlite3.exe";

// Get current directory for relative paths
// const currentDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ""));

function buildDependencyTree(packages) {
  const tree = {};
  for (const [key, value] of Object.entries(packages)) {
    const packageName = key.split("node_modules/").pop(); // Get the package name
    tree[packageName] = value.dependencies ? Object.keys(value.dependencies) : [];
  }
  return tree;
}

function findTopParent(packageName, tree, visited = new Set()) {
  visited.add(packageName);

  for (const [parent, children] of Object.entries(tree)) {
    if (children.includes(packageName) && !visited.has(parent)) {
      return findTopParent(parent, tree, visited); // Recursive call
    }
  }

  return packageName === "Direct Dependency" ? null : packageName; // If no parent, it's a direct dependency
}

function createCSVContent(data, timestamp) {
  const header = "GitRepo,Parent,Component,Version,Message,Status Message,Timestamp\n";
  return data.reduce((csv, row) => {
    return csv + `${row.gitRepo},${row.parent},${row.component},${row.version},"${row.message}",,${timestamp}\n`;
  }, header);
}

// Moved function to the global scope
function insertDeprecationInfoIntoDatabase(timestamp, tempSqlFile, sqlLitePath, databasePath, deprecatedData) {
  // Build SQL insert command with Report, ReportDateTime, and AppName columns
  // also set the busy_timeout to 5000 ms to avoid database lock issues
  console.log("Inserting status message into the database");

  // Build SQL insert commands for each entry in the deprecatedData array
  const sqlCommands = `
  PRAGMA busy_timeout = 5000;
  ${deprecatedData
    .map(
      (data) => `
  INSERT INTO DeprecationChecks (GitRepo, Parent, Component, Version, Message, StatusMessage, Timestamp) 
  VALUES ('${data.gitRepo}', '${data.parent}', '${data.component}', '${data.version}', '${data.message}', '${data.statusMessage}', '${timestamp}');
  `
    )
    .join("\n")}
  `;

  // Write the SQL commands to a temporary file
  fs.writeFileSync(tempSqlFile, sqlCommands, "utf8");

  // Execute the SQL commands using the .read directive
  try {
    execSync(`"${sqlLitePath}" "${databasePath}" ".read ${tempSqlFile}"`, { stdio: "inherit" });
  } catch (error) {
    console.error("Error executing SQL commands:", error);
  }

  // Delete the temporary SQL file
  fs.unlinkSync(tempSqlFile);
}

function findDeprecatedPackages(packageLockPath) {
  fs.readFile(packageLockPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    try {
      // Get the current date/time in GMT
      const now = new Date();
      // Convert it to the local time zone
      const timestamp = now.toLocaleString();

      const packageLock = JSON.parse(data);
      const packages = packageLock.packages || {};
      const tree = buildDependencyTree(packages);
      const deprecatedData = [];
      let csvContent = "";

      for (const [key, value] of Object.entries(packages)) {
        if (value.deprecated) {
          const packageName = key.split("node_modules/").pop();
          const topParent = findTopParent(packageName, tree) || "Direct Dependency";
          console.log(
            JSON.stringify(
              {
                gitRepo: gitRepo,
                parent: topParent,
                component: packageName,
                version: value.version,
                message: value.deprecated
              },
              null,
              2
            )
          );
          deprecatedData.push({
            gitRepo: gitRepo,
            parent: topParent,
            component: packageName,
            version: value.version,
            message: value.deprecated,
            statusMessage: ""
          });
        }
      }

      if (deprecatedData.length > 0) {
        csvContent = createCSVContent(deprecatedData, timestamp);
        console.log(`Deprecated packages information written to ${csvFilePath}`);
      } else {
        // csvContent = `GitRepo,Parent,Component,Version,Message,Status Message,Timestamp\n${gitRepo},,,,,No Deprecated Packages Found,${timestamp}\n`;
        deprecatedData.push({
          gitRepo: gitRepo,
          parent: "",
          component: "",
          version: "",
          message: "",
          statusMessage: "No Deprecated Packages Found"
        });
        csvContent = createCSVContent(deprecatedData, timestamp);
        console.log("No deprecated packages found. Status written to the file.");
      }
      // Write the CSV content to file
      fs.writeFileSync(csvFilePath, csvContent, "utf8");

      insertDeprecationInfoIntoDatabase(timestamp, tempSqlFile, sqlLitePath, databasePath, deprecatedData);
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
    }
  });
}

function prepareEnvironment(packageLockPath) {
  // Determine the node_modules path based on the packageLockPath
  const nodeModulesPath = packageLockPath.replace("package-lock.json", "node_modules");

  // Delete package-lock.json and node_modules
  if (fs.existsSync(packageLockPath)) {
    console.log("Deleting package-lock.json");
    fs.unlinkSync(packageLockPath);
  }

  if (fs.existsSync(nodeModulesPath)) {
    console.log("Deleting node_modules");
    fs.rmSync(nodeModulesPath, { recursive: true });
  }

  // Run npm install in the directory of package-lock.json
  const packageLockDir = packageLockPath.substring(0, packageLockPath.lastIndexOf("\\"));
  console.log(`Running npm install in ${packageLockDir}`);
  execSync("npm install", { cwd: packageLockDir, stdio: "inherit" });
}

// Prepare the environment
prepareEnvironment(packageLockPath);

// Run findDeprecatedPackages
findDeprecatedPackages(packageLockPath, gitRepo);

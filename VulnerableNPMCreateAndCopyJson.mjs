// this script runs npm audit for a react app passed in as a command line argument
// it then writes the output to a file .json file that contains the name of the git repo in the filename and also a date time stamp
// it then copies that file to the build servers

// we do this so in case we ever need to find out when a vulnerability was found we can look at the file and see the date time stamp

import { execSync } from "child_process";
import fs from "fs";
// Retrieve command line arguments
const inventoryPath = process.argv[2];
const gitRepo = process.argv[3];
const COVBuildServers = process.argv[4];

const copyFile = (source, destination) => {
  console.log(`Copying file from ${source} to ${destination}`);
  fs.copyFile(source, destination, (err) => {
    if (err) {
      console.error("Error copying file:", err);
    } else {
      console.log(`File has been copied to ${destination}`);
    }
  });
};

const runAudit = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  const filename = `${gitRepo}_npm_audit_${dateStr}.json`;
  //FH - running audit fix throws an error if vulnerabilities are found
  // however here we just want write the output of the command to a file
  // so we ingore the error
  console.log("Generating npm audit json file");
  try {
    execSync(`npm audit --omit=dev --json > ${filename}`, { cwd: process.cwd() });
  } catch (error) {
    //ignore error
  }
  console.log(`Audit result has been written to ${filename}`);
  console.log(`${filename}`);

  //copy file to build servers
  let servers = COVBuildServers.split(",");
  console.log(servers);
  for (let server of servers) {
    let serverSpecificPath = `\\\\${server}${inventoryPath}`;
    const destinationPath = `${serverSpecificPath}\\${filename}`;
    copyFile(filename, destinationPath);
  }
  console.log("Audit has been completed");
};

runAudit();

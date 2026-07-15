/**
 * Run this in Google Apps Script (script.google.com) to auto-populate links.json.
 *
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file
 * 3. Click Run → select "generateLinks"
 * 4. Authorize when prompted (it needs Drive access)
 * 5. Check the Logs (View → Logs) — copy the JSON output
 * 6. Paste into links.json in the GitHub repo
 */

function generateLinks() {
  var docNames = [
    "Soap Line Up",
    "Brand Assets",
    "Company Goals",
    "Key Results",
    "Soap R&D Formulas",
    "Candle Packaging Strategy",
    "Inventory Management",
    "Revenue",
    "Expenses",
    "Total Profit",
    "Jumble 2026",
    "Jumble Tasks 2026",
    "IVYCOAST Meeting Notes 2025",
    "Markets & Events Hub",
    "Futagoza Market Jan 2025",
    "Futagoza Pre-Market Prep",
    "Social Media Strategy",
    "Social Posts",
    "Social Channels",
    "Cafe Event",
    "Customer Complaint — Kurkku (Nov 2025)",
    "Ivycoast Tasks",
    "Lead Tracker",
    "Team Directory",
    "Key Documents Index",
    "ClickFunnels Case Study",
    "Typography in Japan",
    "Boldoath Projects",
    "Legacy Projects",
    "Design Projects Brief",
    "Boldoath Tasks",
    "Design Contract Template EN JP",
    "2025 Changes Updates",
    "Children's Book Brief"
  ];

  var result = {};
  var notFound = [];

  docNames.forEach(function(name) {
    var files = DriveApp.searchFiles('title = "' + name.replace(/"/g, '\\"') + '"');
    if (files.hasNext()) {
      var file = files.next();
      result[name] = file.getUrl();
    } else {
      // Try partial match
      var partialFiles = DriveApp.searchFiles('title contains "' + name.split(" ")[0] + '"');
      var found = false;
      while (partialFiles.hasNext()) {
        var pFile = partialFiles.next();
        if (pFile.getName() === name) {
          result[name] = pFile.getUrl();
          found = true;
          break;
        }
      }
      if (!found) {
        result[name] = "";
        notFound.push(name);
      }
    }
  });

  Logger.log("=== COPY EVERYTHING BELOW INTO links.json ===");
  Logger.log(JSON.stringify(result, null, 2));

  if (notFound.length > 0) {
    Logger.log("\n=== NOT FOUND IN DRIVE (" + notFound.length + ") ===");
    notFound.forEach(function(name) {
      Logger.log("  - " + name);
    });
  }
}

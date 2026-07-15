// ── CRM Migration Script ─────────────────────────────────────
// Migrates contacts from the source spreadsheet into the main
// Contacts sheet. Run once from the Apps Script editor.
//
// HOW TO USE:
// 1. Open your Apps Script project (the one with apps-script.js)
// 2. Create a new file called "migrate-crm" and paste this code
// 3. Run the function migrateCrmContacts() from the editor
// 4. Check the Contacts sheet for the imported rows
// 5. Delete this file after migration is complete
// ==============================================================

var SOURCE_SHEET_ID = "1qUU0CMCU5ePgXP2Pz1M0mMFpjzc9OELw06cLSJzjfsc";
var TARGET_SHEET_ID = "1Nr1Jh22jK6HZRcy-ViA8Mryq8zNJo9t4LgT7My-s7Vo";

function migrateCrmContacts() {
  // Open source sheet (first/default sheet)
  var sourceSS = SpreadsheetApp.openById(SOURCE_SHEET_ID);
  var sourceSheet = sourceSS.getSheets()[0];
  var sourceData = sourceSheet.getDataRange().getValues();

  if (sourceData.length < 2) {
    Logger.log("Source sheet is empty or has no data rows.");
    return;
  }

  // Source headers (row 0)
  var srcHeaders = sourceData[0].map(function(h) { return String(h).trim().toLowerCase(); });
  Logger.log("Source headers: " + JSON.stringify(srcHeaders));

  // Find column indices in source
  var colDate = findCol(srcHeaders, ["date"]);
  var colCompany = findCol(srcHeaders, ["company name", "company"]);
  var colName = findCol(srcHeaders, ["person's name", "person name", "name"]);
  var colStyle = findCol(srcHeaders, ["style", "type"]);
  var colContact = findCol(srcHeaders, ["contact detail", "contact details", "contact"]);
  var colContacted = findCol(srcHeaders, ["contacted"]);
  var colContracted = findCol(srcHeaders, ["contracted"]);
  var colNotes = findCol(srcHeaders, ["notes", "note"]);

  Logger.log("Column mapping — Date:" + colDate + " Company:" + colCompany +
    " Name:" + colName + " Style:" + colStyle + " Contact:" + colContact +
    " Contacted:" + colContacted + " Contracted:" + colContracted + " Notes:" + colNotes);

  // Open target Contacts sheet
  var targetSS = SpreadsheetApp.openById(TARGET_SHEET_ID);
  var targetSheet = targetSS.getSheetByName("Contacts");
  if (!targetSheet) {
    Logger.log("ERROR: 'Contacts' sheet not found in target spreadsheet.");
    return;
  }

  var targetHeaders = targetSheet.getRange(1, 1, 1, targetSheet.getLastColumn()).getValues()[0];
  Logger.log("Target headers: " + JSON.stringify(targetHeaders));

  // Get existing contacts to check for duplicates (by name + company)
  var existingData = targetSheet.getDataRange().getValues();
  var existingKeys = {};
  var nameIdx = targetHeaders.indexOf("name");
  var compIdx = targetHeaders.indexOf("company");
  for (var e = 1; e < existingData.length; e++) {
    var key = String(existingData[e][nameIdx] || "").trim() + "|" + String(existingData[e][compIdx] || "").trim();
    existingKeys[key.toLowerCase()] = true;
  }

  // Find next ID
  var maxId = 0;
  for (var m = 1; m < existingData.length; m++) {
    var num = parseInt(String(existingData[m][0]).replace(/\D/g, ""), 10);
    if (num > maxId) maxId = num;
  }

  var now = new Date().toISOString();
  var imported = 0;
  var skipped = 0;

  // Process each source row
  for (var i = 1; i < sourceData.length; i++) {
    var row = sourceData[i];

    var personName = colName >= 0 ? String(row[colName] || "").trim() : "";
    var company = colCompany >= 0 ? String(row[colCompany] || "").trim() : "";

    // Skip empty rows
    if (!personName && !company) {
      skipped++;
      continue;
    }

    // Check for duplicates
    var dupKey = (personName + "|" + company).toLowerCase();
    if (existingKeys[dupKey]) {
      Logger.log("SKIP duplicate: " + personName + " / " + company);
      skipped++;
      continue;
    }

    // Parse name — source has "日本語名　English Name" format
    // Use full string as name
    var contactName = personName || company;

    // Parse date
    var rawDate = colDate >= 0 ? row[colDate] : "";
    var connectedDate = "";
    if (rawDate instanceof Date) {
      connectedDate = rawDate.toISOString().split("T")[0];
    } else if (rawDate) {
      // Try to parse text like "18-Feb"
      try {
        var parsed = new Date(rawDate + " 2025");
        if (!isNaN(parsed.getTime())) {
          connectedDate = parsed.toISOString().split("T")[0];
        }
      } catch(e) { /* ignore */ }
    }

    // Parse contact detail for email/phone
    var contactDetail = colContact >= 0 ? String(row[colContact] || "") : "";
    var email = "";
    var phone = "";
    // Try to extract email
    var emailMatch = contactDetail.match(/[\w.+-]+@[\w.-]+\.\w+/);
    if (emailMatch) email = emailMatch[0];
    // Try to extract phone
    var phoneMatch = contactDetail.match(/[\d\-()+ ]{8,}/);
    if (phoneMatch) phone = phoneMatch[0].trim();

    // Determine stage from Contacted/Contracted columns
    var contacted = colContacted >= 0 ? String(row[colContacted] || "") : "";
    var contracted = colContracted >= 0 ? String(row[colContracted] || "") : "";
    var stage = "prospect";
    if (contracted && contracted !== "" && contracted !== "FALSE" && contracted !== "0") {
      stage = "active";
    } else if (contacted && contacted !== "" && contacted !== "FALSE" && contacted !== "0") {
      stage = "contacted";
    }

    // Style → products
    var style = colStyle >= 0 ? String(row[colStyle] || "").trim() : "";

    // Notes
    var notes = colNotes >= 0 ? String(row[colNotes] || "").trim() : "";

    // Build contact object
    maxId++;
    var contact = {
      id: "crm-" + maxId,
      name: contactName,
      type: "Vendor",
      company: company,
      role: "",
      email: email,
      phone: phone,
      products: style,
      location: "",
      stage: stage,
      notes: notes,
      connectedDate: connectedDate,
      lastContactDate: connectedDate,
      workspace: "IVYCOAST",
      wholesalePercent: "",
      consignmentPercent: "",
      profileImageUrl: "",
      businessCardFrontUrl: "",
      businessCardUrl: "",
      businessCardBackUrl: "",
      checklist: "",
      createdAt: now,
      updatedAt: now
    };

    // Map to target row
    var newRow = targetHeaders.map(function(h) {
      return (contact[h] !== undefined && contact[h] !== null) ? contact[h] : "";
    });

    targetSheet.appendRow(newRow);
    existingKeys[dupKey] = true;
    imported++;
    Logger.log("IMPORTED: " + contactName + " / " + company + " → " + contact.id);
  }

  Logger.log("=== Migration complete: " + imported + " imported, " + skipped + " skipped ===");
}

// Helper: find column index by possible header names
function findCol(headers, names) {
  for (var n = 0; n < names.length; n++) {
    for (var h = 0; h < headers.length; h++) {
      if (headers[h] === names[n]) return h;
    }
  }
  // Partial match fallback
  for (var n2 = 0; n2 < names.length; n2++) {
    for (var h2 = 0; h2 < headers.length; h2++) {
      if (headers[h2].indexOf(names[n2]) >= 0) return h2;
    }
  }
  return -1;
}

// ── Add missing Invoices columns ──────────────────────────────
// Adds paymentBank, paymentNote, marginNote to the Invoices sheet
// if they don't already exist. Safe to run multiple times.
//
// HOW TO USE:
// 1. Open your Apps Script project (the one with apps-script.js)
// 2. Create a new file called "add-invoice-columns" and paste this code
// 3. Run addInvoiceColumns() from the editor
// 4. Delete this file after it finishes
// =============================================================

function addInvoiceColumns() {
  var ss = SpreadsheetApp.openById("1Nr1Jh22jK6HZRcy-ViA8Mryq8zNJo9t4LgT7My-s7Vo");
  var sheet = ss.getSheetByName("Invoices");

  if (!sheet) {
    Logger.log("ERROR: Invoices sheet not found.");
    return;
  }

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).trim();
  });

  Logger.log("Current headers: " + JSON.stringify(headers));

  var toAdd = ["paymentBank", "paymentNote", "marginNote"];
  var added = [];

  toAdd.forEach(function(col) {
    if (headers.indexOf(col) === -1) {
      lastCol++;
      sheet.getRange(1, lastCol).setValue(col);
      added.push(col);
      Logger.log("Added column: " + col + " at position " + lastCol);
    } else {
      Logger.log("Column already exists: " + col);
    }
  });

  if (added.length === 0) {
    Logger.log("All columns already present — nothing to do.");
  } else {
    Logger.log("Done. Added: " + added.join(", "));
  }
}

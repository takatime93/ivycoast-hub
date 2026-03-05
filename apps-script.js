// ==============================================================
// IVYCOAST & Boldoath — Kanban Board + CRM API (Google Apps Script)
// ==============================================================
// Sheets:
//   "Tasks"    — Kanban board (id prefix: ivy-)
//   "Contacts" — CRM contacts (id prefix: crm-)
//
// 1. Create a Google Sheet with sheets named "Tasks" and "Contacts"
// 2. Tasks headers:    id | name | status | priority | assignee | due | workspace | category | description | docLink | createdAt | updatedAt
// 3. Contacts headers: id | name | type | company | role | email | phone | products | location | stage | notes | connectedDate | lastContactDate | workspace | createdAt | updatedAt
// 4. Open Extensions → Apps Script, paste this code, deploy as web app
// 5. Set "Execute as: Me" and "Who has access: Anyone"
// 6. Copy the deployed URL into the dashboard (Board tab config)
// ==============================================================

function getSheet(sheetName) {
  var name = sheetName || "Tasks";
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function rowToObj(headers, row) {
  var obj = {};
  headers.forEach(function (h, i) {
    obj[h] = row[i] || "";
  });
  return obj;
}

function getAllRows(sheetName) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    rows.push(rowToObj(headers, data[i]));
  }
  return rows;
}

function findRowById(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1; // 1-indexed
  }
  return -1;
}

function nextId(sheet, prefix) {
  var data = sheet.getDataRange().getValues();
  var max = 0;
  for (var i = 1; i < data.length; i++) {
    var num = parseInt(String(data[i][0]).replace(/\D/g, ""), 10);
    if (num > max) max = num;
  }
  return prefix + (max + 1);
}

function createRow(sheetName, item) {
  var sheet = getSheet(sheetName);
  var prefix = (sheetName === "Contacts") ? "crm-" : "ivy-";
  var now = new Date().toISOString();
  var id = nextId(sheet, prefix);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    if (h === "id") return id;
    if (h === "createdAt" || h === "updatedAt") return now;
    return item[h] || "";
  });
  sheet.appendRow(row);
  return rowToObj(headers, row);
}

function updateRow(sheetName, item) {
  var sheet = getSheet(sheetName);
  var rowNum = findRowById(sheet, item.id);
  if (rowNum === -1) return null;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var existing = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  var obj = rowToObj(headers, existing);
  // Merge provided fields
  Object.keys(item).forEach(function (k) {
    if (k !== "createdAt") obj[k] = item[k];
  });
  obj.updatedAt = new Date().toISOString();
  var newRow = headers.map(function (h) { return obj[h] || ""; });
  sheet.getRange(rowNum, 1, 1, newRow.length).setValues([newRow]);
  return obj;
}

function deleteRow(sheetName, id) {
  var sheet = getSheet(sheetName);
  var rowNum = findRowById(sheet, id);
  if (rowNum === -1) return false;
  sheet.deleteRow(rowNum);
  return true;
}

// --- Web App Endpoints ---

function doGet(e) {
  var action = (e.parameter && e.parameter.action) || "list";
  var sheetName = (e.parameter && e.parameter.sheet) || "Tasks";
  if (action === "list") {
    var key = (sheetName === "Contacts") ? "contacts" : "tasks";
    var result = {};
    result[key] = getAllRows(sheetName);
    return jsonResponse(result);
  }
  return jsonResponse({ error: "Unknown action" });
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return jsonResponse({ error: "Invalid JSON body" }); }

  var action = body.action;
  var sheetName = body.sheet || "Tasks";
  var itemKey = (sheetName === "Contacts") ? "contact" : "task";
  var item = body[itemKey] || body.task || body.contact || {};

  if (action === "create") {
    var created = createRow(sheetName, item);
    var res = {};
    res[itemKey] = created;
    return jsonResponse(res);
  }
  if (action === "update") {
    var updated = updateRow(sheetName, item);
    if (!updated) return jsonResponse({ error: itemKey + " not found" });
    var res2 = {};
    res2[itemKey] = updated;
    return jsonResponse(res2);
  }
  if (action === "delete") {
    var ok = deleteRow(sheetName, body.id);
    return jsonResponse({ success: ok });
  }
  return jsonResponse({ error: "Unknown action" });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

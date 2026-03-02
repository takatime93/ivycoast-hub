// ==============================================================
// IVYCOAST & Boldoath — Kanban Board API (Google Apps Script)
// ==============================================================
// 1. Create a Google Sheet with a sheet named "Tasks"
// 2. Add headers in row 1: id | name | status | priority | assignee | due | workspace | category | description | docLink | createdAt | updatedAt
// 3. Open Extensions → Apps Script, paste this code, deploy as web app
// 4. Set "Execute as: Me" and "Who has access: Anyone"
// 5. Copy the deployed URL into the dashboard (Board tab config)
// ==============================================================

var SHEET_NAME = "Tasks";

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function rowToTask(headers, row) {
  var task = {};
  headers.forEach(function (h, i) {
    task[h] = row[i] || "";
  });
  return task;
}

function getAllTasks() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var tasks = [];
  for (var i = 1; i < data.length; i++) {
    tasks.push(rowToTask(headers, data[i]));
  }
  return tasks;
}

function findRowById(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1; // 1-indexed
  }
  return -1;
}

function nextId(sheet) {
  var data = sheet.getDataRange().getValues();
  var max = 0;
  for (var i = 1; i < data.length; i++) {
    var num = parseInt(String(data[i][0]).replace(/\D/g, ""), 10);
    if (num > max) max = num;
  }
  return "ivy-" + (max + 1);
}

function createTask(task) {
  var sheet = getSheet();
  var now = new Date().toISOString();
  var id = nextId(sheet);
  var row = [
    id,
    task.name || "",
    task.status || "backlog",
    task.priority || "",
    task.assignee || "",
    task.due || "",
    task.workspace || "IVYCOAST",
    task.category || "",
    task.description || "",
    task.docLink || "",
    now,
    now
  ];
  sheet.appendRow(row);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return rowToTask(headers, row);
}

function updateTask(task) {
  var sheet = getSheet();
  var rowNum = findRowById(sheet, task.id);
  if (rowNum === -1) return null;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var existing = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  var obj = rowToTask(headers, existing);
  // Merge provided fields
  Object.keys(task).forEach(function (k) {
    if (k !== "createdAt") obj[k] = task[k];
  });
  obj.updatedAt = new Date().toISOString();
  var newRow = headers.map(function (h) { return obj[h] || ""; });
  sheet.getRange(rowNum, 1, 1, newRow.length).setValues([newRow]);
  return obj;
}

function deleteTask(id) {
  var sheet = getSheet();
  var rowNum = findRowById(sheet, id);
  if (rowNum === -1) return false;
  sheet.deleteRow(rowNum);
  return true;
}

// --- Web App Endpoints ---

function doGet(e) {
  var action = (e.parameter && e.parameter.action) || "list";
  if (action === "list") {
    return jsonResponse({ tasks: getAllTasks() });
  }
  return jsonResponse({ error: "Unknown action" });
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return jsonResponse({ error: "Invalid JSON body" }); }
  var action = body.action;

  if (action === "create") {
    var created = createTask(body.task);
    return jsonResponse({ task: created });
  }
  if (action === "update") {
    var updated = updateTask(body.task);
    if (!updated) return jsonResponse({ error: "Task not found" });
    return jsonResponse({ task: updated });
  }
  if (action === "delete") {
    var ok = deleteTask(body.id);
    return jsonResponse({ success: ok });
  }
  return jsonResponse({ error: "Unknown action" });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

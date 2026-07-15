var SS_ID = "1Nr1Jh22jK6HZRcy-ViA8Mryq8zNJo9t4LgT7My-s7Vo";

function addAllMissingColumns() {
  var ss = SpreadsheetApp.openById(SS_ID);
  addColumnsToSheet(ss, "Invoices", ["orderNumber"]);
  addColumnsToSheet(ss, "Receipts", ["receiptNumber","invoiceId","invoiceNumber","contactName","contactCompany","contactEmail","contactAddress","receiptDate","items","subtotal","discount","shipping","taxType","tax","total","pricingType","pricingPercent","pricingParties","workspace","notes","orderId","orderNumber"]);
  addColumnsToSheet(ss, "Contacts", ["nameEn","vendorRelation","connectorFeePercent","connectorId","businessCardUrl","businessCardBackUrl"]);
  addColumnsToSheet(ss, "PartnerStock", ["contactId","contactName","productName","sku","quantity","unitPrice","pricingType","status","dateDelivered","dateSold","dateReturned","notes"]);
}

function addColumnsToSheet(ss, sheetName, requiredCols) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) { Logger.log(sheetName + " not found"); return; }
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) { Logger.log(sheetName + " is empty"); return; }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
  Logger.log(sheetName + " headers: " + JSON.stringify(headers));
  var added = [];
  requiredCols.forEach(function(col) {
    if (headers.indexOf(col) === -1) {
      lastCol++;
      sheet.getRange(1, lastCol).setValue(col);
      added.push(col);
    }
  });
  Logger.log(sheetName + " added: " + (added.length > 0 ? added.join(", ") : "nothing"));
}

// ==============================================================
// IVYCOAST & Boldoath — Hub API (Google Apps Script)
// ==============================================================
// Sheets:
//   "Tasks"    — Kanban board (id prefix: ivy-)
//   "Contacts" — CRM contacts (id prefix: crm-)
//   "Products" — Shopify products cache (id prefix: prod-)
//   "Orders"   — Shopify orders cache (id prefix: ord-)
//   "Customers" — Customer profiles from orders (id prefix: cust-)
//   "Invoices"  — Invoice records (id prefix: inv-)
//
// 1. Create a Google Sheet with sheets named "Tasks", "Contacts", "Products", "Orders"
// 2. Tasks headers:    id | name | status | priority | assignee | due | workspace | category | description | docLink | createdAt | updatedAt
// 3. Contacts headers: id | name | type | company | role | email | phone | products | location | stage | notes | connectedDate | lastContactDate | workspace | wholesalePercent | consignmentPercent | profileImageUrl | businessCardFrontUrl | businessCardBackUrl | checklist | createdAt | updatedAt
// 4. Products headers: id | shopifyProductId | shopifyVariantId | title | variantTitle | sku | price | compareAtPrice | inventoryQuantity | inventoryItemId | locationId | status | productType | vendor | tags | imageUrl | lastSynced
// 5. Orders headers:   id | shopifyOrderId | orderNumber | email | totalPrice | currency | financialStatus | fulfillmentStatus | lineItems | customerName | createdAt | shippingAddress | note | lastSynced
// 6. Customers headers: id | shopifyCustomerId | name | email | phone | totalOrders | totalSpent | firstOrderDate | lastOrderDate | tags | notes | createdAt | updatedAt
// 7. Invoices headers:  id | invoiceNumber | contactId | contactName | contactCompany | contactEmail | contactAddress | invoiceDate | dueDate | poReference | items | subtotal | discount | shipping | taxType | tax | total | pricingType | pricingPercent | pricingParties | status | workspace | notes | orderId | orderNumber | createdAt | updatedAt
// 8. Receipts headers:  id | receiptNumber | invoiceId | invoiceNumber | contactName | contactCompany | contactEmail | contactAddress | receiptDate | items | subtotal | discount | shipping | taxType | tax | total | pricingType | pricingPercent | pricingParties | workspace | notes | orderId | orderNumber | createdAt | updatedAt
// 9. Open Extensions → Apps Script, paste this code, deploy as web app
// 7. Set "Execute as: Me" and "Who has access: Anyone"
// 8. Copy the deployed URL into the dashboard (Board tab config)
//
// Shopify setup:
//   - Store: ivycoast-japan.myshopify.com
//   - Set script property SHOPIFY_ACCESS_TOKEN via Apps Script editor
//   - Create time-driven trigger for scheduledSync() every 15 minutes
// ==============================================================

var SPREADSHEET_ID = "1Nr1Jh22jK6HZRcy-ViA8Mryq8zNJo9t4LgT7My-s7Vo";

function getSheet(sheetName) {
  var name = sheetName || "Tasks";
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function rowToObj(headers, row) {
  var obj = {};
  headers.forEach(function (h, i) {
    obj[h] = (row[i] !== undefined && row[i] !== null && row[i] !== "") ? row[i] : "";
  });
  return obj;
}

function getAllRows(sheetName) {
  var sheet = getSheet(sheetName);
  if (!sheet) return [];
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
  var prefixMap = { "Contacts": "crm-", "Products": "prod-", "Orders": "ord-", "Customers": "cust-", "Invoices": "inv-", "Receipts": "rec-" };
  var prefix = prefixMap[sheetName] || "ivy-";
  var now = new Date().toISOString();
  var id = nextId(sheet, prefix);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    if (h === "id") return id;
    if (h === "createdAt") return item[h] || now;
    if (h === "updatedAt") return now;
    return (item[h] !== undefined && item[h] !== null) ? item[h] : "";
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
  // Merge provided fields (createdAt is only updated if explicitly provided)
  Object.keys(item).forEach(function (k) {
    obj[k] = item[k];
  });
  obj.updatedAt = new Date().toISOString();
  var newRow = headers.map(function (h) { return (obj[h] !== undefined && obj[h] !== null) ? obj[h] : ""; });
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
    var keyMap = { "Contacts": "contacts", "Products": "products", "Orders": "orders", "Customers": "customers", "Invoices": "invoices", "Receipts": "receipts" };
    var key = keyMap[sheetName] || "tasks";
    var result = {};
    result[key] = getAllRows(sheetName);
    return jsonResponse(result);
  }
  return jsonResponse({ error: "Unknown action" });
}

function doPost(e) {
  // Detect Shopify webhook (has X-Shopify-Topic header or order_number field without action)
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return jsonResponse({ error: "Invalid JSON body" }); }

  // Shopify webhook: payload has order_number but no action field
  if (!body.action && body.order_number !== undefined) {
    return handleShopifyWebhook(body);
  }

  var action = body.action;
  var sheetName = body.sheet || "Tasks";
  var itemKeyMap = { "Contacts": "contact", "Products": "product", "Orders": "order", "Customers": "customer", "Invoices": "invoice", "Receipts": "receipt" };
  var itemKey = itemKeyMap[sheetName] || "task";
  var item = body[itemKey] || body.task || body.contact || body.invoice || body.receipt || {};

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

  // Shopify custom actions
  if (action === "syncProducts") {
    var count = syncShopifyProducts();
    return jsonResponse({ success: true, synced: count });
  }
  if (action === "syncOrders") {
    var count2 = syncShopifyOrders();
    return jsonResponse({ success: true, synced: count2 });
  }
  if (action === "updateInventory") {
    var result3 = updateShopifyInventory(body.inventoryItemId, body.locationId, body.quantity);
    return jsonResponse(result3);
  }
  if (action === "syncCustomers") {
    var count3 = syncCustomers();
    return jsonResponse({ success: true, synced: count3 });
  }

  if (action === "uploadFile") {
    var result4 = uploadFileToDrive(body.fileName, body.mimeType, body.base64Data);
    return jsonResponse(result4);
  }

  return jsonResponse({ error: "Unknown action" });
}

// ── Upload file to Google Drive ────────────────────────────────

function uploadFileToDrive(fileName, mimeType, base64Data) {
  if (!fileName || !mimeType || !base64Data) {
    return { success: false, error: "Missing fileName, mimeType, or base64Data" };
  }
  try {
    // Find or create folder
    var folderName = "IvycoastHub-CRM";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    // Decode base64 and create file
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, fileName);
    var file = folder.createFile(blob);

    // Set sharing to anyone with link can view
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var fileUrl = "https://drive.google.com/uc?id=" + fileId;
    return { success: true, fileUrl: fileUrl, fileId: fileId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================== SHOPIFY WEBHOOK HANDLER =====================

function handleShopifyWebhook(order) {
  // Only create invoice for paid orders
  if (order.financial_status !== "paid") {
    return jsonResponse({ success: true, skipped: "not paid" });
  }

  var shopifyOrderId = String(order.id || "");
  var orderNumber = String(order.order_number || "");

  // Check if invoice already exists for this order
  var invoiceSheet = getSheet("Invoices");
  if (invoiceSheet) {
    var invData = invoiceSheet.getDataRange().getValues();
    var invHeaders = invData[0];
    var orderIdCol = invHeaders.indexOf("orderId");
    var orderNumCol = invHeaders.indexOf("orderNumber");
    for (var i = 1; i < invData.length; i++) {
      if ((orderIdCol >= 0 && String(invData[i][orderIdCol]) === shopifyOrderId) ||
          (orderNumCol >= 0 && String(invData[i][orderNumCol]) === orderNumber)) {
        return jsonResponse({ success: true, skipped: "invoice already exists" });
      }
    }
  }

  // Build line items string and structured items
  var lineItems = [];
  var itemsJson = [];
  var subtotal = 0;
  if (order.line_items && order.line_items.length) {
    order.line_items.forEach(function(li) {
      var qty = li.quantity || 1;
      var price = parseFloat(li.price) || 0;
      var name = li.title || li.name || "";
      if (li.variant_title) name += " \u2014 " + li.variant_title;
      lineItems.push(qty + "x " + name);
      itemsJson.push({
        description: name,
        qty: qty,
        unitPrice: price,
        amount: qty * price
      });
      subtotal += qty * price;
    });
  }

  var totalPrice = parseFloat(order.total_price) || subtotal;
  var customerName = "";
  if (order.customer) {
    customerName = ((order.customer.first_name || "") + " " + (order.customer.last_name || "")).trim();
  }

  // Parse shipping address
  var addrJson = "";
  if (order.shipping_address) {
    var sa = order.shipping_address;
    addrJson = JSON.stringify({
      postal: sa.zip || "",
      prefecture: sa.province || "",
      city: sa.city || "",
      line1: (sa.address1 || ""),
      line2: (sa.address2 || "")
    });
  }

  var invoice = {
    invoiceNumber: generateInvoiceNumber_(),
    contactId: "",
    contactName: customerName,
    contactCompany: customerName,
    contactEmail: order.email || "",
    contactAddress: addrJson,
    invoiceDate: order.created_at ? order.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    dueDate: "",
    poReference: "Order #" + orderNumber,
    items: JSON.stringify(itemsJson),
    subtotal: String(subtotal),
    discount: "0",
    shipping: String(parseFloat(order.total_shipping_price_set && order.total_shipping_price_set.shop_money ? order.total_shipping_price_set.shop_money.amount : "0") || 0),
    taxType: "included",
    tax: "0",
    total: String(totalPrice),
    pricingType: "wholesale",
    pricingPercent: "",
    status: "draft",
    workspace: "IVYCOAST",
    notes: "Auto-generated from Shopify webhook, order #" + orderNumber,
    orderId: shopifyOrderId,
    orderNumber: orderNumber
  };

  var created = createRow("Invoices", invoice);
  return jsonResponse({ success: true, invoice: created });
}

// Generate invoice number server-side
function generateInvoiceNumber_() {
  var sheet = getSheet("Invoices");
  if (!sheet) return "INV-" + new Date().getFullYear() + "-001";
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var numCol = headers.indexOf("invoiceNumber");
  if (numCol === -1) return "INV-" + new Date().getFullYear() + "-001";
  var year = String(new Date().getFullYear());
  var maxSeq = 0;
  for (var i = 1; i < data.length; i++) {
    var num = String(data[i][numCol] || "");
    if (num.indexOf("INV-" + year) === 0) {
      var parts = num.split("-");
      var seq = parseInt(parts[2], 10) || 0;
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  var next = String(maxSeq + 1);
  while (next.length < 3) next = "0" + next;
  return "INV-" + year + "-" + next;
}

function generateReceiptNumber_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Receipts");
  var year = new Date().getFullYear().toString();
  var prefix = "REC-" + year + "-";
  var maxSeq = 0;
  if (sheet && sheet.getLastRow() > 1) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var col = headers.indexOf("receiptNumber");
    if (col >= 0) {
      var data = sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < data.length; i++) {
        var num = String(data[i][0] || "");
        if (num.indexOf(prefix) !== 0) continue;
        var parts = num.split("-");
        var seq = parseInt(parts[2], 10) || 0;
        if (seq > maxSeq) maxSeq = seq;
      }
    }
  }
  var next = String(maxSeq + 1);
  while (next.length < 3) next = "0" + next;
  return "REC-" + year + "-" + next;
}

// ===================== SHOPIFY API =====================

var SHOPIFY_STORE = "ivycoast-japan.myshopify.com";

function getShopifyToken() {
  return PropertiesService.getScriptProperties().getProperty("SHOPIFY_ACCESS_TOKEN");
}

function shopifyGet(endpoint, params) {
  var token = getShopifyToken();
  if (!token) throw new Error("SHOPIFY_ACCESS_TOKEN not set");
  var url = "https://" + SHOPIFY_STORE + "/admin/api/2024-01/" + endpoint;
  if (params) {
    var qs = Object.keys(params).map(function(k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
    url += "?" + qs;
  }
  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    muteHttpExceptions: true
  });
  return JSON.parse(response.getContentText());
}

function shopifyPost(endpoint, payload) {
  var token = getShopifyToken();
  if (!token) throw new Error("SHOPIFY_ACCESS_TOKEN not set");
  var url = "https://" + SHOPIFY_STORE + "/admin/api/2024-01/" + endpoint;
  var response = UrlFetchApp.fetch(url, {
    method: "post",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  return JSON.parse(response.getContentText());
}

// ── Sync Shopify Products → Google Sheet ───────────────────────

function syncShopifyProducts() {
  var sheet = getSheet("Products");
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var existing = getAllRows("Products");

  // Build lookup by shopifyVariantId for upsert
  var variantMap = {};
  existing.forEach(function(row) {
    if (row.shopifyVariantId) variantMap[String(row.shopifyVariantId)] = row;
  });

  var allVariants = [];
  var sinceId = "0";
  var hasMore = true;

  // Paginate through all products
  while (hasMore) {
    var data = shopifyGet("products.json", { limit: "250", since_id: sinceId, fields: "id,title,variants,status,product_type,vendor,tags,images" });
    var products = data.products || [];
    if (products.length === 0) { hasMore = false; break; }

    products.forEach(function(p) {
      var imageUrl = (p.images && p.images.length > 0) ? p.images[0].src : "";
      (p.variants || []).forEach(function(v) {
        allVariants.push({
          shopifyProductId: String(p.id),
          shopifyVariantId: String(v.id),
          title: p.title,
          variantTitle: v.title === "Default Title" ? "" : v.title,
          sku: v.sku || "",
          price: v.price || "",
          compareAtPrice: v.compare_at_price || "",
          inventoryQuantity: String(v.inventory_quantity || 0),
          inventoryItemId: String(v.inventory_item_id || ""),
          locationId: "",
          status: p.status || "",
          productType: p.product_type || "",
          vendor: p.vendor || "",
          tags: p.tags || "",
          imageUrl: imageUrl
        });
      });
    });

    sinceId = String(products[products.length - 1].id);
    if (products.length < 250) hasMore = false;
  }

  // Fetch location ID (primary location)
  var locationId = "";
  try {
    var locData = shopifyGet("locations.json", {});
    if (locData.locations && locData.locations.length > 0) {
      locationId = String(locData.locations[0].id);
    }
  } catch (e) { /* use empty */ }

  var now = new Date().toISOString();
  var synced = 0;

  allVariants.forEach(function(v) {
    v.locationId = locationId;
    v.lastSynced = now;
    var existingRow = variantMap[v.shopifyVariantId];
    if (existingRow) {
      // Update existing row
      v.id = existingRow.id;
      updateRow("Products", v);
    } else {
      // Create new row
      createRow("Products", v);
    }
    synced++;
  });

  return synced;
}

// ── Sync Shopify Orders → Google Sheet ─────────────────────────

function syncShopifyOrders() {
  var sheet = getSheet("Orders");
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var existing = getAllRows("Orders");

  // Build lookup by shopifyOrderId
  var orderMap = {};
  existing.forEach(function(row) {
    if (row.shopifyOrderId) orderMap[String(row.shopifyOrderId)] = row;
  });

  // Get all orders (paginated using since_id, ascending)
  var allOrders = [];
  var sinceId = "0";
  var hasMore = true;

  while (hasMore) {
    var params = { limit: "250", status: "any", since_id: sinceId };

    var data = shopifyGet("orders.json", params);
    var orders = data.orders || [];
    if (orders.length === 0) { hasMore = false; break; }

    orders.forEach(function(o) {
      var lineItemsSummary = (o.line_items || []).map(function(li) {
        return li.quantity + "x " + li.title;
      }).join("; ");

      var customerName = "";
      if (o.customer) {
        customerName = ((o.customer.first_name || "") + " " + (o.customer.last_name || "")).trim();
      }

      var shippingAddr = "";
      if (o.shipping_address) {
        var sa = o.shipping_address;
        shippingAddr = [sa.address1, sa.address2, sa.city, sa.province, sa.zip, sa.country].filter(Boolean).join(", ");
      }

      allOrders.push({
        shopifyOrderId: String(o.id),
        orderNumber: String(o.order_number || ""),
        email: o.email || "",
        totalPrice: o.total_price || "",
        currency: o.currency || "JPY",
        financialStatus: o.financial_status || "",
        fulfillmentStatus: o.fulfillment_status || "unfulfilled",
        lineItems: lineItemsSummary,
        customerName: customerName,
        createdAt: o.created_at || "",
        shippingAddress: shippingAddr,
        note: o.note || ""
      });
    });

    sinceId = String(orders[orders.length - 1].id);
    if (orders.length < 250) hasMore = false;
  }

  // Also fetch draft orders (separate Shopify endpoint)
  var draftSinceId = "0";
  var draftHasMore = true;
  while (draftHasMore) {
    var draftParams = { limit: "250", since_id: draftSinceId };
    var draftData = shopifyGet("draft_orders.json", draftParams);
    var drafts = draftData.draft_orders || [];
    if (drafts.length === 0) { draftHasMore = false; break; }

    drafts.forEach(function(d) {
      var lineItemsSummary = (d.line_items || []).map(function(li) {
        return li.quantity + "x " + li.title;
      }).join("; ");

      var customerName = "";
      if (d.customer) {
        customerName = ((d.customer.first_name || "") + " " + (d.customer.last_name || "")).trim();
      }

      var shippingAddr = "";
      if (d.shipping_address) {
        var sa = d.shipping_address;
        shippingAddr = [sa.address1, sa.address2, sa.city, sa.province, sa.zip, sa.country].filter(Boolean).join(", ");
      }

      // Use "draft-" prefix to avoid ID collision with regular orders
      var draftId = "draft-" + String(d.id);
      // Skip if already added as a completed order (draft was converted)
      if (orderMap[draftId]) return;

      allOrders.push({
        shopifyOrderId: draftId,
        orderNumber: d.name || ("D" + d.order_number || ""),
        email: d.email || "",
        totalPrice: d.total_price || "",
        currency: d.currency || "JPY",
        financialStatus: d.status || "draft",
        fulfillmentStatus: "unfulfilled",
        lineItems: lineItemsSummary,
        customerName: customerName,
        createdAt: d.created_at || "",
        shippingAddress: shippingAddr,
        note: d.note || ""
      });
    });

    draftSinceId = String(drafts[drafts.length - 1].id);
    if (drafts.length < 250) draftHasMore = false;
  }

  // Sort newest first
  allOrders.sort(function(a, b) {
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  var now = new Date().toISOString();
  var synced = 0;

  allOrders.forEach(function(o) {
    o.lastSynced = now;
    var existingRow = orderMap[o.shopifyOrderId];
    if (existingRow) {
      o.id = existingRow.id;
      updateRow("Orders", o);
    } else {
      createRow("Orders", o);
    }
    synced++;
  });

  // Auto-sync customer profiles from orders
  try { syncCustomers(); } catch (e) { console.error("Customer sync failed:", e); }

  return synced;
}

// ── Sync Customers from Orders → Google Sheet ─────────────────

function syncCustomers() {
  // Ensure Customers sheet exists
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss.getSheetByName("Customers")) {
    var newSheet = ss.insertSheet("Customers");
    newSheet.getRange(1, 1, 1, 13).setValues([["id","shopifyCustomerId","name","email","phone","totalOrders","totalSpent","firstOrderDate","lastOrderDate","tags","notes","createdAt","updatedAt"]]);
  }

  var orders = getAllRows("Orders");
  var existing = getAllRows("Customers");

  // Build lookup by email
  var customerMap = {};
  existing.forEach(function(row) {
    if (row.email) customerMap[String(row.email).toLowerCase()] = row;
  });

  // Aggregate orders by email
  var emailAgg = {};
  orders.forEach(function(o) {
    var email = String(o.email || "").toLowerCase().trim();
    if (!email) return;
    if (!emailAgg[email]) {
      emailAgg[email] = { name: o.customerName || "", email: email, orders: [], totalSpent: 0 };
    }
    emailAgg[email].orders.push(o);
    emailAgg[email].totalSpent += parseFloat(o.totalPrice) || 0;
    // Use the most recent non-empty name
    if (o.customerName && !emailAgg[email].name) {
      emailAgg[email].name = o.customerName;
    }
  });

  var now = new Date().toISOString();
  var synced = 0;

  Object.keys(emailAgg).forEach(function(email) {
    var agg = emailAgg[email];
    var sortedOrders = agg.orders.sort(function(a, b) {
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });
    var firstOrder = sortedOrders[0].createdAt || "";
    var lastOrder = sortedOrders[sortedOrders.length - 1].createdAt || "";

    var existingCustomer = customerMap[email];
    var customerData = {
      name: agg.name,
      email: email,
      totalOrders: String(agg.orders.length),
      totalSpent: String(Math.round(agg.totalSpent * 100) / 100),
      firstOrderDate: firstOrder,
      lastOrderDate: lastOrder
    };

    if (existingCustomer) {
      customerData.id = existingCustomer.id;
      // Preserve user-edited fields
      customerData.phone = existingCustomer.phone || "";
      customerData.tags = existingCustomer.tags || "";
      customerData.notes = existingCustomer.notes || "";
      customerData.shopifyCustomerId = existingCustomer.shopifyCustomerId || "";
      updateRow("Customers", customerData);
    } else {
      createRow("Customers", customerData);
    }
    synced++;
  });

  return synced;
}

// ── Update Shopify Inventory ───────────────────────────────────

function updateShopifyInventory(inventoryItemId, locationId, quantity) {
  if (!inventoryItemId || !locationId) {
    return { success: false, error: "Missing inventoryItemId or locationId" };
  }
  try {
    var result = shopifyPost("inventory_levels/set.json", {
      location_id: Number(locationId),
      inventory_item_id: Number(inventoryItemId),
      available: Number(quantity)
    });

    // Update the Products sheet with the new quantity
    var products = getAllRows("Products");
    var match = products.find(function(p) {
      return String(p.inventoryItemId) === String(inventoryItemId);
    });
    if (match) {
      updateRow("Products", {
        id: match.id,
        inventoryQuantity: String(quantity),
        lastSynced: new Date().toISOString()
      });
    }

    return { success: true, inventory_level: result.inventory_level || null };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ── Scheduled Sync (time-driven trigger) ───────────────────────

function scheduledSync() {
  try {
    syncShopifyProducts();
    syncShopifyOrders();
  } catch (e) {
    console.error("Scheduled sync failed:", e);
  }
}

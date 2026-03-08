// ==============================================================
// IVYCOAST & Boldoath — Hub API (Google Apps Script)
// ==============================================================
// Sheets:
//   "Tasks"    — Kanban board (id prefix: ivy-)
//   "Contacts" — CRM contacts (id prefix: crm-)
//   "Products" — Shopify products cache (id prefix: prod-)
//   "Orders"   — Shopify orders cache (id prefix: ord-)
//
// 1. Create a Google Sheet with sheets named "Tasks", "Contacts", "Products", "Orders"
// 2. Tasks headers:    id | name | status | priority | assignee | due | workspace | category | description | docLink | createdAt | updatedAt
// 3. Contacts headers: id | name | type | company | role | email | phone | products | location | stage | notes | connectedDate | lastContactDate | workspace | createdAt | updatedAt
// 4. Products headers: id | shopifyProductId | shopifyVariantId | title | variantTitle | sku | price | compareAtPrice | inventoryQuantity | inventoryItemId | locationId | status | productType | vendor | tags | imageUrl | lastSynced
// 5. Orders headers:   id | shopifyOrderId | orderNumber | email | totalPrice | currency | financialStatus | fulfillmentStatus | lineItems | customerName | createdAt | shippingAddress | note | lastSynced
// 6. Open Extensions → Apps Script, paste this code, deploy as web app
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
  var prefixMap = { "Contacts": "crm-", "Products": "prod-", "Orders": "ord-" };
  var prefix = prefixMap[sheetName] || "ivy-";
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
    var keyMap = { "Contacts": "contacts", "Products": "products", "Orders": "orders" };
    var key = keyMap[sheetName] || "tasks";
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
  var itemKeyMap = { "Contacts": "contact", "Products": "product", "Orders": "order" };
  var itemKey = itemKeyMap[sheetName] || "task";
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

  return jsonResponse({ error: "Unknown action" });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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

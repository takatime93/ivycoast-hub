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
// 2. Tasks headers:    id | name | status | priority | assignee | due | workspace | category | description | docLink | createdAt | updatedAt | entityType | entityId
// 3. Contacts headers: id | name | nameEn | type | company | role | email | phone | products | location | stage | notes | connectedDate | lastContactDate | workspace | wholesalePercent | consignmentPercent | profileImageUrl | businessCardFrontUrl | businessCardBackUrl | checklist | website | instagram | socialMedia | vendorRelation | connectorFeePercent | connectorId | businessCardUrl | people | createdAt | updatedAt
// 4. Products headers: id | shopifyProductId | shopifyVariantId | title | variantTitle | sku | price | compareAtPrice | inventoryQuantity | inventoryItemId | locationId | status | productType | vendor | tags | imageUrl | lastSynced | description | handle | imageUrls | productOptions | barcode | weight | weightUnit | variantOptions | inventoryPolicy | metafields
// 5. Orders headers:   id | shopifyOrderId | orderNumber | email | totalPrice | currency | financialStatus | fulfillmentStatus | lineItems | customerName | createdAt | shippingAddress | note | lastSynced | contactId
// 6. Customers headers: id | shopifyCustomerId | name | email | phone | totalOrders | totalSpent | firstOrderDate | lastOrderDate | tags | notes | createdAt | updatedAt
// 7. Invoices headers:  id | invoiceNumber | contactId | contactName | contactCompany | contactEmail | contactAddress | invoiceDate | dueDate | poReference | items | subtotal | discount | shipping | taxType | tax | total | pricingType | pricingPercent | pricingParties | status | workspace | notes | orderId | orderNumber | paymentBank | paymentNote | marginNote | createdAt | updatedAt
// 8. Receipts headers:  id | receiptNumber | invoiceId | invoiceNumber | contactName | contactCompany | contactEmail | contactAddress | receiptDate | items | subtotal | discount | shipping | taxType | tax | total | pricingType | pricingPercent | pricingParties | workspace | notes | orderId | orderNumber | createdAt | updatedAt
// 9. PartnerStock headers: id | contactId | contactName | productName | sku | quantity | unitPrice | pricingType | status | dateDelivered | dateSold | dateReturned | notes | createdAt | updatedAt
// 10. ContactDocuments headers: id | contactId | contactName | docType | docName | sentDate | receivedDate | fileUrl | notes | createdAt | updatedAt
// 11. People headers: id | nameJa | nameEn | initials | title | avatarImageUrl | email | phone | lineId | instagramHandle | preferredContact | vendorId | vendorRole | isPrimary | languages | communicationPrefs | background | howWeMet | lastContactedAt | lastContactedType | firstMetAt | createdAt | updatedAt
// 12. SoapBatches headers: id | name | batchNumber | date | status | oils | superfat | lyeConcentration | fragrance | fragranceOz | colorant | notes | properties | lyeCalc | qualityScore | cureStartDate | cureEndDate | actualResults | barsProduced | costPerBar | linkedProductId | linkedProductName | createdAt | updatedAt
//     + Slice 4 LOCK columns (appended at end): recipeId | recipeVersion | formulaSnapshot | costSnapshot | qtyProduced | dateMade
// 13. ProductMeta headers: id | shopifyProductId | source | category | devStatus | line | nameEn | nameJa | marketingName | ingredientLabelJa | linkedFormulaId | costPerBar | finishedCostPerBar | targetLaunch | heroImageUrl | internalNotes | versions | createdAt | updatedAt
// 14. Ingredients headers (Slice 4 / Make, id prefix: ing-): id | name | nameJa | category | unit | pricePerUnit | supplier | notes | active | createdAt | updatedAt
// 15. Recipes headers (Slice 4 / Make, id prefix: rcp-): id | name | kind | items | yield | yieldUnit | instructions | status | version | notes | createdAt | updatedAt
// 16. BrandConcept headers (Slice 5 / Brand, id prefix: bc-): id | section | title | content | lang | order | status | updatedBy | createdAt | updatedAt
// 17. Events headers (Slice 7 / Calendar, id prefix: evt-): id | type | title | date | endDate | allDay | note | link | linkType | linkId | workspace | status | createdBy | createdAt | updatedAt
// 18. SocialPosts headers (Slice 7 / Social planner, id prefix: spost-): id | platform | caption | assetRef | assetType | scheduledAt | postedAt | status | workspace | campaign | linkUrl | voiceChecked | createdBy | createdAt | updatedAt
// 11. Open Extensions → Apps Script, paste this code, deploy as web app
// 7. Set "Execute as: Me" and "Who has access: Anyone"
// 8. Copy the deployed URL into the dashboard (Board tab config)
//
// Shopify setup:
//   - Store: ivycoast-japan.myshopify.com
//   - Set script property SHOPIFY_ACCESS_TOKEN via Apps Script editor
//   - Create time-driven trigger for scheduledSync() every 15 minutes
//
// Ivy chat (in-app AI assistant, Gemini):
//   - POST action "chat"     — { action:"chat", messages:[{role,text}], idToken } → { reply }
//                              MANDATORY auth (verifyIdToken_ always runs — chat spends
//                              API money). Requires FIREBASE_API_KEY to be set, otherwise
//                              returns "server not configured" (chat stays off until then).
//   - POST action "brainSet" — { action:"brainSet", text } → { success, chunks }
//                              Replaces the "BrainKB" sheet contents (the knowledge pack
//                              fed to Ivy). Gated by authGate_ like other writes.
//   - Required script property: GEMINI_API_KEY (Google AI Studio key)
//   - Optional script property: GEMINI_MODEL (default "gemini-2.5-flash")
//   - Deploy note: after adding these properties, create a NEW deployment (or update
//     the existing one) so the script re-authorizes UrlFetch to generativelanguage.googleapis.com.
//     The "BrainKB" sheet is auto-created on first brainSet.
// ==============================================================

var SPREADSHEET_ID = "1Nr1Jh22jK6HZRcy-ViA8Mryq8zNJo9t4LgT7My-s7Vo";

// Cache spreadsheet handle per execution to avoid repeated openById calls
var _ssHandle = null;
function getSS() {
  if (!_ssHandle) _ssHandle = SpreadsheetApp.openById(SPREADSHEET_ID);
  return _ssHandle;
}

function getSheet(sheetName) {
  var name = sheetName || "Tasks";
  return getSS().getSheetByName(name);
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
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sheet.getLastColumn();
  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
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
  var prefixMap = { "Contacts": "crm-", "Products": "prod-", "Orders": "ord-", "Customers": "cust-", "Invoices": "inv-", "Receipts": "rec-", "PartnerStock": "stk-", "ContactDocuments": "cdoc-", "VenueReports": "vr-", "Shipments": "shp-", "Ingredients": "ing-", "Recipes": "rcp-", "BrandConcept": "bc-", "Events": "evt-", "SocialPosts": "spost-" };
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

// --- Activity Logging & Presence Helpers ---

var SHEET_TO_ITEM_TYPE = {
  Tasks: "task", Contacts: "contact", Products: "product",
  Orders: "order", Customers: "customer", Invoices: "invoice", Receipts: "receipt",
  PartnerStock: "stock", ContactDocuments: "document", People: "person",
  ContactNotes: "contactNote", ContactInteractions: "contactInteraction", ContactActivityLog: "contactActivity",
  SoapBatches: "soapBatch", ProductMeta: "productMeta",
  VenueReports: "venueReport", Shipments: "shipment",
  Ingredients: "ingredient", Recipes: "recipe", BrandConcept: "brandConcept",
  Events: "event", SocialPosts: "socialPost"
};

function ensureSheet(name, headers) {
  var ss = getSS();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }
  // Existing sheet: APPEND any missing header columns at the end (append-only — never
  // reorder or rename existing columns). This lets schema additions (e.g. new Shopify
  // fields on Products) self-heal on deploy so createRow/updateRow/getAllRows can use them.
  var lastCol = sheet.getLastColumn();
  var existing = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var have = {};
  existing.forEach(function (h) { if (h !== "" && h != null) have[h] = true; });
  var toAdd = headers.filter(function (h) { return !have[h]; });
  if (toAdd.length > 0) {
    sheet.getRange(1, lastCol + 1, 1, toAdd.length).setValues([toAdd]);
  }
  return sheet;
}

// Full ensure pass. Not called per-request anymore — see ensureSheetsOnce_()
// (PropertiesService-gated) and the ?action=ensureSheets admin path.
function ensureActivityAndPresenceSheets() {
  ensureSheet("ActivityLog", ["id","action","itemType","itemId","itemName","detail","userId","userName","timestamp"]);
  ensureSheet("Presence", ["email","lastActive","currentTab","photoUrl"]);
  ensureSheet("People", ["id","nameJa","nameEn","initials","title","avatarImageUrl","email","phone","lineId","instagramHandle","preferredContact","vendorId","vendorRole","isPrimary","languages","communicationPrefs","background","howWeMet","lastContactedAt","lastContactedType","firstMetAt","createdAt","updatedAt"]);
  ensureSheet("ContactNotes", ["id","contactId","body","context","createdAt","createdBy"]);
  ensureSheet("ContactInteractions", ["id","contactId","vendorId","type","summary","occurredAt","createdAt"]);
  ensureSheet("ContactActivityLog", ["id","contactId","eventType","title","detail","relatedId","occurredAt"]);
  // Slice 4 (Make): SoapBatches gains the LOCKED-SNAPSHOT columns (OWNER DECISION
  // #3, 2026-07-14 — slice4-plan tail). ensureSheet is append-only, so the six new
  // columns land at the END of the existing header row; existing rows/consumers
  // (formulator save path, batch history, frozen costPerBar) are untouched.
  // formulaSnapshot/costSnapshot are IMMUTABLE once set — see handleLockBatch_ and
  // applyUpdateGuards_.
  ensureSheet("SoapBatches", ["id","name","batchNumber","date","status","oils","superfat","lyeConcentration","fragrance","fragranceOz","colorant","notes","properties","lyeCalc","qualityScore","cureStartDate","cureEndDate","actualResults","barsProduced","costPerBar","linkedProductId","linkedProductName","createdAt","updatedAt","recipeId","recipeVersion","formulaSnapshot","costSnapshot","qtyProduced","dateMade"]);
  // Slice 4 (Make): ingredient master with editable prices that persist/sync
  // (OWNER DECISION #1). Price edits flow through the normal update path — but
  // batches NEVER re-read prices after lock (snapshot rule above).
  ensureSheet("Ingredients", ["id","name","nameJa","category","unit","pricePerUnit","supplier","notes","active","createdAt","updatedAt"]);
  // Slice 4 (Make): general recipes — kind ∈ {soap, candle, other}; candle math is
  // BLOCKED on specs but the kind field ships now (owner mandate). items is JSON:
  // [{ingredientId, name, qty, unit}]. version is a simple int — editing an ACTIVE
  // recipe's formula fields bumps it server-side (applyUpdateGuards_).
  ensureSheet("Recipes", ["id","name","kind","items","yield","yieldUnit","instructions","status","version","notes","createdAt","updatedAt"]);
  // Slice 5 (Brand): editable brand workspace store (OWNER DECISION #2). One row
  // per section entry; content is JSON or text; frontend seeds it from the
  // knowledge pack. section ∈ {mission, positioning, voice, palette, campaign, rule, asset}.
  ensureSheet("BrandConcept", ["id","section","title","content","lang","order","status","updatedBy","createdAt","updatedAt"]);
  ensureSheet("ProductMeta", ["id","shopifyProductId","source","category","devStatus","line","nameEn","nameJa","marketingName","ingredientLabelJa","linkedFormulaId","costPerBar","finishedCostPerBar","targetLaunch","heroImageUrl","internalNotes","versions","createdAt","updatedAt"]);
  ensureSheet("Products", ["id","shopifyProductId","shopifyVariantId","title","variantTitle","sku","price","compareAtPrice","inventoryQuantity","inventoryItemId","locationId","status","productType","vendor","tags","imageUrl","lastSynced","description","handle","imageUrls","productOptions","barcode","weight","weightUnit","variantOptions","inventoryPolicy","metafields"]);
  // Schema links (entity graph): entityType/entityId let a Task point at any
  // record; contactId links an Order to a CRM contact. New columns are appended
  // at the END of existing header rows by ensureSheet — never reordered.
  ensureSheet("Tasks", ["id","name","status","priority","assignee","due","workspace","category","description","docLink","createdAt","updatedAt","entityType","entityId"]);
  ensureSheet("Orders", ["id","shopifyOrderId","orderNumber","email","totalPrice","currency","financialStatus","fulfillmentStatus","lineItems","customerName","createdAt","shippingAddress","note","lastSynced","contactId","orderSource","archived"]);
  // Slice 2 (Sell): settlement engine + internal shipment record. ensureSheet is
  // append-only, so declaring the full known Invoices header just APPENDS the new
  // `settlement` JSON column at the end — existing invoice columns are never
  // reordered or touched. (Invoices/Receipts were previously created outside the
  // ensure pass; declaring them here is safe and self-healing.)
  ensureSheet("Invoices", ["id","invoiceNumber","contactId","contactName","contactCompany","contactEmail","contactAddress","invoiceDate","dueDate","poReference","items","subtotal","discount","shipping","taxType","tax","total","pricingType","pricingPercent","pricingParties","status","workspace","notes","orderId","orderNumber","paymentBank","paymentNote","marginNote","settlement","createdAt","updatedAt"]);
  // VenueReports: manually-keyed consignment sales reports from venues. status ∈
  // {UNPROCESSED, settled}; lines/gross drive the settlement split; once settled,
  // settlementInvoiceId points at the STL- invoice row.
  ensureSheet("VenueReports", ["id","contactId","venueName","period","received","status","lines","gross","settlementInvoiceId","createdAt","updatedAt"]);
  // Shipments: INTERNAL-ONLY fulfillment record. NEVER read by any invoice/receipt/
  // PDF/client-facing path (privacy guard — see uploadFile/invoice generation).
  // items/photos/inserts are JSON strings.
  ensureSheet("Shipments", ["id","orderId","invoiceId","items","photos","inserts","notes","packagedAt","shippedAt","createdBy","createdAt","updatedAt"]);
  // Slice 7 (Calendar): STANDALONE calendar events — persisted rows with full CRUD.
  // LINKED calendar events (invoice dues, task dues, batch cure, releases, settlements)
  // are computed CLIENT-SIDE from existing sheets and have NO storage here. date/endDate
  // are YYYY-MM-DD JST strings (app-wide convention — no timezone math server-side).
  // allDay = "true"/"" (v1 all-day). linkType/linkId = optional soft entity ref
  // (e.g. invoice/inv-123). status ∈ {active, done, cancelled}.
  ensureSheet("Events", ["id","type","title","date","endDate","allDay","note","link","linkType","linkId","workspace","status","createdBy","createdAt","updatedAt"]);
  // Slice 7 (Social planner, under Brand): social posts, draft → scheduled → posted.
  // platform is a FREE STRING (owner hasn't fixed the platform list — adding platforms
  // needs no schema change). assetRef is a link/Drive-ref string (media upload rides
  // the existing uploadFile action later). scheduledAt/postedAt are JST datetimes;
  // a post cannot become status=posted without postedAt (applyUpdateGuards_ defaults
  // it to JST today). voiceChecked = "true"/"" (client voice-check passed at save).
  ensureSheet("SocialPosts", ["id","platform","caption","assetRef","assetType","scheduledAt","postedAt","status","workspace","campaign","linkUrl","voiceChecked","createdBy","createdAt","updatedAt"]);
}

function logActivity(action, itemType, itemId, itemName, detail, userId, userName) {
  try {
    var sheet = getSheet("ActivityLog");
    if (!sheet) return;
    var id = "log-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    var ts = new Date().toISOString();
    sheet.appendRow([id, action, itemType || "", itemId || "", itemName || "", detail || "", userId || "", userName || "", ts]);
  } catch(ex) { /* non-fatal: never crash caller */ }
}

// --- Concurrency: script lock for mutating actions ---
// Wraps sheet-mutating request handlers. nextId() (max+1 scan) and updateRow()
// (read-modify-write) are not safe under concurrent writes — two simultaneous
// creates can mint the same id, two updates can lose one. Scope is kept tight:
// acquired AFTER auth, released in finally. On timeout returns a JSON error the
// client can retry on. Heartbeat/presence is deliberately NOT locked (per-user
// row-scoped; queuing it behind data writes would add latency for no safety).
function withScriptLock_(fn) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return jsonResponse({ error: "busy, retry" });
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// --- batchList cache (sharded) ---
// CacheService caps values at ~100KB. The old single-key put silently threw and
// was swallowed, so every 2-min poll did 16 full-sheet reads. The payload is now
// trimmed (Products.description/metafields stripped) and sharded into chunks of
// BATCH_CACHE_CHUNK_CHARS chars stored as batchList_0..n-1 plus batchList_meta
// (chunk count). 30K chars keeps each chunk under ~90KB even if every char is a
// 3-byte UTF-8 sequence (Japanese text is common in this data).
var BATCH_CACHE_CHUNK_CHARS = 30 * 1024;
var BATCH_CACHE_MAX_CHUNKS = 30; // invalidation sweep bound (~900KB payload ceiling)
var BATCH_CACHE_TTL_SECONDS = 60;

function batchCachePut_(payload) {
  try {
    var cache = CacheService.getScriptCache();
    var chunks = [];
    for (var i = 0; i < payload.length; i += BATCH_CACHE_CHUNK_CHARS) {
      chunks.push(payload.substring(i, i + BATCH_CACHE_CHUNK_CHARS));
    }
    if (chunks.length === 0) chunks.push("");
    if (chunks.length > BATCH_CACHE_MAX_CHUNKS) {
      console.error("batchList cache: payload too large to shard (" + payload.length + " chars) — skipping cache");
      return;
    }
    var kv = {};
    chunks.forEach(function (c, idx) { kv["batchList_" + idx] = c; });
    cache.putAll(kv, BATCH_CACHE_TTL_SECONDS);
    // Meta written LAST so a concurrent reader never sees meta without chunks.
    cache.put("batchList_meta", String(chunks.length), BATCH_CACHE_TTL_SECONDS);
  } catch (ex) {
    console.error("batchList cache write failed: " + ex);
  }
}

function batchCacheGet_() {
  try {
    var cache = CacheService.getScriptCache();
    var meta = cache.get("batchList_meta");
    if (!meta) return null;
    var count = parseInt(meta, 10);
    if (!count || count < 1 || count > BATCH_CACHE_MAX_CHUNKS) return null;
    var keys = [];
    for (var i = 0; i < count; i++) keys.push("batchList_" + i);
    var got = cache.getAll(keys);
    var parts = [];
    for (var j = 0; j < count; j++) {
      var part = got["batchList_" + j];
      if (part === undefined || part === null) return null; // partial eviction — treat as miss
      parts.push(part);
    }
    return parts.join("");
  } catch (ex) {
    console.error("batchList cache read failed: " + ex);
    return null;
  }
}

function invalidateBatchListCache_() {
  try {
    var cache = CacheService.getScriptCache();
    var keys = ["batchList", "batchList_meta"]; // "batchList" = legacy single key
    for (var i = 0; i < BATCH_CACHE_MAX_CHUNKS; i++) keys.push("batchList_" + i);
    cache.removeAll(keys);
  } catch (ex) {
    console.error("batchList cache invalidate failed: " + ex);
  }
}

// Products rows for the batchList snapshot: strip description (HTML, can be
// huge) and metafields (JSON blob) — the dashboard list views don't need them,
// and they were the main reason the payload blew the cache cap. Detail views
// fetch them via ?action=list&sheet=Products, which is untouched.
function getProductsForBatch_() {
  return getAllRows("Products").map(function (row) {
    var slim = {};
    Object.keys(row).forEach(function (k) {
      if (k === "description" || k === "metafields") return;
      slim[k] = row[k];
    });
    return slim;
  });
}

// Windowed ActivityLog read: the sheet grows forever; reading all of it on
// every poll gets slower every day. Read only the last `limit` data rows.
// Returns newest-first (same order as the old slice(-100).reverse()).
function getRecentActivities_(limit) {
  var sheet = getSheet("ActivityLog");
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var count = Math.min(limit, lastRow - 1); // guard: fewer rows than limit
  var startRow = lastRow - count + 1;
  var data = sheet.getRange(startRow, 1, count, lastCol).getValues();
  var rows = [];
  for (var i = data.length - 1; i >= 0; i--) {
    rows.push(rowToObj(headers, data[i]));
  }
  return rows;
}

// Run the sheet/column ensure pass ONCE per deployment instead of on every
// request (it was costing 9+ header-row reads per request). Gated by a
// PropertiesService flag. To force a re-run after adding new sheets/columns:
// bump the flag version in a redeploy, delete the property in the Apps
// Script editor, or hit ?action=ensureSheets.
// V2: adds Orders.contactId + Tasks.entityType/entityId (Phase A) — the bump
// forces one ensure pass on the first request after this deploy.
// V3 (Slice 2 / Sell): adds Orders.orderSource + Orders.archived, Invoices.settlement,
// and two new sheets — VenueReports + Shipments. The bump forces one ensure pass on
// the first request post-deploy. Ivy/chat/BrainKB sheets have their own lifecycle and
// are untouched by this flag.
// V4 (Slices 4+5 / Make + Brand): adds three new sheets — Ingredients (ing-),
// Recipes (rcp-), BrandConcept (bc-) — plus six SoapBatches lock columns
// (recipeId/recipeVersion/formulaSnapshot/costSnapshot/qtyProduced/dateMade).
// Ivy/chat/BrainKB untouched; all existing endpoints unaffected.
// V5 (Slice 7 / Calendar + Social planner): adds two new sheets — Events (evt-,
// standalone calendar events) + SocialPosts (spost-, social planner). LINKED
// calendar events are client-computed projections and add no storage. Ivy/chat/
// BrainKB untouched; all existing endpoints unaffected.
var SHEETS_ENSURED_FLAG = "SHEETS_ENSURED_V5";

function ensureSheetsOnce_() {
  try {
    var props = PropertiesService.getScriptProperties();
    if (props.getProperty(SHEETS_ENSURED_FLAG) === "true") return;
    ensureActivityAndPresenceSheets();
    props.setProperty(SHEETS_ENSURED_FLAG, "true");
  } catch (ex) {
    console.error("ensureSheetsOnce_ failed: " + ex);
  }
}

// --- Web App Endpoints ---

// ===================== REQUEST AUTHENTICATION =====================
// Verifies the caller's Firebase ID token against the email allowlist.
//
// ROLLOUT (fail-safe): enforcement is OFF until the Script Property
// REQUIRE_AUTH === "true". With it off, requests are never blocked — the
// backend behaves exactly as before — so deploying this code changes nothing
// until you opt in. Before flipping REQUIRE_AUTH on, also set FIREBASE_API_KEY
// (the Firebase Web API key) as a Script Property, and re-run/redeploy so the
// script is authorized for external UrlFetch calls. Test with the live app,
// confirm both users can still load data, THEN set REQUIRE_AUTH = "true".
var AUTH_ALLOWED_EMAILS = ["taka@ivycoast.co", "yoko@ivycoast.co"];

function authEnforced_() {
  return PropertiesService.getScriptProperties().getProperty("REQUIRE_AUTH") === "true";
}

// Returns { ok: true, email } or { ok: false, reason }. Verifies the token via
// Google's Identity Toolkit (accounts:lookup), which rejects forged/expired
// tokens, then checks the email allowlist. Results are cached briefly by token.
function verifyIdToken_(idToken) {
  if (!idToken) return { ok: false, reason: "missing token" };
  var apiKey = PropertiesService.getScriptProperties().getProperty("FIREBASE_API_KEY");
  if (!apiKey) return { ok: false, reason: "server not configured (FIREBASE_API_KEY)" };

  var cache = CacheService.getScriptCache();
  var cacheKey;
  try {
    cacheKey = "auth:" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, idToken));
    var hit = cache.get(cacheKey);
    if (hit) {
      if (hit.charAt(0) === "+") return { ok: true, email: hit.substring(1) };
      return { ok: false, reason: hit.substring(1) };
    }
  } catch (e) { cacheKey = null; }

  var result;
  try {
    var resp = UrlFetchApp.fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey), {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ idToken: idToken }),
      muteHttpExceptions: true
    });
    var data = JSON.parse(resp.getContentText());
    if (resp.getResponseCode() !== 200 || !data.users || !data.users.length) {
      result = { ok: false, reason: "invalid or expired token" };
    } else {
      var email = String(data.users[0].email || "").toLowerCase();
      if (AUTH_ALLOWED_EMAILS.indexOf(email) === -1) result = { ok: false, reason: "not allowlisted" };
      else result = { ok: true, email: email };
    }
  } catch (err) {
    return { ok: false, reason: "verification error: " + err.message }; // do not cache transient errors
  }

  if (cacheKey) {
    try { cache.put(cacheKey, (result.ok ? "+" + result.email : "-" + result.reason), 300); } catch (e) {}
  }
  return result;
}

// Gate helper: returns a jsonResponse error to short-circuit, or null to proceed.
function authGate_(idToken) {
  if (!authEnforced_()) return null;
  var v = verifyIdToken_(idToken);
  if (!v.ok) return jsonResponse({ error: "Unauthorized: " + v.reason });
  return null;
}

function doGet(e) {
  ensureSheetsOnce_();
  var _authErr = authGate_(e && e.parameter ? e.parameter.idToken : "");
  if (_authErr) return _authErr;
  var action = (e.parameter && e.parameter.action) || "list";
  var sheetName = (e.parameter && e.parameter.sheet) || "Tasks";
  // Admin: force the full ensure pass (needed after adding sheets/columns).
  if (action === "ensureSheets") {
    try {
      ensureActivityAndPresenceSheets();
      PropertiesService.getScriptProperties().setProperty(SHEETS_ENSURED_FLAG, "true");
      return jsonResponse({ success: true, ensured: true });
    } catch (ex) {
      return jsonResponse({ success: false, error: ex.message });
    }
  }
  // Diagnostic: list the Gemini models this API key can actually use (names that
  // support generateContent). Lets us pick a valid GEMINI_MODEL without guessing.
  if (action === "geminiModels") {
    try {
      var gkey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
      if (!gkey) return jsonResponse({ error: "GEMINI_API_KEY not set" });
      var mResp = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + encodeURIComponent(gkey) + "&pageSize=100", { muteHttpExceptions: true });
      var mData = JSON.parse(mResp.getContentText());
      var usable = (mData.models || []).filter(function (m) {
        return (m.supportedGenerationMethods || []).indexOf("generateContent") !== -1;
      }).map(function (m) { return m.name.replace("models/", ""); });
      return jsonResponse({ current: (PropertiesService.getScriptProperties().getProperty("GEMINI_MODEL") || "gemini-2.0-flash (default)"), usable: usable });
    } catch (ex) {
      return jsonResponse({ error: ex.message });
    }
  }
  // Batch endpoint: return all data in one request (cached 60s, sharded).
  // NOTE: Products rows here EXCLUDE description/metafields (see getProductsForBatch_).
  if (action === "batchList") {
    var cached = batchCacheGet_();
    if (cached) {
      return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    }
    var payload = JSON.stringify({
      tasks: getAllRows("Tasks"),
      contacts: getAllRows("Contacts"),
      products: getProductsForBatch_(),
      orders: getAllRows("Orders"),
      customers: getAllRows("Customers"),
      invoices: getAllRows("Invoices"),
      receipts: getAllRows("Receipts"),
      partnerStock: getAllRows("PartnerStock"),
      contactDocuments: getAllRows("ContactDocuments"),
      people: getAllRows("People"),
      contactNotes: getAllRows("ContactNotes"),
      contactInteractions: getAllRows("ContactInteractions"),
      contactActivityLog: getAllRows("ContactActivityLog"),
      soapBatches: getAllRows("SoapBatches"),
      productMeta: getAllRows("ProductMeta"),
      venueReports: getAllRows("VenueReports"),
      shipments: getAllRows("Shipments"),
      ingredients: getAllRows("Ingredients"),
      recipes: getAllRows("Recipes"),
      brandConcept: getAllRows("BrandConcept"),
      events: getAllRows("Events"),
      socialPosts: getAllRows("SocialPosts"),
      activities: getRecentActivities_(100)
    });
    batchCachePut_(payload);
    return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "list") {
    // ActivityLog: windowed read of only the last 100 rows (sheet grows forever)
    if (sheetName === "ActivityLog") {
      return jsonResponse({ activities: getRecentActivities_(100) });
    }
    var keyMap = { "Contacts": "contacts", "Products": "products", "Orders": "orders", "Customers": "customers", "Invoices": "invoices", "Receipts": "receipts", "PartnerStock": "partnerStock", "ContactDocuments": "contactDocuments", "People": "people", "ContactNotes": "contactNotes", "ContactInteractions": "contactInteractions", "ContactActivityLog": "contactActivityLog", "SoapBatches": "soapBatches", "ProductMeta": "productMeta", "VenueReports": "venueReports", "Shipments": "shipments", "Ingredients": "ingredients", "Recipes": "recipes", "BrandConcept": "brandConcept", "Events": "events", "SocialPosts": "socialPosts" };
    var key = keyMap[sheetName] || "tasks";
    var result = {};
    result[key] = getAllRows(sheetName);
    return jsonResponse(result);
  }
  return jsonResponse({ error: "Unknown action" });
}

function doPost(e) {
  ensureSheetsOnce_();

  // Detect Shopify webhook (has X-Shopify-Topic header or order_number field without action)
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return jsonResponse({ error: "Invalid JSON body" }); }

  // Shopify webhook: payload has order_number but no action field. Exempt from the
  // auth gate (Shopify can't send a token) — safe because the handler is a no-op.
  if (!body.action && body.order_number !== undefined) {
    return handleShopifyWebhook(body);
  }

  var _authErr = authGate_(body.idToken);
  if (_authErr) return _authErr;

  // ── Ivy chat (Gemini). MANDATORY auth — this endpoint spends API money, so the
  // token is verified even when REQUIRE_AUTH is off (unlike authGate_ above, which
  // is a no-op until that property is "true"). When FIREBASE_API_KEY is unset this
  // returns "server not configured" — intended: chat stays off until it exists.
  // Placed BEFORE the CRUD lock block: the external Gemini call can take many
  // seconds and must never hold or wait on the script lock.
  if (body.action === "chat") {
    var v = verifyIdToken_(body.idToken);
    if (!v.ok) return jsonResponse({ error: "chat requires sign-in: " + v.reason });
    return handleIvyChat_(body);
  }

  // ── Ivy knowledge pack write — MANDATORY auth (like chat): brainSet overwrites
  // the knowledge injected into every Gemini system prompt, so it must not be
  // writable unauthenticated even while REQUIRE_AUTH is off (Halle M1, 2026-07-13). ──
  if (body.action === "brainSet") {
    var bv = verifyIdToken_(body.idToken);
    if (!bv.ok) return jsonResponse({ error: "brainSet requires sign-in: " + bv.reason });
    return handleBrainSet_(body);
  }

  var action = body.action;
  var sheetName = body.sheet || "Tasks";
  var itemKeyMap = { "Contacts": "contact", "Products": "product", "Orders": "order", "Customers": "customer", "Invoices": "invoice", "Receipts": "receipt", "PartnerStock": "stock", "ContactDocuments": "document", "People": "person", "ContactNotes": "contactNote", "ContactInteractions": "contactInteraction", "ContactActivityLog": "contactActivity", "SoapBatches": "soapBatch", "ProductMeta": "productMeta", "VenueReports": "venueReport", "Shipments": "shipment", "Ingredients": "ingredient", "Recipes": "recipe", "BrandConcept": "brandConcept", "Events": "event", "SocialPosts": "socialPost" };
  var itemKey = itemKeyMap[sheetName] || "task";
  var item = body[itemKey] || body.task || body.contact || body.invoice || body.receipt || {};
  var userId = body.userId || "";
  var userName = body.userName || "";
  var iType = SHEET_TO_ITEM_TYPE[sheetName] || "task";

  // Mutating CRUD actions run under the script lock: nextId() and updateRow()
  // are read-modify-write and unsafe under concurrent requests. The batchList
  // cache is invalidated AFTER the write, inside the lock, so the next poll
  // rebuilds from post-write data.
  if (action === "create" || action === "update" || action === "delete") {
    return withScriptLock_(function () {
      if (action === "create") {
        applyCreateDefaults_(sheetName, item, userName);
        var created = createRow(sheetName, item);
        invalidateBatchListCache_();
        logActivity("created", iType, created.id, created.name || created.invoiceNumber || created.receiptNumber || created.title || "", "", userId, userName);
        var res = {};
        res[itemKey] = created;
        return jsonResponse(res);
      }
      if (action === "update") {
        applyUpdateGuards_(sheetName, item, userName);
        var updated = updateRow(sheetName, item);
        if (!updated) return jsonResponse({ error: itemKey + " not found" });
        invalidateBatchListCache_();
        logActivity("updated", iType, updated.id, updated.name || updated.invoiceNumber || updated.receiptNumber || updated.title || "", "", userId, userName);
        var res2 = {};
        res2[itemKey] = updated;
        return jsonResponse(res2);
      }
      // delete
      var ok = deleteRow(sheetName, body.id);
      invalidateBatchListCache_();
      logActivity("deleted", iType, body.id, body.itemName || "", "", userId, userName);
      return jsonResponse({ success: ok });
    });
  }

  // Settlement generation (Slice 2 / Sell). IRREVERSIBLE: creates an STL- invoice row
  // + mutates PartnerStock, so it runs under the script lock (nextId + updateRow are
  // read-modify-write). The frontend gates this behind a confirm dialog (server writes
  // are not auto-undoable). Auth: inherits authGate_ above; consistent with other
  // state-changing endpoints.
  if (action === "generateSettlement") {
    return withScriptLock_(function () {
      return handleGenerateSettlement_(body);
    });
  }

  // Batch lock (Slice 4 / Make). IRREVERSIBLE by design: writes an IMMUTABLE
  // formula + cost snapshot onto a SoapBatches row (OWNER DECISION #3). Runs under
  // the script lock — it reads current Ingredients prices + the recipe, computes
  // the snapshot server-side, and must not race a concurrent price edit or create.
  if (action === "lockBatch") {
    return withScriptLock_(function () {
      return handleLockBatch_(body);
    });
  }

  // Shopify custom actions. NOT wrapped in the script lock: they can run for
  // minutes (paginated API calls) and would starve CRUD writes waiting on the
  // lock. They do invalidate the batchList cache so synced data is visible.
  if (action === "syncProducts") {
    var count = syncShopifyProducts();
    invalidateBatchListCache_();
    logActivity("synced", "product", "", "", count + " products synced", "system", "Shopify");
    return jsonResponse({ success: true, synced: count });
  }
  if (action === "syncOrders") {
    var count2 = syncShopifyOrders();
    invalidateBatchListCache_();
    logActivity("synced", "order", "", "", count2 + " orders synced", "system", "Shopify");
    return jsonResponse({ success: true, synced: count2 });
  }
  if (action === "updateInventory") {
    var result3 = updateShopifyInventory(body.inventoryItemId, body.locationId, body.quantity);
    if (result3.success) {
      invalidateBatchListCache_();
      logActivity("updated", "product", body.inventoryItemId || "", "", "qty=" + body.quantity, userId, userName);
    }
    return jsonResponse(result3);
  }
  if (action === "syncCustomers") {
    var count3 = syncCustomers();
    invalidateBatchListCache_();
    logActivity("synced", "customer", "", "", count3 + " customers synced", "system", "Shopify");
    return jsonResponse({ success: true, synced: count3 });
  }

  if (action === "uploadFile") {
    var result4 = uploadFileToDrive(body.fileName, body.mimeType, body.base64Data);
    if (result4.success) {
      logActivity("uploaded", "file", result4.fileId || "", body.fileName || "", "", userId, userName);
    }
    return jsonResponse(result4);
  }

  // Fetch OG metadata from a URL
  if (action === "fetchOgImage") {
    var targetUrl = body.url;
    if (!targetUrl) return jsonResponse({ success: false, error: "Missing url" });
    try {
      var ogResp = UrlFetchApp.fetch(targetUrl, { muteHttpExceptions: true, followRedirects: true });
      var html = ogResp.getContentText();
      var ogImage = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || [])[1] || "";
      var ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || [])[1] || "";
      var ogDescription = (html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) || [])[1] || "";
      if (!ogImage) ogImage = (html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) || [])[1] || "";
      if (!ogTitle) ogTitle = (html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) || [])[1] || "";
      if (!ogTitle) ogTitle = (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || "";
      return jsonResponse({ success: true, ogImage: ogImage, ogTitle: ogTitle, ogDescription: ogDescription });
    } catch(ogErr) {
      return jsonResponse({ success: false, error: ogErr.message });
    }
  }

  // Heartbeat / Presence: one read of the sheet, in-memory diff, write only
  // cells that changed, and build the response from the in-memory data (no
  // trailing re-read). Deliberately NOT under the script lock — it's per-user
  // row-scoped and fires every 45s per client; queuing it behind data writes
  // would add latency for no safety benefit.
  if (action === "heartbeat") {
    var presenceList = [];
    var presenceSheet = getSheet("Presence");
    if (presenceSheet) {
      var email = body.email || "";
      var nowIso = new Date().toISOString();
      var pData = presenceSheet.getDataRange().getValues();
      var pHeaders = pData.length > 0 ? pData[0] : ["email", "lastActive", "currentTab", "photoUrl"];
      var found = false;
      for (var pi = 1; pi < pData.length; pi++) {
        if (String(pData[pi][0]) === email) {
          found = true;
          // lastActive always changes
          presenceSheet.getRange(pi + 1, 2).setValue(nowIso);
          pData[pi][1] = nowIso;
          var newTab = body.currentTab || "";
          if (String(pData[pi][2]) !== newTab) {
            presenceSheet.getRange(pi + 1, 3).setValue(newTab);
            pData[pi][2] = newTab;
          }
          if (body.photoUrl && String(pData[pi][3]) !== String(body.photoUrl)) {
            presenceSheet.getRange(pi + 1, 4).setValue(body.photoUrl);
            pData[pi][3] = body.photoUrl;
          }
          break;
        }
      }
      if (!found) {
        var newPresenceRow = [email, nowIso, body.currentTab || "", body.photoUrl || ""];
        presenceSheet.appendRow(newPresenceRow);
        pData.push(newPresenceRow);
      }
      for (var pj = 1; pj < pData.length; pj++) {
        presenceList.push(rowToObj(pHeaders, pData[pj]));
      }
    }
    return jsonResponse({ success: true, presence: presenceList });
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
    var fileUrl = "https://lh3.googleusercontent.com/d/" + fileId;
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

// HARD RULE: never auto-create invoices. A Shopify webhook previously generated
// ~37K duplicate invoice rows, so auto-creation is permanently disabled. This
// handler only acknowledges the webhook (so Shopify stops retrying) and writes
// nothing to the Invoices sheet. Do NOT re-enable invoice creation here.
function handleShopifyWebhook(order) {
  // This endpoint is reachable unauthenticated (Shopify can't send a token), so
  // sanitize the only attacker-controlled value before it touches the log.
  var orderNumber = String((order && order.order_number) || "").replace(/[^\w\-]/g, "").substring(0, 32);
  logActivity("received", "order", "", "Shopify order #" + orderNumber, "Webhook received — auto-invoice creation disabled", "system", "Shopify");
  return jsonResponse({ success: true, skipped: "auto-invoice creation disabled" });
}

// ===================== IVY CHAT (Gemini) =====================
// In-app AI assistant for Taka & Yoko. PRIVACY: message content is deliberately
// never logged (no logActivity, no console output of message text).
// Vendor decision 2026-07-13 (Taka): Gemini, not Claude — native to the Google
// stack the app already runs on (Sheets/Apps Script/Drive), native embeddings
// (text-embedding-004) + NotebookLM for the future smart-retrieval layer, cheaper
// per call, and the app's original vision. Billing enabled on the Google project.

var IVY_SYSTEM_PROMPT = "You are Ivy, the internal AI assistant inside the Ivycoast Hub, serving exactly two users: Taka and Yoko Imoto, founders of IVYCOAST (premium handmade CBD soaps & soy candles, brand of Boldoath Inc., Japan). Answer from the IVYCOAST KNOWLEDGE section; when the knowledge doesn't cover something, say so plainly rather than guessing. Mirror the user's language (Japanese ↔ English). Be concise and practical. Use Markdown for structure (short bold labels, bullet lists) when it aids readability. Money/legal answers: cite the source note when the knowledge provides one. Never invent prices, terms, or partner details.\n\nFOCUS: Answer ONLY the user's most recent message. Use earlier turns for context only when the new message clearly refers back to them (e.g. 'and the candle?'). NEVER restate or fold in your answers to earlier, unrelated questions from the conversation.\n\nSOURCES — READ CAREFULLY: The KNOWLEDGE ends with a '## 10. Sources (for citation)' section listing real Drive document links. You MUST cite using those links. FORBIDDEN: writing citations in prose such as '(Source: Master Knowledge Pack, Sections 2, 3, 4)' or naming sections/version numbers — never do this. REQUIRED: when your answer draws on the knowledge, end with one line that starts 'Sources:' (or in Japanese 'ソース:') followed by 1-3 Markdown hyperlinks copied VERBATIM from section 10, e.g. 'Sources: [Kurkku Fields Market Invoice](https://docs.google.com/spreadsheets/d/18JLd3U6QQOXp1yfW4wLNnGJVbn9qzRV6FE81YoYSP4Y/edit)'. Rules: (1) copy the full URL exactly as it appears in section 10 — NEVER invent, guess, shorten, or modify a URL; (2) pick the documents tied to the section(s) you actually used; (3) these are document-level references, so do not claim a specific line came from a specific file; (4) if your answer used no knowledge (small talk, or 'I do not have that'), omit the Sources line entirely.";

// body.messages = [{ role: "user"|"assistant", text }] — capped server-side to the
// last 20 messages, each trimmed to 4000 chars (client sends the same shape, but
// never trust client-side caps).
function handleIvyChat_(body) {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty("GEMINI_API_KEY");
  if (!key) return jsonResponse({ error: "server not configured (GEMINI_API_KEY)" });
  var model = props.getProperty("GEMINI_MODEL") || "gemini-flash-latest";

  var msgs = (body.messages && Object.prototype.toString.call(body.messages) === "[object Array]") ? body.messages : [];
  msgs = msgs.slice(-12);
  var contents = [];
  for (var i = 0; i < msgs.length; i++) {
    var m = msgs[i] || {};
    var text = String(m.text || "").substring(0, 4000);
    if (!text) continue;
    contents.push({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: text }] });
  }
  if (contents.length === 0) return jsonResponse({ error: "no messages" });

  var brain = getBrainText_();
  var sys = IVY_SYSTEM_PROMPT + "\n\n=== IVYCOAST KNOWLEDGE ===\n" +
    (brain || "(knowledge pack not yet loaded — tell the user plainly when they ask for company specifics you don't have)");

  var payload = {
    systemInstruction: { parts: [{ text: sys }] },
    contents: contents,
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
  };

  // Transient overloads (429 rate-limit, 500/503 model-busy) are common on the
  // shared Gemini tier — retry the primary model with backoff, then try an
  // optional fallback model once (set GEMINI_MODEL_FALLBACK to enable).
  var urlBase = "https://generativelanguage.googleapis.com/v1beta/models/";
  var urlTail = ":generateContent?key=" + encodeURIComponent(key);
  var fallbackModel = props.getProperty("GEMINI_MODEL_FALLBACK") || "";
  var modelsToTry = [model];
  if (fallbackModel && fallbackModel !== model) modelsToTry.push(fallbackModel);

  var code = 0, respText = "";
  for (var mi = 0; mi < modelsToTry.length && code !== 200; mi++) {
    var attempts = mi === 0 ? 3 : 1; // retry primary a few times; fallback once
    for (var a = 0; a < attempts; a++) {
      try {
        var resp = UrlFetchApp.fetch(urlBase + encodeURIComponent(modelsToTry[mi]) + urlTail, {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });
        code = resp.getResponseCode();
        respText = resp.getContentText();
      } catch (err) {
        code = 0; respText = "fetch failed: " + err.message;
      }
      if (code === 200) break;
      if (code === 429 || code === 500 || code === 503 || code === 0) {
        Utilities.sleep(700 * (a + 1)); // 0.7s, 1.4s, 2.1s
        continue;
      }
      break; // non-transient error — stop retrying this model
    }
  }
  if (code !== 200) {
    if (code === 429 || code === 500 || code === 503 || code === 0) {
      return jsonResponse({ error: "Ivy's AI service is busy right now — give it a few seconds and ask again.", retryable: true });
    }
    return jsonResponse({ error: "Ivy hit a problem (error " + code + "). Try again, and let Taka know if it keeps happening." });
  }
  try {
    var data = JSON.parse(respText);
    var parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
    var reply = parts.map(function (p) { return p.text || ""; }).join("");
    if (!reply) return jsonResponse({ error: "Gemini returned no text (finishReason: " + (((data.candidates || [])[0] || {}).finishReason || "unknown") + ")" });
    return jsonResponse({ reply: reply });
  } catch (e2) {
    return jsonResponse({ error: "Gemini parse error: " + e2.message });
  }
}

// ── Knowledge pack ("brain") storage: BrainKB sheet, one ≤45K-char chunk per row ──
// (Sheets caps a cell at 50K chars; 45K leaves margin.)
var BRAIN_CACHE_KEY = "brainText";
var BRAIN_CACHE_TTL_SECONDS = 1800;
var BRAIN_CHUNK_CHARS = 45000;
// CacheService caps a value at ~100KB (bytes). Japanese text is up to 3 bytes/char,
// so skip caching when the joined text is large enough to risk the cap.
var BRAIN_CACHE_MAX_CHARS = 90 * 1024;

// Replace the entire knowledge pack. Rare admin write — small and fast, so it
// does not take the script lock (and must not queue behind long syncs).
function handleBrainSet_(body) {
  var text = String(body.text || "");
  var sheet = ensureSheet("BrainKB", ["chunk"]);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  var chunks = [];
  for (var i = 0; i < text.length; i += BRAIN_CHUNK_CHARS) {
    chunks.push([text.substring(i, i + BRAIN_CHUNK_CHARS)]);
  }
  if (chunks.length > 0) {
    sheet.getRange(2, 1, chunks.length, 1).setValues(chunks);
  }
  try { CacheService.getScriptCache().remove(BRAIN_CACHE_KEY); } catch (e) {}
  return jsonResponse({ success: true, chunks: chunks.length });
}

// Read the knowledge pack: cache-first (TTL 30 min), else BrainKB col A joined.
// Returns "" when the sheet is missing/empty — chat still works without a brain.
function getBrainText_() {
  try {
    var hit = CacheService.getScriptCache().get(BRAIN_CACHE_KEY);
    if (hit) return hit;
  } catch (e) {}
  var sheet = getSheet("BrainKB");
  if (!sheet) return "";
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return "";
  var vals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var parts = [];
  for (var i = 0; i < vals.length; i++) {
    var v = String(vals[i][0] || "");
    if (v) parts.push(v);
  }
  var joined = parts.join("\n");
  if (joined.length <= BRAIN_CACHE_MAX_CHARS) {
    try { CacheService.getScriptCache().put(BRAIN_CACHE_KEY, joined, BRAIN_CACHE_TTL_SECONDS); } catch (e) {}
  }
  return joined;
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

// ===================== SETTLEMENT ENGINE (Slice 2 / Sell) =====================
// A settlement is a regular Invoices-sheet row (reusing the invoice plumbing/PDF/
// ledger) distinguished by an STL- invoiceNumber and a populated `settlement` JSON
// column. It is NEVER minted through the normal client invoice path — it is created
// server-side by handleGenerateSettlement_ so the split math and STL- numbering are
// authoritative and race-safe (runs under the script lock). This does NOT reimplement
// the client invoice money math (saveInvoice); it is a separate document type whose
// only "math" is the consignment split, which is business-critical and lives here.

// Mint the next STL-YYYY-NNN number on its own sequence (scans the Invoices
// invoiceNumber column for STL- rows only). Mirrors generateInvoiceNumber_.
function generateSettlementNumber_() {
  var sheet = getSheet("Invoices");
  var year = String(new Date().getFullYear());
  if (!sheet || sheet.getLastRow() < 2) return "STL-" + year + "-001";
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var numCol = headers.indexOf("invoiceNumber");
  if (numCol === -1) return "STL-" + year + "-001";
  var maxSeq = 0;
  for (var i = 1; i < data.length; i++) {
    var num = String(data[i][numCol] || "");
    if (num.indexOf("STL-" + year) === 0) {
      var seq = parseInt(num.split("-")[2], 10) || 0;
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  var next = String(maxSeq + 1);
  while (next.length < 3) next = "0" + next;
  return "STL-" + year + "-" + next;
}

// Port of the concept's computeSplits VERBATIM: every party gets Math.ceil(gross*pct/100),
// and the LAST party (the venue) absorbs the rounding remainder so the amounts sum to
// `gross` exactly. `parties` = [{party, pct}, ...] with the venue LAST.
// Returns [{party, pct, amt}, ...].
function computeSplits_(gross, parties) {
  gross = Math.round(Number(gross) || 0);
  var out = [];
  var runningNonLast = 0;
  for (var i = 0; i < parties.length; i++) {
    var pct = Number(parties[i].pct) || 0;
    var amt;
    if (i < parties.length - 1) {
      amt = Math.ceil(gross * pct / 100);
      runningNonLast += amt;
    } else {
      amt = gross - runningNonLast; // venue absorbs remainder → splits sum to gross exactly
    }
    out.push({ party: parties[i].party, pct: pct, amt: amt });
  }
  return out;
}

// Derive the split parties from the venue contact's stored contract terms
// (OWNER DECISION #1): venue keeps `consignmentPercent`, connector takes
// `connectorFeePercent`, Ivycoast = 100 − consignmentPercent − connectorFeePercent.
// Venue is LAST (absorbs rounding). Direct consignment (no connector) = 2-party
// (OWNER DECISION #5), discriminated by vendorRelation/connectorId.
// `override` (optional) = { ivyPct, connectorPct, venuePct } — when provided, those
// values are used AND stored on the settlement record (OWNER DECISION #4a).
function settlementParties_(venueContact, allContacts, override) {
  var venueName = venueContact.company || venueContact.name || "Venue";
  var consignmentPct = Number(venueContact.consignmentPercent) || 0;
  var connectorFeePct = Number(venueContact.connectorFeePercent) || 0;
  var connectorId = String(venueContact.connectorId || "");
  var relation = String(venueContact.vendorRelation || "");

  // Resolve connector name from connectorId, if any.
  var connectorName = "";
  var hasConnector = !!connectorId && connectorFeePct > 0 && relation.indexOf("connector") !== -1;
  // Fallback: even if relation string is unset, a connectorId + fee implies via-connector.
  if (!hasConnector && connectorId && connectorFeePct > 0) hasConnector = true;
  if (hasConnector) {
    for (var i = 0; i < allContacts.length; i++) {
      if (String(allContacts[i].id) === connectorId) {
        connectorName = allContacts[i].company || allContacts[i].name || "Connector";
        break;
      }
    }
    if (!connectorName) connectorName = "Connector";
  }

  // Percentages: override wins when supplied (stored on the record for history).
  var venuePct = (override && override.venuePct != null) ? Number(override.venuePct) : consignmentPct;
  var connectorPct = (override && override.connectorPct != null) ? Number(override.connectorPct) : (hasConnector ? connectorFeePct : 0);
  var ivyPct = (override && override.ivyPct != null) ? Number(override.ivyPct) : (100 - venuePct - connectorPct);

  var parties = [{ party: "Ivycoast", pct: ivyPct }];
  if (connectorPct > 0) parties.push({ party: connectorName || "Connector", pct: connectorPct });
  parties.push({ party: venueName, pct: venuePct }); // venue LAST → absorbs remainder
  return parties;
}

// generateSettlement — server-authoritative, IRREVERSIBLE (creates an STL- invoice
// row + mutates PartnerStock). Runs inside the script lock (see doPost). Request:
//   { action:"generateSettlement", reportId, override?:{ivyPct,connectorPct,venuePct},
//     idToken, userId, userName }
// Steps: resolve report + venue contact → compute splits → create STL- invoice row →
// reconcile matching active PartnerStock (reserved/active → sold) → mark report settled.
function handleGenerateSettlement_(body) {
  var reportId = body.reportId;
  if (!reportId) return jsonResponse({ error: "missing reportId" });

  var reports = getAllRows("VenueReports");
  var report = null;
  for (var r = 0; r < reports.length; r++) {
    if (String(reports[r].id) === String(reportId)) { report = reports[r]; break; }
  }
  if (!report) return jsonResponse({ error: "report not found: " + reportId });
  if (String(report.status) === "settled") {
    return jsonResponse({ error: "report already settled (settlementInvoiceId=" + report.settlementInvoiceId + ")" });
  }

  var contacts = getAllRows("Contacts");
  var venueContact = null;
  for (var c = 0; c < contacts.length; c++) {
    if (String(contacts[c].id) === String(report.contactId)) { venueContact = contacts[c]; break; }
  }
  if (!venueContact) return jsonResponse({ error: "venue contact not found: " + report.contactId });

  // Parse report lines + gross.
  var lines = [];
  try { lines = report.lines ? JSON.parse(report.lines) : []; } catch (e) { lines = []; }
  if (Object.prototype.toString.call(lines) !== "[object Array]") lines = [];
  var gross = Number(report.gross);
  if (!gross) {
    gross = 0;
    lines.forEach(function (l) { gross += Number(l.amount) || 0; });
  }
  gross = Math.round(gross);
  // Guard: never settle a zero/blank-gross report. Settling would mint a ¥0 STL
  // invoice AND flip the report to "settled", permanently blocking a real settle
  // once the report is corrected. Money-critical → fail closed. (Halle, 2026-07-13)
  if (!(gross > 0)) {
    return jsonResponse({ error: "cannot settle: report gross is zero or blank (reportId=" + reportId + ")" });
  }

  // Compute splits from contract terms (+ optional per-settlement override, stored).
  var override = body.override || null;
  var parties = settlementParties_(venueContact, contacts, override);
  // Guard: percentages must be non-negative and sum to 100 (contract data or an
  // override can produce a negative Ivycoast share when venue+connector > 100, which
  // would silently mint a wrong split / negative due-from-venue). Fail closed so a
  // bad contract or typo can't create a wrong money document. (Halle, 2026-07-13)
  var pctSum = 0, pctBad = false;
  for (var pi = 0; pi < parties.length; pi++) {
    var p = Number(parties[pi].pct);
    if (!(p >= 0)) pctBad = true;
    pctSum += p;
  }
  if (pctBad || Math.round(pctSum) !== 100) {
    return jsonResponse({ error: "cannot settle: split percentages invalid (sum=" + pctSum + ", must be 100 with no negatives). Check the venue's consignment/connector terms or the override." });
  }
  var splits = computeSplits_(gross, parties);

  // Due from venue = everything NOT retained by the venue (venue is the last party).
  var venueAmt = splits[splits.length - 1].amt;
  var dueFromVenue = gross - venueAmt; // = ivyAmt + connectorAmt

  var venueName = venueContact.company || venueContact.name || "Venue";
  var period = String(report.period || "");
  var stlNumber = generateSettlementNumber_();
  var todayIso = new Date().toISOString().substring(0, 10);

  // itemsSold snapshot (for the statement) — normalize line shape.
  var itemsSold = lines.map(function (l) {
    var qty = Number(l.qty) || 0;
    var amt = Number(l.amount != null ? l.amount : l.amt) || 0;
    return { sku: l.sku || "", productName: l.productName || l.name || "", qty: qty, amt: amt };
  });

  var settlementJson = {
    reportId: report.id,
    period: period,
    gross: gross,
    splits: splits,
    dueFromVenue: dueFromVenue,
    itemsSold: itemsSold
  };

  // Build the STL invoice row. status "sent" = money requested from the venue; → "paid"
  // when remitted (via the normal invoice update path). Money-critical: `total` is the
  // amount owed BY the venue (dueFromVenue), matching the concept.
  var invItem = {
    invoiceNumber: stlNumber,
    contactId: report.contactId,
    contactName: venueName,
    contactCompany: venueContact.company || "",
    contactEmail: venueContact.email || "",
    invoiceDate: todayIso,
    dueDate: todayIso,
    items: JSON.stringify(itemsSold),
    subtotal: gross,
    discount: 0,
    shipping: 0,
    taxType: "included",
    tax: 0,
    total: dueFromVenue,
    pricingType: "consignment",
    status: "sent",
    workspace: venueContact.workspace || "",
    notes: "Consignment settlement for " + venueName + " · " + period,
    orderId: "",
    orderNumber: "",
    settlement: JSON.stringify(settlementJson)
  };

  // Create the STL invoice via the existing create path (NOT a parallel math path).
  var createdInvoice = createRow("Invoices", invItem);

  // Reconcile PartnerStock: match active/reserved rows for this venue to the sold lines
  // and flip them sold. Match by contactId + (sku OR productName). dateSold = period-30.
  var soldDate = period ? (period + "-01") : todayIso;
  var stock = getAllRows("PartnerStock");
  var reconciled = [];
  itemsSold.forEach(function (line) {
    var remaining = line.qty;
    for (var s = 0; s < stock.length && remaining > 0; s++) {
      var row = stock[s];
      if (String(row.contactId) !== String(report.contactId)) continue;
      var st = String(row.status);
      if (st !== "active" && st !== "reserved") continue;
      var skuMatch = line.sku && String(row.sku) && String(row.sku) === String(line.sku);
      var nameMatch = line.productName && String(row.productName) &&
        String(row.productName).toLowerCase() === String(line.productName).toLowerCase();
      if (!skuMatch && !nameMatch) continue;

      var have = Number(row.quantity) || 0;
      if (have <= 0) continue;
      var take = Math.min(have, remaining);
      var newQty = have - take;
      remaining -= take;
      var upd = { id: row.id, quantity: String(newQty), dateSold: soldDate };
      if (newQty <= 0) upd.status = "sold";
      updateRow("PartnerStock", upd);
      // Write the decrement back into the in-memory snapshot so a later report line
      // matching this same stock row sees the reduced quantity (prevents double-count).
      row.quantity = String(newQty);
      if (newQty <= 0) row.status = "sold";
      reconciled.push({ id: row.id, took: take, remaining: newQty });
    }
  });

  // Mark the report settled + link the STL invoice (bidirectional).
  updateRow("VenueReports", {
    id: report.id,
    status: "settled",
    settlementInvoiceId: createdInvoice.id
  });

  invalidateBatchListCache_();
  logActivity("settled", "venueReport", report.id, stlNumber,
    "gross ¥" + gross + " → due ¥" + dueFromVenue, body.userId || "", body.userName || "");

  return jsonResponse({
    success: true,
    invoice: createdInvoice,
    report: { id: report.id, status: "settled", settlementInvoiceId: createdInvoice.id },
    settlement: settlementJson,
    reconciled: reconciled
  });
}

// ===================== MAKE + BRAND STORES (Slices 4+5) =====================
// Ingredients (ing-) · Recipes (rcp-) · BrandConcept (bc-) ride the generic
// 6-touch CRUD wiring. The two pieces of real logic live here:
//   1. Per-sheet create defaults + update guards (recipe version bump, batch
//      snapshot immutability, BrandConcept updatedBy stamp).
//   2. handleLockBatch_ — the batch-lock action (OWNER DECISION #3): an
//      immutable formula + cost snapshot written onto a SoapBatches row.

// Read one row as an object by id (single-row sibling of getAllRows).
function getRowById_(sheetName, id) {
  var sheet = getSheet(sheetName);
  if (!sheet) return null;
  var rowNum = findRowById(sheet, id);
  if (rowNum === -1) return null;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  return rowToObj(headers, row);
}

// Today's date as a YYYY-MM-DD string in JST — matches the app-wide date
// convention (client jstToday()). Used for the SocialPosts postedAt default.
function jstTodayStr_() {
  return Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd");
}

// Create-path defaults for the new sheets. Called inside the script lock, before
// createRow. Mutates `item` in place; never throws.
function applyCreateDefaults_(sheetName, item, userName) {
  try {
    if (sheetName === "Ingredients") {
      // Active by default — the 材料 master lists active ingredients; deactivate
      // instead of delete so old batch snapshots keep resolving names.
      if (item.active === undefined || item.active === null || item.active === "") item.active = "true";
    }
    if (sheetName === "Recipes") {
      item.version = 1; // server-authoritative — never accept a client-supplied version (Halle M2)
      if (!item.status) item.status = "draft";
      if (!item.kind) item.kind = "soap"; // soap now; candle when specs land
    }
    if (sheetName === "BrandConcept") {
      if (!item.updatedBy && userName) item.updatedBy = userName;
    }
    // Slice 7 — standalone calendar events. v1 events are all-day; a fresh event
    // is active until checked off/cancelled. createdBy is stamped from the
    // signed-in user (client never needs to send it).
    if (sheetName === "Events") {
      if (item.allDay === undefined || item.allDay === null || item.allDay === "") item.allDay = "true";
      if (!item.status) item.status = "active";
      if (!item.createdBy && userName) item.createdBy = userName;
    }
    // Slice 7 — social posts start life as drafts. Same posted/postedAt coupling
    // as the update guard: a post created directly as "posted" (e.g. backfilling
    // history) gets postedAt defaulted to JST today.
    if (sheetName === "SocialPosts") {
      if (!item.status) item.status = "draft";
      if (!item.createdBy && userName) item.createdBy = userName;
      if (String(item.status) === "posted" && !item.postedAt) item.postedAt = jstTodayStr_();
    }
    // Snapshots have exactly ONE writer: handleLockBatch_ (Halle H1). A generic
    // create must never carry a client-fabricated snapshot — it would read as
    // "locked" and the immutability guard would then protect the forged number.
    if (sheetName === "SoapBatches") {
      delete item.formulaSnapshot;
      delete item.costSnapshot;
      delete item.recipeId;
      delete item.recipeVersion;
      delete item.qtyProduced;
    }
  } catch (ex) { /* defaults are best-effort — never block a write */ }
}

// Recipe fields whose change constitutes a FORMULA edit (bumps version on an
// active recipe). Cosmetic fields (name, notes, status) do not bump.
var RECIPE_FORMULA_FIELDS = ["items", "yield", "yieldUnit", "instructions", "kind"];

// Update-path guards. Called inside the script lock, before updateRow.
// Mutates `item` in place.
function applyUpdateGuards_(sheetName, item, userName) {
  try {
    // OWNER DECISION #3 (2026-07-14): a locked batch's snapshot is IMMUTABLE.
    // Later edits to ingredient prices or recipes NEVER rewrite it — and neither
    // can a generic client update. On a SoapBatches row that already carries a
    // formulaSnapshot, silently strip every lock-bearing field from the incoming
    // update (status/notes/name/cure dates/links stay editable). Stripping (not
    // rejecting) keeps existing consumers safe: the formulator sends full row
    // objects on save, and unchanged snapshot fields would otherwise round-trip.
    if (sheetName === "SoapBatches" && item.id) {
      var existingBatch = getRowById_("SoapBatches", item.id);
      if (existingBatch && String(existingBatch.formulaSnapshot) !== "") {
        delete item.formulaSnapshot;
        delete item.costSnapshot;
        delete item.recipeId;
        delete item.recipeVersion;
        delete item.qtyProduced;   // costPerUnit in the snapshot depends on it
        delete item.barsProduced;  // legacy mirror of qtyProduced
        delete item.costPerBar;    // legacy mirror of the locked cost/unit
      }
    }
    // Recipe versioning (kept simple per plan): editing an ACTIVE recipe's
    // formula fields bumps `version` server-side. A future full version history
    // could layer on by snapshotting the pre-edit row into a RecipeVersions
    // sheet here, keyed recipeId+version — batches already pin recipeVersion,
    // so no batch data would need migrating.
    if (sheetName === "Recipes" && item.id) {
      var existingRecipe = getRowById_("Recipes", item.id);
      if (existingRecipe) {
        // version is FULLY server-authoritative (Halle M2): start from the stored
        // value (ignore whatever the client sent), bump only on a formula edit
        // to an active recipe.
        item.version = parseInt(existingRecipe.version, 10) || 1;
        if (String(existingRecipe.status) === "active") {
          var changed = false;
          for (var i = 0; i < RECIPE_FORMULA_FIELDS.length; i++) {
            var f = RECIPE_FORMULA_FIELDS[i];
            if (item[f] !== undefined && String(item[f]) !== String(existingRecipe[f])) { changed = true; break; }
          }
          if (changed) item.version += 1;
        }
      }
    }
    if (sheetName === "BrandConcept") {
      if (!item.updatedBy && userName) item.updatedBy = userName;
    }
    // Slice 7 — a social post can never sit in status "posted" without a
    // postedAt. If the incoming update moves it to posted and neither the
    // update nor the stored row carries a postedAt, default it to JST today
    // (quality-of-life: "Mark posted" is a one-tap human action after posting
    // on the platform, and "today" is almost always the truth).
    if (sheetName === "SocialPosts" && item.id && String(item.status) === "posted" && !item.postedAt) {
      var existingPost = getRowById_("SocialPosts", item.id);
      if (existingPost && String(existingPost.postedAt) !== "") {
        delete item.postedAt; // keep the stored timestamp (don't let a blank round-trip erase it)
      } else {
        item.postedAt = jstTodayStr_();
      }
    }
  } catch (ex) { /* guards must never crash the write path; worst case the
                    snapshot fields round-trip unchanged (same values) */ }
}

// Mint the next B-YYYY-NNN batch number (scans SoapBatches.batchNumber for
// B-YYYY- rows only — free-text legacy numbers like SOAP-2026-001 are ignored
// and never collide). Mirrors generateSettlementNumber_.
function generateBatchNumber_() {
  var year = String(new Date().getFullYear());
  var prefix = "B-" + year + "-";
  var maxSeq = 0;
  var sheet = getSheet("SoapBatches");
  if (sheet && sheet.getLastRow() > 1) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var col = headers.indexOf("batchNumber");
    if (col >= 0) {
      var data = sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < data.length; i++) {
        var num = String(data[i][0] || "");
        if (num.indexOf(prefix) !== 0) continue;
        var seq = parseInt(num.split("-")[2], 10) || 0;
        if (seq > maxSeq) maxSeq = seq;
      }
    }
  }
  var next = String(maxSeq + 1);
  while (next.length < 3) next = "0" + next;
  return prefix + next;
}

// lockBatch — server-authoritative, IMMUTABLE once written (OWNER DECISION #3).
// Runs inside the script lock (see doPost). Request:
//   { action:"lockBatch", recipeId, qtyProduced, batchId?, batchNumber?, dateMade?,
//     status?, notes?, name?, linkedProductId?, linkedProductName?,
//     idToken, userId, userName }
//   - batchId absent  → CREATE a new SoapBatches row carrying the snapshot.
//   - batchId present → lock an EXISTING (unlocked) SoapBatches row in place;
//     re-lock of an already-locked batch is REJECTED (double-settle-style guard).
// Steps: resolve recipe → read CURRENT Ingredients prices (the one and only
// price read this batch will ever do) → compute formula + cost snapshot
// server-side → write. Fail-closed on any missing ingredient / invalid price /
// non-positive qty: a wrong locked cost is a permanent wrong number.
// Response: { success:true, batch:<full row>, formulaSnapshot, costSnapshot }
// (snapshots also returned parsed so the frontend needn't re-parse the row JSON).
function handleLockBatch_(body) {
  var recipeId = body.recipeId;
  if (!recipeId) return jsonResponse({ error: "missing recipeId" });

  var recipes = getAllRows("Recipes");
  var recipe = null;
  for (var r = 0; r < recipes.length; r++) {
    if (String(recipes[r].id) === String(recipeId)) { recipe = recipes[r]; break; }
  }
  if (!recipe) return jsonResponse({ error: "recipe not found: " + recipeId });

  var items = [];
  try { items = recipe.items ? JSON.parse(recipe.items) : []; } catch (e) { items = []; }
  if (Object.prototype.toString.call(items) !== "[object Array]" || items.length === 0) {
    return jsonResponse({ error: "cannot lock: recipe has no items (recipeId=" + recipeId + ")" });
  }

  var qtyProduced = Math.round(Number(body.qtyProduced));
  if (!(qtyProduced > 0)) {
    return jsonResponse({ error: "cannot lock: qtyProduced must be a positive number (cost/unit needs it)" });
  }

  // Re-lock guard — immutable, like the settlement double-settle guard.
  var existingBatch = null;
  if (body.batchId) {
    existingBatch = getRowById_("SoapBatches", body.batchId);
    if (!existingBatch) return jsonResponse({ error: "batch not found: " + body.batchId });
    if (String(existingBatch.formulaSnapshot) !== "") {
      return jsonResponse({ error: "batch already locked (id=" + existingBatch.id + ", batchNumber=" + existingBatch.batchNumber + ") — snapshots are immutable" });
    }
  }

  // Read CURRENT ingredient prices. This is the moment the cost is frozen:
  // later price/recipe edits never touch this batch.
  var ingredients = getAllRows("Ingredients");
  var ingMap = {};
  for (var g = 0; g < ingredients.length; g++) ingMap[String(ingredients[g].id)] = ingredients[g];

  var snapItems = [];
  var costLines = [];
  var totalCost = 0;
  for (var i = 0; i < items.length; i++) {
    var line = items[i] || {};
    var label = line.name || line.ingredientId || ("item " + (i + 1));
    var qty = Number(line.qty);
    if (!(qty > 0)) return jsonResponse({ error: "cannot lock: recipe item has no positive qty (" + label + ")" });
    var ing = ingMap[String(line.ingredientId || "")];
    if (!ing) return jsonResponse({ error: "cannot lock: ingredient not found in master (" + label + ") — fix the recipe or the Ingredients sheet first" });
    // Unit mismatch = a silently wrong (possibly 1000×) cost frozen forever —
    // fail closed instead (Halle M5). Same-unit is required; no conversion v1.
    if (line.unit && ing.unit && String(line.unit) !== String(ing.unit)) {
      return jsonResponse({ error: "cannot lock: unit mismatch for " + (ing.name || label) + " — recipe uses '" + line.unit + "' but the ingredient is priced per '" + ing.unit + "'. Align the units first." });
    }
    // Blank/non-numeric price is a data gap, not a free ingredient — reject.
    // An EXPLICIT 0 is allowed (e.g. homegrown botanicals). (Halle M3)
    var rawPrice = ing.pricePerUnit;
    if (rawPrice === "" || rawPrice === null || rawPrice === undefined || isNaN(Number(rawPrice))) {
      return jsonResponse({ error: "cannot lock: ingredient has no pricePerUnit set (" + (ing.name || ing.id) + ") — enter a price (0 is allowed for homegrown/free) first" });
    }
    var price = Number(rawPrice);
    if (!(price >= 0)) return jsonResponse({ error: "cannot lock: ingredient has a negative pricePerUnit (" + (ing.name || ing.id) + ")" });
    // JPY has no sub-unit: keep line costs to the yen (Halle M4).
    var lineCost = Math.round(qty * price);
    totalCost += lineCost;
    var unit = line.unit || ing.unit || "";
    snapItems.push({ ingredientId: ing.id, name: ing.name || label, qty: qty, unit: unit, pricePerUnit: price });
    costLines.push({ ingredientId: ing.id, name: ing.name || label, qty: qty, unit: unit, pricePerUnit: price, lineCost: lineCost });
  }
  totalCost = Math.round(totalCost);
  // Integer yen. NOTE for reporting: derive profit from totalCost, not
  // costPerUnit × qty (rounding residue) — documented in the snapshot itself.
  var costPerUnit = Math.round(totalCost / qtyProduced);

  var lockedAt = new Date().toISOString();
  var recipeVersion = parseInt(recipe.version, 10) || 1;
  var formulaSnapshot = {
    recipeId: recipe.id,
    recipeName: recipe.name || "",
    recipeVersion: recipeVersion,
    kind: recipe.kind || "soap",
    items: snapItems,
    yield: recipe.yield !== undefined ? recipe.yield : "",
    yieldUnit: recipe.yieldUnit || "",
    lockedAt: lockedAt
  };
  var costSnapshot = {
    lines: costLines,
    totalCost: totalCost,
    qtyProduced: qtyProduced,
    costPerUnit: costPerUnit,
    currency: "JPY",
    lockedAt: lockedAt
  };

  // Batch number: explicit > existing row's > auto B-YYYY-NNN. Must be unique
  // across SoapBatches (legacy free-text numbers included).
  var batchNumber = String(body.batchNumber || "").trim();
  if (!batchNumber && existingBatch && String(existingBatch.batchNumber) !== "") batchNumber = String(existingBatch.batchNumber);
  if (!batchNumber) batchNumber = generateBatchNumber_();
  var allBatches = getAllRows("SoapBatches");
  for (var b = 0; b < allBatches.length; b++) {
    if (String(allBatches[b].batchNumber) === batchNumber &&
        (!existingBatch || String(allBatches[b].id) !== String(existingBatch.id))) {
      return jsonResponse({ error: "batchNumber already exists: " + batchNumber });
    }
  }

  var dateMade = String(body.dateMade || "").substring(0, 10) || lockedAt.substring(0, 10);

  var fields = {
    batchNumber: batchNumber,
    recipeId: recipe.id,
    recipeVersion: String(recipeVersion),
    formulaSnapshot: JSON.stringify(formulaSnapshot),
    costSnapshot: JSON.stringify(costSnapshot),
    qtyProduced: String(qtyProduced),
    dateMade: dateMade,
    status: body.status || (existingBatch && existingBatch.status) || "planning",
    notes: (body.notes !== undefined && body.notes !== null) ? body.notes : ((existingBatch && existingBatch.notes) || ""),
    name: body.name || (existingBatch && existingBatch.name) || recipe.name || batchNumber,
    // Legacy mirrors — existing SoapBatches consumers (batch history table,
    // product-detail batch cards, frozen costPerBar column) see locked batches
    // with zero frontend changes. Protected post-lock by applyUpdateGuards_.
    date: dateMade,
    barsProduced: String(qtyProduced),
    costPerBar: String(costPerUnit),
    linkedProductId: body.linkedProductId || (existingBatch && existingBatch.linkedProductId) || "",
    linkedProductName: body.linkedProductName || (existingBatch && existingBatch.linkedProductName) || ""
  };

  var batchRow;
  if (existingBatch) {
    fields.id = existingBatch.id;
    batchRow = updateRow("SoapBatches", fields);
    if (!batchRow) return jsonResponse({ error: "batch row vanished during lock: " + body.batchId });
  } else {
    batchRow = createRow("SoapBatches", fields);
  }

  invalidateBatchListCache_();
  logActivity("locked", "soapBatch", batchRow.id, batchNumber,
    "recipe " + (recipe.name || recipe.id) + " v" + recipeVersion + " · total ¥" + totalCost + " · ¥" + costPerUnit + "/unit × " + qtyProduced,
    body.userId || "", body.userName || "");

  return jsonResponse({
    success: true,
    batch: batchRow,
    formulaSnapshot: formulaSnapshot,
    costSnapshot: costSnapshot
  });
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
    var data = shopifyGet("products.json", { limit: "250", since_id: sinceId, fields: "id,title,variants,status,product_type,vendor,tags,images,body_html,handle,options" });
    var products = data.products || [];
    if (products.length === 0) { hasMore = false; break; }

    products.forEach(function(p) {
      var imageUrl = (p.images && p.images.length > 0) ? p.images[0].src : "";
      // Product-level expansion fields (denormalized onto each variant row)
      var description = p.body_html || "";
      var handle = p.handle || "";
      var imageUrls = JSON.stringify((p.images || []).map(function(im) { return im.src; }));
      var productOptions = JSON.stringify((p.options || []).map(function(o) { return o.name; }));

      // Metafields (best-effort, per product, throttled, never breaks sync)
      var metafields = "{}";
      try {
        var mfData = shopifyGet("products/" + p.id + "/metafields.json", {});
        var mfMap = {};
        (mfData.metafields || []).forEach(function(mf) {
          mfMap[mf.namespace + "." + mf.key] = mf.value;
        });
        metafields = JSON.stringify(mfMap);
        Utilities.sleep(200); // gentle throttle against rate limits
      } catch (e) {
        metafields = "{}";
      }

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
          imageUrl: imageUrl,
          description: description,
          handle: handle,
          imageUrls: imageUrls,
          productOptions: productOptions,
          barcode: v.barcode || "",
          weight: String(v.weight || ""),
          weightUnit: v.weight_unit || "",
          variantOptions: JSON.stringify({ option1: v.option1 || "", option2: v.option2 || "", option3: v.option3 || "" }),
          inventoryPolicy: v.inventory_policy || "",
          metafields: metafields
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

function mapDraftStatus(status) {
  var map = { "open": "draft", "completed": "paid", "invoice_sent": "pending", "expired": "voided" };
  return map[status] || "draft";
}

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
        note: o.note || "",
        orderSource: "Shopify"
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
        orderNumber: d.name || ("D-" + d.id),
        email: d.email || "",
        totalPrice: d.total_price || "",
        currency: d.currency || "JPY",
        financialStatus: mapDraftStatus(d.status),
        fulfillmentStatus: "unfulfilled",
        lineItems: lineItemsSummary,
        customerName: customerName,
        createdAt: d.created_at || "",
        shippingAddress: shippingAddr,
        note: d.note || "",
        orderSource: "Shopify"
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
    ensureSheetsOnce_();
    var pCount = syncShopifyProducts();
    var oCount = syncShopifyOrders();
    logActivity("synced", "product", "", "", pCount + " products synced (scheduled)", "system", "Scheduler");
    logActivity("synced", "order", "", "", oCount + " orders synced (scheduled)", "system", "Scheduler");
  } catch (e) {
    console.error("Scheduled sync failed:", e);
  }
}

// ── One-time cleanup: remove duplicate auto-created invoices ────
// Run manually: deduplicateInvoices()
// Dedupes by extracting order# from notes/poReference, or by contactName+total+date
function deduplicateInvoices() {
  var sheet = getSheet("Invoices");
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) { Logger.log("No data rows"); return; }

  var all = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = all[0];
  Logger.log("Headers: " + JSON.stringify(headers));
  Logger.log("Total rows (excl header): " + (all.length - 1));

  // Find columns by name (case-insensitive)
  var cols = {};
  for (var h = 0; h < headers.length; h++) {
    cols[String(headers[h]).trim().toLowerCase()] = h;
  }
  var notesCol = cols["notes"] !== undefined ? cols["notes"] : -1;
  var poRefCol = cols["poreference"] !== undefined ? cols["poreference"] : -1;
  var createdAtCol = cols["createdat"] !== undefined ? cols["createdat"] : -1;
  var nameCol = cols["contactname"] !== undefined ? cols["contactname"] : -1;
  var totalCol = cols["total"] !== undefined ? cols["total"] : -1;
  var dateCol = cols["invoicedate"] !== undefined ? cols["invoicedate"] : -1;
  Logger.log("notes=" + notesCol + " poRef=" + poRefCol + " createdAt=" + createdAtCol + " name=" + nameCol + " total=" + totalCol + " date=" + dateCol);

  function getDedupeKey(row) {
    if (poRefCol !== -1) {
      var po = String(row[poRefCol]).trim();
      var poMatch = po.match(/[Oo]rder\s*#?\s*(\d+)/);
      if (poMatch) return "order-" + poMatch[1];
    }
    if (notesCol !== -1) {
      var notes = String(row[notesCol]).trim();
      var noteMatch = notes.match(/[Oo]rder\s*#?\s*(\d+)/);
      if (noteMatch) return "order-" + noteMatch[1];
    }
    var n = nameCol !== -1 ? String(row[nameCol]).trim() : "";
    var t = totalCol !== -1 ? String(row[totalCol]).trim() : "";
    var d = dateCol !== -1 ? String(row[dateCol]).trim() : "";
    if (n && t) return "composite-" + n + "|" + t + "|" + d;
    return null;
  }

  var manualRows = [];
  var groups = {};
  for (var i = 1; i < all.length; i++) {
    var key = getDedupeKey(all[i]);
    if (!key) { manualRows.push(all[i]); continue; }
    if (!groups[key]) {
      groups[key] = { best: i, bestCreated: createdAtCol !== -1 ? String(all[i][createdAtCol]) : String(i) };
    } else {
      var existing = groups[key].bestCreated;
      var current = createdAtCol !== -1 ? String(all[i][createdAtCol]) : String(i);
      if (current < existing) {
        groups[key] = { best: i, bestCreated: current };
      }
    }
  }

  var keepRows = [];
  manualRows.forEach(function(r) { keepRows.push(r); });
  Object.keys(groups).forEach(function(k) { keepRows.push(all[groups[k].best]); });

  var removed = (all.length - 1) - keepRows.length;
  Logger.log("Keeping: " + keepRows.length + " rows. Removing: " + removed + " duplicates.");
  if (removed === 0) { Logger.log("No duplicates found"); return; }

  sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  if (keepRows.length > 0) {
    sheet.getRange(2, 1, keepRows.length, lastCol).setValues(keepRows);
  }
  var newLastRow = keepRows.length + 1;
  if (lastRow > newLastRow) {
    sheet.deleteRows(newLastRow + 1, lastRow - newLastRow);
  }
  SpreadsheetApp.flush();
  Logger.log("Done! Kept " + keepRows.length + " invoices, removed " + removed + " duplicates.");
}

// ── One-time cleanup: remove "created invoice" spam from ActivityLog ────
// Run manually: cleanupActivityLog()
function cleanupActivityLog() {
  var sheet = getSheet("ActivityLog");
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) { Logger.log("No data rows"); return; }

  var all = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = all[0];
  Logger.log("Headers: " + JSON.stringify(headers));
  Logger.log("Total rows (excl header): " + (all.length - 1));

  // Find action and itemType columns
  var actionCol = -1, typeCol = -1, nameCol = -1;
  for (var h = 0; h < headers.length; h++) {
    var hLower = String(headers[h]).trim().toLowerCase();
    if (hLower === "action") actionCol = h;
    else if (hLower === "itemtype") typeCol = h;
    else if (hLower === "itemname") nameCol = h;
  }
  Logger.log("action=" + actionCol + " itemType=" + typeCol + " itemName=" + nameCol);

  var keepRows = [];
  var removed = 0;
  for (var i = 1; i < all.length; i++) {
    var action = actionCol !== -1 ? String(all[i][actionCol]).trim().toLowerCase() : "";
    var itype = typeCol !== -1 ? String(all[i][typeCol]).trim().toLowerCase() : "";
    // Remove "created invoice" spam entries (auto-generated duplicates)
    if (action === "created" && itype === "invoice") {
      removed++;
      continue;
    }
    keepRows.push(all[i]);
  }

  Logger.log("Keeping: " + keepRows.length + " rows. Removing: " + removed + " spam entries.");
  if (removed === 0) { Logger.log("No spam found"); return; }

  sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  if (keepRows.length > 0) {
    sheet.getRange(2, 1, keepRows.length, lastCol).setValues(keepRows);
  }
  var newLastRow = keepRows.length + 1;
  if (lastRow > newLastRow) {
    sheet.deleteRows(newLastRow + 1, lastRow - newLastRow);
  }
  SpreadsheetApp.flush();
  Logger.log("Done! Kept " + keepRows.length + " activity entries, removed " + removed + " spam.");
}

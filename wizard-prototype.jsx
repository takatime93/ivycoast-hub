import { useState, useCallback } from "react";

// ── Mock Data (matches real Ivycoast Hub data shapes) ──────────
const CONTACTS = [
  { id: "c1", name: "Yuki Tanaka", company: "Northshore Cafe", email: "yuki@northshore.jp", consignmentPercent: 30, wholesalePercent: 0 },
  { id: "c2", name: "Kenji Mori", company: "Tsutaya Books Daikanyama", email: "kenji@tsutaya.co.jp", consignmentPercent: 0, wholesalePercent: 25 },
  { id: "c3", name: "Aiko Sato", company: "Lumine Est Shinjuku", email: "aiko@lumine.jp", consignmentPercent: 35, wholesalePercent: 0 },
  { id: "c4", name: "Hiroshi Nakamura", company: "Isetan Mitsukoshi", email: "hiroshi@isetan.co.jp", consignmentPercent: 0, wholesalePercent: 40 },
  { id: "c5", name: "Mai Kobayashi", company: "The Good Neighbors", email: "mai@tgn.jp", consignmentPercent: 20, wholesalePercent: 0 },
  { id: "c6", name: "Ren Watanabe", company: "Tokyu Hands Shibuya", email: "ren@tokyuhands.jp", consignmentPercent: 0, wholesalePercent: 30 },
];

const RECENT_CONTACT_IDS = ["c1", "c3", "c5"];

const ORDERS = [
  { id: "o1", number: "#1042", customer: "Northshore Cafe", total: 128400, status: "paid", items: [
    { description: "Hinoki Soap 80g", qty: 3, unitPrice: 2800 },
    { description: "Yuzu Candle 120g", qty: 2, unitPrice: 3200 },
    { description: "Gift Set A — Holiday", qty: 1, unitPrice: 5800 },
  ]},
  { id: "o2", number: "#1041", customer: "Tsutaya Books", total: 85600, status: "unfulfilled", items: [
    { description: "Matcha Soap 80g", qty: 5, unitPrice: 2800 },
    { description: "Cypress Candle 180g", qty: 3, unitPrice: 4200 },
  ]},
  { id: "o3", number: "#1040", customer: "Lumine Est", total: 42800, status: "paid", items: [
    { description: "Hinoki Soap 80g", qty: 10, unitPrice: 2800 },
    { description: "Lavender Soap 80g", qty: 5, unitPrice: 2800 },
  ]},
];

const PRODUCTS = [
  { title: "Hinoki Soap 80g", price: 2800 },
  { title: "Matcha Soap 80g", price: 2800 },
  { title: "Lavender Soap 80g", price: 2800 },
  { title: "Yuzu Candle 120g", price: 3200 },
  { title: "Cypress Candle 180g", price: 4200 },
  { title: "Gift Set A — Holiday", price: 5800 },
  { title: "Gift Set B — Essential", price: 7200 },
  { title: "Room Spray — Hinoki", price: 3800 },
];

// ── Styles ─────────────────────────────────────────────────────
const tokens = {
  primary: "#0e413b",
  primaryHover: "#1a5c50",
  primaryTint: "#e8f0ee",
  text: "#181818",
  textHeading: "#202124",
  textSecondary: "#5f6368",
  textTertiary: "#80868b",
  surface: "#fff",
  surfaceSecondary: "#f8f9fa",
  surfaceTertiary: "#f1f3f4",
  border: "#dadce0",
  borderLight: "#ebebeb",
  borderSeparator: "#f0f0f0",
  successBg: "#e6f4ea",
  successText: "#137333",
  warningBg: "#fef7e0",
  warningText: "#b06000",
  neutralBg: "#e8eaed",
  neutralText: "#5f6368",
  shadow: "0 8px 30px rgba(0,0,0,0.18)",
  shadowCard: "0 4px 14px rgba(0,0,0,0.03)",
  font: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontDisplay: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: "'SF Mono', 'SFMono-Regular', Menlo, Consolas, monospace",
};

// ── Components ─────────────────────────────────────────────────

function ProgressBar({ step, total, labels, onStepClick }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "0 0 20px", justifyContent: "center" }}>
      {Array.from({ length: total }, (_, i) => {
        const s = i + 1;
        const done = s < step;
        const active = s === step;
        const clickable = done;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div
              onClick={clickable ? () => onStepClick(s) : undefined}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                cursor: clickable ? "pointer" : "default",
                opacity: !done && !active ? 0.4 : 1,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? tokens.primary : active ? tokens.primary : tokens.borderLight,
                color: done || active ? "#fff" : tokens.textSecondary,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600, fontFamily: tokens.fontMono,
                transition: "all 0.2s",
              }}>
                {done ? "✓" : s}
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 400,
                color: active ? tokens.primary : tokens.textSecondary,
                fontFamily: tokens.fontMono, letterSpacing: -0.3,
                whiteSpace: "nowrap",
              }}>
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div style={{
                width: 48, height: 2, margin: "0 6px",
                background: done ? tokens.primary : tokens.borderLight,
                marginBottom: 18, transition: "background 0.2s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ModeCard({ icon, title, desc, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "24px 20px", border: `2px solid ${active ? tokens.primary : tokens.borderLight}`,
        borderRadius: 12, background: active ? tokens.primaryTint : tokens.surface,
        cursor: "pointer", textAlign: "center", transition: "all 0.15s",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        fontFamily: tokens.font,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = tokens.border; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = tokens.borderLight; }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: tokens.textHeading }}>{title}</span>
      <span style={{ fontSize: 12, color: tokens.textSecondary, lineHeight: 1.4 }}>{desc}</span>
    </button>
  );
}

function ContactRow({ contact, onClick, isRecent }) {
  const badge = contact.consignmentPercent
    ? { label: `C ${contact.consignmentPercent}%`, bg: tokens.warningBg, color: tokens.warningText }
    : contact.wholesalePercent
    ? { label: `W ${contact.wholesalePercent}%`, bg: "#e8f0fe", color: "#1a73e8" }
    : null;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "8px 12px", cursor: "pointer", display: "flex",
        alignItems: "center", gap: 8, borderRadius: 6, transition: "background 0.1s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = tokens.surfaceTertiary}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: tokens.textHeading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {contact.name}
        </div>
        <div style={{ fontSize: 12, color: tokens.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {contact.company}
        </div>
      </div>
      {badge && (
        <span style={{
          fontSize: 10, fontWeight: 600, fontFamily: tokens.fontMono,
          padding: "2px 6px", borderRadius: 4,
          background: badge.bg, color: badge.color, whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {badge.label}
        </span>
      )}
    </div>
  );
}

function OrderRow({ order, onClick, selected }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 12px", cursor: "pointer", display: "flex",
        alignItems: "center", gap: 10, borderRadius: 6, transition: "background 0.1s",
        background: selected ? tokens.primaryTint : "transparent",
        border: selected ? `1px solid ${tokens.primary}` : "1px solid transparent",
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = tokens.surfaceTertiary; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontWeight: 600, fontSize: 13, color: tokens.textHeading, fontFamily: tokens.fontMono }}>{order.number}</span>
      <span style={{ flex: 1, fontSize: 13, color: tokens.textSecondary }}>{order.customer}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: tokens.textHeading }}>¥{order.total.toLocaleString()}</span>
      <span style={{
        fontSize: 10, fontFamily: tokens.fontMono, fontWeight: 400,
        padding: "2px 6px", borderRadius: 2,
        background: order.status === "paid" ? tokens.successBg : tokens.neutralBg,
        color: order.status === "paid" ? tokens.successText : tokens.neutralText,
      }}>
        {order.status}
      </span>
    </div>
  );
}

function QuickChip({ product, onAdd }) {
  return (
    <button
      onClick={() => onAdd(product)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 10px", background: tokens.surfaceSecondary,
        border: `1px solid ${tokens.borderLight}`, borderRadius: 6,
        fontSize: 12, fontFamily: tokens.font, cursor: "pointer",
        color: tokens.textHeading, whiteSpace: "nowrap", transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = tokens.primaryTint; e.currentTarget.style.borderColor = tokens.primary; }}
      onMouseLeave={e => { e.currentTarget.style.background = tokens.surfaceSecondary; e.currentTarget.style.borderColor = tokens.borderLight; }}
    >
      <span>{product.title}</span>
      <span style={{ color: tokens.textSecondary, fontSize: 11 }}>¥{product.price.toLocaleString()}</span>
    </button>
  );
}

function WizardBtn({ children, onClick, primary, disabled, small }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        padding: small ? "6px 14px" : "8px 20px",
        borderRadius: 6, fontSize: 13, fontWeight: 500, fontFamily: tokens.font,
        cursor: disabled ? "not-allowed" : "pointer",
        border: primary ? "none" : `1px solid ${tokens.border}`,
        background: primary ? (disabled ? tokens.textSecondary : tokens.primary) : tokens.surface,
        color: primary ? "#fff" : tokens.textHeading,
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: tokens.textSecondary,
      textTransform: "uppercase", letterSpacing: 0.5,
      padding: "8px 0 4px", fontFamily: tokens.fontMono,
    }}>
      {children}
    </div>
  );
}

// ── Main Wizard ────────────────────────────────────────────────

export default function InvoiceWizardPrototype() {
  const [docType, setDocType] = useState("invoice");
  const [mode, setMode] = useState(null); // null = mode select, "full" or "guided"
  const [step, setStep] = useState(1);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactSearch, setContactSearch] = useState("");
  const [showNewContact, setShowNewContact] = useState(false);
  const [source, setSource] = useState(null); // "order" or "manual"
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [details, setDetails] = useState({ dueDate: "", po: "", workspace: "IVYCOAST", status: "draft", taxType: "included", discount: "0", shipping: "0", notes: "" });

  const stepLabels = ["Contact", "Source", "Items", "Details"];

  const reset = () => {
    setMode(null); setStep(1); setSelectedContact(null); setContactSearch("");
    setShowNewContact(false); setSource(null); setSelectedOrder(null);
    setItems([]); setDetails({ dueDate: "", po: "", workspace: "IVYCOAST", status: "draft", taxType: "included", discount: "0", shipping: "0", notes: "" });
  };

  const goNext = () => {
    if (step === 1 && selectedContact) setStep(2);
    else if (step === 2 && source === "order") setStep(2.5);
    else if (step === 2 && source === "manual") { setItems([{ description: "", qty: 1, unitPrice: 0 }]); setStep(3); }
    else if (step === 2.5 && selectedOrder) {
      setItems(selectedOrder.items.map(i => ({ ...i })));
      setStep(3);
    }
    else if (step === 3 && items.some(i => i.description)) setStep(4);
  };

  const goBack = () => {
    if (step === 4) setStep(3);
    else if (step === 3 && source === "order") setStep(2.5);
    else if (step === 3) setStep(2);
    else if (step === 2.5) setStep(2);
    else if (step === 2) setStep(1);
    else if (step === 1) setMode(null);
  };

  const addItem = (product) => {
    setItems(prev => [...prev, { description: product.title, qty: 1, unitPrice: product.price }]);
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: field === "qty" || field === "unitPrice" ? Number(value) || 0 : value } : item));
  };

  const subtotal = items.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
  const discount = Number(details.discount) || 0;
  const shipping = Number(details.shipping) || 0;
  const tax = details.taxType === "10" ? Math.round((subtotal - discount) * 0.1) : 0;
  const total = subtotal - discount + tax + shipping;

  const filteredContacts = contactSearch
    ? CONTACTS.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.company.toLowerCase().includes(contactSearch.toLowerCase()))
    : CONTACTS;
  const recentContacts = CONTACTS.filter(c => RECENT_CONTACT_IDS.includes(c.id));

  const displayStep = step === 2.5 ? 2 : Math.floor(step);
  const isInvoice = docType === "invoice";

  // ── Mode Selection ──────────────────────────────────
  if (!mode) {
    return (
      <div style={{ fontFamily: tokens.font, maxWidth: 520, margin: "0 auto", background: tokens.surface, borderRadius: 12, boxShadow: tokens.shadow, overflow: "hidden" }}>
        {/* Doc type toggle */}
        <div style={{ display: "flex", borderBottom: `1px solid ${tokens.borderLight}` }}>
          {["invoice", "receipt"].map(t => (
            <button key={t} onClick={() => setDocType(t)} style={{
              flex: 1, padding: "12px 0", background: docType === t ? tokens.surface : tokens.surfaceSecondary,
              border: "none", borderBottom: docType === t ? `2px solid ${tokens.primary}` : "2px solid transparent",
              fontFamily: tokens.font, fontSize: 13, fontWeight: docType === t ? 600 : 400,
              color: docType === t ? tokens.primary : tokens.textSecondary, cursor: "pointer",
              textTransform: "capitalize",
            }}>
              New {t}
            </button>
          ))}
        </div>

        <div style={{ padding: "32px 28px" }}>
          <h2 style={{ fontFamily: tokens.fontDisplay, fontSize: 18, fontWeight: 600, color: tokens.textHeading, margin: "0 0 4px", textAlign: "center" }}>
            New {isInvoice ? "Invoice" : "Receipt"}
          </h2>
          <p style={{ fontSize: 13, color: tokens.textSecondary, textAlign: "center", margin: "0 0 24px" }}>
            How would you like to create this {isInvoice ? "invoice" : "receipt"}?
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <ModeCard icon="📝" title="Full Form" desc="All fields at once" onClick={() => setMode("full")} />
            <ModeCard icon="🧭" title="Guided" desc="Step by step" onClick={() => { setMode("guided"); setStep(1); }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Full Form Mode (placeholder) ─────────────────────
  if (mode === "full") {
    return (
      <div style={{ fontFamily: tokens.font, maxWidth: 520, margin: "0 auto", background: tokens.surface, borderRadius: 12, boxShadow: tokens.shadow, padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: tokens.fontDisplay, fontSize: 18, fontWeight: 600, color: tokens.textHeading, margin: 0 }}>
            New {isInvoice ? "Invoice" : "Receipt"} — Full Form
          </h2>
          <button onClick={reset} style={{ background: "none", border: "none", fontSize: 18, color: tokens.textSecondary, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "40px 20px", textAlign: "center", color: tokens.textTertiary, fontSize: 13, border: `2px dashed ${tokens.borderLight}`, borderRadius: 8 }}>
          This is the existing full form layout — unchanged.
          <br />All current fields appear here as they do today.
        </div>
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <WizardBtn onClick={reset}>← Back to mode selection</WizardBtn>
        </div>
      </div>
    );
  }

  // ── Guided Wizard ────────────────────────────────────
  return (
    <div style={{ fontFamily: tokens.font, maxWidth: 520, margin: "0 auto", background: tokens.surface, borderRadius: 12, boxShadow: tokens.shadow, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: tokens.fontDisplay, fontSize: 16, fontWeight: 600, color: tokens.textHeading, margin: 0 }}>
          New {isInvoice ? "Invoice" : "Receipt"}
        </h2>
        <button onClick={reset} style={{ background: "none", border: "none", fontSize: 18, color: tokens.textSecondary, cursor: "pointer" }}>✕</button>
      </div>

      {/* Progress */}
      <div style={{ padding: "16px 24px 0" }}>
        <ProgressBar
          step={displayStep}
          total={4}
          labels={stepLabels}
          onStepClick={(s) => { if (s < step) setStep(s); }}
        />
      </div>

      <div style={{ padding: "0 24px 24px", minHeight: 320 }}>

        {/* ── Step 1: Contact ─────────────────────── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: tokens.fontMono, marginBottom: 4 }}>
              Step 1 of 4 · Contact
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: tokens.textHeading, margin: "0 0 12px", fontFamily: tokens.fontDisplay }}>
              Who is this {isInvoice ? "invoice" : "receipt"} for?
            </h3>

            {/* Search input */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: tokens.textSecondary, fontSize: 13 }}>🔍</span>
              <input
                type="text"
                placeholder="Search contacts..."
                value={contactSearch}
                onChange={e => { setContactSearch(e.target.value); setShowNewContact(false); }}
                style={{
                  width: "100%", padding: "8px 10px 8px 32px", border: `1px solid ${tokens.border}`,
                  borderRadius: 6, fontSize: 14, fontFamily: tokens.font, boxSizing: "border-box",
                  outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = tokens.primary}
                onBlur={e => e.target.style.borderColor = tokens.border}
              />
            </div>

            {/* Selected contact indicator */}
            {selectedContact && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                background: tokens.primaryTint, borderRadius: 6, marginBottom: 8,
                border: `1px solid ${tokens.primary}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: tokens.primary, flex: 1 }}>
                  {selectedContact.name} — {selectedContact.company}
                </span>
                <button onClick={() => { setSelectedContact(null); setContactSearch(""); }} style={{ background: "none", border: "none", color: tokens.primary, cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            )}

            {/* Contact list */}
            {!showNewContact && (
              <div style={{ maxHeight: 200, overflowY: "auto", border: `1px solid ${tokens.borderLight}`, borderRadius: 8, padding: "4px 0" }}>
                {!contactSearch && recentContacts.length > 0 && (
                  <>
                    <SectionLabel>Recent</SectionLabel>
                    {recentContacts.map(c => (
                      <ContactRow key={c.id} contact={c} isRecent onClick={() => { setSelectedContact(c); setContactSearch(c.name); }} />
                    ))}
                  </>
                )}
                <SectionLabel>{contactSearch ? "Results" : "All Contacts"}</SectionLabel>
                {filteredContacts.filter(c => !contactSearch ? !RECENT_CONTACT_IDS.includes(c.id) : true).map(c => (
                  <ContactRow key={c.id} contact={c} onClick={() => { setSelectedContact(c); setContactSearch(c.name); }} />
                ))}
                {filteredContacts.length === 0 && (
                  <div style={{ padding: "12px", fontSize: 12, color: tokens.textTertiary, textAlign: "center" }}>No contacts found</div>
                )}
                <div
                  onClick={() => setShowNewContact(true)}
                  style={{
                    padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 500,
                    color: tokens.primary, borderTop: `1px solid ${tokens.borderLight}`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = tokens.surfaceTertiary}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  + New Contact
                </div>
              </div>
            )}

            {/* New contact inline form */}
            {showNewContact && (
              <div style={{ border: `1px solid ${tokens.border}`, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <SectionLabel>New Contact</SectionLabel>
                {["Contact Name", "Company", "Email"].map(field => (
                  <input key={field} placeholder={field} style={{
                    padding: "7px 10px", border: `1px solid ${tokens.border}`, borderRadius: 6,
                    fontSize: 13, fontFamily: tokens.font, outline: "none",
                  }} />
                ))}
                <select style={{ padding: "7px 10px", border: `1px solid ${tokens.border}`, borderRadius: 6, fontSize: 13, fontFamily: tokens.font }}>
                  <option>Vendor</option><option>Business</option><option>Customer</option>
                </select>
                <div style={{ display: "flex", gap: 8 }}>
                  <WizardBtn small onClick={() => setShowNewContact(false)}>Cancel</WizardBtn>
                  <WizardBtn small primary onClick={() => {
                    setSelectedContact({ id: "new", name: "New Contact", company: "" });
                    setShowNewContact(false);
                  }}>Add</WizardBtn>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Source ──────────────────────── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: tokens.fontMono, marginBottom: 4 }}>
              Step 2 of 4 · Items
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: tokens.textHeading, margin: "0 0 16px", fontFamily: tokens.fontDisplay }}>
              How do you want to add items?
            </h3>
            <div style={{ fontSize: 12, color: tokens.textSecondary, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: tokens.primary, display: "inline-block" }} />
              For: {selectedContact?.name} {selectedContact?.company ? `— ${selectedContact.company}` : ""}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <ModeCard icon="📦" title="From an Order" desc="Pull items from a Shopify order" onClick={() => setSource("order")} active={source === "order"} />
              <ModeCard icon="✏️" title="Add Manually" desc="Type in products yourself" onClick={() => setSource("manual")} active={source === "manual"} />
            </div>
          </div>
        )}

        {/* ── Step 2a: Select Order ───────────────── */}
        {step === 2.5 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: tokens.fontMono, marginBottom: 4 }}>
              Step 2 of 4 · Select Order
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: tokens.textHeading, margin: "0 0 12px", fontFamily: tokens.fontDisplay }}>
              Which order?
            </h3>
            <div style={{ maxHeight: 200, overflowY: "auto", border: `1px solid ${tokens.borderLight}`, borderRadius: 8, padding: "4px 0", marginBottom: 12 }}>
              {ORDERS.map(o => (
                <OrderRow key={o.id} order={o} selected={selectedOrder?.id === o.id} onClick={() => setSelectedOrder(o)} />
              ))}
            </div>
            <div style={{
              padding: "10px 12px", borderRadius: 8, background: tokens.surfaceSecondary,
              border: `1px solid ${tokens.borderLight}`, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <span style={{ fontSize: 12, color: tokens.textSecondary }}>
                Order not listed? <span style={{ color: tokens.primary, fontWeight: 500, cursor: "pointer", textDecoration: "underline" }}>Create a manual order →</span>
              </span>
            </div>
          </div>
        )}

        {/* ── Step 3: Review Items ────────────────── */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: tokens.fontMono, marginBottom: 4 }}>
              Step 3 of 4 · Review Items
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: tokens.textHeading, margin: "0 0 8px", fontFamily: tokens.fontDisplay }}>
              {source === "order" ? "Review & adjust items" : "Add your items"}
            </h3>
            <div style={{ fontSize: 12, color: tokens.textSecondary, marginBottom: 12, display: "flex", gap: 12 }}>
              <span>For: <strong>{selectedContact?.name}</strong></span>
              {selectedOrder && <span>Source: <strong>{selectedOrder.number}</strong></span>}
            </div>

            {/* Line items table */}
            <div style={{ border: `1px solid ${tokens.borderLight}`, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 80px 80px 28px", gap: 0, padding: "6px 8px", background: tokens.surfaceSecondary, borderBottom: `1px solid ${tokens.borderLight}` }}>
                {["Description", "Qty", "Price", "Amount", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 600, color: tokens.textTertiary, fontFamily: tokens.fontMono, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</span>
                ))}
              </div>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 50px 80px 80px 28px", gap: 0, padding: "6px 8px", borderBottom: `1px solid ${tokens.borderSeparator}`, alignItems: "center" }}>
                  <input value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} placeholder="Product name" style={{ border: "none", fontSize: 13, fontFamily: tokens.font, padding: "4px 0", outline: "none", background: "transparent", minWidth: 0 }} />
                  <input type="number" value={item.qty || ""} onChange={e => updateItem(idx, "qty", e.target.value)} style={{ border: `1px solid ${tokens.borderLight}`, borderRadius: 4, fontSize: 12, padding: "4px", width: 40, textAlign: "center", fontFamily: tokens.font }} />
                  <span style={{ fontSize: 12, color: tokens.textSecondary, fontFamily: tokens.fontMono }}>¥{item.unitPrice.toLocaleString()}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: tokens.textHeading, fontFamily: tokens.fontMono }}>¥{(item.qty * item.unitPrice).toLocaleString()}</span>
                  <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: tokens.textTertiary, cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setItems(prev => [...prev, { description: "", qty: 1, unitPrice: 0 }])}
              style={{ background: "none", border: "none", color: tokens.primary, fontSize: 12, fontWeight: 500, cursor: "pointer", padding: "4px 0", fontFamily: tokens.font, marginBottom: 12 }}
            >
              + Add Line Item
            </button>

            {/* Quick add chips */}
            <SectionLabel>Quick Add</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {PRODUCTS.slice(0, 6).map(p => (
                <QuickChip key={p.title} product={p} onAdd={addItem} />
              ))}
            </div>

            <div style={{ borderTop: `2px solid ${tokens.textHeading}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: tokens.textHeading }}>Subtotal</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: tokens.textHeading, fontFamily: tokens.fontMono }}>¥{subtotal.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* ── Step 4: Final Details ───────────────── */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: tokens.fontMono, marginBottom: 4 }}>
              Step 4 of 4 · Details
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: tokens.textHeading, margin: "0 0 12px", fontFamily: tokens.fontDisplay }}>
              Final details
            </h3>

            <div style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: 12, color: tokens.textSecondary }}>
              <span style={{ fontFamily: tokens.fontMono, fontWeight: 500, color: tokens.textHeading }}>
                {isInvoice ? "INV" : "REC"}-2026-004
              </span>
              <span>·</span>
              <span>{new Date().toISOString().split("T")[0]}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {isInvoice && (
                <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: tokens.textSecondary, fontFamily: tokens.fontMono }}>Due Date</span>
                  <input type="date" value={details.dueDate} onChange={e => setDetails(d => ({...d, dueDate: e.target.value}))} style={{ padding: "7px 8px", border: `1px solid ${tokens.border}`, borderRadius: 6, fontSize: 13, fontFamily: tokens.font }} />
                </label>
              )}
              <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: tokens.textSecondary, fontFamily: tokens.fontMono }}>PO / Reference</span>
                <input type="text" placeholder="e.g. #PO-00276" value={details.po} onChange={e => setDetails(d => ({...d, po: e.target.value}))} style={{ padding: "7px 8px", border: `1px solid ${tokens.border}`, borderRadius: 6, fontSize: 13, fontFamily: tokens.font }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: tokens.textSecondary, fontFamily: tokens.fontMono }}>Workspace</span>
                <select value={details.workspace} onChange={e => setDetails(d => ({...d, workspace: e.target.value}))} style={{ padding: "7px 8px", border: `1px solid ${tokens.border}`, borderRadius: 6, fontSize: 13, fontFamily: tokens.font }}>
                  <option>IVYCOAST</option><option>BOLDOATH</option>
                </select>
              </label>
              {isInvoice && (
                <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: tokens.textSecondary, fontFamily: tokens.fontMono }}>Status</span>
                  <select value={details.status} onChange={e => setDetails(d => ({...d, status: e.target.value}))} style={{ padding: "7px 8px", border: `1px solid ${tokens.border}`, borderRadius: 6, fontSize: 13, fontFamily: tokens.font }}>
                    <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option>
                  </select>
                </label>
              )}
              <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: tokens.textSecondary, fontFamily: tokens.fontMono }}>Tax</span>
                <select value={details.taxType} onChange={e => setDetails(d => ({...d, taxType: e.target.value}))} style={{ padding: "7px 8px", border: `1px solid ${tokens.border}`, borderRadius: 6, fontSize: 13, fontFamily: tokens.font }}>
                  <option value="included">10% included</option><option value="0">No tax</option><option value="10">10% added</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: tokens.textSecondary, fontFamily: tokens.fontMono }}>Discount</span>
                <input type="number" value={details.discount} onChange={e => setDetails(d => ({...d, discount: e.target.value}))} style={{ padding: "7px 8px", border: `1px solid ${tokens.border}`, borderRadius: 6, fontSize: 13, fontFamily: tokens.font, textAlign: "right" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: tokens.textSecondary, fontFamily: tokens.fontMono }}>Shipping</span>
                <input type="number" value={details.shipping} onChange={e => setDetails(d => ({...d, shipping: e.target.value}))} style={{ padding: "7px 8px", border: `1px solid ${tokens.border}`, borderRadius: 6, fontSize: 13, fontFamily: tokens.font, textAlign: "right" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 3, gridColumn: "1 / -1" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: tokens.textSecondary, fontFamily: tokens.fontMono }}>Notes</span>
                <input type="text" placeholder="Payment terms, special instructions..." value={details.notes} onChange={e => setDetails(d => ({...d, notes: e.target.value}))} style={{ padding: "7px 8px", border: `1px solid ${tokens.border}`, borderRadius: 6, fontSize: 13, fontFamily: tokens.font }} />
              </label>
            </div>

            {/* Totals */}
            <div style={{ background: tokens.surfaceSecondary, borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: tokens.textSecondary }}>
                <span>Subtotal</span><span style={{ fontFamily: tokens.fontMono }}>¥{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: tokens.textSecondary }}>
                  <span>Discount</span><span style={{ fontFamily: tokens.fontMono }}>-¥{discount.toLocaleString()}</span>
                </div>
              )}
              {tax > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: tokens.textSecondary }}>
                  <span>Tax (10%)</span><span style={{ fontFamily: tokens.fontMono }}>¥{tax.toLocaleString()}</span>
                </div>
              )}
              {shipping > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: tokens.textSecondary }}>
                  <span>Shipping</span><span style={{ fontFamily: tokens.fontMono }}>¥{shipping.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: tokens.textHeading, borderTop: `2px solid ${tokens.textHeading}`, paddingTop: 8, marginTop: 2 }}>
                <span>Total</span><span style={{ fontFamily: tokens.fontMono }}>¥{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Actions ──────────────────────────── */}
      <div style={{
        padding: "12px 24px", borderTop: `1px solid ${tokens.borderLight}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: tokens.surfaceSecondary,
      }}>
        <WizardBtn onClick={goBack}>← Back</WizardBtn>
        <div style={{ display: "flex", gap: 8 }}>
          {step === 4 && (
            <WizardBtn onClick={() => alert("Preview would open here")}>Preview</WizardBtn>
          )}
          {step === 4 ? (
            <WizardBtn primary onClick={() => {
              alert(`${isInvoice ? "Invoice" : "Receipt"} saved!\n\nContact: ${selectedContact?.name}\nItems: ${items.length}\nTotal: ¥${total.toLocaleString()}`);
              reset();
            }}>
              Save
            </WizardBtn>
          ) : (
            <WizardBtn
              primary
              disabled={
                (step === 1 && !selectedContact) ||
                (step === 2 && !source) ||
                (step === 2.5 && !selectedOrder) ||
                (step === 3 && !items.some(i => i.description))
              }
              onClick={goNext}
            >
              Next →
            </WizardBtn>
          )}
        </div>
      </div>
    </div>
  );
}

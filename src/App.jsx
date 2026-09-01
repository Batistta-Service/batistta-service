import { storageGet, storageSet } from "./storage";
import emailjs from "@emailjs/browser";
import React, { useState, useEffect, useRef } from "react";
import { Wrench, Phone, Clock, Plus, ArrowLeft, AlertCircle, Check, ChevronRight } from "lucide-react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
`;

const STATUSES = [
  { id: "recibido", label: "Recibido", dot: "#5B9BD5" },
  { id: "diagnostico", label: "Diagnóstico", dot: "#E8A23D" },
  { id: "reparacion", label: "En reparación", dot: "#D9782E" },
  { id: "espera", label: "Esperando repuesto", dot: "#C1594A" },
  { id: "listo", label: "Listo para entrega", dot: "#7FA872" },
  { id: "entregado", label: "Entregado", dot: "#6B6E70" },
];

const MACHINE_TYPES = ["Horno", "Amasadora", "Batidora", "Divisora", "Formadora", "Cámara de fermentación", "Laminadora", "Rebanadora", "Otro"];

const STAFF_PASSWORD = "begtaller";

// Configuración de aviso por mail cuando se registra un cliente nuevo (EmailJS).
// En la vista de prueba de Claude quedan vacíos (no se manda mail acá).
// En la app publicada, estos valores se completan con las variables de entorno de Vercel.
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";

async function notifyNewClient(client, order) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) return;
  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        client_name: client.name,
        client_phone: client.phone,
        ticket: order.ticket,
        machine_type: order.machineType,
        machine_model: order.machineModel,
        issue: order.issue,
      },
      { publicKey: EMAILJS_PUBLIC_KEY }
    );
  } catch (err) {
    console.error("No se pudo enviar el aviso por mail:", err);
  }
}

const seedClients = [
  { phone: "5550142", name: "Panadería El Trigal" },
  { phone: "5550198", name: "Pastelería Dulce Aroma" },
];

const seedOrders = [
  { id: "o1", ticket: "OT-2026-001", phone: "5550142", machineType: "Horno", machineModel: "Rotativo RX-200", issue: "No alcanza temperatura, tarda demasiado en calentar.", status: "diagnostico", dateReceived: "2026-08-18", notes: [{ date: "2026-08-19", text: "Se revisó resistencia principal, en espera de multímetro." }], contacted: false },
  { id: "o2", ticket: "OT-2026-002", phone: "5550198", machineType: "Amasadora", machineModel: "Espiral AE-40", issue: "Ruido metálico fuerte al amasar en velocidad 2.", status: "espera", dateReceived: "2026-08-15", notes: [{ date: "2026-08-16", text: "Rodamiento del eje dañado, se pidió repuesto al proveedor." }], contacted: true },
];

function normalizePhone(p) {
  return (p || "").replace(/[^0-9]/g, "");
}

function daysAgo(dateStr) {
  const diff = Math.floor((new Date("2026-08-25") - new Date(dateStr)) / 86400000);
  return diff;
}

function StatusDot({ color, size = 8, glow = true }) {
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: color, display: "inline-block", boxShadow: glow ? `0 0 6px 1px ${color}99` : "none" }} />
  );
}

function PhoneGate({ onSubmit, error, staffMode, onStaffLogin, onStaffLogout, onViewAllClients }) {
  const [phone, setPhone] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [showPinBox, setShowPinBox] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  function submitPin() {
    if (onStaffLogin(pin)) {
      setShowPinBox(false);
      setPin("");
      setPinError(false);
      onViewAllClients();
    } else {
      setPinError(true);
    }
  }

  function handleGenerateLink() {
    const digits = normalizePhone(phone);
    if (digits.length < 6) return;
    const url = `${window.location.origin}${window.location.pathname}?tel=${digits}`;
    setGeneratedLink(url);
    setLinkCopied(false);
    try {
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[#17191B] flex items-center justify-center p-4" style={{ fontFamily: "Inter" }}>
      <style>{FONTS}</style>
      <div
        className="w-full max-w-sm bg-[#1C1F21] border border-[#2E3234] rounded-xl p-6"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-md bg-[#E8A23D]/15 flex items-center justify-center shrink-0">
            <Wrench size={17} className="text-[#E8A23D]" />
          </div>
          <div>
            <h1 className="text-[#EDE9E2] font-semibold text-sm leading-none" style={{ fontFamily: "Space Grotesk" }}>Batistta Service</h1>
            <p className="text-[#6B6E70] text-[11px] mt-1">Consultá tu reparación</p>
          </div>
        </div>

        <div className="mb-5 pb-5 border-b border-[#2E3234]">
          {staffMode ? (
            <>
              <button type="button" onClick={onStaffLogout} className="w-full flex items-center justify-center gap-1.5 text-[11px] text-[#7FA872] border border-[#2E3234] py-2 rounded-md mb-2"><Check size={12} /> Modo taller activo</button>
              <button type="button" onClick={onViewAllClients} className="w-full bg-[#E8A23D]/10 border border-[#E8A23D]/40 text-[#E8A23D] text-xs font-medium py-2.5 rounded-md">
                Ver todos los clientes
              </button>
            </>
          ) : showPinBox ? (
            <div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setPinError(false); }}
                  onKeyDown={(e) => e.key === "Enter" && submitPin()}
                  placeholder="Clave del taller"
                  autoFocus
                  className="flex-1 bg-[#24282B] border border-[#33383a] rounded-md px-3 py-2 text-sm text-[#EDE9E2] placeholder:text-[#5F6264] focus:outline-none focus:border-[#E8A23D]"
                />
                <button type="button" onClick={submitPin} className="bg-[#E8A23D] text-[#1A1D1F] text-sm font-medium px-4 rounded-md">Entrar</button>
              </div>
              {pinError && <p className="text-[#C1594A] text-[11px] mt-1.5">Clave incorrecta.</p>}
            </div>
          ) : (
            <button type="button" onClick={() => setShowPinBox(true)} className="w-full bg-[#E8A23D]/10 border border-[#E8A23D]/40 text-[#E8A23D] text-sm font-medium py-2.5 rounded-md">
              MODO TALLER
            </button>
          )}
        </div>

        <label className="text-[11px] uppercase tracking-wide text-[#7A7D7F] font-medium mb-1.5 block">O consultá con tu número de teléfono</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit(phone)}
          placeholder="Ej. 011 5550-0142"
          inputMode="tel"
          className="w-full bg-[#24282B] border border-[#33383a] rounded-md px-3 py-2.5 text-sm text-[#EDE9E2] placeholder:text-[#5F6264] focus:outline-none focus:border-[#E8A23D] mb-1"
        />
        {error && <p className="text-[#C1594A] text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}

        <button type="button" onClick={() => onSubmit(phone)} className="w-full bg-[#E8A23D] hover:bg-[#f0ad4d] text-[#1A1D1F] font-medium text-sm py-2.5 rounded-md transition-colors mt-4">
          Continuar
        </button>
        <p className="text-[#4A4D4F] text-[10px] mt-4 leading-relaxed">
          Si es la primera vez, vas a poder registrar tu máquina y el problema. Ejemplo para probar: <span className="font-mono text-[#6B6E70]">5550142</span>
        </p>

        <div className="mt-5 pt-5 border-t border-[#2E3234]">
          <p className="text-[11px] uppercase tracking-wide text-[#7A7D7F] font-medium mb-2">¿Sos del taller?</p>
          <p className="text-[#6B6E70] text-[11px] mb-2.5 leading-relaxed">Escribí arriba el teléfono del cliente y generá su link personal para mandarlo por WhatsApp.</p>
          <button type="button" onClick={handleGenerateLink} className="w-full border border-[#33383a] hover:border-[#E8A23D] text-[#9A9D9F] hover:text-[#E8A23D] text-xs py-2 rounded-md transition-colors">
            Generar link para este número
          </button>
          {generatedLink && (
            <div className="mt-2.5">
              <input readOnly value={generatedLink} onFocus={(e) => e.target.select()} className="w-full bg-[#24282B] border border-[#33383a] rounded-md px-2.5 py-2 text-[11px] font-mono text-[#D5D2CB] focus:outline-none" />
              <p className="text-[10px] mt-1.5 text-[#7FA872]">{linkCopied ? "¡Copiado! Pegalo en WhatsApp." : "Tocá el link para seleccionarlo y copiarlo."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IntakeForm({ phone, onCreate, onBack, isFirstTime }) {
  const [name, setName] = useState("");
  const [machineType, setMachineType] = useState(MACHINE_TYPES[0]);
  const [machineModel, setMachineModel] = useState("");
  const [issue, setIssue] = useState("");
  const canSubmit = (isFirstTime ? name.trim() : true) && machineModel.trim() && issue.trim();

  return (
    <div className="min-h-screen bg-[#17191B] p-4 flex items-center justify-center" style={{ fontFamily: "Inter" }}>
      <style>{FONTS}</style>
      <div className="w-full max-w-sm bg-[#1C1F21] border border-[#2E3234] rounded-xl p-6">
        <button onClick={onBack} className="flex items-center gap-1 text-[#7A7D7F] hover:text-[#EDE9E2] text-xs mb-4"><ArrowLeft size={13} /> Volver</button>

        <h2 className="text-[#EDE9E2] font-semibold text-base mb-1" style={{ fontFamily: "Space Grotesk" }}>
          {isFirstTime ? "Registrá tu reparación" : "Nueva reparación"}
        </h2>
        <p className="text-[#6B6E70] text-xs mb-5">
          {isFirstTime ? "No encontramos este número — completá los datos y queda registrado." : "Se va a guardar junto a tus otras reparaciones."}
        </p>

        <div className="space-y-3.5">
          {isFirstTime && (
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[#7A7D7F] font-medium mb-1.5 block">Tu nombre o el de tu panadería</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Panadería El Trigal" className="w-full bg-[#24282B] border border-[#33383a] rounded-md px-3 py-2 text-sm text-[#EDE9E2] placeholder:text-[#5F6264] focus:outline-none focus:border-[#E8A23D]" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[#7A7D7F] font-medium mb-1.5 block">Tipo de máquina</label>
              <select value={machineType} onChange={(e) => setMachineType(e.target.value)} className="w-full bg-[#24282B] border border-[#33383a] rounded-md px-3 py-2 text-sm text-[#EDE9E2] focus:outline-none focus:border-[#E8A23D]">
                {MACHINE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[#7A7D7F] font-medium mb-1.5 block">Modelo</label>
              <input value={machineModel} onChange={(e) => setMachineModel(e.target.value)} placeholder="Ej. RX-200" className="w-full bg-[#24282B] border border-[#33383a] rounded-md px-3 py-2 text-sm text-[#EDE9E2] placeholder:text-[#5F6264] focus:outline-none focus:border-[#E8A23D]" />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[#7A7D7F] font-medium mb-1.5 block">¿Qué problema tiene?</label>
            <textarea value={issue} onChange={(e) => setIssue(e.target.value)} rows={3} placeholder="Describí la falla..." className="w-full bg-[#24282B] border border-[#33383a] rounded-md px-3 py-2 text-sm text-[#EDE9E2] placeholder:text-[#5F6264] focus:outline-none focus:border-[#E8A23D] resize-none" />
          </div>
          <button
            onClick={() => canSubmit && onCreate({ name: name.trim(), machineType, machineModel: machineModel.trim(), issue: issue.trim() })}
            disabled={!canSubmit}
            className="w-full bg-[#E8A23D] disabled:bg-[#33383a] disabled:text-[#5F6264] text-[#1A1D1F] font-medium text-sm py-2.5 rounded-md transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, onStatusChange, onAddNote, onToggleContacted, staffMode }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const status = STATUSES.find((s) => s.id === order.status);
  const days = daysAgo(order.dateReceived);

  function submitNote() {
    if (!note.trim()) return;
    onAddNote(order.id, note.trim());
    setNote("");
  }

  return (
    <div className={`bg-[#1F2224] border rounded-md overflow-hidden ${order.contacted ? "border-[#2E3234]" : "border-[#C1594A]/50"}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] text-[#8B8E90]">{order.ticket}</span>
          <div className="flex items-center gap-2">
            {order.contacted ? (
              <span className="flex items-center gap-1 text-[10px] text-[#7FA872]"><Check size={11} /> Contactado</span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-[#C1594A]"><AlertCircle size={11} /> Sin contactar</span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-[#EDE9E2]"><StatusDot color={status.dot} />{status.label}</span>
          </div>
        </div>
        <p className="text-[#EDE9E2] font-medium text-sm mb-1">{order.machineType} <span className="text-[#9A9D9F] font-normal">· {order.machineModel}</span></p>
        <p className="text-[#9A9D9F] text-xs leading-relaxed">{order.issue}</p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[11px] text-[#7A7D7F] flex items-center gap-1"><Clock size={11} />{days === 0 ? "hoy" : `hace ${days} d`}</span>
          <ChevronRight size={14} className={`text-[#5F6264] transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#2E3234] pt-3.5 space-y-3.5">
          {staffMode && (
            <button
              onClick={() => onToggleContacted(order.id)}
              className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-md border transition-colors ${order.contacted ? "border-[#7FA872]/40 bg-[#7FA872]/10 text-[#7FA872]" : "border-[#33383a] text-[#9A9D9F] hover:border-[#7FA872] hover:text-[#7FA872]"}`}
            >
              <Check size={13} /> {order.contacted ? "Marcado como contactado" : "Marcar como contactado"}
            </button>
          )}

          {staffMode && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7A7D7F] font-medium mb-2">Cambiar estado</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onStatusChange(order.id, s.id)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${s.id === order.status ? "border-[#E8A23D] bg-[#E8A23D]/10 text-[#EDE9E2]" : "border-[#2E3234] text-[#9A9D9F]"}`}
                  >
                    <StatusDot color={s.dot} size={7} />{s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#7A7D7F] font-medium mb-2">Bitácora</p>
            <div className="space-y-1.5 mb-2.5">
              {order.notes.length === 0 && <p className="text-[#5F6264] text-xs italic">Sin notas todavía.</p>}
              {order.notes.map((n, i) => (
                <div key={i} className="bg-[#24282B] rounded-md px-3 py-2 border border-[#2E3234]">
                  <p className="text-[10px] font-mono text-[#7A7D7F] mb-0.5">{n.date}</p>
                  <p className="text-[#D5D2CB] text-xs leading-snug">{n.text}</p>
                </div>
              ))}
            </div>
            {staffMode ? (
              <div className="flex gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitNote()} placeholder="Agregar nota..." className="flex-1 bg-[#24282B] border border-[#33383a] rounded-md px-3 py-1.5 text-xs text-[#EDE9E2] placeholder:text-[#5F6264] focus:outline-none focus:border-[#E8A23D]" />
                <button onClick={submitNote} className="bg-[#33383a] hover:bg-[#3d4245] text-[#EDE9E2] text-xs px-3 rounded-md">Añadir</button>
              </div>
            ) : (
              <p className="text-[#5F6264] text-[10px] italic">Solo el taller puede cambiar el estado o agregar notas.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function exportOrdersCSV(clients, orders) {
  const headers = ["Ticket", "Cliente", "Telefono", "Tipo de maquina", "Modelo", "Problema", "Estado", "Contactado", "Fecha recibido", "Notas"];
  const statusLabel = (id) => (STATUSES.find((s) => s.id === id) || {}).label || id;
  const rows = orders.map((o) => {
    const c = clients.find((c) => c.phone === o.phone);
    const notes = (o.notes || []).map((n) => `${n.date}: ${n.text}`).join(" | ");
    return [o.ticket, c ? c.name : "", o.phone, o.machineType, o.machineModel, o.issue, statusLabel(o.status), o.contacted ? "Sí" : "No", o.dateReceived, notes];
  });
  const escape = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `batistta-service-reparaciones-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ClientListView({ clients, orders, onSelectClient, onBack }) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const rows = clients
    .map((c) => {
      const myOrders = orders.filter((o) => o.phone === c.phone);
      const active = myOrders.filter((o) => o.status !== "entregado").length;
      const pending = myOrders.filter((o) => !o.contacted).length;
      const latest = myOrders.sort((a, b) => (a.dateReceived < b.dateReceived ? 1 : -1))[0];
      return { ...c, count: myOrders.length, active, pending, latestStatus: latest ? STATUSES.find((s) => s.id === latest.status) : null };
    })
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-[#17191B]" style={{ fontFamily: "Inter" }}>
      <style>{FONTS}</style>
      <header className="border-b border-[#2E3234] px-4 sm:px-6 py-3.5 sticky top-0 bg-[#17191B]/95 backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#E8A23D]/15 flex items-center justify-center shrink-0">
              <Wrench size={16} className="text-[#E8A23D]" />
            </div>
            <h1 className="text-[#EDE9E2] font-semibold text-sm" style={{ fontFamily: "Space Grotesk" }}>Todos los clientes</h1>
          </div>
          <button onClick={onBack} className="text-[#9A9D9F] hover:text-[#EDE9E2] text-xs px-2.5 py-1.5 rounded-md border border-[#2E3234] hover:bg-[#1F2224]">Volver</button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full bg-[#24282B] border border-[#33383a] rounded-md px-3 py-2 text-sm text-[#EDE9E2] placeholder:text-[#5F6264] focus:outline-none focus:border-[#E8A23D] mb-2.5"
        />
        <button onClick={() => exportOrdersCSV(clients, orders)} className="w-full bg-[#E8A23D]/10 border border-[#E8A23D]/40 text-[#E8A23D] text-xs font-medium py-2 rounded-md">
          Descargar Excel (todas las reparaciones)
        </button>
      </header>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-2">
        {rows.length === 0 && <p className="text-[#5F6264] text-sm text-center py-10">No se encontraron clientes.</p>}
        {rows.map((c) => (
          <button
            key={c.phone}
            onClick={() => onSelectClient(c.phone)}
            className={`w-full text-left bg-[#1F2224] border rounded-md p-3.5 flex items-center justify-between transition-colors ${c.pending > 0 ? "border-[#C1594A]/50 hover:border-[#C1594A]" : "border-[#2E3234] hover:border-[#E8A23D]"}`}
          >
            <div className="min-w-0">
              <p className="text-[#EDE9E2] font-medium text-sm truncate">{c.name}</p>
              <p className="text-[#7A7D7F] text-[11px] mt-0.5 flex items-center gap-1"><Phone size={10} />{c.phone} <span className="text-[#5F6264]">· {c.count} reparación{c.count === 1 ? "" : "es"}</span></p>
              {c.pending > 0 && <p className="text-[#C1594A] text-[10px] mt-1 flex items-center gap-1"><AlertCircle size={10} /> {c.pending} sin contactar</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {c.latestStatus && <span className="flex items-center gap-1.5 text-[11px] text-[#9A9D9F]"><StatusDot color={c.latestStatus.dot} size={7} />{c.latestStatus.label}</span>}
              <ChevronRight size={14} className="text-[#5F6264]" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RepairsView({ client, orders, onStatusChange, onAddNote, onToggleContacted, onNewOrder, onChangeNumber, onBackToList, staffMode }) {
  const myOrders = orders.filter((o) => o.phone === client.phone).sort((a, b) => (a.dateReceived < b.dateReceived ? 1 : -1));
  const [linkCopied, setLinkCopied] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?tel=${client.phone}`;
    try {
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[#17191B]" style={{ fontFamily: "Inter" }}>
      <style>{FONTS}</style>
      <header className="border-b border-[#2E3234] px-4 sm:px-6 py-3.5 sticky top-0 bg-[#17191B]/95 backdrop-blur">
        <div className="flex items-center gap-2.5 min-w-0 mb-2.5">
          <div className="w-8 h-8 rounded-md bg-[#E8A23D]/15 flex items-center justify-center shrink-0">
            <Wrench size={16} className="text-[#E8A23D]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[#EDE9E2] font-semibold text-sm leading-none truncate" style={{ fontFamily: "Space Grotesk" }}>{client.name}</h1>
            <p className="text-[#6B6E70] text-[11px] mt-0.5 flex items-center gap-1"><Phone size={10} />{client.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={copyLink} className="text-[#9A9D9F] hover:text-[#EDE9E2] text-xs px-2.5 py-1.5 rounded-md border border-[#2E3234] hover:bg-[#1F2224]">{linkCopied ? "¡Copiado!" : "Copiar link"}</button>
          {staffMode && (
            <span className="text-[11px] text-[#7FA872] flex items-center gap-1 px-2.5 py-1.5"><Check size={12} /> Modo taller</span>
          )}
          <button onClick={onChangeNumber} className="text-[#9A9D9F] hover:text-[#EDE9E2] text-xs px-2.5 py-1.5 rounded-md border border-[#2E3234] hover:bg-[#1F2224]">Cambiar número</button>
          {staffMode && onBackToList && (
            <button onClick={onBackToList} className="text-[#E8A23D] hover:text-[#f0ad4d] text-xs px-2.5 py-1.5 rounded-md border border-[#E8A23D]/40 bg-[#E8A23D]/10 flex items-center gap-1"><ArrowLeft size={12} /> Volver al listado</button>
          )}
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-2.5">
        <button onClick={onNewOrder} className="w-full flex items-center justify-center gap-1.5 border border-dashed border-[#33383a] hover:border-[#E8A23D] text-[#9A9D9F] hover:text-[#E8A23D] text-sm py-3 rounded-md transition-colors">
          <Plus size={15} /> Registrar otra reparación
        </button>

        {myOrders.length === 0 && <p className="text-[#5F6264] text-sm text-center py-10">Todavía no tenés reparaciones registradas.</p>}
        {myOrders.map((o) => (
          <OrderRow key={o.id} order={o} onStatusChange={onStatusChange} onAddNote={onAddNote} onToggleContacted={onToggleContacted} staffMode={staffMode} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState("");
  const loaded = useRef(false);

  const [screen, setScreen] = useState("gate"); // gate | intake | repairs | clientList
  const [phoneError, setPhoneError] = useState("");
  const [activePhone, setActivePhone] = useState(null);
  const [staffMode, setStaffMode] = useState(false);
  const urlHandled = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        let c, o;
        try { c = await storageGet("clients"); } catch { c = null; }
        try { o = await storageGet("orders"); } catch { o = null; }
        setClients(c ? JSON.parse(c.value) : seedClients);
        setOrders(o ? JSON.parse(o.value) : seedOrders);
        if (!c) await storageSet("clients", JSON.stringify(seedClients));
        if (!o) await storageSet("orders", JSON.stringify(seedOrders));
      } catch (err) {
        console.error(err);
        setClients(seedClients);
        setOrders(seedOrders);
      } finally {
        loaded.current = true;
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (loading || urlHandled.current) return;
    urlHandled.current = true;
    const telParam = new URLSearchParams(window.location.search).get("tel");
    if (telParam) handlePhoneSubmit(telParam);
  }, [loading]);

  useEffect(() => {
    if (!loaded.current) return;
    (async () => {
      try { await storageSet("clients", JSON.stringify(clients)); setSaveError(false); }
      catch (err) { console.error(err); setSaveError(true); setSaveErrorMsg((err && (err.message || JSON.stringify(err))) || "error desconocido"); }
    })();
  }, [clients]);

  useEffect(() => {
    if (!loaded.current) return;
    (async () => {
      try { await storageSet("orders", JSON.stringify(orders)); setSaveError(false); }
      catch (err) { console.error(err); setSaveError(true); setSaveErrorMsg((err && (err.message || JSON.stringify(err))) || "error desconocido"); }
    })();
  }, [orders]);

  function handlePhoneSubmit(rawPhone) {
    try {
      const phone = normalizePhone(rawPhone);
      if (phone.length < 6) {
        setPhoneError("Ingresá un número de teléfono válido.");
        return;
      }
      setPhoneError("");
      setActivePhone(phone);
      const existing = clients.find((c) => c.phone === phone);
      setScreen(existing ? "repairs" : "intake");
    } catch (err) {
      console.error(err);
      setPhoneError("Ocurrió un error: " + (err && err.message ? err.message : "desconocido"));
    }
  }

  function handleCreateOrder(data) {
    const isNewClient = !clients.find((c) => c.phone === activePhone);
    let clientRecord = clients.find((c) => c.phone === activePhone);
    if (!clientRecord) {
      clientRecord = { phone: activePhone, name: data.name || activePhone };
      setClients([...clients, clientRecord]);
    }
    const num = orders.length + 1;
    const newOrder = {
      id: "o" + Date.now(),
      ticket: `OT-2026-${String(num).padStart(3, "0")}`,
      phone: activePhone,
      machineType: data.machineType,
      machineModel: data.machineModel,
      issue: data.issue,
      status: "recibido",
      dateReceived: "2026-08-25",
      notes: [],
      contacted: false,
    };
    setOrders([newOrder, ...orders]);
    if (isNewClient) notifyNewClient(clientRecord, newOrder);
    setScreen("repairs");
  }

  function handleStatusChange(id, status) {
    if (!staffMode) return;
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  function handleAddNote(id, text) {
    if (!staffMode) return;
    const noteObj = { date: "2026-08-25", text };
    setOrders(orders.map((o) => (o.id === id ? { ...o, notes: [...o.notes, noteObj] } : o)));
  }

  function handleToggleContacted(id) {
    if (!staffMode) return;
    setOrders(orders.map((o) => (o.id === id ? { ...o, contacted: !o.contacted } : o)));
  }

  function handleStaffLogin(pin) {
    if (pin === STAFF_PASSWORD) { setStaffMode(true); return true; }
    return false;
  }

  function handleStaffLogout() {
    setStaffMode(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#17191B] flex items-center justify-center" style={{ fontFamily: "Inter" }}>
        <style>{FONTS}</style>
        <div className="flex items-center gap-2.5 text-[#7A7D7F] text-sm">
          <div className="w-4 h-4 border-2 border-[#E8A23D] border-t-transparent rounded-full animate-spin" />
          Cargando...
        </div>
      </div>
    );
  }

  if (screen === "gate") {
    return (
      <PhoneGate
        onSubmit={handlePhoneSubmit}
        error={phoneError}
        staffMode={staffMode}
        onStaffLogin={handleStaffLogin}
        onStaffLogout={handleStaffLogout}
        onViewAllClients={() => setScreen("clientList")}
      />
    );
  }

  if (screen === "clientList") {
    return (
      <ClientListView
        clients={clients}
        orders={orders}
        onSelectClient={(phone) => { setActivePhone(phone); setScreen("repairs"); }}
        onBack={() => setScreen("gate")}
      />
    );
  }

  if (screen === "intake") {
    const isFirstTime = !clients.find((c) => c.phone === activePhone);
    return (
      <IntakeForm
        phone={activePhone}
        isFirstTime={isFirstTime}
        onCreate={handleCreateOrder}
        onBack={() => setScreen(isFirstTime ? "gate" : "repairs")}
      />
    );
  }

  const client = clients.find((c) => c.phone === activePhone);
  return (
    <>
      {saveError && (
        <div className="fixed top-3 right-3 z-50 max-w-xs bg-[#C1594A] text-white text-[11px] px-3 py-2 rounded-md shadow-lg">
          <p className="flex items-center gap-1.5 font-medium"><AlertCircle size={12} /> No se pudo guardar el último cambio</p>
          {saveErrorMsg && <p className="mt-1 opacity-90 break-words">{saveErrorMsg}</p>}
        </div>
      )}
      <RepairsView
        client={client}
        orders={orders}
        onStatusChange={handleStatusChange}
        onAddNote={handleAddNote}
        onToggleContacted={handleToggleContacted}
        onNewOrder={() => setScreen("intake")}
        onChangeNumber={() => { setScreen("gate"); setActivePhone(null); }}
        onBackToList={() => { setScreen("clientList"); setActivePhone(null); }}
        staffMode={staffMode}
      />
    </>
  );
}

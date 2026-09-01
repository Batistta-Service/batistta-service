// Conexión directa a la API de Supabase, sin usar la librería @supabase/supabase-js
// (esto evita un problema que causaba errores intermitentes al guardar).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Estos dos métodos reemplazan a window.storage.get / window.storage.set
// que solo funcionan dentro de Claude. Usan la tabla "kv_store" en Supabase.
export async function storageGet(key) {
  const url = `${SUPABASE_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}&select=value`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`No se pudo leer (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data && data.length ? { value: data[0].value } : null;
}

export async function storageSet(key, value) {
  const url = `${SUPABASE_URL}/rest/v1/kv_store`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`No se pudo guardar (${res.status}): ${text}`);
  }
  return { key, value };
}

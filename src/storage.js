import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Estos dos métodos reemplazan a window.storage.get / window.storage.set
// que solo funcionan dentro de Claude. Usan la tabla "kv_store" en Supabase.
export async function storageGet(key) {
  const { data, error } = await supabase
    .from("kv_store")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return data ? { value: data.value } : null;
}

export async function storageSet(key, value) {
  const { error } = await supabase
    .from("kv_store")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw error;
  return { key, value };
}

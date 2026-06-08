export async function loadJSON(name) {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`);
  if (!res.ok) throw new Error(`Veri yüklenemedi: ${name} (${res.status})`);
  return res.json();
}

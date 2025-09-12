// tools/seedAll.mjs
// Node 18+ (fetch global)
const BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/,"");
const EMAIL = process.env.SEED_EMAIL || "admin@example.com";
const PASSWORD = process.env.SEED_PASSWORD || "password";

// ------------------ Données ------------------
const CATEGORIES = [
  { name: "Streaming vidéo",  color: "#ef4444", icon: "film",        description: "SVOD & TV",  type: "expense" },
  { name: "Musique",          color: "#22c55e", icon: "music",       description: "Streaming audio", type: "expense" },
  { name: "Jeux vidéo",       color: "#a855f7", icon: "gamepad",     description: "Gaming & abonnements", type: "expense" },
  { name: "Stockage cloud",   color: "#0ea5e9", icon: "cloud",       description: "Cloud & sauvegarde", type: "expense" },
  { name: "Productivité",     color: "#f59e0b", icon: "check-circle",description: "Bureautique & outils", type: "expense" },
  { name: "Télécom",          color: "#10b981", icon: "phone",       description: "Opérateurs & box", type: "expense" },
];

const SERVICES = [
  { name:"Netflix",               category:"Streaming vidéo",  website:"https://www.netflix.com",       provider:"Netflix Inc." },
  { name:"Disney+",               category:"Streaming vidéo",  website:"https://www.disneyplus.com" },
  { name:"Amazon Prime Video",    category:"Streaming vidéo",  website:"https://www.primevideo.com" },
  { name:"Canal+",                category:"Streaming vidéo",  website:"https://www.canalplus.com" },
  { name:"YouTube Premium",       category:"Streaming vidéo",  website:"https://www.youtube.com/premium" },

  { name:"Spotify",               category:"Musique",          website:"https://www.spotify.com" },
  { name:"Deezer",                category:"Musique",          website:"https://www.deezer.com" },
  { name:"Apple Music",           category:"Musique",          website:"https://music.apple.com" },

  { name:"Dropbox",               category:"Stockage cloud",   website:"https://www.dropbox.com" },
  { name:"Google One",            category:"Stockage cloud",   website:"https://one.google.com" },
  { name:"iCloud+",               category:"Stockage cloud",   website:"https://www.icloud.com" },

  { name:"Microsoft 365",         category:"Productivité",     website:"https://www.microsoft.com/microsoft-365" },
  { name:"Adobe Creative Cloud",  category:"Productivité",     website:"https://www.adobe.com/creativecloud" },

  { name:"Orange",                category:"Télécom",          website:"https://www.orange.fr" },
  { name:"SFR",                   category:"Télécom",          website:"https://www.sfr.fr" },
  { name:"Bouygues Telecom",      category:"Télécom",          website:"https://www.bouyguestelecom.fr" },
  { name:"Free",                  category:"Télécom",          website:"https://www.free.fr" },
];

// ------------------ Utils HTTP ------------------
async function req(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, opts);
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}
const listify = (x) =>
  Array.isArray(x) ? x :
  x?.items ? x.items :
  x?.data ? x.data :
  x?.["hydra:member"] ? x["hydra:member"] :
  [];

// ------------------ Main ------------------
async function main() {
  // 0) login
  const { token } = await req(`/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // 1) Upsert catégories (type = "expense" d’après ton Entity)
  const existingCatsRaw = await req(`/api/category/all`, { headers }).catch(() => []);
  const catMap = new Map(listify(existingCatsRaw).map(c => [String(c.name || "").toLowerCase(), c]));

  for (const c of CATEGORIES) {
    const key = c.name.toLowerCase();
    if (catMap.has(key)) { console.log(`✓ Catégorie existe: ${c.name}`); continue; }

    const payload = {
      name: c.name,
      description: c.description || null,
      color: c.color || "#64748b",
      icon: c.icon || "tag",
      type: "expense",              // ← validé par ton backend
      is_default: false,
    };
    try {
      const created = await req(`/api/category/create`, {
        method: "POST", headers, body: JSON.stringify(payload),
      });
      console.log(`+ Catégorie: ${c.name}`);
    } catch (e) {
      console.log(`✗ Catégorie ${c.name} -> ${e.message}`);
    }
  }

  // 🔁 Re-fetch après créations pour avoir des objets avec un vrai id
  const afterCatsRaw = await req(`/api/category/all`, { headers }).catch(() => []);
  const catByName = new Map(listify(afterCatsRaw).map(c => [String(c.name || "").toLowerCase(), c]));
  // console.log("DEBUG categories:", Array.from(catByName.keys()));

  // 2) Upsert services
  // 2) Upsert services
const existingSvcsRaw = await req(`/api/service/all`, { headers }).catch(() => []);
const svcMap = new Map(listify(existingSvcsRaw).map(s => [String(s.name || "").toLowerCase(), s]));

// petit util pour construire un favicon depuis l'URL du site
const faviconFromWebsite = (site) => {
  try {
    const url = new URL(site);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(site)}&sz=64`;
  }
};

for (const s of SERVICES) {
  const key = s.name.toLowerCase();
  if (svcMap.has(key)) { console.log(`✓ Service existe: ${s.name}`); continue; }

  const cat = catByName.get(String(s.category).toLowerCase());
  if (!cat?.id) { console.log(`! Skip ${s.name}: category introuvable (${s.category})`); continue; }

  // champs requis: description + logo
  const description = s.description && String(s.description).trim()
    ? s.description.trim()
    : `Service ${s.name}`;
  const logo = s.logo && String(s.logo).trim()
    ? s.logo.trim()
    : faviconFromWebsite(s.website || "https://example.com");

  const payload = {
    name: s.name,
    description,                // ← requis
    provider: s.provider || s.name,
    logo,                       // ← requis (une URL convient)
    website: s.website || null,
    status: "active",
    currency: "EUR",
    category_id: cat.id,        // ← requis
  };

  try {
    const created = await req(`/api/service/create`, {
      method: "POST", headers, body: JSON.stringify(payload),
    });
    console.log(`+ Service: ${created?.name || s.name}`);
  } catch (e) {
    console.log(`✗ Service ${s.name} -> ${e.message}`);
  }
}

}

main().catch(e => { console.error(e); process.exit(1); });

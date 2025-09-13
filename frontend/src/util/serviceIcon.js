// src/utils/serviceIcon.js

// Map nom → domaine (ajoute/édite au besoin)
const SERVICE_DOMAINS = {
  'Netflix': 'netflix.com',
  'Amazon Prime Video': 'primevideo.com',
  'Disney+': 'disneyplus.com',
  'Canal+': 'canalplus.com',
  'YouTube Premium': 'youtube.com',
  'Spotify': 'spotify.com',
  'Deezer': 'deezer.com',
  'Apple Music': 'music.apple.com',
  'Dropbox': 'dropbox.com',
  'Google One': 'one.google.com',
  'iCloud+': 'icloud.com',
  'Microsoft 365': 'microsoft.com',
  'Adobe Creative Cloud': 'adobe.com',
  'Orange': 'orange.fr',
  'SFR': 'sfr.fr',
  'Bouygues Telecom': 'bouyguestelecom.fr',
  'Free': 'free.fr',
};

// Génère une URL PNG depuis un domaine (Google S2 favicons, fiable et léger)
const favicon = (domain) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

// Retourne une URL d'icône OU null si rien trouvé
export function getServiceIconUrl(serviceOrName) {
  const s = serviceOrName || {};
  const name = (s.name || s.title || s).trim?.() || '';

  // 1) l’API fournit déjà quelque chose ?
  // (ton backend a un champ "logo", mais on couvre aussi d’autres noms possibles)
  if (s.logo) return s.logo;
  if (s.logo_url) return s.logo_url;
  if (s.icon) return s.icon;
  if (s.image) return s.image;
  if (s.website || s.url) return favicon(s.website || s.url);

  const domain = SERVICE_DOMAINS[name];
  if (domain) return favicon(domain);

  return null;
}

// Map nom → domaine (ajoute/édite au besoin)
const SERVICE_DOMAINS = {
  'Amazon Prime Video': 'primevideo.com',
  'Disney+': 'disneyplus.com',
  'Canal+': 'canalplus.com',
  'OCS': 'ocs.fr',
  'Spotify': 'spotify.com',
  'Apple Music': 'apple.com',
  'YouTube Premium': 'youtube.com',
  'Deezer': 'deezer.com',
  'Orange': 'orange.fr',
  'SFR': 'sfr.fr',
  'Bouygues Telecom': 'bouyguestelecom.fr',
  'Free': 'free.fr',
  'Microsoft 365': 'microsoft.com',
  'Google One': 'one.google.com',
  'iCloud+': 'icloud.com',
  'Dropbox': 'dropbox.com',
  'Adobe Creative Cloud': 'adobe.com',
  'Xbox Game Pass': 'xbox.com',
  'PlayStation Plus': 'playstation.com',
  'Nintendo Switch Online': 'nintendo.com',
};

// Génère une URL PNG depuis un domaine (Google S2 favicons, fiable et léger)
const favicon = (domain) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

export function getServiceIconUrl(serviceOrName) {
  const s = serviceOrName || {};
  const name = (s.name || s.title || s).trim?.() || '';

  // 1) si l'API fournit déjà un logo/website → on l’utilise
  if (s.logo_url) return s.logo_url;
  if (s.website || s.url) return favicon(s.website || s.url);

  // 2) mapping nom→domaine
  const domain = SERVICE_DOMAINS[name];
  if (domain) return favicon(domain);

  // 3) rien trouvé → null (le UI affichera un avatar texte)
  return null;
}

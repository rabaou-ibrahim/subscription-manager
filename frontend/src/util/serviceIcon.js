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

const favicon = (domain) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

export function getServiceIconUrl(serviceOrName) {
  const s = serviceOrName || {};
  const name = (s.name || s.title || s).trim?.() || '';

  if (s.logo) return s.logo;
  if (s.logo_url) return s.logo_url;
  if (s.icon) return s.icon;
  if (s.image) return s.image;
  if (s.website || s.url) return favicon(s.website || s.url);

  const domain = SERVICE_DOMAINS[name];
  if (domain) return favicon(domain);

  return null;
}

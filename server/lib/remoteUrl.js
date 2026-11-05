const IMAGE_DOMAINS = [
  'instagram.com', 'cdninstagram.com', 'fbcdn.net',
  'flashscore.com', 'flashscore.it', 'flashscore.ninja',
  'diretta.it', 'livesport.com', 'livesport-ott-images.ssl.cdn.cra.cz',
  'thesportsdb.com',
];

function validateRemoteUrl(value, domains = IMAGE_DOMAINS) {
  if (typeof value !== 'string') return { valid: false, status: 400, message: 'URL malformato' };
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        (url.port && !['80', '443'].includes(url.port))) {
      return { valid: false, status: 400, message: 'Protocollo o credenziali URL non consentiti' };
    }
    if (!domains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) {
      return { valid: false, status: 403, message: 'Dominio non autorizzato' };
    }
    return { valid: true };
  } catch {
    return { valid: false, status: 400, message: 'URL malformato' };
  }
}

function validateRedirect(options, domains = IMAGE_DOMAINS) {
  const validation = validateRemoteUrl(`${options.protocol}//${options.hostname}${options.port ? `:${options.port}` : ''}${options.path || '/'}`, domains);
  if (!validation.valid) throw new Error(validation.message);
}

module.exports = { validateRemoteUrl, validateRedirect };

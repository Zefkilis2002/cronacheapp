const config = {
  // Se siamo in locale (localhost) usiamo il server locale a porta 5000
  // Altrimenti usiamo l'URL di produzione (che ora userà le Cloud Functions tramite rewrite)
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://cronacheapp.web.app'
};

export default config;
const hostname = typeof window === 'undefined' ? '' : window.location.hostname;
const config = {
  API_BASE_URL: (process.env.REACT_APP_API_BASE_URL || (['localhost', '127.0.0.1', '[::1]'].includes(hostname)
    ? 'http://localhost:5000'
    : 'https://cronacheapp.onrender.com')).replace(/\/$/, '')
};

export default config;

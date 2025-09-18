// Script de debugging para inspeccionar peticiones de red
// Agregar en la consola del navegador para interceptar todas las peticiones fetch

(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(...args) {
    const [url, options = {}] = args;
    
    // Solo logear peticiones a endpoints de heartbeat/session
    if (url.includes('/session/heartbeat') || url.includes('/session/end')) {
      console.group('🔍 [DEBUG] Fetch intercepted:', url);
      console.log('URL:', url);
      console.log('Options:', options);
      console.log('Cookies (document.cookie):', document.cookie);
      console.log('Credentials mode:', options.credentials);
      console.log('Headers:', options.headers);
      console.groupEnd();
    }
    
    return originalFetch.apply(this, args).then(response => {
      if (url.includes('/session/heartbeat') || url.includes('/session/end')) {
        console.group('📡 [DEBUG] Fetch response:', url);
        console.log('Status:', response.status);
        console.log('Headers:', [...response.headers.entries()]);
        console.log('Set-Cookie headers:', response.headers.get('set-cookie'));
        console.groupEnd();
      }
      return response;
    });
  };
  
  console.log('🔍 Network debugging enabled for session endpoints');
})();
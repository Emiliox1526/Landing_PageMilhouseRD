// js/includeHeader.js
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('header-container');
    if (!container) {
        console.error('No existe <div id="header-container"> en esta página.');
        return;
    }

    fetch('/includes/header.html')
        .then((resp) => {
            if (!resp.ok) throw new Error(`Error ${resp.status} al cargar header.html`);
            return resp.text();
        })
        .then((html) => {
            // 1) Inyectamos el HTML del header
            container.innerHTML = html;
            const navEl    = container.querySelector('nav');

            // 1.a) Ajustes visuales del nav
            if (navEl) {
                navEl.classList.add('navbar', 'navbar-expand-lg', 'navbar-dark', 'nav-transparent');
                navEl.style.backgroundColor = 'var(--vino)';
                navEl.style.boxShadow       = '0 2px 4px rgba(0,0,0,0.1)';
                const brandEl = navEl.querySelector('.navbar-brand');
                if (brandEl) {
                    brandEl.style.color = 'var(--vino)';
                }
            }

            // 2) Lógica sencilla de login para admin
            const adminDropdown = document.getElementById('adminDropdown');
            if (!adminDropdown) {
                console.error('No se encontró #adminDropdown.');
                return;
            }

            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            console.log('[Header] isAdmin status:', isAdmin);
            
            if (isAdmin) {
                // Usuario está logueado - mostrar botón admin
                adminDropdown.classList.remove('d-none');
                
                // Configurar el botón de logout
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log('[Header] Cerrando sesión...');
                        
                        // Limpiar el estado de autenticación
                        localStorage.removeItem('isAdmin');
                        
                        // Redirigir a la página principal
                        window.location.href = '/index.html';
                    });
                } else {
                    console.error('[Header] No se encontró el botón de logout');
                }
            } else {
                // Usuario no está logueado - ocultar botón admin
                adminDropdown.classList.add('d-none');
            }

            // 3) Cambio de fondo según página
            if (navEl) {
                const isHome = location.pathname.endsWith('/index.html') || location.pathname === '/';
                navEl.classList.add(isHome ? 'navbar-gradiente' : 'bg-vino');
            }
        })
        .catch((err) => {
            console.error('Error al cargar el header:', err);
        });
});

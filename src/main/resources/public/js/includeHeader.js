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
            const loginBtn = document.getElementById('loginBtn');
            const adminDropdown = document.getElementById('adminDropdown');
            if (!loginBtn || !adminDropdown) {
                console.error('No se encontraron #loginBtn o #adminDropdown.');
                return;
            }

            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            if (isAdmin) {
                loginBtn.classList.add('d-none');
                adminDropdown.classList.remove('d-none');
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', e => {
                        e.preventDefault();
                        localStorage.removeItem('isAdmin');
                        window.location.href = '/index.html';
                    });
                }
            } else {
                loginBtn.classList.remove('d-none');
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

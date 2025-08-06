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

            // 2) Elementos de login y perfil
            const loginBtn        = document.getElementById('loginBtn');
            const profileDropdown = document.getElementById('profileDropdown');
            const dashboardItem   = document.getElementById('dashboardItem');
            if (!loginBtn || !profileDropdown) {
                console.error('No se encontraron #loginBtn y/o #profileDropdown.');
                return;
            }

            // 3) Lógica existente: uso de localStorage para login manual
            const token = localStorage.getItem('jwt');
            if (token) {
                loginBtn.classList.add('d-none');
                profileDropdown.classList.remove('d-none');
                const username = localStorage.getItem('userName') || 'Perfil';
                const navUsernameSpan = document.getElementById('nav-username');
                if (navUsernameSpan) navUsernameSpan.textContent = username;
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem('jwt');
                        localStorage.removeItem('userName');
                        localStorage.removeItem('role');
                        document.cookie = 'jwt=; Path=/; Max-Age=0';
                        window.location.href = '../index.html';
                    });
                }
                if (dashboardItem) {
                    const role = localStorage.getItem('role');
                    const isAdmin = role && role.toLowerCase() === 'admin';
                    dashboardItem.classList.toggle('d-none', !isAdmin);
                }
            } else {
                loginBtn.classList.remove('d-none');
                profileDropdown.classList.add('d-none');
                if (dashboardItem) dashboardItem.classList.add('d-none');
            }

            // ——— Nuevo: comprobar sesión con cookie JWT y endpoint /api/auth/me ———
            fetch('/api/auth/me', { credentials: 'include' })
                .then(res => {
                    if (!res.ok) throw new Error('No autenticado');
                    return res.json();
                })
                .then(({ name, email, role }) => {
                    // Actualizamos localStorage con datos frescos
                    localStorage.setItem('userName', name);
                    localStorage.setItem('userEmail', email);
                    if (role) localStorage.setItem('role', role);

                    // Mostramos perfil y ocultamos loginBtn
                    loginBtn.classList.add('d-none');
                    profileDropdown.classList.remove('d-none');
                    const navUsernameSpan = document.getElementById('nav-username');
                    if (navUsernameSpan) navUsernameSpan.textContent = name;

                    // Mostrar menu de admin si aplica
                    if (dashboardItem) {
                        const isAdmin = role && role.toLowerCase() === 'admin';
                        dashboardItem.classList.toggle('d-none', !isAdmin);
                    }
                })
                .catch(() => {
                    // No autenticado o error: nada que cambiar
                });

            // 4) Cambio de fondo según página
            if (navEl) {
                const isHome = location.pathname.endsWith('/index.html') || location.pathname === '/';
                navEl.classList.add(isHome ? 'navbar-gradiente' : 'bg-vino');
            }
        })
        .catch((err) => {
            console.error('Error al cargar el header:', err);
        });
});

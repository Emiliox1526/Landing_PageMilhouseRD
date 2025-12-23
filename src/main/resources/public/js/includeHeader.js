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

            // 2) Lógica de autenticación - verificar con backend
            const adminDropdown = document.getElementById('adminDropdown');
            if (!adminDropdown) {
                console.error('No se encontró #adminDropdown.');
                return;
            }

            // Verificar sesión con el backend
            fetch('/api/auth/validate', {
                credentials: 'include'
            })
            .then(resp => resp.json())
            .then(data => {
                const isAuthenticated = data.success && data.authenticated;
                console.log('[Header] Authentication status:', isAuthenticated);
                
                // Sincronizar localStorage con el estado del backend
                if (isAuthenticated) {
                    localStorage.setItem('isAdmin', 'true');
                    adminDropdown.classList.remove('d-none');
                } else {
                    localStorage.removeItem('isAdmin');
                    adminDropdown.classList.add('d-none');
                }
                
                // Configurar el botón de logout
                if (isAuthenticated) {
                    const logoutBtn = document.getElementById('logoutBtn');
                    if (logoutBtn) {
                        // Remove any existing listener to prevent duplicates
                        const newLogoutBtn = logoutBtn.cloneNode(true);
                        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
                        
                        newLogoutBtn.addEventListener('click', async (e) => {
                            e.preventDefault();
                            console.log('[Header] Cerrando sesión...');
                            
                            try {
                                // Llamar al endpoint de logout
                                await fetch('/api/auth/logout', {
                                    method: 'POST',
                                    credentials: 'include'
                                });
                            } catch (error) {
                                console.error('Error al cerrar sesión:', error);
                            }
                            
                            // Limpiar el estado de autenticación
                            localStorage.removeItem('isAdmin');
                            
                            // Redirigir a la página principal
                            window.location.href = '/index.html';
                        });
                    } else {
                        console.error('[Header] No se encontró el botón de logout');
                    }
                }
            })
            .catch(err => {
                console.error('[Header] Error validating session:', err);
                localStorage.removeItem('isAdmin');
                adminDropdown.classList.add('d-none');
            });

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

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (username === 'Milhouse' && password === 'Desiree2009') {
            localStorage.setItem('isAdmin', 'true');
            window.location.href = '/index.html';
        } else {
            alert('Credenciales inválidas');
        }
    });
});

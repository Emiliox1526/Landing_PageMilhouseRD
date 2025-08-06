// js/includeFooter.js
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('footer-container');
    if (!container) {
        console.error('No existe <div id="footer-container"> en esta página.');
        return;
    }

    fetch('includes/footer.html')
        .then(resp => {
            if (!resp.ok) throw new Error(`Error ${resp.status} al cargar footer.html`);
            return resp.text();
        })
        .then(html => {
            container.innerHTML = html;
            setupNewsletter(container);
        })
        .catch(err => console.error('[includeFooter] Error:', err));

    function setupNewsletter(root) {
        const form = root.querySelector('#newsletter-form');
        if (!form) return;
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const email = document.getElementById('newsletter-email').value.trim();
            if (!email) return;
            try {
                await fetch('/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                form.reset();
                alert('¡Gracias por suscribirte!');
            } catch(err) {
                console.error('Newsletter', err);
                alert('No se pudo enviar el correo');
            }
        });
    }
});

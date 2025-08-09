const propertiesContainer = document.getElementById('propertiesContainer');
const verPropiedadesBtn = document.getElementById('verPropiedadesBtn');
const heroVerPropiedades = document.getElementById('heroVerPropiedades');

console.log('[INDEX] script cargado');

/* ----------------------------- Helpers ----------------------------- */
function extractId(doc) {
    const raw = doc?._id ?? doc?.id;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;

    if (typeof raw === 'object') {
        if (raw.$oid) return String(raw.$oid);
        if (raw.oid)  return String(raw.oid);
        if (typeof raw.toHexString === 'function') {
            try { return raw.toHexString(); } catch {}
        }
    }
    const m = JSON.stringify(raw).match(/[0-9a-fA-F]{24}/);
    return m ? m[0] : '';
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getMainImage(p) {
    if (Array.isArray(p?.images) && p.images[0]) return p.images[0];
    return 'https://via.placeholder.com/800x450?text=Propiedad';
}

function getLocationText(loc) {
    if (!loc) return '';
    if (typeof loc === 'string') return loc;
    const parts = [loc.sector, loc.city, loc.province, loc.country].filter(Boolean);
    return parts.join(', ');
}

function formatPrice(p) {
    if (p?.priceFormatted) return p.priceFormatted;
    if (typeof p?.price === 'number') {
        try {
            const currency = p?.currency || 'USD';
            return new Intl.NumberFormat('es-DO', { style: 'currency', currency }).format(p.price);
        } catch {
            return `$${p.price.toLocaleString()}`;
        }
    }
    return '';
}

/* ---------------------------- Fetch helper --------------------------- */
async function fetchJSON(url) {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    console.log('[INDEX] fetch', url, res.status, res.statusText);
    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (e) {
        console.error('[INDEX] No se pudo parsear JSON. Respuesta cruda:', text);
        throw e;
    }
    return { ok: res.ok, status: res.status, data };
}

function coerceToArray(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
        const keys = ['properties','data','results','items','content','list'];
        for (const k of keys) {
            if (Array.isArray(data[k])) return data[k];
        }
        const firstArray = Object.values(data).find(Array.isArray);
        if (firstArray) return firstArray;
    }
    return [];
}

/* ---------------------------- Render list --------------------------- */
async function cargarPropiedades() {
    if (!propertiesContainer) return;
    propertiesContainer.innerHTML = '';
    propertiesContainer.className = 'row g-3';

    try {
        const { ok, status, data } = await fetchJSON('/api/properties');
        if (!ok) throw new Error(`HTTP ${status}`);

        const list = coerceToArray(data);
        console.log('[INDEX] tamaño lista:', list.length, { keys: data && typeof data === 'object' ? Object.keys(data) : null });
        if (!Array.isArray(list) || list.length === 0) {
            propertiesContainer.innerHTML = '<p class="text-muted">No hay propiedades disponibles.</p>';
            return;
        }

        // Diagnóstico: ver ids y títulos
        try {
            console.table(list.map(p => ({ id: extractId(p), title: p?.title })));
        } catch (_) {}

        list.forEach((property) => {
            const id = extractId(property);
            if (!id) return;

            const col = document.createElement('div');
            col.className = 'col-md-4';

            const link = document.createElement('a');
            link.href = `property.html?id=${encodeURIComponent(id)}`;
            link.className = 'text-decoration-none text-dark';
            link.setAttribute('data-id', id);

            const mainImg = getMainImage(property);
            const title = escapeHtml(property?.title || 'Propiedad');
            const propType = escapeHtml(property?.type || '');
            const saleType = escapeHtml(property?.saleType || '');
            const locationText = escapeHtml(getLocationText(property?.location));
            const priceText = escapeHtml(formatPrice(property));
            const beds = property?.bedrooms ?? null;
            const baths = property?.bathrooms ?? null;
            const park = property?.parking ?? null;
            const area = property?.area ?? null;
            const areaUnit = property?.areaUnit ?? 'm²';

            const card = document.createElement('div');
            card.className = 'card h-100 shadow-sm';
            card.innerHTML = `
        <div class="ratio ratio-16x9">
          <img src="${mainImg}" alt="${title}" class="card-img-top" loading="lazy" style="object-fit: cover;">
        </div>
        <div class="card-body">
          <div class="d-flex flex-wrap gap-2 mb-2">
            ${propType ? `<span class="badge text-bg-primary">${propType}</span>` : ''}
            ${saleType ? `<span class="badge text-bg-secondary">${saleType}</span>` : ''}
          </div>

          <h5 class="card-title mb-1">${title}</h5>
          ${locationText ? `<div class="text-muted small mb-2"><i class="bi bi-geo-alt-fill me-1"></i>${locationText}</div>` : ''}

          <div class="d-flex flex-wrap gap-3 small text-muted mb-2">
            ${Number.isFinite(beds) ? `<span><i class="bi bi-door-open me-1"></i>${beds} hab</span>` : ''}
            ${Number.isFinite(baths) ? `<span><i class="bi bi-droplet me-1"></i>${baths} baños</span>` : ''}
            ${Number.isFinite(park) ? `<span><i class="bi bi-car-front me-1"></i>${park} parqueos</span>` : ''}
            ${Number.isFinite(area) ? `<span><i class="bi bi-aspect-ratio me-1"></i>${area} ${escapeHtml(areaUnit)}</span>` : ''}
          </div>

          <p class="fw-bold fs-5 mb-0">${priceText || ''}</p>
        </div>
      `;

            link.appendChild(card);
            col.appendChild(link);
            propertiesContainer.appendChild(col);
        });
    } catch (error) {
        console.error('Error al cargar las propiedades:', error);
        propertiesContainer.innerHTML = `
      <div class="alert alert-danger" role="alert">
        No se pudieron cargar las propiedades. Intenta de nuevo más tarde.
      </div>`;
    }
}

/* --------------------------- Event wiring --------------------------- */
if (verPropiedadesBtn) {
    verPropiedadesBtn.addEventListener('click', cargarPropiedades);
}

if (heroVerPropiedades) {
    heroVerPropiedades.addEventListener('click', (e) => {
        e.preventDefault();
        cargarPropiedades();
        const section = document.getElementById('properties');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
}

/* Auto-cargar al abrir la página */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[INDEX] DOMContentLoaded');
    cargarPropiedades();
});

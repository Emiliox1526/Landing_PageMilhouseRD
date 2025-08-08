// =========[ INDEX DEBUG LOGS ]=========
console.info(`[INDEX] Script cargado @ ${new Date().toISOString()}`);

const propertiesContainer = document.getElementById('propertiesContainer');
const verPropiedadesBtn   = document.getElementById('verPropiedadesBtn');
const heroVerPropiedades  = document.getElementById('heroVerPropiedades');

console.debug('[INDEX] Refs:', {
    hasPropertiesContainer: !!propertiesContainer,
    hasVerPropiedadesBtn: !!verPropiedadesBtn,
    hasHeroVerPropiedades: !!heroVerPropiedades,
});

// Solo para confirmar que el HTML está listo (no dispara la carga)
document.addEventListener('DOMContentLoaded', () => {
    console.info('[INDEX] DOMContentLoaded');
});

async function cargarPropiedades() {
    const t0 = performance.now();
    console.group('[INDEX] cargarPropiedades()');
    try {
        if (!propertiesContainer) {
            console.error('[INDEX] #propertiesContainer no encontrado. Abortando render.');
            console.groupEnd();
            return;
        }

        console.log('[INDEX] Limpiando contenedor y seteando clases…');
        propertiesContainer.innerHTML = '';
        propertiesContainer.className = 'row g-3';

        const url = '/api/properties';
        console.time('[INDEX] fetch /api/properties');
        console.log('[INDEX] Haciendo fetch:', url);

        const response = await fetch(url);

        console.timeEnd('[INDEX] fetch /api/properties');
        console.log('[INDEX] Respuesta:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
        });

        if (!response.ok) {
            throw new Error(`Network response not ok (status ${response.status})`);
        }

        console.time('[INDEX] response.json()');
        const properties = await response.json();
        console.timeEnd('[INDEX] response.json()');

        const count = Array.isArray(properties) ? properties.length : 0;
        console.info(`[INDEX] Propiedades recibidas: ${count}`);

        if (!Array.isArray(properties)) {
            console.warn('[INDEX] La respuesta no es un array. Valor:', properties);
        } else {
            // Muestra un resumen tabular para inspección rápida
            try {
                console.table(
                    properties.map((p, i) => ({
                        idx: i,
                        _id: p?._id,
                        id: p?.id,
                        title: p?.title,
                        city: p?.location?.city,
                        area: p?.location?.area,
                        priceFormatted: p?.priceFormatted,
                    }))
                );
            } catch (e) {
                console.warn('[INDEX] No se pudo imprimir console.table, detalle:', e);
            }
        }

        let appended = 0;

        properties?.forEach((property, idx) => {
            console.groupCollapsed(`[INDEX] Render card #${idx + 1}`);
            try {
                console.log('[INDEX] property cruda:', property);

                const id = String(property?._id ?? property?.id ?? '').trim();
                console.log('[INDEX] ID resuelto:', id);

                if (!id) {
                    console.warn('[INDEX] ID vacío o inválido. Se omite esta card.');
                    console.groupEnd();
                    return;
                }

                const href = `property.html?id=${encodeURIComponent(id)}`;
                console.log('[INDEX] Enlace generado:', href);

                const col = document.createElement('div');
                col.className = 'col-md-4';
                console.log('[INDEX] <div.col-md-4> creado.');

                const link = document.createElement('a');
                link.href = href;
                link.className = 'text-decoration-none text-dark';
                console.log('[INDEX] <a> creado y configurado.');

                const title = property?.title ?? 'Sin título';
                const city = property?.location?.city || '';
                const area = property?.location?.area || '';
                const price = property?.priceFormatted || '';

                const card = document.createElement('div');
                card.className = 'card h-100';
                card.style.cursor = 'pointer';
                card.innerHTML = `
          <div class="card-body">
            <h5 class="card-title">${title}</h5>
            <p class="card-text"><i class="bi bi-geo-alt-fill me-1"></i>${city} ${area}</p>
            <p class="card-text fw-bold">${price}</p>
          </div>
        `;
                console.log('[INDEX] <div.card> creado con innerHTML.');

                link.appendChild(card);
                col.appendChild(link);
                propertiesContainer.appendChild(col);
                appended++;
                console.log('[INDEX] Card agregada al DOM. Total appended:', appended);
            } catch (cardErr) {
                console.error('[INDEX] Error al construir/adjuntar card:', cardErr);
            } finally {
                console.groupEnd();
            }
        });

        console.info(`[INDEX] Render finalizado. Cards agregadas: ${appended}/${count}`);
        const t1 = performance.now();
        console.info(`[INDEX] Duración total cargarPropiedades(): ${(t1 - t0).toFixed(1)} ms`);
    } catch (error) {
        console.error('[INDEX] Error al cargar las propiedades:', error);
        if (propertiesContainer) {
            propertiesContainer.innerHTML = '<p>No se pudieron cargar las propiedades.</p>';
        }
    } finally {
        console.groupEnd();
    }
}

// Eventos
if (verPropiedadesBtn) {
    verPropiedadesBtn.addEventListener('click', () => {
        console.log('[INDEX] Click en #verPropiedadesBtn → cargarPropiedades()');
        cargarPropiedades();
    });
} else {
    console.warn('[INDEX] #verPropiedadesBtn no existe; no se adjunta listener.');
}

if (heroVerPropiedades) {
    heroVerPropiedades.addEventListener('click', (e) => {
        console.log('[INDEX] Click en #heroVerPropiedades → prevenir default y cargar');
        e.preventDefault();
        cargarPropiedades();

        const section = document.getElementById('properties');
        if (section) {
            console.log('[INDEX] Haciendo scroll a #properties…');
            section.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.warn('[INDEX] #properties no encontrado para scroll.');
        }
    });
} else {
    console.warn('[INDEX] #heroVerPropiedades no existe; no se adjunta listener.');
}

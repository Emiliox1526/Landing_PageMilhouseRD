document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');

    // Intentamos extraer el id de la URL en caso de que venga como segmento
    if (!id) {
        const parts = window.location.pathname.split('/').filter(Boolean);
        id = parts[parts.length - 1];
    }

    if (!id) {
        console.error('No se proporcionó ningún ID de propiedad');
        return;
    }

    try {
        const response = await fetch(`/api/properties/${id}`);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const property = await response.json();

        document.title = property.title || 'Detalle de Propiedad';

        const setText = (sel, txt) => {
            const el = document.querySelector(sel);
            if (el) el.textContent = txt;
        };

        setText('.property-id', `ID: ${id}`);
        setText('.property-title', property.title);
        setText('.property-header .badge', property.saleType);
        setText('.property-header .h4', property.priceFormatted);
        setText('.property-details p', property.descriptionParagraph);

        // Ubicación
        const locEl = document.querySelector('.property-header .text-muted.mb-1');
        if (locEl) {
            const city = property.location?.city || '';
            const area = property.location?.area || '';
            locEl.innerHTML = `<i class="bi bi-geo-alt-fill me-1"></i>${city}${city && area ? ', ' : ''}${area}`;
        }

        // Estadísticas
        const stats = document.querySelectorAll('.property-header .d-inline-flex > div');
        if (stats.length >= 4) {
            stats[0].innerHTML = `<i class="bi bi-house-door-fill me-1"></i>${property.bedrooms} Dorm.`;
            stats[1].innerHTML = `<i class="bi bi-bath me-1"></i>${property.bathrooms} Baños`;
            stats[2].innerHTML = `<i class="bi bi-car-front-fill me-1"></i>${property.parking} Parqueos`;
            stats[3].innerHTML = `<i class="bi bi-arrows-fullscreen me-1"></i>${property.area} m²`;
        }

        // Features
        const featuresList = document.querySelector('.property-details ul');
        featuresList.innerHTML = '';
        (property.features || []).forEach(f => {
            const li = document.createElement('li');
            li.className = 'col-md-6 mb-2';
            li.innerHTML = `<i class="bi bi-check-circle-fill text-success me-1"></i>${f}`;
            featuresList.appendChild(li);
        });

        // Amenities
        const amenContainer = document.querySelector('.property-details .row.gy-2');
        amenContainer.innerHTML = '';
        (property.amenities || []).forEach(a => {
            const div = document.createElement('div');
            div.className = 'col-6 col-md-4 col-lg-3';
            div.innerHTML = `<i class="bi bi-circle-fill text-primary me-1"></i>${a}`;
            amenContainer.appendChild(div);
        });

        // Tipologías
        const tbody = document.querySelector('.property-typology tbody');
        tbody.innerHTML = '';
        (property.units || []).forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${u.name}</td>
        <td>${u.floor}</td>
        <td>${u.bedrooms}</td>
        <td>${u.bathrooms}</td>
        <td>${u.parking}</td>
        <td>${u.zone}</td>
        <td>${u.terrace}</td>
        <td>${u.priceFormatted}</td>
      `;
            tbody.appendChild(tr);
        });

        // Galería
        const gallery = document.querySelector('#galleryCarousel .carousel-inner');
        gallery.innerHTML = '';
        (property.images || []).forEach((img, i) => {
            const item = document.createElement('div');
            item.className = 'carousel-item' + (i === 0 ? ' active' : '');
            item.innerHTML = `<img src="${img.src}" class="d-block w-100" alt="Foto ${i+1}">`;
            gallery.appendChild(item);
        });

    } catch (err) {
        console.error('Error al cargar la propiedad:', err);
    }
});

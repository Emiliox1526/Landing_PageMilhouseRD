document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');

    // Intentamos extraer el id de la URL en caso de que venga como segmento
    if (!id) {
        const parts = window.location.pathname.split('/').filter(Boolean);
        id = parts[parts.length - 1];
    }

    if (!id) {
        console.error('No property id provided');
        return;
    }

    try {
        const response = await fetch(`/api/properties/${id}`);
        if (!response.ok) throw new Error('Error en la respuesta de la red');
        const property = await response.json();

        // Reflejamos el id para permitir referencia desde formularios u otras acciones
        const propertyIdEl = document.querySelector('.property-id');
        if (propertyIdEl) propertyIdEl.textContent = `ID: ${id}`;

        document.title = property.title || 'Propiedad';

        const titleEl = document.querySelector('.property-title');
        if (titleEl) titleEl.textContent = property.title || '';

        const locationEl = document.querySelector('.property-header .text-muted');
        if (locationEl) {
            const city = property.location?.city || '';
            const area = property.location?.area || '';
            locationEl.innerHTML = `<i class="bi bi-geo-alt-fill me-1"></i>${city}, ${area}`;
        }

        const saleTypeEl = document.querySelector('.property-header .badge');
        if (saleTypeEl) saleTypeEl.textContent = property.saleType || '';

        const priceEl = document.querySelector('.property-header .h4');
        if (priceEl) priceEl.textContent = property.priceFormatted || '';

        const stats = document.querySelectorAll('.property-header .d-inline-flex > div');
        if (stats.length >= 4) {
            stats[0].innerHTML = `<i class="bi bi-house-door-fill me-1"></i>${property.bedrooms} Dorm.`;
            stats[1].innerHTML = `<i class="bi bi-bath me-1"></i>${property.bathrooms} Baños`;
            stats[2].innerHTML = `<i class="bi bi-car-front-fill me-1"></i>${property.parking} Parqueos`;
            stats[3].innerHTML = `<i class="bi bi-arrows-fullscreen me-1"></i>${property.area} m²`;
        }

        const descEl = document.querySelector('.property-details p');
        if (descEl) descEl.textContent = property.descriptionParagraph || '';

        const featuresList = document.querySelector('.property-details ul');
        if (featuresList) {
            featuresList.innerHTML = '';
            (property.features || []).forEach(feat => {
                const li = document.createElement('li');
                li.className = 'col-md-6 mb-2';
                li.innerHTML = `<i class="bi bi-check-circle-fill text-success me-1"></i>${feat}`;
                featuresList.appendChild(li);
            });
        }

        const amenitiesContainer = document.querySelector('.property-details .row.gy-2');
        if (amenitiesContainer) {
            amenitiesContainer.innerHTML = '';
            (property.amenities || []).forEach(am => {
                const div = document.createElement('div');
                div.className = 'col-6 col-md-4 col-lg-3';
                div.innerHTML = `<i class="bi bi-circle-fill text-primary me-1"></i>${am}`;
                amenitiesContainer.appendChild(div);
            });
        }

        const unitsTbody = document.querySelector('.property-typology tbody');
        if (unitsTbody) {
            unitsTbody.innerHTML = '';
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
                unitsTbody.appendChild(tr);
            });
        }

        const galleryInner = document.querySelector('#galleryCarousel .carousel-inner');
        if (galleryInner) {
            galleryInner.innerHTML = '';
            (property.images || []).forEach((img, idx) => {
                const div = document.createElement('div');
                div.className = 'carousel-item' + (idx === 0 ? ' active' : '');
                div.innerHTML = `<img src="${img.src}" class="d-block w-100" alt="Foto ${idx + 1}">`;
                galleryInner.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Error al cargar la propiedad:', error);
    }
});


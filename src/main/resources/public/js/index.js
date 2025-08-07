const propertiesContainer = document.getElementById('propertiesContainer');
const verPropiedadesBtn = document.getElementById('verPropiedadesBtn');

async function cargarPropiedades() {
    propertiesContainer.innerHTML = '';
    propertiesContainer.className = 'row g-3';
    try {
        const response = await fetch('/api/properties');
        if (!response.ok) {
            throw new Error('Error en la respuesta de la red');
        }
        const properties = await response.json();
        properties.forEach(property => {

            const id = property._id?.$oid || property._id;


            const col = document.createElement('div');
            col.className = 'col-md-4';

            const card = document.createElement('div');
            card.className = 'card h-100';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${property.title}</h5>
                    <p class="card-text"><i class="bi bi-geo-alt-fill me-1"></i>${property.location?.city || ''} ${property.location?.area || ''}</p>
                    <p class="card-text fw-bold">${property.priceFormatted}</p>
                </div>
            `;
            card.addEventListener('click', () => {
                window.location.href = `property.html?id=${id}`;
            });

            col.appendChild(card);
            propertiesContainer.appendChild(col);
        });
    } catch (error) {
        console.error('Error al cargar las propiedades:', error);
        propertiesContainer.innerHTML = '<p>No se pudieron cargar las propiedades.</p>';
    }
}

verPropiedadesBtn.addEventListener('click', cargarPropiedades);


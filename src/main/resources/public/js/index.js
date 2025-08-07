const propertiesContainer = document.getElementById('propertiesContainer');
const verPropiedadesBtn = document.getElementById('verPropiedadesBtn');

async function cargarPropiedades() {
    propertiesContainer.innerHTML = '';
    try {
        const response = await fetch('/api/properties');
        if (!response.ok) {
            throw new Error('Error en la respuesta de la red');
        }
        const properties = await response.json();
        properties.forEach(property => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${property.title}</h3>
                <p>${property.location?.city || ''} ${property.location?.area || ''}</p>
                <p>${property.priceFormatted}</p>
            `;
            card.addEventListener('click', () => {
                window.location.href = `property.html?id=${property._id}`;
            });
            propertiesContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar las propiedades:', error);
        propertiesContainer.innerHTML = '<p>No se pudieron cargar las propiedades.</p>';
    }
}

verPropiedadesBtn.addEventListener('click', cargarPropiedades);


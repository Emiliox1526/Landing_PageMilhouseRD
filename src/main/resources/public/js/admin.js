document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('propertyForm');
    if (!form) return;


    const API_BASE = (location.origin.includes('localhost:7070')) ? '' : 'http://localhost:7070';


    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            title: form.title.value.trim(),
            type: form.type.value,
            saleType: form.saleType.value,

            price: parseFloat(form.price.value.replace(/[^0-9.]/g, '')),


            bedrooms: parseInt(form.bedrooms.value, 10),
            bathrooms: parseInt(form.bathrooms.value, 10),
            parking: parseInt(form.parking.value, 10),
            area: form.area.value ? parseFloat(form.area.value) : undefined,
            address: form.address.value.trim(),
            latitude: form.latitude.value ? parseFloat(form.latitude.value) : undefined,
            longitude: form.longitude.value ? parseFloat(form.longitude.value) : undefined,
            descriptionParagraph: form.descriptionParagraph.value.trim(),
            features: form.features.value
                ? form.features.value.split(',').map(s => s.trim()).filter(Boolean)
                : [],
            amenities: form.amenities.value
                ? form.amenities.value.split(',').map(s => s.trim()).filter(Boolean)
                : [],
            images: form.images.value
                ? form.images.value.split(',').map(s => s.trim()).filter(Boolean)
                : []
        };

        Object.keys(data).forEach(k => {
            const v = data[k];
            if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
                delete data[k];
            }
        });

        try {
            const res = await fetch(`${API_BASE}/api/properties`, {

                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert('Propiedad guardada correctamente');
                form.reset();
            } else {
                let msg = 'Error al guardar';
                try {
                    const err = await res.json();
                    if (err.errors) {
                        msg += ': ' + err.errors.join(', ');
                    } else if (err.message) {
                        msg += ': ' + err.message;
                    }
                } catch (_) {

                    msg += ` (status ${res.status})`;

                }
                alert(msg);
            }
        } catch (err) {
            console.error(err);
            alert('Error de red');
        }
    });
});

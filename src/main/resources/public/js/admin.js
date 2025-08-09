document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('propertyForm');
    if (!form) return;

    const API_BASE = (location.origin.includes('localhost:7070')) ? '' : 'http://localhost:7070';
    console.log('[DEBUG] API_BASE:', API_BASE);
    console.log('[DEBUG] location.origin:', location.origin);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[DEBUG] Form submit triggered');

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

        console.log('[DEBUG] Data before cleaning:', JSON.parse(JSON.stringify(data)));

        Object.keys(data).forEach(k => {
            const v = data[k];
            if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
                delete data[k];
            }
        });

        console.log('[DEBUG] Final data to send:', JSON.parse(JSON.stringify(data)));

        try {
            console.log('[DEBUG] Sending POST to:', `${API_BASE}/api/properties`);
            const res = await fetch(`${API_BASE}/api/properties`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            console.log('[DEBUG] Response status:', res.status);
            console.log('[DEBUG] Response headers:', Object.fromEntries(res.headers.entries()));

            if (res.ok) {
                const jsonResp = await res.json().catch(() => null);
                console.log('[DEBUG] Response JSON:', jsonResp);
                alert('Propiedad guardada correctamente');
                form.reset();
            } else {
                let msg = 'Error al guardar';
                try {
                    const err = await res.json();
                    console.log('[DEBUG] Error response JSON:', err);
                    if (err.errors) {
                        msg += ': ' + err.errors.join(', ');
                    } else if (err.message) {
                        msg += ': ' + err.message;
                    }
                } catch (_) {
                    console.warn('[DEBUG] No JSON body in error response');
                    msg += ` (status ${res.status})`;
                }
                alert(msg);
            }
        } catch (err) {
            console.error('[DEBUG] Network error:', err);
            alert('Error de red');
        }
    });
});

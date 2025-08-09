document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('propertyForm');
  if (!form) return;

  const sameApi = /(?:localhost|127\.0\.0\.1):7070$/.test(location.host);
  const API_BASE = sameApi ? '' : 'http://localhost:7070';
  console.log('[DEBUG] API_BASE:', API_BASE, 'origin:', location.origin, 'host:', location.host);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[DEBUG] Form submit triggered');

    const data = {
      title: form.title.value.trim(),
      type: form.type.value,
      saleType: form.saleType.value,
      price: parseFloat(String(form.price.value).replace(/[^0-9.]/g, '')),
      bedrooms: parseInt(form.bedrooms.value, 10),
      bathrooms: parseInt(form.bathrooms.value, 10),
      parking: parseInt(form.parking.value, 10),
      area: form.area.value ? parseFloat(form.area.value) : undefined,
      address: form.address.value.trim(),
      latitude: form.latitude.value ? parseFloat(form.latitude.value) : undefined,
      longitude: form.longitude.value ? parseFloat(form.longitude.value) : undefined,
      descriptionParagraph: form.descriptionParagraph.value.trim(),
      features: form.features.value ? form.features.value.split(',').map(s=>s.trim()).filter(Boolean) : [],
      amenities: form.amenities.value ? form.amenities.value.split(',').map(s=>s.trim()).filter(Boolean) : [],
      images: form.images.value ? form.images.value.split(',').map(s=>s.trim()).filter(Boolean) : []
    };

    console.log('[DEBUG] Data before cleaning:', JSON.parse(JSON.stringify(data)));

    Object.keys(data).forEach(k => {
      const v = data[k];
      if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) delete data[k];
    });

    console.log('[DEBUG] Final data to send:', JSON.parse(JSON.stringify(data)));

    const url = `${API_BASE}/api/properties`;
    console.log('[DEBUG] Sending POST to:', url);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      console.log('[DEBUG] Response status:', res.status);
      console.log('[DEBUG] Response headers:', Object.fromEntries(res.headers.entries()));

      if (res.ok) {
        let json = null;
        try { json = await res.json(); } catch {}
        console.log('[DEBUG] Response JSON:', json);
        alert('Propiedad guardada correctamente');
        form.reset();
      } else {
        let msg = 'Error al guardar';
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const err = await res.json();
            console.log('[DEBUG] Error JSON:', err);
            msg += err?.errors ? ': ' + err.errors.join(', ')
                 : err?.message ? ': ' + err.message
                 : '';
          } else {
            const text = await res.text();
            console.log('[DEBUG] Error TEXT:', text);
            msg += ` (status ${res.status}) ${text.slice(0, 300)}`;
          }
        } catch (e2) {
          console.warn('[DEBUG] Failed to read error body', e2);
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


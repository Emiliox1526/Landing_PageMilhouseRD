// =========[ PROPERTY-DETAIL LOG ]=========
console.info(`[DETAIL] Script cargado @ ${new Date().toISOString()}`);

(function () {
    const $  = (sel, ctx=document) => ctx.querySelector(sel);
    const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
    const container = $('#propertyContent') || document.body;

    // Usa base absoluta solo si no estás en :7070
    const API_BASE = (location.origin.includes('localhost:7070')) ? '' : 'http://localhost:7070';

    // Helpers
    const fmtCurrency = (v, currency='USD', locale='en-US') =>
        (typeof v === 'number' && !Number.isNaN(v))
            ? new Intl.NumberFormat(locale,{style:'currency',currency,maximumFractionDigits:0}).format(v)
            : (typeof v === 'string' ? v : '');

    const textOrDash = v => (v ?? '') === '' ? '—' : v;

    const getIdFromURL = () => {
        const raw = new URLSearchParams(location.search).get('id');
        return raw ? decodeURIComponent(raw) : null;
    };

    const isApartmentType = (t) => {
        if (!t) return false;
        const s = String(t).toLowerCase();
        return ['apartamento','apartamentos','apartment','apto','penthouse','penthouses','ph'].some(k => s.includes(k));
    };

    function renderError(msg='No se pudo cargar la propiedad.'){
        container.innerHTML = `<div class="alert alert-danger my-4">${msg}</div>`;
    }
    const renderNotFound = () => renderError('Propiedad no encontrada.');

    // ========= LIGHTBOX =========
    function openLightboxFull(allUrls, startIdx=0) {
        const lb       = $('#lightbox');
        if (!lb) return;
        const lbImg    = lb.querySelector('.lightbox-img');
        const btnPrev  = lb.querySelector('.lightbox-prev');
        const btnNext  = lb.querySelector('.lightbox-next');
        const btnClose = lb.querySelector('.lightbox-close');
        const footer   = lb.querySelector('.lightbox-footer');
        const counter  = footer.querySelector('.lightbox-counter .current');
        const totalEl  = footer.querySelector('.lightbox-counter .total');
        const thumbsEl = footer.querySelector('.lightbox-thumbs');

        if (!allUrls || !allUrls.length) return;

        let idx = Math.max(0, Math.min(startIdx, allUrls.length - 1));
        const total = allUrls.length;
        totalEl.textContent = total;

        thumbsEl.innerHTML = '';
        allUrls.forEach((url, i) => {
            const t = document.createElement('img');
            t.src = url;
            t.alt = `Miniatura ${i+1}`;
            t.loading = 'lazy';
            t.addEventListener('click', () => { idx = i; update(); });
            thumbsEl.appendChild(t);
        });

        function update() {
            lbImg.src = allUrls[idx];
            counter.textContent = idx + 1;
            Array.from(thumbsEl.children).forEach((img, i) => {
                img.classList.toggle('active', i === idx);
            });
        }

        function onPrev(e){ e && e.stopPropagation(); idx = (idx - 1 + total) % total; update(); }
        function onNext(e){ e && e.stopPropagation(); idx = (idx + 1) % total; update(); }
        function onClose(){ lb.classList.remove('open'); cleanup(); }

        function onKey(e){
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft')  onPrev(e);
            if (e.key === 'ArrowRight') onNext(e);
        }
        function onBackdrop(e){ if (e.target === lb) onClose(); }
        function cleanup(){
            document.removeEventListener('keydown', onKey);
            lb.removeEventListener('click', onBackdrop);
            btnPrev.removeEventListener('click', onPrev);
            btnNext.removeEventListener('click', onNext);
            btnClose.removeEventListener('click', onClose);
        }

        btnPrev.addEventListener('click', onPrev);
        btnNext.addEventListener('click', onNext);
        btnClose.addEventListener('click', onClose);
        document.addEventListener('keydown', onKey);
        lb.addEventListener('click', onBackdrop);

        lb.classList.add('open');
        update();
    }

    // -------- Fetch con fallback a /api/properties
    async function fetchPropertyByIdWithFallback(id){
        const url = `${API_BASE}/api/properties/${encodeURIComponent(id)}`;
        const res = await fetch(url);

        if (res.status === 404){
            const list = await fetch(`${API_BASE}/api/properties`).then(r=>r.ok?r.json():[]);
            return list.find(x => String(x?._id)===String(id) || String(x?.id)===String(id)) || null;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        return res.json();
    }

    // ------- RENDER PRINCIPAL
    function renderProperty(p){
        const title = p.title ?? 'Sin título';
        const city  = p.location?.city || '';
        const area  = p.location?.area || '';
        const country = p.location?.country || '';
        const locationText = [area, city, country].filter(Boolean).join(', ') || 'Ubicación no especificada';
        const priceText = p.priceFormatted || fmtCurrency(p.price);
        const code = p.code || (p._id || '').toString().slice(-6).toUpperCase();
        const saleType = (p.saleType || '').toString().trim();         // Venta / Alquiler
        const propType = (p.type || '').toString().trim();             // Apartamento, Casa, etc.

        const images = (p.images||[]).map(x => typeof x==='string' ? x : (x?.src||'')).filter(Boolean);
        const mainImg = images[0] || '/assets/img/house.PNG';

        const features = Array.isArray(p.features)?p.features:[];
        const amenities = Array.isArray(p.amenities)?p.amenities:[];
        const security = Array.isArray(p.security)?p.security:[];
        const interior = Array.isArray(p.interior)?p.interior:[];
        const exterior = Array.isArray(p.exterior)?p.exterior:[];
        const other    = Array.isArray(p.other)?p.other:[];

        const units = Array.isArray(p.units)?p.units:[];
        const related = Array.isArray(p.related)?p.related:[];

        // Topbar: poner el título
        const topTitle = document.getElementById('topbarTitle');
        if (topTitle) {
            topTitle.textContent = title;
            topTitle.title = title; // tooltip con el título completo
        }
        // Vista principal
        container.innerHTML = `
      <!-- HERO -->
      <section class="mb-2">
        <div class="d-flex flex-wrap align-items-center gap-2">
          ${propType ? `<span class="chip"><i class="bi bi-house-door"></i>${propType}</span>`:''}
          ${saleType ? `<span class="chip"><i class="bi bi-tags"></i>${saleType}</span>`:''}

        </div>
       
        <div class="hero-meta"><i class="bi bi-geo-alt-fill me-1"></i>${locationText}</div>
      </section>

      <!-- GALERÍA -->
      <section class="gallery my-3">
        <div class="g-main">
          <img id="mainImage" src="${mainImg}" alt="${title}" loading="eager">
          <button id="btnShowAllPhotos" class="more-btn"><i class="bi bi-grid-3x3-gap"></i> Ver todas</button>
        </div>
        ${[1,2,3,4].map(i=>{
            const src = images[i];
            return `<div>${src?`<img data-index="${i}" src="${src}" alt="Foto ${i+1}" loading="lazy">`:`<div style="height:100%;border-radius:12px;background:#eef2f7"></div>`}</div>`;
        }).join('')}
      </section>

      <div class="row g-4">
        <div class="col-12 col-lg-8">

          <!-- Stats -->
          <div class="row g-3 my-2">
            <div class="col-6 col-sm-3"><div class="stat"><div class="h5 m-0">${textOrDash(p.bedrooms)}</div><div class="lbl">Dormitorios</div></div></div>
            <div class="col-6 col-sm-3"><div class="stat"><div class="h5 m-0">${textOrDash(p.bathrooms)}</div><div class="lbl">Baños</div></div></div>
            <div class="col-6 col-sm-3"><div class="stat"><div class="h5 m-0">${textOrDash(p.parking)}</div><div class="lbl">Parqueos</div></div></div>
            <div class="col-6 col-sm-3"><div class="stat"><div class="h5 m-0">${textOrDash(p.area)}</div><div class="lbl">M²</div></div></div>
          </div>

          <!-- Descripción -->
          ${p.descriptionParagraph ? `
          <div class="card section-card mb-3">
            <div class="card-header"><h2 class="h5 m-0">Descripción</h2></div>
            <div class="card-body">
              <p class="mb-0">${p.descriptionParagraph}</p>
            </div>
          </div>`:''}

          <!-- Facilidades -->
          ${[features, amenities, security, interior, exterior, other].some(arr=>arr.length) ? `
          <div class="card section-card mb-3">
            <div class="card-header"><h2 class="h5 m-0">Lo que incluye</h2></div>
            <div class="card-body">
              <div class="row g-4">
                ${renderFacBlock('Comunes', features)}
                ${renderFacBlock('Amenidades', amenities)}
                ${renderFacBlock('Seguridad', security)}
                ${renderFacBlock('Interior', interior)}
                ${renderFacBlock('Exterior', exterior)}
                ${renderFacBlock('Otras', other)}
              </div>
            </div>
          </div>`:''}

          <!-- Tipología (solo para apartamentos/penthouse) -->
          ${(isApartmentType(propType) && units.length) ? `
          <div class="card section-card mb-3">
            <div class="card-header"><h2 class="h5 m-0">Tipología</h2></div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-typ align-middle">
                  <thead><tr>
                    <th>Nombre</th><th>Piso</th><th>Hab.</th><th>Baños</th><th>Parqueos</th><th>Área</th><th class="text-end">Precio</th>
                  </tr></thead>
                  <tbody>
                    ${units.map(u => `
                      <tr>
                        <td>${u.name||'—'}</td>
                        <td>${u.floor||u.nivel||'—'}</td>
                        <td>${u.rooms??u.bedrooms??'—'}</td>
                        <td>${u.baths??u.bathrooms??'—'}</td>
                        <td>${u.parks??u.parking??'—'}</td>
                        <td>${u.area?`${u.area} M²`:'—'}</td>
                        <td class="text-end">${fmtCurrency(u.price) || textOrDash(u.price)}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>`:''}

          <!-- Mapa (sin API key, iframe público) -->
          <div class="card section-card mb-4">
            <div class="card-header"><h2 class="h5 m-0">Ubicación</h2></div>
            <div class="card-body">
              ${renderMapEmbed(p, locationText)}
            </div>
          </div>

          <!-- Calculadora -->
          <div class="card section-card mb-5">
            <div class="card-header"><h2 class="h5 m-0">Calculadora de Préstamos</h2></div>
            <div class="card-body">
              <div id="loanCalc" class="text-muted">
                Próximamente: selector de banco, inicial y plazo. Precio base: <strong>${priceText||'—'}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Aside contacto -->
        <div class="col-12 col-lg-4">
          <div class="card section-card aside-sticky">
            <div class="card-body">
              ${priceText ? `<div class="mb-2"><span class="text-muted">Desde</span><div class="h4 m-0">${priceText}</div></div>`:''}
              <div class="d-grid gap-2">
                <a class="btn btn-primary" href="tel:+18090000000"><i class="bi bi-telephone-fill me-1"></i> Llamar</a>
                <a class="btn btn-success" href="https://wa.me/18090000000" target="_blank"><i class="bi bi-whatsapp me-1"></i> WhatsApp</a>
                <a class="btn btn-outline-secondary" href="mailto:info@milhouserd.com?subject=Interés%20en%20${encodeURIComponent(title)}"><i class="bi bi-envelope-fill me-1"></i> Enviar correo</a>
               
              </div>
              <hr/>
              <small class="text-muted">Al contactar aceptas nuestros términos de uso.</small>
            </div>
          </div>
        </div>
      </div>

     
    `;

        // ===== Interacciones =====
        // Galería
        const mainEl = $('#mainImage', container);
        const allImgs = [mainImg, ...images.slice(1)];

// Miniaturas: abrir lightbox (no cambiar la imagen grande)
        $$('.gallery img[data-index]', container).forEach(img => {
            const idx = Number(img.getAttribute('data-index')) || 0;
            img.addEventListener('click', () => {
                openLightboxFull(images.length ? images : [mainEl.src], idx);
            });
        });

// Imagen principal: también abre lightbox
        if (mainEl) {
            mainEl.addEventListener('click', () => {
                openLightboxFull(images.length ? images : [mainEl.src], 0);
            });
        }

// Botón "Ver todas"
        const btnAll = $('#btnShowAllPhotos', container);
        if (btnAll) {
            btnAll.disabled = !images.length;
            btnAll.addEventListener('click', () => {
                openLightboxFull(images.length ? images : [mainEl.src], 0);
            });
        }
        // Compartir
        const btnShare = $('#btnShare');
        if (btnShare){
            btnShare.addEventListener('click', async () => {
                try{
                    if (navigator.share){
                        await navigator.share({ title, text:`${title} – ${locationText}`, url: location.href });
                    }else{
                        await navigator.clipboard.writeText(location.href);
                        toast('Enlace copiado al portapapeles');
                    }
                }catch{}
            });
        }



    }

    function renderFacBlock(title, list){
        if (!list || !list.length) return '';
        return `
      <div class="col-12">
        <h3 class="h6 mb-2">${title}</h3>
        <ul class="fac-grid list-unstyled m-0">
          ${list.map(x=>`<li><i class="bi bi-check2 text-success me-1"></i>${x}</li>`).join('')}
        </ul>
      </div>`;
    }

    function renderMapEmbed(p, fallbackText){
        const lat = p.location?.lat, lng = p.location?.lng;
        let q = '';
        if (typeof lat === 'number' && typeof lng === 'number'){
            q = `${lat},${lng}`;
        }else{
            q = encodeURIComponent([p.title, p.location?.area, p.location?.city, p.location?.country].filter(Boolean).join(', '));
        }
        const url = `https://www.google.com/maps?q=${q}&output=embed`;
        return `
      <div class="ratio ratio-16x9">
        <iframe src="${url}" style="border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>`;
    }

    // --- Saved helpers ---
    function getSavedSet(){
        try{
            const raw = localStorage.getItem('mh_saved') || '[]';
            return new Set(JSON.parse(raw));
        }catch{ return new Set(); }
    }
    function setSavedSet(set){
        try{ localStorage.setItem('mh_saved', JSON.stringify(Array.from(set))); }catch{}
    }
    function toast(msg){
        // Simple fallback toast
        const t = document.createElement('div');
        t.textContent = msg;
        Object.assign(t.style, {
            position:'fixed', bottom:'16px', left:'50%', transform:'translateX(-50%)',
            background:'#111827', color:'#fff', padding:'8px 12px', borderRadius:'999px', zIndex:99999
        });
        document.body.appendChild(t);
        setTimeout(()=> t.remove(), 1700);
    }

    // -------- Flow
    async function init(){
        const id = getIdFromURL();
        if (!id){ renderError('Falta el parámetro "id" en la URL.'); return; }
        try{
            const p = await fetchPropertyByIdWithFallback(id);
            if (!p){ renderNotFound(); return; }
            renderProperty(p);
        }catch(e){
            console.error(e);
            renderError();
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();

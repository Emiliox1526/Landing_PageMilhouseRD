// =========[ PROPERTY-DETAIL LOG ]=========
console.info(`[DETAIL] Script cargado @ ${new Date().toISOString()}`);

(function () {
    const $  = (sel, ctx=document) => ctx.querySelector(sel);
    const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
    const container = $('#propertyContent') || document.body;
    const BANKS = [
        { id:'alaver',            name:'Alaver',                          apr:15.00 },
        { id:'alnap',             name:'ALNAP',                           apr:14.50 },
        { id:'asoc-cibao',        name:'Asoc. Cibao',                     apr:13.50 },
        { id:'apap',              name:'APAP',                            apr:15.40 },
        { id:'asoc-duarte',       name:'Asociación Duarte',               apr:14.00 },
        { id:'banco-caribe',      name:'Banco Caribe',                    apr:13.90 },
        { id:'promerica',         name:'Banco Promerica',                 apr:15.95 },
        { id:'bhd-leon',          name:'BHD León',                        apr:14.50 },
        { id:'banreservas',       name:'Banreservas',                     apr:13.20 },
        { id:'coopdeca',          name:'Coopdeca',                        apr:14.50 },
        { id:'coop-altagracia',   name:'Coop La Altagracia',              apr:13.00 },
        { id:'coop-san-jose',     name:'Coop San José',                   apr:14.00 },
        { id:'coop-maimon',       name:'Cooperativa Maimon',              apr:14.00 },
        { id:'popular-rd',        name:'Popular RD$ (ref)',               apr:14.95 },
        { id:'popular-usd-1y',    name:'Popular US$ - 1 año',             apr:9.20  },
        { id:'santa-cruz',        name:'Santa Cruz',                      apr:12.95 },
        { id:'scotiabank',        name:'Scotiabank',                      apr:14.25 },
        { id:'custom',            name:'Personalizada…',                  apr:'X' }, // editable
    ];
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


        const images = (p.images||[]).map(x => typeof x==='string' ? x : (x?.src||'')).filter(Boolean);
        const mainImg = images[0] || '/assets/img/house.PNG';

        const features = Array.isArray(p.features)?p.features:[];
        const amenities = Array.isArray(p.amenities)?p.amenities:[];
        const security = Array.isArray(p.security)?p.security:[];
        const interior = Array.isArray(p.interior)?p.interior:[];
        const exterior = Array.isArray(p.exterior)?p.exterior:[];
        const other    = Array.isArray(p.other)?p.other:[];


        const related = Array.isArray(p.related)?p.related:[];
        const propType = (p.type || '').toString().trim();
        const units    = Array.isArray(p.units) ? p.units : [];
// ——— Tasas anuales por banco (referencia) ———


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

  <!-- CONTENIDO IZQUIERDA + ASIDE DERECHA -->
  <div class="row align-items-start gx-lg-4">
<!-- Stats -->
      <div class="row g-3 my-2">
  <div class="col-6 col-sm-3">
    <div class="stat">
      <div class="h5 m-0">
        <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#ecbb6c" style="vertical-align:middle;margin-right:5px">
          <path d="M60-220v-560h60v380h330v-300h310q57.75 0 98.87 41.13Q900-617.75 900-560v340h-60v-120H120v120H60Zm219.95-237.69q-42.64 0-72.45-29.86-29.81-29.85-29.81-72.5 0-42.64 29.86-72.45 29.85-29.81 72.5-29.81 42.64 0 72.45 29.86 29.81 29.85 29.81 72.5 0 42.64-29.86 72.45-29.85 29.81-72.5 29.81ZM510-400h330v-160q0-33-23.5-56.5T760-640H510v240ZM280-517.69q17.77 0 30.04-12.27T322.31-560q0-17.77-12.27-30.04T280-602.31q-17.77 0-30.04 12.27T237.69-560q0 17.77 12.27 30.04T280-517.69Zm0-42.31Zm230-80v240-240Z"/>
        </svg>
        ${textOrDash(p.bedrooms)}
      </div>
      <div class="lbl">Dormitorios</div>
    </div>
  </div>

  <div class="col-6 col-sm-3">
    <div class="stat">
      <div class="h5 m-0">
        <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#ecbb6c" style="vertical-align:middle;margin-right:5px">
          <path d="M282.31-578.84q-29.16 0-49.58-20.45-20.42-20.45-20.42-49.17 0-29.03 20.42-49.71 20.42-20.67 49.58-20.67 29.15 0 49.57 20.62 20.43 20.62 20.43 49.57 0 28.96-20.43 49.38-20.42 20.43-49.57 20.43Zm-70 478.84q-17 0-28.5-11.89-11.5-11.88-11.5-28.88-30.31 0-51.31-21.47-21-21.46-21-51.61v-209.23h112.31v-30.38q0-34.54 23.88-58.81 23.89-24.27 58.43-24.27 19.23 0 35.84 8.2 16.62 8.19 29.85 22.19l48.3 54.69q8 8.11 15.5 15.21 7.5 7.09 16.5 13.17H720v-332.15q0-18.23-12.5-31.5T677.15-800q-8.17 0-15.66 3.46t-13.65 9.62l-50 50.57q5 17.2 2 33.89t-12 31.08l-96.15-98.16q14-9.12 30-11.65 16-2.53 32 3.55l50-50.67q14.69-14.91 33.52-23.3 18.82-8.39 39.94-8.39 43.31 0 73.08 30.5Q780-799 780-755.23v332.15h80v209.23q0 30.15-21 51.61-21 21.47-51.31 21.47 0 17-11.5 28.88-11.5 11.89-28.5 11.89H212.31Zm-40-100.77h615.38q5.39 0 8.85-3.85 3.46-3.84 3.46-9.23v-149.23H160v149.23q0 5.39 3.46 9.23 3.46 3.85 8.85 3.85Z"/>
        </svg>
        ${textOrDash(p.bathrooms)}
      </div>
      <div class="lbl">Baños</div>
    </div>
  </div>

  <div class="col-6 col-sm-3">
    <div class="stat">
  <div class="h5 m-0">
    <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#ecbb6c" style="vertical-align:middle;margin-right:5px">
      <path d="M600-520h60v-80h80q25 0 42.5-17.5T800-660v-40q0-25-17.5-42.5T740-760H600v240Zm60-140v-40h80v40h-80ZM520-400q-33 0-56.5-23.5T440-480v-320q0-33 23.5-56.5T520-880h320q33 0 56.5 23.5T920-800v320q0 33-23.5 56.5T840-400H720v280h-80v-280H520Zm0-80h320v-320H520v320Zm160-160ZM320-120q-17 0-28.5-11.5T280-160v-40H80v-80h240v-200H80v-80h208l-42-120H80v-80h180q19 0 34.5 11t21.5 29l84 240v320q0 17-11.5 28.5T360-120h-40ZM220-320q25 0 42.5-17.5T280-380q0-25-17.5-42.5T220-440q-25 0-42.5 17.5T160-380q0 25 17.5 42.5T220-320Z"/>
    </svg>
    ${textOrDash(p.parking)}
  </div>
  <div class="lbl">Parqueos</div>
</div>

  </div>

  <div class="col-6 col-sm-3">
    <div class="stat">
      <div class="h5 m-0">
        <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#ecbb6c" style="vertical-align:middle;margin-right:5px">
          <path d="M760-601.54V-760H601.54v-60H820v218.46h-60ZM140-140v-218.46h60V-200h158.46v60H140Zm0-307.69v-64.62h64.62v64.62H140Zm0-153.85v-64.61h64.62v64.61H140Zm0-153.84V-820h64.62v64.62H140Zm153.85 0V-820h64.61v64.62h-64.61ZM447.69-140v-64.62h64.62V-140h-64.62Zm0-615.38V-820h64.62v64.62h-64.62ZM601.54-140v-64.62h64.61V-140h-64.61Zm153.84 0v-64.62H820V-140h-64.62Zm0-153.85v-64.61H820v64.61h-64.62Zm0-153.84v-64.62H820v64.62h-64.62Z"/>
        </svg>
        ${textOrDash(p.area)}M²
      </div>
      <div class="lbl">Metros cuadrados</div>
    </div>
  </div>
</div>


    <!-- Columna principal (izquierda) -->
    <div class="col-12 col-lg-8 order-lg-1 pe-lg-3">

      
      <!-- Descripción -->
${p.descriptionParagraph ? `
<div class="card section-card mb-3">
  <div class="card-header"><h2 class="h5 m-0">Descripción</h2></div>
  <div class="card-body">
    <p class="mb-0">${p.descriptionParagraph.replace(/\n/g, '<br>')}</p>
  </div>
</div>` : ''}

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
<div class="card section-card calc-card mb-5">
  <div class="card-header">
    <h2 class="h5 m-0">Calculadora de Préstamos</h2>
  </div>

  <div class="card-body">
    <div id="loanCalc" class="calculator">
      <!-- CONTROLES (izquierda) -->
      <div class="calc-controls">
        <div class="row g-3">

          <!-- Banco -->
          <div class="col-12">
            <label class="form-label">Selecciona tu Banco</label>
            <select id="lcBank" class="form-select"></select>
            <small id="lcAprNote" class="text-muted d-block mt-1"></small>
          </div>

          <!-- Tipología (solo apartamentos/penthouse) -->
          <div class="col-12" id="lcTypologyWrap" style="display:none">
            <label class="form-label">Precio de Tipología</label>
            <select id="lcTypology" class="form-select"></select>
          </div>

          <!-- Pago Inicial -->
          <div class="col-12 col-md-6">
            <label class="form-label">Pago Inicial</label>
            <div class="input-group">
              <span class="input-group-text" id="lcCurrencySym">RD$</span>
              <input id="lcDown" type="number" min="0" step="100" class="form-control" value="0">
            </div>
            <small id="lcDownPct" class="text-muted d-block mt-1">0%</small>
          </div>

          <!-- Plazo -->
          <div class="col-12 col-md-6">
            <label class="form-label">Tiempo del Préstamo</label>
            <input id="lcYears" type="range" class="form-range" min="1" max="30" step="1" value="10">
            <div class="small text-muted">
              <span id="lcYearsLbl">10</span> Años
            </div>
          </div>
        </div>

        <hr class="hr-soft my-3" />

        <!-- Métricas (se mantienen los IDs) -->
        <div class="metrics">
          <div class="metric">
            <div class="k">Inicial a Pagar</div>
            <div id="lcOutDown" class="v">—</div>
          </div>
          <div class="metric">
            <div class="k">Total del Préstamo</div>
            <div id="lcOutPrincipal" class="v">—</div>
          </div>
          <div class="metric d-none d-md-block">
            <div class="k">Tasa</div>
            <div id="aprOut" class="v">—</div>
          </div>
        </div>
      </div>

      <!-- RESULTADO WOW (derecha) -->
      <aside class="result-hero">
        <div class="result-title">Cuota Estimada</div>
<div id="lcOutPayment" class="result-amount">— <small>/mes</small></div>

        <!-- chips opcionales (no afectan tu JS) -->
        <div class="result-chips mt-2">
          <span class="result-chip" id="chipTerm"><span id="chipTermText">10 años</span></span>
          <span class="result-chip" id="chipApr"><span id="chipAprText"></span></span>
          <span class="result-chip" id="chipDown"><span id="chipDownText">Inicial: RD$ 0</span></span>
        </div>
      </aside>
    </div>
  </div>
</div>


    </div><!-- /col izquierda -->

    <!-- Aside contacto (derecha) -->
    <div class="col-12 col-lg-4 order-lg-2 ps-lg-0 ms-lg-auto aside-sticky">
      <div class="card section-card w-100">
        <div class="card-body">
          ${priceText ? `<div class="mb-2"><span class="text-muted">Desde</span><div class="h4 m-0">RD${priceText}</div></div>`:''}
          <div class="d-grid gap-2">
            <a class="btn btn-primary" href="tel:+18090000000"><i class="bi bi-telephone-fill me-1"></i> Llamar</a>
            <a class="btn btn-primary" href="https://wa.me/18090000000" target="_blank"><i class="bi bi-whatsapp me-1"></i> WhatsApp</a>
            <a class="btn btn-primary" href="mailto:info@milhouserd.com?subject=Interés%20en%20${encodeURIComponent(title)}"><i class="bi bi-envelope-fill me-1"></i> Enviar correo</a>
          </div>
          <hr/>
          <small class="text-muted">Al contactar aceptas nuestros términos de uso.</small>
        </div>
      </div>
    </div><!-- /col derecha -->

  </div><!-- /row -->
`;

        (() => {
            const propType      = (p.type || '').toString().trim();
            const currencyGuess = /\bRD\$|DOP\b/i.test(p.priceFormatted || '') ? 'DOP' : 'USD';
            const units         = Array.isArray(p.units) ? p.units : [];
            const basePrice     = (typeof p.price === 'number' && p.price > 0) ? p.price : 0;

            const calcRoot = $('#loanCalc', container); // busca dentro del HTML recién renderizado
            if (calcRoot) {
                mountLoanCalculator(calcRoot, {
                    currency: currencyGuess,
                    propertyPrice: basePrice,
                    units,
                    isApartment: isApartmentType(propType)
                });
            }
        })();
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
    function mountLoanCalculator(root, opts){
        if (!root) return;

        const fmt = (v)=> fmtCurrency(v, opts.currency === 'DOP' ? 'DOP' : 'USD');
        const sym = (opts.currency === 'DOP') ? 'RD$' : 'RD$';

        const elBank    = root.querySelector('#lcBank');
        const elAprNote = root.querySelector('#lcAprNote');
        const elTypW    = root.querySelector('#lcTypologyWrap');
        const elTyp     = root.querySelector('#lcTypology');
        const elCurSym  = root.querySelector('#lcCurrencySym');
        const elDown    = root.querySelector('#lcDown');
        const elDownPct = root.querySelector('#lcDownPct');
        const elYears   = root.querySelector('#lcYears');
        const elYearsL  = root.querySelector('#lcYearsLbl');

        const outDown      = root.querySelector('#lcOutDown');
        const outPrincipal = root.querySelector('#lcOutPrincipal');
        const outPayment   = root.querySelector('#lcOutPayment');
        const outApr       = root.querySelector('#aprOut');            // <<— FALTABA

        // chips opcionales (si existen)
        const chipTermText = root.querySelector('#chipTermText');
        const chipAprText  = root.querySelector('#chipAprText');
        const chipDownText = root.querySelector('#chipDownText');

        // poblar bancos
        elBank.innerHTML = BANKS
            .map(b=> `<option value="${b.id}" data-apr="${b.apr}">${b.name} (${b.apr}% Anual)</option>`)
            .join('');
        elCurSym.textContent = sym;

        // tipologías (solo apt/penthouse con precio)
        const pricedUnits = Array.isArray(opts.units) ? opts.units.filter(u => typeof u.price==='number' && u.price>0) : [];
        const showTypology = !!(opts.isApartment && pricedUnits.length);
        elTypW.style.display = showTypology ? '' : 'none';
        if (showTypology){
            elTyp.innerHTML = pricedUnits.map((u,i)=>{
                const lbl = [u.name||`Tipología ${i+1}`, u.area?`${u.area} m²`:null].filter(Boolean).join(' – ');
                return `<option value="${u.price}">${lbl} — ${fmt(u.price)}</option>`;
            }).join('');
        }

        function getBasePrice(){
            if (showTypology){
                const v = Number(elTyp.value);
                if (!Number.isNaN(v) && v>0) return v;
            }
            return Number(opts.propertyPrice||0);
        }

        function getAPR(){
            const opt = elBank.options[elBank.selectedIndex];
            const apr = Number(opt?.dataset?.apr||0);
            return { apr, bankName: opt?.textContent||'-' };
        }

        function compute(){
            const base  = Math.max(0, getBasePrice());
            let   down  = Number(elDown.value||0);
            if (down < 0) down = 0;
            if (down > base) down = base;
            elDown.value = String(down);

            const principal = Math.max(0, base - down);
            const years     = Number(elYears.value||1);
            const months    = Math.max(1, years*12);

            const { apr, bankName } = getAPR();
            const i = (apr/100)/12;

            let payment;
            if (i === 0){
                payment = principal / months;
            }else{
                const pow = Math.pow(1+i, months);
                payment = principal * (i*pow)/(pow-1);
            }

            const pct = base>0 ? Math.round((down/base)*100) : 0;

            // >>> Actualizaciones visibles
            elAprNote.textContent = `Tasa usada: ${apr}% APR • ${bankName}`;
            if (outApr) outApr.textContent = `${apr}% Anual`;        // <<— AHORA SÍ
            elYearsL.textContent  = years;
            elDownPct.textContent = `${pct}%`;
            outDown.textContent      = fmt(down);
            outPrincipal.textContent = fmt(principal);
            outPayment.innerHTML = `RD${fmt(Math.round(payment))} <small>/mes</small>`;

            // chips decorativos (si están)
            if (chipTermText) chipTermText.textContent = `${years} años`;
            if (chipAprText)  chipAprText.textContent  = `${apr}% APR`;
            if (chipDownText) chipDownText.textContent = `Inicial: ${fmt(down)}`;
        }

        // listeners
        elBank.addEventListener('change', ()=>{
            if (elBank.value === 'custom'){
                const current = getAPR().apr;
                const v = prompt('Ingresa la tasa anual (APR) %', String(current||14));
                const num = Number(v);
                if (!Number.isNaN(num) && num>0){
                    elBank.options[elBank.selectedIndex].dataset.apr = String(num);
                }
            }
            compute();
        });
        if (showTypology) elTyp.addEventListener('change', compute);
        elDown.addEventListener('input', compute);
        elYears.addEventListener('input', compute);

        // init
        compute();
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
        // Soporta: location.lat/lng, location.latitude/longitude
        // y también p.lat/p.lng por si vienen a nivel raíz
        const L = p.location || {};
        const num = v => (typeof v === 'string' ? parseFloat(v) : v);

        const latCandidates = [L.lat, L.latitude, p.lat, p.latitude].map(num);
        const lngCandidates = [L.lng, L.longitude, L.long, p.lng, p.longitude, p.long].map(num);

        const lat = latCandidates.find(v => Number.isFinite(v));
        const lng = lngCandidates.find(v => Number.isFinite(v));

        let url;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            // Centra y fija el pin exactamente en las coordenadas
            url = `https://www.google.com/maps?q=loc:${lat},${lng}&z=16&output=embed`;
        } else {
            // Fallback por texto si no hay coords
            const q = encodeURIComponent(
                [p.title, L.address, L.sector, L.city, L.province, L.country]
                    .filter(Boolean).join(', ')
                || (fallbackText || '')
            );
            url = `https://www.google.com/maps?q=${q}&z=14&output=embed`;
        }

        return `
    <div class="ratio ratio-16x9">
      <iframe src="${url}" style="border:0" loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"></iframe>
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

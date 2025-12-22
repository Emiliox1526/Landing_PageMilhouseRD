const propertiesContainer = document.getElementById('propertiesContainer');
const verPropiedadesBtn = document.getElementById('verPropiedadesBtn');
const heroVerPropiedades = document.getElementById('heroVerPropiedades');

console.log('[INDEX] script cargado');

/* ----------------------------- Helpers ----------------------------- */
function extractId(doc) {
    const raw = doc?._id ?? doc?.id;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;

    if (typeof raw === 'object') {
        if (raw.$oid) return String(raw.$oid);
        if (raw.oid)  return String(raw.oid);
        if (typeof raw.toHexString === 'function') {
            try { return raw.toHexString(); } catch {}
        }
    }
    const m = JSON.stringify(raw).match(/[0-9a-fA-F]{24}/);
    return m ? m[0] : '';
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getMainImage(p) {
    if (Array.isArray(p?.images) && p.images[0]) return p.images[0];
    return 'https://via.placeholder.com/800x450?text=Propiedad';
}

function getLocationText(loc) {
    if (!loc) return '';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
        const parts = [
            loc.sector, loc.neighborhood, loc.barrio, loc.district,      // vecindario/sector
            loc.city, loc.municipality,                                   // ciudad/municipio
            loc.province, loc.state, loc.region,                          // provincia/estado/región
            loc.country                                                   // país
        ].filter(Boolean);
        return parts.join(', ');
    }
    return '';
}
function resolveLocation(p) {
    // 1) Si trae un texto ya preparado
    if (p?.locationText && typeof p.locationText === 'string') return p.locationText;

    // 2) Si 'location' o 'address' son string u objeto {city, sector, ...}
    const fromLocation = getLocationText(p?.location);
    if (fromLocation) return fromLocation;

    const fromAddress = getLocationText(p?.address);
    if (fromAddress) return fromAddress;

    // 3) Si vienen los campos sueltos en la raíz
    const parts = [
        p?.sector, p?.neighborhood, p?.barrio, p?.district,
        p?.city, p?.municipality,
        p?.province, p?.state, p?.region,
        p?.country
    ].filter(Boolean);
    if (parts.length) return parts.join(', ');

    return '';
}

function formatPrice(p) {
    if (p?.priceFormatted) return p.priceFormatted;
    if (typeof p?.price === 'number') {
        try {
            // 👇 Fuerza pesos dominicanos como moneda por defecto
            const currency = p?.currency || 'DOP';
            return new Intl.NumberFormat('es-DO', {
                style: 'currency',
                currency,
                minimumFractionDigits: 0
            }).format(p.price);
        } catch {
            // Fallback con símbolo RD$
            return `RD$ ${p.price.toLocaleString('es-DO')}`;
        }
    }
    return '';
}


/* ---------------------------- Fetch helper --------------------------- */
async function fetchJSON(url) {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    console.log('[INDEX] fetch', url, res.status, res.statusText);
    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (e) {
        console.error('[INDEX] No se pudo parsear JSON. Respuesta cruda:', text);
        throw e;
    }
    return { ok: res.ok, status: res.status, data };
}

function coerceToArray(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
        const keys = ['properties','data','results','items','content','list'];
        for (const k of keys) {
            if (Array.isArray(data[k])) return data[k];
        }
        const firstArray = Object.values(data).find(Array.isArray);
        if (firstArray) return firstArray;
    }
    return [];
}
/* ---------------------------- Cargar hero --------------------------- */
async function cargarHeroRecientes() {
    const sliderContainer = document.getElementById("dynamic-slider");
    const dotsContainer   = document.getElementById("slider-dots");
    let currentSlide = 0;

    try {
        const { ok, status, data } = await fetchJSON('/api/properties');
        if (!ok) throw new Error(`HTTP ${status}`);
        const list = coerceToArray(data);
        if (!list.length) return;

        // Separar la propiedad hero default si existe
        const heroDefault = list.find(p => p.isHeroDefault === true);
        const others = list.filter(p => p.isHeroDefault !== true);
        
        // Ordenar otros por fecha descendente y tomar hasta 5 (para total de 6 con hero default)
        const recientes = [...others]
            .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, heroDefault ? 5 : 6);
        
        // Si hay hero default, ponerlo primero
        const slides = heroDefault ? [heroDefault, ...recientes] : recientes;

        sliderContainer.innerHTML = "";
        dotsContainer.innerHTML = "";

        slides.forEach((p, i) => {
            const img = getMainImage(p);
            // Use custom hero title/description if available, otherwise fallback to property data
            const title = escapeHtml(p.heroTitle || p.title || "Propiedad");
            const location = escapeHtml(p.heroDescription || resolveLocation(p));

            const slide = document.createElement("div");
            slide.className = "slide" + (i === 0 ? " active" : "");
            slide.innerHTML = `
                <img class="hero-image" src="${img}" alt="${title}">
                <div class="hero-overlay">
                    <h1>${title}</h1>
                    <p>${location}</p>
                </div>
            `;
            sliderContainer.appendChild(slide);

            const dot = document.createElement("span");
            dot.className = "dot" + (i === 0 ? " active" : "");
            dot.addEventListener("click", () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });

        function goToSlide(idx) {
            const slides = sliderContainer.querySelectorAll(".slide");
            const dots   = dotsContainer.querySelectorAll(".dot");
            slides[currentSlide].classList.remove("active");
            dots[currentSlide].classList.remove("active");
            currentSlide = idx;
            slides[currentSlide].classList.add("active");
            dots[currentSlide].classList.add("active");
        }

        document.getElementById("prev-slide")
            .addEventListener("click", () =>
                goToSlide((currentSlide - 1 + slides.length) % slides.length)
            );
        document.getElementById("next-slide")
            .addEventListener("click", () =>
                goToSlide((currentSlide + 1) % slides.length)
            );
    } catch (err) {
        console.error("Error cargando hero recientes:", err);
    }
}

/* =========================
   Filtros + orden + paginación (extensión)
   ========================= */

// Cache de datos y estado UI
let ALL_PROPERTIES = [];

const $ = (id) => document.getElementById(id);
const qInput        = $('q');
const fType         = $('fType');
const fSaleType     = $('fSaleType');
const fMin          = $('fMin');
const fMax          = $('fMax');
const sortBySelect  = $('sortBy');
const pageSizeSelect= $('pageSize');
const resetBtn      = $('resetFilters');
const resultsCount  = $('resultsCount');
const paginationEl  = $('pagination');

const STATE = {
    q: '',
    type: '',
    saleType: '',
    min: null,
    max: null,
    sort: 'createdAt-desc',
    pageSize: 9,
    page: 1,
};
function parseMoney(v){
    if (v == null || v === '') return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    // Mantén solo dígitos, coma y punto, elimina RD$, US$, espacios, etc.
    const s = String(v).replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
}

function extractPrice(p){
    const n = Number(p?.price);
    if (Number.isFinite(n)) return n;
    // units[0].price
    const unitP = Array.isArray(p?.units) ? p.units.find(u => Number.isFinite(Number(u?.price))) : null;
    if (unitP) return Number(unitP.price);
    // priceFormatted "RD$ 750,000" / "US$ 5,000,000"
    const pf = parseMoney(p?.priceFormatted);
    if (pf != null) return pf;
    return NaN;
}

// Lee valores aunque cambien IDs/names en el HTML
function readFiltersFromDOM(){
    const pick = (sel)=> document.querySelector(sel);

    const typeEl = pick('#fType, select[name="type"], select[name="propertyType"], select[name="tipo"], [data-filter="type"]');
    const saleEl = pick('#fSaleType, select[name="saleType"], select[name="transaction"], select[name="transaccion"], [data-filter="saleType"]');
    const minEl  = pick('#fMin, input[name="min"], input[name="priceMin"], input[name="precioMin"], [data-filter="min"]');
    const maxEl  = pick('#fMax, input[name="max"], input[name="priceMax"], input[name="precioMax"], [data-filter="max"]');

    let type = (typeEl?.value || '').trim();
    let sale = (saleEl?.value || '').trim();

    // “Todos” o “Venta / Alquiler” → vacío (no filtra)
    if (/^todos?$/i.test(type)) type = '';
    if (/venta\s*\/\s*alquiler|alquiler\s*\/\s*venta/i.test(sale)) sale = '';

    return {
        type,
        saleType: sale,
        min: parseMoney(minEl?.value ?? ''),
        max: parseMoney(maxEl?.value ?? '')
    };
}
function numOrNull(v){ const n = Number(v); return Number.isFinite(n) ? n : null; }

function haystackFor(p){
    return [
        p.title,
        p.descriptionParagraph,
        p.type,
        p.saleType,
        (p.location ? (typeof p.location === 'string'
            ? p.location
            : [p.location.sector,p.location.city,p.location.province,p.location.country].filter(Boolean).join(' ')) : '')
    ].filter(Boolean).join(' ').toLowerCase();
}

function applyFilters(list){
    const q = STATE.q.trim().toLowerCase();
    return list.filter(p=>{
        // texto libre
        if (q){
            const haystack = [
                p.title,
                p.descriptionParagraph,
                p.type,
                p.saleType,
                (p.location ? (typeof p.location === 'string'
                    ? p.location
                    : [p.location.sector, p.location.city, p.location.province, p.location.country].filter(Boolean).join(' ')) : '')
            ].filter(Boolean).join(' ').toLowerCase();
            if (!haystack.includes(q)) return false;
        }

        // tipo y transacción (case-insensitive)
        if (STATE.type && String(p.type||'').toLowerCase() !== STATE.type.toLowerCase()) return false;
        if (STATE.saleType && String(p.saleType||'').toLowerCase() !== STATE.saleType.toLowerCase()) return false;

        // precio (acepta number, formatted, o units[].price)
        const price = extractPrice(p);
        if (STATE.min != null && !(Number.isFinite(price) && price >= STATE.min)) return false;
        if (STATE.max != null && !(Number.isFinite(price) && price <= STATE.max)) return false;

        return true;
    });
}


function sortList(list){
    const [field, dir] = (STATE.sort || 'createdAt-desc').split('-');
    const mult = dir === 'asc' ? 1 : -1;
    return [...list].sort((a,b)=>{
        let va, vb;
        if (field === 'price'){ va = Number(a.price); vb = Number(b.price); }
        else if (field === 'area'){ va = Number(a.area); vb = Number(b.area); }
        else { va = new Date(a.createdAt||0).getTime(); vb = new Date(b.createdAt||0).getTime(); }
        if (!Number.isFinite(va)) va = -Infinity;
        if (!Number.isFinite(vb)) vb = -Infinity;
        return (va - vb) * mult;
    });
}

function paginate(list){
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / STATE.pageSize));
    const page  = Math.min(Math.max(1, STATE.page), pages);
    const start = (page - 1) * STATE.pageSize;
    const end   = start + STATE.pageSize;
    return { total, pages, page, items: list.slice(start, end) };
}

// Render de cards (reusa tu mismo layout)
function renderCards(items){
    propertiesContainer.className = 'row g-3';
    if (!items.length){
        propertiesContainer.innerHTML = '<p class="text-muted">No hay propiedades con esos filtros.</p>';
        return;
    }
    propertiesContainer.innerHTML = '';
    for (const property of items){
        const id = extractId(property);
        if (!id) continue;

        const col = document.createElement('div');
        col.className = 'col-md-4';

        const link = document.createElement('a');
        link.href = `property.html?id=${encodeURIComponent(id)}`;
        link.className = 'text-decoration-none text-dark';
        link.setAttribute('data-id', id);

        const mainImg      = getMainImage(property);
        const title        = escapeHtml(property?.title || 'Propiedad');
        const propType     = escapeHtml(property?.type || '');
        const saleType     = escapeHtml(property?.saleType || '');
        const locationText = escapeHtml(resolveLocation(property));
        const priceText    = escapeHtml(formatPrice(property));
        const beds         = property?.bedrooms ?? null;
        const baths        = property?.bathrooms ?? null;
        const park         = property?.parking ?? null;
        const area         = property?.area ?? null;
        const areaUnit     = property?.areaUnit ?? 'm²';

        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm';
        card.innerHTML = `
      <div class="ratio ratio-16x9">
        <img src="${mainImg}" alt="${title}" class="card-img-top" loading="lazy" style="object-fit: cover;">
      </div>
      <div class="card-body">
        <div class="d-flex flex-wrap gap-2 mb-2">
          ${propType ? `<span class="badge text-bg-primary">${propType}</span>` : ''}
          ${saleType ? `<span class="badge text-bg-secondary">${saleType}</span>` : ''}
        </div>
        <h5 class="card-title mb-1">${title}</h5>
        ${locationText ? `<div class="text-muted small mb-2"><i class="bi bi-geo-alt-fill me-1"></i>${locationText}</div>` : ''}
        <div class="d-flex flex-wrap gap-3 small text-muted mb-2">
          ${Number.isFinite(beds) ? `<span><i class="bi bi-door-open me-1"></i>${beds} hab</span>` : ''}
          ${Number.isFinite(baths) ? `<span><i class="bi bi-droplet me-1"></i>${baths} baños</span>` : ''}
          ${Number.isFinite(park) ? `<span><i class="bi bi-car-front me-1"></i>${park} parqueos</span>` : ''}
          ${Number.isFinite(area) ? `<span><i class="bi bi-aspect-ratio me-1"></i>${area} ${escapeHtml(areaUnit)}</span>` : ''}
        </div>
        <p class="fw-bold fs-5 mb-0">${priceText || ''}</p>
      </div>
    `;
        link.appendChild(card);
        col.appendChild(link);
        propertiesContainer.appendChild(col);
    }
}

function renderPagination(pages, page){
    if (!paginationEl) return;
    paginationEl.innerHTML = '';
    if (pages <= 1) return;

    const addItem = (label, target, disabled=false, active=false)=>{
        const li = document.createElement('li');
        li.className = `page-item${disabled?' disabled':''}${active?' active':''}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = label;
        a.addEventListener('click', (e)=>{
            e.preventDefault();
            if (disabled || target === STATE.page) return;
            STATE.page = target;
            applyAndRender();
            const section = document.getElementById('properties');
            if (section) section.scrollIntoView({behavior:'smooth', block:'start'});
        });
        li.appendChild(a);
        paginationEl.appendChild(li);
    };

    addItem('«', Math.max(1, page-1), page===1, false);

    const windowSize = 2;
    const first = 1, last = pages;
    const from = Math.max(first, page-windowSize);
    const to   = Math.min(last, page+windowSize);

    const ellipsis = ()=> {
        const li = document.createElement('li');
        li.className = 'page-item disabled';
        li.innerHTML = '<span class="page-link">…</span>';
        paginationEl.appendChild(li);
    };

    if (from > first){
        addItem(String(first), first, false, page===first);
        if (from > first+1) ellipsis();
    }
    for (let p = from; p <= to; p++) addItem(String(p), p, false, p===page);
    if (to < last){
        if (to < last-1) ellipsis();
        addItem(String(last), last, false, page===last);
    }

    addItem('»', Math.min(pages, page+1), page===pages, false);
}

function updateResultsCount(total){
    if (!resultsCount) return;
    const start = (STATE.page - 1) * STATE.pageSize + 1;
    const end   = Math.min(total, STATE.page * STATE.pageSize);

}

function applyAndRender(){
    const filtered = sortList(applyFilters(ALL_PROPERTIES));
    const { items, pages, page, total } = paginate(filtered);
    STATE.page = page;
    renderCards(items);
    renderPagination(pages, page);
    updateResultsCount(total);
}

/* Eventos (solo si existen los elementos) */
let debounce;
qInput?.addEventListener('input', (e)=>{
    clearTimeout(debounce);
    debounce = setTimeout(()=>{
        STATE.q = e.target.value || '';
        STATE.page = 1;
        applyAndRender();
    }, 300);
});

$('filtersForm')?.addEventListener('submit',(e)=>{
    e.preventDefault();
    const F = readFiltersFromDOM();
    STATE.type     = F.type;
    STATE.saleType = F.saleType;
    STATE.min      = F.min;
    STATE.max      = F.max;
    STATE.page = 1;
    applyAndRender();
});

resetBtn?.addEventListener('click', ()=>{
    $('filtersForm')?.reset();
    STATE.q = '';
    STATE.type = '';
    STATE.saleType = '';
    STATE.min = STATE.max = null;
    STATE.page = 1;
    applyAndRender();
});

sortBySelect?.addEventListener('change', ()=>{
    STATE.sort = sortBySelect.value;
    STATE.page = 1;
    applyAndRender();
});

pageSizeSelect?.addEventListener('change', ()=>{
    STATE.pageSize = Number(pageSizeSelect.value) || 9;
    STATE.page = 1;
    applyAndRender();
});

/* ---------------------------- Render list --------------------------- */
async function cargarPropiedades() {
    if (!propertiesContainer) return;
    propertiesContainer.innerHTML = '';
    propertiesContainer.className = 'row g-3';

    try {
        const { ok, status, data } = await fetchJSON('/api/properties');
        if (!ok) throw new Error(`HTTP ${status}`);

        const list = coerceToArray(data);
        console.log('[INDEX] tamaño lista:', list.length, { keys: data && typeof data === 'object' ? Object.keys(data) : null });

        // Cachear lista para filtros/paginación
        ALL_PROPERTIES = Array.isArray(list) ? list : [];

        if (!ALL_PROPERTIES.length) {
            propertiesContainer.innerHTML = '<p class="text-muted">No hay propiedades disponibles.</p>';
            updateResultsCount(0);
            renderPagination(1, 1);
            return;
        }

        // Diagnóstico opcional
        try { console.table(ALL_PROPERTIES.map(p => ({ id: extractId(p), title: p?.title }))); } catch {}

        // Primer render con estado actual (por defecto: recientes)
        applyAndRender();

    } catch (error) {
        console.error('Error al cargar las propiedades:', error);
        propertiesContainer.innerHTML = `
      <div class="alert alert-danger" role="alert">
        No se pudieron cargar las propiedades. Intenta de nuevo más tarde.
      </div>`;
    }
}

/* --------------------------- Event wiring + Scroll lock --------------------------- */
function lockScroll() {
    document.body.classList.add('lock-scroll');
}
function unlockScroll() {
    document.body.classList.remove('lock-scroll');
}

if (verPropiedadesBtn) {
    verPropiedadesBtn.addEventListener('click', () => {
        unlockScroll();
        cargarPropiedades();
        const section = document.getElementById('properties');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
}

if (heroVerPropiedades) {
    heroVerPropiedades.addEventListener('click', (e) => {
        e.preventDefault();
        unlockScroll();               // ✅ desbloquea el scroll
        cargarPropiedades();          // (opcional: recarga lista)
        const section = document.getElementById('properties');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
}

/* Auto-cargar al abrir la página + bloquear scroll inicial */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[INDEX] DOMContentLoaded');
    lockScroll();
    cargarHeroRecientes();// ✅ bloquea scroll al iniciar
    cargarPropiedades();            // sigue cargando la data en background
});
// === Controles modernos: sync con selects existentes ===
(function(){
    const sortBy = document.getElementById('sortBy');
    const pageSize = document.getElementById('pageSize');

    // Orden
    const sortSeg = document.getElementById('sortSegment');
    if (sortSeg && sortBy) {
        sortSeg.addEventListener('click', (e)=>{
            const btn = e.target.closest('.seg-btn[data-sort]');
            if(!btn) return;
            sortBy.value = btn.dataset.sort;
            sortBy.dispatchEvent(new Event('change', { bubbles:true }));
            sortSeg.querySelectorAll('.seg-btn').forEach(b=>b.setAttribute('aria-pressed','false'));
            btn.setAttribute('aria-pressed','true');
        });
    }

    // Por página
    const sizeSeg = document.getElementById('pageSizeSegment');
    if (sizeSeg && pageSize) {
        sizeSeg.addEventListener('click', (e)=>{
            const btn = e.target.closest('.seg-btn[data-size]');
            if(!btn) return;
            pageSize.value = btn.dataset.size;
            pageSize.dispatchEvent(new Event('change', { bubbles:true }));
            sizeSeg.querySelectorAll('.seg-btn').forEach(b=>b.setAttribute('aria-pressed','false'));
            btn.setAttribute('aria-pressed','true');
        });
    }
})();

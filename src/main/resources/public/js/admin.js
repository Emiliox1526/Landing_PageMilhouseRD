document.addEventListener('DOMContentLoaded', () => {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const API_BASE = isLocal ? 'http://localhost:7070' : ''; // en prod, vacío para usar el proxy de Netlify
    const API = `${API_BASE}/api`;
    const UPLOADS = `${API_BASE}/uploads`;

    console.log('[ADMIN] API_BASE:', API_BASE);

    // --- Config imágenes ---
    const MAX_IMAGES = 10;
    const MAX_FILE_MB = 5;
    const USE_UPLOAD_API = true; // usa /api/uploads

    // UI básicos
    const btnOpenCreateToolbar = document.getElementById('btnOpenCreateToolbar');
    const btnReloadList        = document.getElementById('btnReloadList');
    const modalEl              = document.getElementById('propertyModal');
    const form                 = document.getElementById('propertyForm');
    const cardsContainer       = document.getElementById('propertiesContainer');

    // Filtros/toolbar/paginación (mismo layout que index)
    const $ = (id) => document.getElementById(id);
    const qInput         = $('q');
    const fType          = $('fType');
    const fSaleType      = $('fSaleType');
    const fMin           = $('fMin');
    const fMax           = $('fMax');
    const sortBySelect   = $('sortBy');
    const pageSizeSelect = $('pageSize');
    const resetBtn       = $('resetFilters');
    const resultsCount   = $('resultsCount');
    const paginationEl   = $('pagination');
    const sortSegment    = $('sortSegment');
    const pageSizeSegment= $('pageSizeSegment');

    // Map elements
    const mapContainer   = document.getElementById('latLngPicker');
    const latInput       = document.getElementById('latitude');
    const lngInput       = document.getElementById('longitude');
    const btnMyLocation  = document.getElementById('btnUseMyLocation');
    const btnClearMarker = document.getElementById('btnClearMarker');

    // Chips (características/amenidades)
    const featureInput   = document.getElementById('featureInput');
    const addFeatureBtn  = document.getElementById('addFeatureBtn');
    const featuresListEl = document.getElementById('featuresList');

    const amenityInput   = document.getElementById('amenityInput');
    const addAmenityBtn  = document.getElementById('addAmenityBtn');
    const amenitiesListEl= document.getElementById('amenitiesList');

    // Tipologia
    const TYPES_WITH_UNITS = ['Apartamento','Penthouse'];

// DOM de tipo/precio
    const typeSelect   = document.getElementById('type');
    const priceInput   = document.getElementById('price');
    const priceAutoNote= document.getElementById('priceAutoNote');

// DOM de unidades
    const unitsSection = document.getElementById('unitsSection');
    const unitName     = document.getElementById('unitName');
    const unitFloor    = document.getElementById('unitFloor');
    const unitBedrooms = document.getElementById('unitBedrooms');
    const unitBathrooms= document.getElementById('unitBathrooms');
    const unitParking  = document.getElementById('unitParking');
    const unitArea     = document.getElementById('unitArea');
    const unitPrice    = document.getElementById('unitPrice');
    const addUnitBtn   = document.getElementById('addUnitBtn');
    const unitsListEl  = document.getElementById('unitsList');


    // Imágenes
    const imageInput     = document.getElementById('imageFiles');
    const imagePreviewEl = document.getElementById('imagePreview');
    const imageCountEl   = document.getElementById('imageCount');

    const getModal = () => new bootstrap.Modal(modalEl);

    // ===== Estado =====
    let editingId = null;
    let featuresList = [];
    let amenitiesList = [];
    let existingImageUrls = [];  // urls existentes (edición)
    let selectedFiles = [];      // [{id, file, url}] nuevos
    let unitsList = [];
    // Data y estado de filtros/paginación
    let ALL_PROPERTIES = [];
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

    // ===== Abrir modal (crear) =====
    function supportsUnits(){
        const t = (typeSelect?.value || '').trim();
        return TYPES_WITH_UNITS.includes(t);
    }
    function toImageUrl(s, API_BASE='') {
        if (!s) return '';
        const str = String(s);
        if (str.startsWith('data:') || /^https?:\/\//i.test(str)) return str;
        if (str.startsWith('/api/images/')) return `${API_BASE}${str}`;
        if (/^[a-f0-9]{24}$/i.test(str)) return `${API_BASE}/api/images/${str}`;
        // Fallback: por compatibilidad con datos viejos (ej. "/uploads/xxx.png")
        return `${API_BASE}${str}`;
    }
    function minUnitPrice(){
        const vals = unitsList.map(u => Number(u.price)).filter(Number.isFinite);
        return vals.length ? Math.min(...vals) : null;
    }

    function toggleUnitsUI(){
        const on = supportsUnits();
        if (on){
            unitsSection?.classList.remove('d-none');
            priceInput?.setAttribute('disabled','disabled');
            priceAutoNote?.classList.remove('d-none');
            // reflejar precio auto si hay unidades
            const mu = minUnitPrice();
            if (mu != null) priceInput.value = mu;
            else priceInput.value = '';
        }else{
            unitsSection?.classList.add('d-none');
            priceInput?.removeAttribute('disabled');
            priceAutoNote?.classList.add('d-none');
        }
    }

    // ===== Gestión de campos según tipo de propiedad =====
    function getPropertyTypeCategory(type) {
        const t = (type || '').trim();
        if (t === 'Solar' || t === 'Solares') return 'solar';  // Soporte para ambos nombres
        if (t === 'Local Comercial') return 'commercial';
        if (['Casa', 'Apartamento', 'Penthouse', 'Villa'].includes(t)) return 'residential';
        return 'unknown';
    }

    // Helper function to hide price per sqm field and restore price field to editable
    function hidePricePerSqmField() {
        const pricePerSqmContainer = document.getElementById('pricePerSqmContainer');
        const pricePerSqmField = document.getElementById('pricePerSqm');
        const priceAutoCalculated = document.getElementById('priceAutoCalculated');
        
        if (pricePerSqmContainer) {
            pricePerSqmContainer.style.display = 'none';
            if (pricePerSqmField) {
                pricePerSqmField.removeAttribute('required');
                pricePerSqmField.value = '';
            }
        }
        if (priceInput) {
            priceInput.removeAttribute('readonly');
            priceInput.style.backgroundColor = '';
        }
        if (priceAutoCalculated) {
            priceAutoCalculated.classList.add('d-none');
        }
    }

    function toggleFieldsByPropertyType() {
        const type = typeSelect?.value || '';
        const category = getPropertyTypeCategory(type);
        
        // Referencias a los campos del formulario
        const bedroomsField = document.getElementById('bedrooms');
        const bathroomsField = document.getElementById('bathrooms');
        const parkingField = document.getElementById('parking');
        const areaField = document.getElementById('area');
        
        // Referencias a campos específicos de solares
        const pricePerSqmContainer = document.getElementById('pricePerSqmContainer');
        const pricePerSqmField = document.getElementById('pricePerSqm');
        const priceAutoCalculated = document.getElementById('priceAutoCalculated');
        
        // Referencias a los containers de los campos
        const bedroomsContainer = bedroomsField?.closest('.col-md-4');
        const bathroomsContainer = bathroomsField?.closest('.col-md-4');
        const parkingContainer = parkingField?.closest('.col-md-4');
        
        // Referencias a secciones de amenidades
        const amenitiesSection = document.getElementById('amenitiesSection');
        
        // Resetear estado de campos
        const setFieldState = (field, container, required, visible) => {
            if (!field || !container) return;
            
            if (visible) {
                container.classList.remove('d-none');
                if (required) {
                    field.setAttribute('required', 'required');
                } else {
                    field.removeAttribute('required');
                }
            } else {
                container.classList.add('d-none');
                field.removeAttribute('required');
                field.value = '';  // Clear value when field is hidden
            }
        };
        
        // Actualizar hint de rango de precios
        updatePriceHint(type);
        
        // Aplicar reglas según categoría
        switch (category) {
            case 'solar':
                // Solares: solo área y precio por m²
                setFieldState(bedroomsField, bedroomsContainer, false, false);
                setFieldState(bathroomsField, bathroomsContainer, false, false);
                setFieldState(parkingField, parkingContainer, false, false);
                if (areaField) {
                    areaField.setAttribute('required', 'required');
                    const areaLabel = document.querySelector('label[for="area"]');
                    if (areaLabel) areaLabel.innerHTML = '📐 Área del solar (m²)';
                }
                // Mostrar campo de precio por m² y hacer precio de solo lectura
                if (pricePerSqmContainer) {
                    pricePerSqmContainer.style.display = '';
                    if (pricePerSqmField) {
                        pricePerSqmField.setAttribute('required', 'required');
                    }
                }
                if (priceInput) {
                    priceInput.setAttribute('readonly', 'readonly');
                    priceInput.style.backgroundColor = '#f8f9fa';
                }
                if (priceAutoCalculated) {
                    priceAutoCalculated.classList.remove('d-none');
                }
                // Ocultar amenidades para solares
                if (amenitiesSection) amenitiesSection.classList.add('d-none');
                // Calcular precio automáticamente
                calculateSolarPrice();
                break;
                
            case 'commercial':
                // Locales comerciales: área, baños opcionales, NO habitaciones
                setFieldState(bedroomsField, bedroomsContainer, false, false);
                setFieldState(bathroomsField, bathroomsContainer, false, true);  // Opcional
                setFieldState(parkingField, parkingContainer, false, true);     // Opcional
                if (areaField) {
                    areaField.setAttribute('required', 'required');
                    const areaLabel = document.querySelector('label[for="area"]');
                    if (areaLabel) areaLabel.innerHTML = '📐 Área del local (m²)';
                }
                // Ocultar precio por m² para no solares
                hidePricePerSqmField();
                // Mostrar amenidades pero con advertencia
                if (amenitiesSection) {
                    amenitiesSection.classList.remove('d-none');
                    const amenityLabel = document.querySelector('label[for="amenityInput"]');
                    if (amenityLabel) {
                        amenityLabel.textContent = 'Amenidades (solo comerciales, ej: Estacionamiento, Seguridad)';
                        amenityLabel.setAttribute('data-original-text', 'Amenidades');
                    }
                }
                break;
                
            case 'residential':
                // Propiedades residenciales: todos los campos
                setFieldState(bedroomsField, bedroomsContainer, true, true);
                setFieldState(bathroomsField, bathroomsContainer, true, true);
                setFieldState(parkingField, parkingContainer, false, true);  // Opcional
                if (areaField) {
                    areaField.setAttribute('required', 'required');
                    const areaLabel = document.querySelector('label[for="area"]');
                    if (areaLabel) areaLabel.innerHTML = '📐 Área construida (m²)';
                }
                // Ocultar precio por m² para no solares
                hidePricePerSqmField();
                // Mostrar amenidades
                if (amenitiesSection) {
                    amenitiesSection.classList.remove('d-none');
                    const amenityLabel = document.querySelector('label[for="amenityInput"]');
                    if (amenityLabel) {
                        const originalText = amenityLabel.getAttribute('data-original-text') || 'Amenidades';
                        amenityLabel.textContent = originalText;
                    }
                }
                break;
                
            default:
                // Por defecto, mostrar todos los campos
                setFieldState(bedroomsField, bedroomsContainer, false, true);
                setFieldState(bathroomsField, bathroomsContainer, false, true);
                setFieldState(parkingField, parkingContainer, false, true);
                // Ocultar precio por m² para no solares
                hidePricePerSqmField();
                if (amenitiesSection) amenitiesSection.classList.remove('d-none');
                break;
        }
        
        // También aplicar la lógica de unidades
        toggleUnitsUI();
    }

    // Nueva función para actualizar hint de precio
    function updatePriceHint(type) {
        const priceRangeHint = document.getElementById('priceRangeHint');
        if (!priceRangeHint) return;
        
        const area = parseFloat(document.getElementById('area')?.value) || 0;
        let hint = '';
        
        switch (type) {
            case 'Solar':
                // Para solares, no mostrar rango de validación, solo informativo
                hint = 'Ingrese el área y el precio por m². El precio total se calculará automáticamente.';
                break;
            case 'Local Comercial':
                hint = area > 0
                    ? `Rango sugerido: RD$${(area * 2900).toLocaleString('es-DO')} - RD$${(area * 580000).toLocaleString('es-DO')} (RD$2,900-580,000/m²)`
                    : 'Rango típico: RD$2,900-580,000/m²';
                break;
            case 'Casa':
            case 'Apartamento':
            case 'Penthouse':
            case 'Villa':
                hint = area > 0
                    ? `Rango sugerido: RD$${(area * 5800).toLocaleString('es-DO')} - RD$${(area * 870000).toLocaleString('es-DO')} (RD$5,800-870,000/m²)`
                    : 'Rango típico: RD$5,800-870,000/m²';
                break;
            default:
                hint = '';
        }
        
        priceRangeHint.textContent = hint;
    }

    // Nueva función para calcular precio de solares automáticamente
    function calculateSolarPrice() {
        const type = typeSelect?.value || '';
        if (type !== 'Solar') return;
        
        const areaField = document.getElementById('area');
        const pricePerSqmField = document.getElementById('pricePerSqm');
        const priceField = document.getElementById('price');
        
        if (!areaField || !pricePerSqmField || !priceField) return;
        
        const area = parseFloat(areaField.value) || 0;
        const pricePerSqm = parseFloat(pricePerSqmField.value) || 0;
        
        if (area > 0 && pricePerSqm > 0) {
            const totalPrice = area * pricePerSqm;
            priceField.value = totalPrice.toFixed(2);
        } else {
            priceField.value = '';
        }
    }

    function clearUnitInputs(){
        unitName.value=''; unitFloor.value='';
        unitBedrooms.value=''; unitBathrooms.value='';
        unitParking.value=''; unitArea.value='';
        unitPrice.value='';
    }
    function openCreateModal(){
        form?.reset();
        form?.classList.remove('was-validated');
        editingId = null;
        featuresList = [];
        amenitiesList = [];
        existingImageUrls = [];
        clearSelectedFiles();
        renderChipLists();
        renderImagePreview();

        // NUEVO: reset tipologías
        unitsList = [];
        renderUnitsList();
        toggleFieldsByPropertyType();

        modalEl.querySelector('.modal-title').textContent = 'Crear propiedad';
        getModal().show();
    }

    btnOpenCreateToolbar?.addEventListener('click', openCreateModal);

    // ===== Recargar listado =====
    btnReloadList?.addEventListener('click', loadCards);

    // ===== Helpers =====
    function extractId(doc){
        const raw = doc?._id ?? doc?.id;
        if (!raw) return '';
        if (typeof raw === 'string') return raw;
        if (typeof raw === 'object'){
            if (raw.$oid) return String(raw.$oid);
            if (raw.oid)  return String(raw.oid);
            if (typeof raw.toHexString === 'function'){
                try{ return raw.toHexString(); }catch{}
            }
        }
        const m = JSON.stringify(raw).match(/[0-9a-fA-F]{24}/);
        return m ? m[0] : '';
    }
    function escapeHtml(str){
        return String(str ?? '')
            .replaceAll('&','&amp;')
            .replaceAll('<','&lt;')
            .replaceAll('>','&gt;')
            .replaceAll('"','&quot;')
            .replaceAll("'","&#039;");
    }
    function getMainImage(p){
        if (Array.isArray(p?.images) && p.images[0]) return toImageUrl(p.images[0], API_BASE);
        return 'https://via.placeholder.com/800x450?text=Propiedad';
    }
    function getLocationText(loc){
        if (!loc) return '';
        if (typeof loc === 'string') return loc;
        const parts = [loc.sector, loc.city, loc.province, loc.country].filter(Boolean);
        return parts.join(', ');
    }
    function formatPrice(p){
        if (p?.priceFormatted) return p.priceFormatted;
        if (typeof p?.price === 'number'){
            try{
                const currency = p?.currency || 'DOP';  // Forzar DOP por defecto
                return new Intl.NumberFormat('es-DO',{style:'currency',currency,minimumFractionDigits:0}).format(p.price);
            }catch{
                return `RD$${p.price.toLocaleString('es-DO')}`;
            }
        }
        return '';
    }
    function parseMoney(v){
        if (v == null || v === '') return null;
        if (typeof v === 'number') return Number.isFinite(v) ? v : null;
        const s = String(v).replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : null;
    }
    function extractPrice(p){
        const n = Number(p?.price);
        if (Number.isFinite(n)) return n;

        // si hay unidades, usar el menor precio válido
        if (Array.isArray(p?.units) && p.units.length){
            const vals = p.units.map(u => Number(u?.price)).filter(Number.isFinite);
            if (vals.length) return Math.min(...vals);
        }
        const pf = parseMoney(p?.priceFormatted);
        if (pf != null) return pf;
        return NaN;
    }

    // ====== Filtros/orden/paginación ======
    function readFiltersFromDOM(){
        let type = (fType?.value || '').trim();
        let sale = (fSaleType?.value || '').trim();
        if (/^todos?$/i.test(type)) type = '';
        if (/venta\s*\/\s*alquiler|alquiler\s*\/\s*venta/i.test(sale)) sale = '';
        return {
            type,
            saleType: sale,
            min: parseMoney(fMin?.value ?? ''),
            max: parseMoney(fMax?.value ?? '')
        };
    }
    function applyFilters(list){
        const q = (STATE.q||'').trim().toLowerCase();
        return list.filter(p=>{
            if (q){
                const haystack = [
                    p.title, p.descriptionParagraph, p.type, p.saleType,
                    (p.location ? (typeof p.location === 'string'
                        ? p.location
                        : [p.location.sector,p.location.city,p.location.province,p.location.country].filter(Boolean).join(' ')) : '')
                ].filter(Boolean).join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            if (STATE.type && String(p.type||'').toLowerCase() !== STATE.type.toLowerCase()) return false;
            if (STATE.saleType && String(p.saleType||'').toLowerCase() !== STATE.saleType.toLowerCase()) return false;

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
        if (total === 0) resultsCount.textContent = 'Sin resultados';
        else resultsCount.textContent = `Mostrando ${start}–${end} de ${total}`;
    }
    function applyAndRender(){
        const filtered = sortList(applyFilters(ALL_PROPERTIES));
        const { items, pages, page, total } = paginate(filtered);
        STATE.page = page;
        renderCards(items);
        renderPagination(pages, page);
        updateResultsCount(total);
    }

    // Segmented -> sincroniza aria-pressed y selects ocultos
    function setSegmentPressed(segmentEl, datasetKey, value){
        segmentEl?.querySelectorAll('.seg-btn').forEach(btn=>{
            const isActive = String(btn.dataset[datasetKey]) === String(value);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }
    sortSegment?.addEventListener('click', (e)=>{
        const btn = e.target.closest('.seg-btn'); if (!btn) return;
        STATE.sort = btn.dataset.sort || 'createdAt-desc';
        sortBySelect.value = STATE.sort;
        setSegmentPressed(sortSegment, 'sort', STATE.sort);
        STATE.page = 1;
        applyAndRender();
    });
    pageSizeSegment?.addEventListener('click', (e)=>{
        const btn = e.target.closest('.seg-btn'); if (!btn) return;
        const size = parseInt(btn.dataset.size,10);
        if (!Number.isFinite(size)) return;
        STATE.pageSize = size;
        pageSizeSelect.value = String(size);
        setSegmentPressed(pageSizeSegment, 'size', String(size));
        STATE.page = 1;
        applyAndRender();
    });

    // ===== Render de cards (con menú 3 puntos) =====
    function renderCards(list){
        cardsContainer.className = 'row g-3';
        if (!list.length){
            cardsContainer.innerHTML = '<div class="col-12 text-muted">No hay propiedades.</div>';
            return;
        }
        cardsContainer.innerHTML = '';
        for(const p of list){
            const id = extractId(p);
            if (!id) continue;

            const mainImg      = getMainImage(p);
            const title        = escapeHtml(p?.title || 'Propiedad');
            const propType     = escapeHtml(p?.type || '');
            const saleType     = escapeHtml(p?.saleType || '');
            const locationText = escapeHtml(getLocationText(p?.location));
            const priceText    = escapeHtml(formatPrice(p));
            const beds         = p?.bedrooms;
            const baths        = p?.bathrooms;
            const park         = p?.parking;
            const area         = p?.area;
            const areaUnit     = p?.areaUnit || 'm²';

            const col = document.createElement('div');
            col.className = 'col-sm-6 col-md-4';

            const link = document.createElement('a');
            link.href = `property.html?id=${encodeURIComponent(id)}`;
            link.className = 'text-decoration-none text-dark';

            const card = document.createElement('div');
            card.className = 'card h-100';
            card.innerHTML = `
        <div class="ratio ratio-16x9">
          <img src="${mainImg}" alt="${title}" loading="lazy">
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

        <!-- Menú 3 puntos -->
        <div class="card-menu dropdown dropup">
          <button class="btn btn-light btn-sm rounded-circle shadow-sm btn-card-menu" data-bs-toggle="dropdown" aria-expanded="false" title="Opciones">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item menu-action action-edit" href="#">Modificar</a></li>
  <li><a class="dropdown-item menu-action action-delete" href="#">Eliminar</a></li>
          </ul>
        </div>
      `;

            // Evitar navegación al interactuar con el menú
            card.querySelectorAll('.btn-card-menu, .dropdown-item').forEach(el=>{
                el.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); });
            });

            // Editar
            card.querySelector('.action-edit')?.addEventListener('click', ()=>{
                openEditModal(p, id);
            });

            // Eliminar
            card.querySelector('.action-delete')?.addEventListener('click', async ()=>{
                if (!confirm('¿Eliminar esta propiedad?')) return;
                try{
                    const res = await fetch(`${API_BASE}/api/properties/${id}`, { method:'DELETE' });
                    if (res.ok){
                        await loadCards(); // recarga
                    }else{
                        alert('No se pudo eliminar (status '+res.status+')');
                    }
                }catch(err){
                    console.error(err);
                    alert('Error de red al eliminar');
                }
            });

            link.appendChild(card);
            col.appendChild(link);
            cardsContainer.appendChild(col);
        }
    }

    // ===== Cargar datos y aplicar filtros =====
    async function loadCards(){
        try{
            const res = await fetch(`${API_BASE}/api/properties`, { headers:{'Accept':'application/json'} });
            if (!res.ok){
                cardsContainer.innerHTML = `<div class="col-12 text-danger">Error al cargar (status ${res.status})</div>`;
                return;
            }
            const raw = await res.text();
            const data = raw ? JSON.parse(raw) : null;
            ALL_PROPERTIES = Array.isArray(data) ? data : (data?.items || data?.results || data?.properties || []);
            applyAndRender();
        }catch(err){
            console.error('[ADMIN] Error cargando lista:', err);
            cardsContainer.innerHTML = `<div class="col-12 text-danger">Error de red</div>`;
        }
    }

    function renderUnitsList(){
        if (!unitsListEl) return;
        unitsListEl.innerHTML = '';

        unitsList.forEach((u, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
      <td>${escapeHtml(u.name||'')}</td>
      <td>${Number.isFinite(u.floor)?u.floor:''}</td>
      <td>${Number.isFinite(u.bedrooms)?u.bedrooms:''}</td>
      <td>${Number.isFinite(u.bathrooms)?u.bathrooms:''}</td>
      <td>${Number.isFinite(u.parking)?u.parking:''}</td>
      <td>${Number.isFinite(u.area)?u.area:''}</td>
      <td>${Number.isFinite(u.price)?new Intl.NumberFormat('es-DO',{style:'currency',currency:'DOP',minimumFractionDigits:0}).format(u.price):''}</td>
      <td class="text-end">
        <button type="button" class="btn btn-sm btn-outline-danger" data-action="del">Eliminar</button>
      </td>
    `;
            tr.querySelector('[data-action="del"]').addEventListener('click', ()=>{
                unitsList.splice(idx,1);
                renderUnitsList();
                // recalcular precio auto si aplica
                if (supportsUnits()){
                    const mu = minUnitPrice();
                    priceInput.value = (mu!=null) ? mu : '';
                }
            });
            unitsListEl.appendChild(tr);
        });
    }

    // ===== Chips: render/add/remove =====
    function renderChipLists(){
        renderChips(featuresListEl, featuresList, (idx)=>{ featuresList.splice(idx,1); renderChipLists(); });
        renderChips(amenitiesListEl, amenitiesList, (idx)=>{ amenitiesList.splice(idx,1); renderChipLists(); });
    }
    function renderChips(container, list, onRemove){
        container.innerHTML = '';
        list.forEach((txt, idx)=>{
            const div = document.createElement('div');
            div.className = 'chip';
            div.innerHTML = `
        <span>${escapeHtml(txt)}</span>
        <button type="button" class="chip-remove" aria-label="Eliminar">&times;</button>
      `;
            div.querySelector('.chip-remove').addEventListener('click', ()=> onRemove(idx));
            container.appendChild(div);
        });
    }
    function addChip(inputEl, list){
        const val = (inputEl.value || '').trim();
        if (!val) return;
        if (val.length > 60) { alert('Texto demasiado largo (máx 60).'); return; }
        if (list.includes(val)) { inputEl.value=''; return; }
        if (list.length >= 50) { alert('Máximo 50 elementos.'); return; }
        list.push(val);
        inputEl.value = '';
        renderChipLists();
    }
    addFeatureBtn?.addEventListener('click', ()=> addChip(featureInput, featuresList));
    addAmenityBtn?.addEventListener('click', ()=> addChip(amenityInput, amenitiesList));
    featureInput?.addEventListener('keydown', (e)=>{ if (e.key==='Enter'){ e.preventDefault(); addChip(featureInput, featuresList);} });
    amenityInput?.addEventListener('keydown', (e)=>{ if (e.key==='Enter'){ e.preventDefault(); addChip(amenityInput, amenitiesList);} });

    // ===== Imágenes: selección, preview, remove =====
    function clearSelectedFiles(){
        selectedFiles.forEach(f => URL.revokeObjectURL(f.url));
        selectedFiles = [];
    }
    function updateImageCount(){
        const total = existingImageUrls.length + selectedFiles.length;
        imageCountEl.textContent = String(total);
    }
    function renderImagePreview(){
        imagePreviewEl.innerHTML = '';
        existingImageUrls.forEach((u, idx)=>{
            const item = document.createElement('div');
            item.className = 'image-item';
            const src = toImageUrl(u, API_BASE);
            item.innerHTML = `
    <img src="${src}" alt="img">
    <button type="button" class="remove" title="Quitar"><i class="bi bi-x-lg"></i></button>
  `;
            item.querySelector('.remove').addEventListener('click', ()=>{
                existingImageUrls.splice(idx,1);
                renderImagePreview();
            });
            imagePreviewEl.appendChild(item);
        });

        // Archivos seleccionados (nuevos)
        selectedFiles.forEach((obj, idx)=>{
            const item = document.createElement('div');
            item.className = 'image-item';
            item.innerHTML = `
        <img src="${obj.url}" alt="${escapeHtml(obj.file.name)}">
        <button type="button" class="remove" title="Quitar"><i class="bi bi-x-lg"></i></button>
      `;
            item.querySelector('.remove').addEventListener('click', ()=>{
                URL.revokeObjectURL(obj.url);
                selectedFiles.splice(idx,1);
                renderImagePreview();
            });
            imagePreviewEl.appendChild(item);
        });

        updateImageCount();
    }
    function addFiles(fileList){
        const incoming = Array.from(fileList || []);
        if (!incoming.length) return;

        const totalNow = existingImageUrls.length + selectedFiles.length;
        const available = MAX_IMAGES - totalNow;
        if (available <= 0) { alert('Límite de imágenes alcanzado.'); return; }

        const accepted = incoming.slice(0, available).filter(f=>{
            if (!f.type.startsWith('image/')) { alert(`"${f.name}" no es una imagen válida.`); return false; }
            if (f.size > MAX_FILE_MB*1024*1024) { alert(`"${f.name}" excede ${MAX_FILE_MB} MB.`); return false; }
            return true;
        });

        accepted.forEach(f=>{
            selectedFiles.push({ id: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) });
        });
        renderImagePreview();
    }
    imageInput?.addEventListener('change', (e)=> addFiles(e.target.files));

    // ===== Prefill + edición =====
    function fillFormFromProperty(p){
        if (!form || !p) return;

        form.title.value = p.title ?? '';
        form.type.value = p.type ?? '';
        form.saleType.value = p.saleType ?? '';
        form.price.value = (typeof p.price === 'number') ? p.price : (p.price ?? '');

        form.bedrooms.value = Number.isFinite(p.bedrooms) ? p.bedrooms : '';
        form.bathrooms.value = Number.isFinite(p.bathrooms) ? p.bathrooms : '';
        form.parking.value   = Number.isFinite(p.parking) ? p.parking : '';
        form.area.value      = Number.isFinite(p.area) ? p.area : '';
        form.address.value   = p.address ?? '';

        const plat = p.latitude ?? p?.location?.latitude ?? p?.location?.lat;
        const plng = p.longitude ?? p?.location?.longitude ?? p?.location?.lng;
        form.latitude.value  = Number.isFinite(plat) ? plat : '';
        form.longitude.value = Number.isFinite(plng) ? plng : '';

        form.descriptionParagraph.value = p.descriptionParagraph ?? '';
        
        // Precio por m² para solares
        const pricePerSqmField = document.getElementById('pricePerSqm');
        if (pricePerSqmField && p.pricePerSqm) {
            pricePerSqmField.value = Number.isFinite(p.pricePerSqm) ? p.pricePerSqm : '';
        } else if (pricePerSqmField && p.type === 'Solar' && p.area > 0 && p.price > 0) {
            // Calcular precio por m² si no está guardado pero tenemos área y precio
            const calculatedPricePerSqm = p.price / p.area;
            pricePerSqmField.value = Number.isFinite(calculatedPricePerSqm) ? calculatedPricePerSqm.toFixed(2) : '';
        }
        
        // tipologia
        unitsList = Array.isArray(p.units) ? p.units.map(u => ({
            id: crypto.randomUUID(),
            name: u.name ?? '',
            floor: Number.isFinite(Number(u.floor)) ? Number(u.floor) : undefined,
            bedrooms: Number.isFinite(Number(u.bedrooms)) ? Number(u.bedrooms) : 0,
            bathrooms: Number.isFinite(Number(u.bathrooms)) ? Number(u.bathrooms) : 0,
            parking: Number.isFinite(Number(u.parking)) ? Number(u.parking) : 0,
            area: Number.isFinite(Number(u.area)) ? Number(u.area) : undefined,
            price: Number.isFinite(Number(u.price)) ? Number(u.price) : undefined
        })) : [];
        renderUnitsList();
        toggleFieldsByPropertyType();

        if (supportsUnits()){
            const mu = minUnitPrice();
            form.price.value = (mu!=null) ? mu : '';
        }
        // chips
        featuresList  = Array.isArray(p.features)  ? [...p.features]  : [];
        amenitiesList = Array.isArray(p.amenities) ? [...p.amenities] : [];
        renderChipLists();

        // imágenes
        existingImageUrls = Array.isArray(p.images) ? [...p.images].slice(0, MAX_IMAGES) : [];
        clearSelectedFiles();
        renderImagePreview();

        // Marca en el mapa si hay lat/lng
        if (Number.isFinite(plat) && Number.isFinite(plng)) {
            initMapIfNeeded();
            setLatLng({ lat: plat, lng: plng }, 'init');
        }
    }
    function openEditModal(p, id){
        editingId = id;
        modalEl.querySelector('.modal-title').textContent = 'Modificar propiedad';
        form?.classList.remove('was-validated');
        fillFormFromProperty(p);
        getModal().show();
        setTimeout(() => { map?.invalidateSize(); }, 50);
    }

    // ===== Submit (crear/actualizar) =====
    async function fileToDataURL(file){
        return new Promise((resolve, reject)=>{
            const reader = new FileReader();
            reader.onload = ()=> resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    async function uploadSelectedFiles(files){
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        const res = await fetch(`${API_BASE}/api/uploads`, { method:'POST', body: fd });
        if (!res.ok) throw new Error(`upload ${res.status}`);
        const data = await res.json().catch(()=> ({}));
        if (!data || !Array.isArray(data.urls)) throw new Error('Respuesta inválida de /api/uploads');
        return data.urls;
    }
    async function getImagesForPayload(){
        if (selectedFiles.length === 0) return [...existingImageUrls];
        const uploaded = await uploadSelectedFiles(selectedFiles.map(o=>o.file));
        return [...existingImageUrls, ...uploaded].slice(0, MAX_IMAGES);
    }

    if (form){
        form.addEventListener('submit', async (e)=>{
            e.preventDefault();
            
            // Limpiar errores anteriores
            if (typeof FormValidator !== 'undefined') {
                FormValidator.clearFormErrors(form);
            }
            
            form.classList.add('was-validated');
            if (!form.checkValidity()) {
                // Mostrar mensaje de error global usando FormValidator si está disponible
                if (typeof FormValidator !== 'undefined') {
                    FormValidator.showGlobalError(form, 'Por favor completa todos los campos requeridos antes de guardar');
                } else {
                    alert('Por favor completa todos los campos requeridos');
                }
                return;
            }

            try{
                const images = await getImagesForPayload();

                const data = {
                    title: form.title.value.trim(),
                    type: form.type.value,
                    saleType: form.saleType.value,
                    price: parseFloat(form.price.value.replace(/[^0-9.]/g,'')),
                    bedrooms: parseInt(form.bedrooms.value,10),
                    bathrooms: parseInt(form.bathrooms.value,10),
                    parking: parseInt(form.parking.value,10),
                    area: form.area.value ? parseFloat(form.area.value) : undefined,
                    address: form.address.value.trim(),
                    latitude: form.latitude.value ? parseFloat(form.latitude.value) : undefined,
                    longitude: form.longitude.value ? parseFloat(form.longitude.value) : undefined,
                    descriptionParagraph: form.descriptionParagraph.value.trim(),
                    features: featuresList,
                    amenities: amenitiesList,
                    images
                };
                
                // Añadir pricePerSqm para solares con validación
                const pricePerSqmField = document.getElementById('pricePerSqm');
                if (form.type.value === 'Solar' && pricePerSqmField?.value) {
                    const pricePerSqm = parseFloat(pricePerSqmField.value);
                    if (!isNaN(pricePerSqm) && pricePerSqm > 0) {
                        data.pricePerSqm = pricePerSqm;
                    }
                }

                Object.keys(data).forEach(k=>{
                    const v = data[k];
                    if (v === undefined || v === '' || (Array.isArray(v) && v.length===0)) delete data[k];
                });
                if (supportsUnits() && unitsList.length){
                    // fuerza precio auto por menor unidad
                    const mu = minUnitPrice();
                    if (mu == null){
                        if (typeof FormValidator !== 'undefined') {
                            FormValidator.showGlobalError(form, 'Agrega al menos una unidad con precio válido');
                        } else {
                            alert('Agrega al menos una unidad con precio.');
                        }
                        return;
                    }
                    data.units = unitsList.map(u => ({
                        name: u.name,
                        floor: Number.isFinite(u.floor) ? u.floor : undefined,
                        bedrooms: Number.isFinite(u.bedrooms) ? u.bedrooms : 0,
                        bathrooms: Number.isFinite(u.bathrooms) ? u.bathrooms : 0,
                        parking: Number.isFinite(u.parking) ? u.parking : 0,
                        area: Number.isFinite(u.area) ? u.area : undefined,
                        price: Number.isFinite(u.price) ? u.price : undefined
                    }));
                    data.price = mu; // precio del anuncio = menor unidad
                } else {
                    // si el tipo no soporta tipologías, no enviar units
                    if ('units' in data) delete data.units;
                }
                const url = editingId
                    ? `${API_BASE}/api/properties/${editingId}`
                    : `${API_BASE}/api/properties`;
                const method = editingId ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method,
                    headers:{'Content-Type':'application/json'},
                    body: JSON.stringify(data)
                });

                if (res.ok){
                    await res.json().catch(()=>null);
                    
                    if (typeof FormValidator !== 'undefined') {
                        FormValidator.showGlobalSuccess(form, editingId ? 'Propiedad actualizada correctamente' : 'Propiedad guardada correctamente');
                    } else {
                        alert(editingId ? 'Propiedad actualizada' : 'Propiedad guardada correctamente');
                    }
                    
                    editingId = null;
                    form.reset();
                    form.classList.remove('was-validated');
                    modalEl.querySelector('.modal-title').textContent = 'Crear propiedad';
                    // reset estados UI
                    featuresList = [];
                    amenitiesList = [];
                    existingImageUrls = [];
                    clearSelectedFiles();
                    renderChipLists();
                    renderImagePreview();
                    
                    // Cerrar modal después de un breve delay para que se vea el mensaje de éxito
                    setTimeout(() => {
                        getModal().hide();
                    }, 1500);
                    
                    if (marker){ marker.remove(); marker = null; }
                    await loadCards();
                }else{
                    let msg = editingId ? 'Error al actualizar la propiedad' : 'Error al guardar la propiedad';
                    let errorsList = [];
                    
                    try{
                        const err = await res.json();
                        if (err?.errors && Array.isArray(err.errors)) {
                            errorsList = err.errors;
                            msg = errorsList[0]; // Mostrar el primer error como mensaje principal
                            
                            if (typeof FormValidator !== 'undefined') {
                                // Mostrar mensaje global
                                FormValidator.showGlobalError(form, msg);
                                
                                // Si hay más errores, agregarlos como una lista
                                if (errorsList.length > 1) {
                                    const existingAlert = form.querySelector('.validation-alert');
                                    if (existingAlert) {
                                        const errorListHtml = '<ul class="mt-2 mb-0">' + 
                                            errorsList.map(e => `<li>${e}</li>`).join('') + 
                                            '</ul>';
                                        existingAlert.innerHTML = existingAlert.innerHTML.replace('</button>', '</button>' + errorListHtml);
                                    }
                                }
                            } else {
                                msg += ':\n\n' + errorsList.map((e, i) => `${i + 1}. ${e}`).join('\n');
                                alert(msg);
                            }
                        } else if (err?.message) {
                            msg += ': ' + err.message;
                            if (typeof FormValidator !== 'undefined') {
                                FormValidator.showGlobalError(form, msg);
                            } else {
                                alert(msg);
                            }
                        }
                    }catch{
                        msg += ` (código de error ${res.status})`;
                        if (typeof FormValidator !== 'undefined') {
                            FormValidator.showGlobalError(form, msg);
                        } else {
                            alert(msg);
                        }
                    }
                    
                    // Si no usamos FormValidator, mostrar alert tradicional
                    if (typeof FormValidator === 'undefined' && errorsList.length === 0) {
                        alert(msg);
                    }
                }
            }catch(err){
                console.error('[ADMIN] Submit error:', err);
                const errorMsg = 'Error al procesar las imágenes o enviar los datos. Por favor intenta nuevamente.';
                if (typeof FormValidator !== 'undefined') {
                    FormValidator.showGlobalError(form, errorMsg);
                } else {
                    alert(errorMsg);
                }
            }
        });
    }

    // ====== MAPA Leaflet ======
    let map = null;
    let marker = null;

    function setLatLng({lat, lng}, from='map'){
        const latVal = Number(lat);
        const lngVal = Number(lng);
        if (!Number.isFinite(latVal) || !Number.isFinite(lngVal)) return;

        latInput.value = latVal.toFixed(6);
        lngInput.value = lngVal.toFixed(6);

        if (map){
            if (!marker){
                marker = L.marker([latVal, lngVal], { draggable: true }).addTo(map);
                marker.on('dragend', () => {
                    const { lat: dlat, lng: dlng } = marker.getLatLng();
                    setLatLng({ lat: dlat, lng: dlng }, 'drag');
                });
            } else {
                marker.setLatLng([latVal, lngVal]);
            }
            if (from !== 'drag'){
                map.setView([latVal, lngVal], Math.max(map.getZoom(), 14));
            }
        }
    }
    function initMapIfNeeded(){
        if (!mapContainer || map) return;
        const DEFAULT_CENTER = [18.7357, -70.1627];
        const DEFAULT_ZOOM   = 7;

        map = L.map(mapContainer, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        map.on('click', (e) => { setLatLng(e.latlng, 'click'); });

        const li = parseFloat(latInput?.value);
        const lo = parseFloat(lngInput?.value);
        if (Number.isFinite(li) && Number.isFinite(lo)){
            setLatLng({lat: li, lng: lo}, 'init');
        }
        setTimeout(() => { map.invalidateSize(); }, 100);
    }
    modalEl?.addEventListener('shown.bs.modal', () => {
        initMapIfNeeded();
        setTimeout(() => { map?.invalidateSize(); }, 50);
    });
    latInput?.addEventListener('change', () => {
        const li = parseFloat(latInput.value);
        const lo = parseFloat(lngInput.value);
        if (Number.isFinite(li) && Number.isFinite(lo)) setLatLng({lat: li, lng: lo}, 'inputs');
    });
    lngInput?.addEventListener('change', () => {
        const li = parseFloat(latInput.value);
        const lo = parseFloat(lngInput.value);
        if (Number.isFinite(li) && Number.isFinite(lo)) setLatLng({lat: li, lng: lo}, 'inputs');
    });
    btnMyLocation?.addEventListener('click', async () => {
        if (!navigator.geolocation){
            alert('Tu navegador no soporta geolocalización.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                initMapIfNeeded();
                setLatLng({ lat: latitude, lng: longitude }, 'geolocation');
            },
            (err) => {
                console.warn('Geolocation error:', err);
                alert('No se pudo obtener tu ubicación.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    });
    btnClearMarker?.addEventListener('click', () => {
        latInput.value = '';
        lngInput.value = '';
        if (marker){ marker.remove(); marker = null; }
        if (map){ map.setView([18.7357, -70.1627], 7); }
    });

    // ===== Eventos filtros/buscador =====
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
        STATE.sort = sortBySelect.value || 'createdAt-desc';
        setSegmentPressed(sortSegment, 'sort', STATE.sort);
        STATE.page = 1;
        applyAndRender();
    });
    addUnitBtn?.addEventListener('click', ()=>{
        const u = {
            id: crypto.randomUUID(),
            name: (unitName.value||'').trim(),
            floor: unitFloor.value ? parseInt(unitFloor.value,10) : undefined,
            bedrooms: unitBedrooms.value ? parseInt(unitBedrooms.value,10) : 0,
            bathrooms: unitBathrooms.value ? parseInt(unitBathrooms.value,10) : 0,
            parking: unitParking.value ? parseInt(unitParking.value,10) : 0,
            area: unitArea.value ? parseFloat(unitArea.value) : undefined,
            price: unitPrice.value ? parseFloat(unitPrice.value) : undefined
        };

        if (!u.name){ alert('Pon un nombre para la unidad.'); return; }
        if (!Number.isFinite(u.price)){ alert('Precio de la unidad inválido.'); return; }

        unitsList.push(u);
        clearUnitInputs();
        renderUnitsList();

        // Precio auto (menor)
        if (supportsUnits()){
            const mu = minUnitPrice();
            if (mu != null) priceInput.value = mu;
        }
    });
    typeSelect?.addEventListener('change', ()=>{
        toggleFieldsByPropertyType();
    });
    
    // Actualizar hint de precio cuando cambie el área
    document.getElementById('area')?.addEventListener('input', ()=>{
        const type = typeSelect?.value || '';
        updatePriceHint(type);
        // Calcular precio para solares
        if (type === 'Solar') {
            calculateSolarPrice();
        }
    });

    // Calcular precio automáticamente para solares cuando cambie precio por m²
    document.getElementById('pricePerSqm')?.addEventListener('input', ()=>{
        const type = typeSelect?.value || '';
        if (type === 'Solar') {
            calculateSolarPrice();
        }
    });

    pageSizeSelect?.addEventListener('change', ()=>{
        const n = parseInt(pageSizeSelect.value,10);
        if (Number.isFinite(n)) STATE.pageSize = n;
        setSegmentPressed(pageSizeSegment, 'size', String(STATE.pageSize));
        STATE.page = 1;
        applyAndRender();
    });

    // ===== Carga inicial =====
    loadCards();
});

document.addEventListener('DOMContentLoaded', () => {
    // Polyfill for crypto.randomUUID() for older browsers
    if (!crypto.randomUUID) {
        crypto.randomUUID = function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
    }
    
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const API_BASE = isLocal ? 'http://localhost:7070' : ''; // en prod, vacío para usar el proxy de Netlify
    const API = `${API_BASE}/api`;
    const UPLOADS = `${API_BASE}/uploads`;

    console.log('[ADMIN] API_BASE:', API_BASE);

    // --- Config imágenes (actualizado para soportar más imágenes y formatos) ---
    const MAX_IMAGES = 100; // Aumentado de 10 a 100
    const MAX_FILE_MB = 25; // Aumentado de 5MB a 25MB
    const USE_UPLOAD_API = true; // usa /api/uploads
    
    // Batch sizes for optimized image processing
    const IMAGE_RENDER_BATCH_SIZE = 10;  // Process 10 images at a time when rendering previews
    const FILE_VALIDATION_BATCH_SIZE = 20;  // Validate 20 files at a time when adding new files
    
    // Formatos de imagen soportados
    const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif'];
    const ALLOWED_MIME_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 
        'image/webp', 'image/svg+xml', 'image/tiff'
    ];

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
    const imageDropZone  = document.getElementById('imageDropZone');
    const uploadProgress = document.getElementById('uploadProgress');

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
        
        // Create a document fragment to batch DOM updates
        const fragment = document.createDocumentFragment();
        
        // Process existing images - store URLs in a closure to avoid index issues
        existingImageUrls.forEach((imageUrl)=>{
            const item = document.createElement('div');
            item.className = 'image-item';
            const src = toImageUrl(imageUrl, API_BASE);
            item.innerHTML = `
    <img src="${src}" alt="img">
    <button type="button" class="remove" title="Quitar"><i class="bi bi-x-lg"></i></button>
  `;
            // Use the URL itself to find and remove the correct item
            const removeHandler = (urlToRemove) => () => {
                const urlIdx = existingImageUrls.indexOf(urlToRemove);
                if (urlIdx !== -1) {
                    existingImageUrls.splice(urlIdx, 1);
                    renderImagePreview();
                }
            };
            item.querySelector('.remove').addEventListener('click', removeHandler(imageUrl));
            fragment.appendChild(item);
        });

        // Archivos seleccionados (nuevos) - process in batches
        let currentBatch = 0;
        
        const processBatch = () => {
            const startIdx = currentBatch * IMAGE_RENDER_BATCH_SIZE;
            const endIdx = Math.min(startIdx + IMAGE_RENDER_BATCH_SIZE, selectedFiles.length);
            
            if (startIdx >= selectedFiles.length) {
                // All batches processed, update count and we're done
                updateImageCount();
                return;
            }
            
            // Process this batch
            const batchFragment = document.createDocumentFragment();
            for (let idx = startIdx; idx < endIdx; idx++) {
                const obj = selectedFiles[idx];
                const item = document.createElement('div');
                item.className = 'image-item';
                item.dataset.fileId = obj.id;
                
                item.innerHTML = `
            <img src="${obj.url}" alt="${escapeHtml(obj.file.name)}">
            <button type="button" class="remove" title="Quitar"><i class="bi bi-x-lg"></i></button>
            <div class="progress-bar-container d-none">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
          `;
                // Use file ID to find and remove the correct file
                const removeHandler = (fileId) => () => {
                    const fileIdx = selectedFiles.findIndex(f => f.id === fileId);
                    if (fileIdx !== -1) {
                        URL.revokeObjectURL(selectedFiles[fileIdx].url);
                        selectedFiles.splice(fileIdx, 1);
                        renderImagePreview();
                    }
                };
                item.querySelector('.remove').addEventListener('click', removeHandler(obj.id));
                batchFragment.appendChild(item);
            }
            
            imagePreviewEl.appendChild(batchFragment);
            currentBatch++;
            
            // Schedule next batch using requestAnimationFrame for smooth rendering
            requestAnimationFrame(() => {
                setTimeout(processBatch, 0); // Small delay to keep UI responsive
            });
        };
        
        // Append existing images immediately
        imagePreviewEl.appendChild(fragment);
        
        // Start processing new files in batches
        if (selectedFiles.length > 0) {
            processBatch();
        } else {
            updateImageCount();
        }
    }
    
    // Update progress for a specific file during upload
    function updateFileProgress(fileId, status, progress = 0) {
        const item = imagePreviewEl.querySelector(`[data-file-id="${fileId}"]`);
        if (!item) return;
        
        const progressContainer = item.querySelector('.progress-bar-container');
        const progressBar = item.querySelector('.progress-bar');
        const removeBtn = item.querySelector('.remove');
        
        if (status === 'uploading') {
            progressContainer?.classList.remove('d-none');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
                progressBar.style.background = '#0d6efd'; // Blue for uploading
            }
            removeBtn?.setAttribute('disabled', 'disabled');
        } else if (status === 'success') {
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.background = '#28a745'; // Green for success
            }
            setTimeout(() => {
                progressContainer?.classList.add('d-none');
            }, 1000);
            removeBtn?.removeAttribute('disabled');
        } else if (status === 'error') {
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.background = '#dc3545'; // Red for error
            }
            setTimeout(() => {
                progressContainer?.classList.add('d-none');
            }, 2000);
            removeBtn?.removeAttribute('disabled');
        }
    }
    function addFiles(fileList){
        const incoming = Array.from(fileList || []);
        if (!incoming.length) return;

        const totalNow = existingImageUrls.length + selectedFiles.length;
        const available = MAX_IMAGES - totalNow;
        if (available <= 0) { 
            alert(`Límite de ${MAX_IMAGES} imágenes alcanzado.`); 
            return; 
        }

        const errors = [];
        const toProcess = incoming.slice(0, available);
        
        // Process files in batches to avoid blocking the UI
        const processFileBatch = (startIdx) => {
            const endIdx = Math.min(startIdx + FILE_VALIDATION_BATCH_SIZE, toProcess.length);
            
            for (let idx = startIdx; idx < endIdx; idx++) {
                const f = toProcess[idx];
                
                // Validate MIME type
                if (!ALLOWED_MIME_TYPES.includes(f.type.toLowerCase())) { 
                    errors.push(`"${f.name}": tipo no permitido (${f.type})`);
                    continue;
                }
                
                // Validate file extension
                const ext = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));
                if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
                    errors.push(`"${f.name}": extensión no permitida (${ext})`);
                    continue;
                }
                
                // Validate file size
                if (f.size > MAX_FILE_MB * 1024 * 1024) { 
                    errors.push(`"${f.name}": excede ${MAX_FILE_MB} MB (${(f.size / 1024 / 1024).toFixed(2)} MB)`);
                    continue;
                }
                
                // Validate file is not empty
                if (f.size === 0) {
                    errors.push(`"${f.name}": archivo vacío`);
                    continue;
                }
                
                // File is valid, add to selectedFiles
                selectedFiles.push({ id: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) });
            }
            
            // Process next batch or finish
            if (endIdx < toProcess.length) {
                // Schedule next batch using setTimeout to keep UI responsive
                setTimeout(() => processFileBatch(endIdx), 0);
            } else {
                // All files processed
                if (errors.length > 0) {
                    const errorMsg = 'Algunos archivos no son válidos:\n\n' + errors.join('\n');
                    alert(errorMsg);
                }
                renderImagePreview();
            }
        };
        
        // Start processing batches
        processFileBatch(0);
    }
    imageInput?.addEventListener('change', (e)=> addFiles(e.target.files));

    // ===== Drag and Drop para imágenes =====
    if (imageDropZone && imageInput) {
        // Click en la zona abre el selector de archivos
        imageDropZone.addEventListener('click', () => {
            imageInput.click();
        });
        
        // Prevenir comportamiento por defecto del navegador
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            imageDropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        // Resaltar zona cuando se arrastra sobre ella
        ['dragenter', 'dragover'].forEach(eventName => {
            imageDropZone.addEventListener(eventName, () => {
                imageDropZone.classList.add('drag-over');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            imageDropZone.addEventListener(eventName, () => {
                imageDropZone.classList.remove('drag-over');
            });
        });
        
        // Manejar drop de archivos
        imageDropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            addFiles(files);
        });
    }

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
    
    // Upload images with progress tracking and concurrent processing
    async function uploadSelectedFilesWithProgress(files, progressCallback) {
        const BATCH_SIZE = 10; // Upload in batches of 10 to avoid overwhelming the server
        const results = [];
        const errors = [];
        
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (file, batchIndex) => {
                const fileIndex = i + batchIndex;
                try {
                    const fd = new FormData();
                    fd.append('files', file);
                    
                    if (progressCallback) {
                        progressCallback(fileIndex, 'uploading', file.name);
                    }
                    
                    const res = await fetch(`${API_BASE}/api/uploads`, { 
                        method: 'POST', 
                        body: fd 
                    });
                    
                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
                        throw new Error(errorData.message || `Upload failed with status ${res.status}`);
                    }
                    
                    const data = await res.json();
                    
                    if (data && Array.isArray(data.urls) && data.urls.length > 0) {
                        if (progressCallback) {
                            progressCallback(fileIndex, 'success', file.name);
                        }
                        return { success: true, url: data.urls[0], warnings: data.warnings };
                    } else {
                        throw new Error('Invalid response from server');
                    }
                } catch (error) {
                    if (progressCallback) {
                        progressCallback(fileIndex, 'error', file.name, error.message);
                    }
                    return { success: false, error: error.message, filename: file.name };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        
        const urls = results.filter(r => r.success).map(r => r.url);
        const failedFiles = results.filter(r => !r.success);
        
        return { urls, errors: failedFiles };
    }
    
    // Legacy function for backward compatibility
    async function uploadSelectedFiles(files){
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        const res = await fetch(`${API_BASE}/api/uploads`, { method:'POST', body: fd });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `upload ${res.status}`);
        }
        const data = await res.json().catch(()=> ({}));
        if (!data || !Array.isArray(data.urls)) throw new Error('Respuesta inválida de /api/uploads');
        
        // Show warnings if any
        if (data.warnings && data.warnings.length > 0) {
            console.warn('Upload warnings:', data.warnings);
        }
        
        return data.urls;
    }
    async function getImagesForPayload(){
        if (selectedFiles.length === 0) return [...existingImageUrls];
        
        // Show upload progress
        if (uploadProgress) {
            uploadProgress.classList.remove('d-none');
            uploadProgress.textContent = 'Subiendo imágenes...';
        }
        
        // Upload with progress tracking
        const fileObjs = selectedFiles.map(obj => obj.file);
        const progressCallback = (index, status, filename, error) => {
            const fileObj = selectedFiles[index];
            if (!fileObj) return;
            
            updateFileProgress(fileObj.id, status);
            
            if (uploadProgress) {
                const completed = selectedFiles.filter((_, i) => i <= index).length;
                const total = selectedFiles.length;
                uploadProgress.textContent = `Subiendo ${completed}/${total} imágenes...`;
            }
        };
        
        const { urls, errors } = await uploadSelectedFilesWithProgress(fileObjs, progressCallback);
        
        // Hide progress indicator
        if (uploadProgress) {
            uploadProgress.classList.add('d-none');
        }
        
        // Show errors if any
        if (errors.length > 0) {
            const errorMessages = errors.map(e => `${e.filename}: ${e.error}`).join('\n');
            console.error('Upload errors:', errorMessages);
            alert(`Algunas imágenes no se pudieron subir:\n\n${errorMessages}`);
        }
        
        return [...existingImageUrls, ...urls].slice(0, MAX_IMAGES);
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
    
    // Actualizar cuando cambie el área (solo para solares con cálculo automático)
    document.getElementById('area')?.addEventListener('input', ()=>{
        // Solo calcular precio automático para solares
        if (typeSelect?.value === 'Solar') {
            calculateSolarPrice();
        }
    });

    // Calcular precio automáticamente para solares cuando cambie precio por m²
    document.getElementById('pricePerSqm')?.addEventListener('input', ()=>{
        if (typeSelect?.value === 'Solar') {
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

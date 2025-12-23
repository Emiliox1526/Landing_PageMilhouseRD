// Manejo de la configuración del Hero de Propiedades
(function() {
    const previewContainer = document.getElementById('heroPreview');
    const previewTitle = document.getElementById('previewTitle');
    const previewDescription = document.getElementById('previewDescription');
    const uploadZone = document.getElementById('heroImageUpload');
    const imageInput = document.getElementById('heroImageInput');
    const titleInput = document.getElementById('heroTitle');
    const descriptionInput = document.getElementById('heroDescription');
    const saveBtn = document.getElementById('saveHeroBtn');
    const resetBtn = document.getElementById('resetHeroBtn');
    const statusMessage = document.getElementById('heroStatusMessage');

    let currentConfig = null;
    let selectedImage = null;

    // Cargar configuración actual
    async function loadCurrentConfig() {
        try {
            const response = await fetch('/api/hero/propiedades', {
                credentials: 'include'
            });
            
            if (response.ok) {
                currentConfig = await response.json();
                applyConfig(currentConfig);
            } else {
                // Si no existe, usar valores por defecto
                currentConfig = {
                    imageUrl: '/images/default-hero.jpg',
                    title: 'Encuentra tu hogar ideal',
                    description: 'Las mejores propiedades en República Dominicana'
                };
                applyConfig(currentConfig);
            }
        } catch (error) {
            console.error('Error loading hero config:', error);
            showStatus('Error al cargar la configuración', 'error');
        }
    }

    // Aplicar configuración a la UI
    function applyConfig(config) {
        if (config.imageUrl) {
            previewContainer.style.backgroundImage = `url('${config.imageUrl}')`;
        }
        titleInput.value = config.title || '';
        descriptionInput.value = config.description || '';
        updatePreview();
    }

    // Actualizar vista previa en tiempo real
    function updatePreview() {
        previewTitle.textContent = titleInput.value || 'Tu título aquí';
        previewDescription.textContent = descriptionInput.value || 'Tu descripción aquí';
    }

    // Drag & drop para subir imagen
    uploadZone.addEventListener('click', () => imageInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageSelect(file);
        }
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageSelect(file);
        }
    });

    // Manejar selección de imagen
    function handleImageSelect(file) {
        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showStatus('La imagen es muy grande. Máximo 10MB.', 'error');
            return;
        }

        selectedImage = file;
        
        // Mostrar preview inmediato
        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.style.backgroundImage = `url('${e.target.result}')`;
            showStatus('Imagen seleccionada. Haz clic en "Guardar Cambios" para aplicar.', 'info');
        };
        reader.readAsDataURL(file);
    }

    // Actualizar preview en tiempo real al escribir
    titleInput.addEventListener('input', updatePreview);
    descriptionInput.addEventListener('input', updatePreview);

    // Guardar cambios
    saveBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();

        if (!title) {
            showStatus('El título es obligatorio', 'error');
            titleInput.focus();
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

        try {
            // 1. Subir imagen si hay una nueva
            let imageUrl = currentConfig?.imageUrl;
            if (selectedImage) {
                const formData = new FormData();
                formData.append('files', selectedImage);

                const uploadResp = await fetch('/api/uploads', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (!uploadResp.ok) throw new Error('Error al subir imagen');
                
                const uploadData = await uploadResp.json();
                imageUrl = uploadData.urls[0]; // GridFS retorna array de URLs
            }

            // 2. Guardar configuración
            const response = await fetch('/api/hero/propiedades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl, title, description }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Error al guardar');

            currentConfig = await response.json();
            selectedImage = null;
            
            showStatus('✅ Cambios guardados exitosamente', 'success');
            
        } catch (error) {
            console.error('Error saving:', error);
            showStatus('❌ Error al guardar los cambios', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Cambios';
        }
    });

    // Restablecer
    resetBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres descartar los cambios?')) {
            applyConfig(currentConfig);
            selectedImage = null;
            showStatus('Cambios descartados', 'info');
        }
    });

    // Mostrar mensajes de estado
    function showStatus(message, type) {
        const className = `status-message status-${type}`;
        statusMessage.innerHTML = `<div class="${className}">${message}</div>`;
        
        setTimeout(() => {
            statusMessage.innerHTML = '';
        }, 5000);
    }

    // Inicializar
    loadCurrentConfig();
})();

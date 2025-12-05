/**
 * Módulo de validación de formularios - MILHOUSE RD
 * Proporciona validaciones completas en español para todos los formularios del sitio
 */

const FormValidator = {
    /**
     * Muestra un mensaje de error global en la parte superior del formulario
     */
    showGlobalError(form, message) {
        this.hideGlobalError(form);
        
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show validation-alert';
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        `;
        
        form.insertBefore(alert, form.firstChild);
        
        // Scroll suave al mensaje de error
        alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    /**
     * Muestra un mensaje de éxito global
     */
    showGlobalSuccess(form, message) {
        this.hideGlobalError(form);
        
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show validation-alert';
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            <i class="bi bi-check-circle-fill me-2"></i>
            <strong>Éxito:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        `;
        
        form.insertBefore(alert, form.firstChild);
        
        // Scroll suave al mensaje
        alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    /**
     * Oculta mensajes globales de error/éxito
     */
    hideGlobalError(form) {
        const existingAlerts = form.querySelectorAll('.validation-alert');
        existingAlerts.forEach(alert => alert.remove());
    },

    /**
     * Muestra un mensaje de error debajo de un campo específico
     */
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback d-block';
        feedback.textContent = message;
        
        // Insertar después del campo o después de su contenedor
        const container = field.closest('.input-group') || field.parentElement;
        container.appendChild(feedback);
    },

    /**
     * Muestra que un campo es válido
     */
    showFieldValid(field) {
        this.clearFieldError(field);
        
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    },

    /**
     * Limpia los mensajes de error de un campo
     */
    clearFieldError(field) {
        field.classList.remove('is-invalid', 'is-valid');
        
        const container = field.closest('.input-group')?.parentElement || field.parentElement;
        const feedback = container?.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    },

    /**
     * Limpia todos los errores de un formulario
     */
    clearFormErrors(form) {
        this.hideGlobalError(form);
        
        const fields = form.querySelectorAll('.is-invalid, .is-valid');
        fields.forEach(field => this.clearFieldError(field));
        
        const feedbacks = form.querySelectorAll('.invalid-feedback');
        feedbacks.forEach(fb => fb.remove());
    },

    /**
     * Valida un campo de email
     */
    validateEmail(value) {
        if (!value || value.trim() === '') {
            return { valid: false, message: 'Por favor ingresa tu correo electrónico' };
        }
        
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
            return { valid: false, message: 'Por favor ingresa un correo electrónico válido (ejemplo: usuario@ejemplo.com)' };
        }
        
        return { valid: true };
    },

    /**
     * Valida un campo requerido
     */
    validateRequired(value, fieldName = 'este campo') {
        if (!value || value.toString().trim() === '') {
            return { valid: false, message: `Por favor completa ${fieldName}` };
        }
        return { valid: true };
    },

    /**
     * Valida un campo numérico
     */
    validateNumber(value, fieldName = 'este campo', options = {}) {
        const { min, max, allowDecimals = true, required = true } = options;
        
        if (!value || value === '') {
            if (required) {
                return { valid: false, message: `Por favor ingresa ${fieldName}` };
            }
            return { valid: true };
        }
        
        // Verificar que solo contiene dígitos y opcionalmente punto decimal
        const pattern = allowDecimals ? /^-?\d+\.?\d*$/ : /^-?\d+$/;
        if (!pattern.test(value)) {
            return { 
                valid: false, 
                message: `${fieldName} debe contener solo ${allowDecimals ? 'números' : 'números enteros'} (ejemplo: ${allowDecimals ? '150.5' : '150'})` 
            };
        }
        
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            return { valid: false, message: `${fieldName} debe ser un número válido` };
        }
        
        if (min !== undefined && num < min) {
            return { valid: false, message: `${fieldName} debe ser mayor o igual a ${min}` };
        }
        
        if (max !== undefined && num > max) {
            return { valid: false, message: `${fieldName} debe ser menor o igual a ${max}` };
        }
        
        return { valid: true };
    },

    /**
     * Valida la longitud de un texto
     */
    validateLength(value, fieldName = 'este campo', options = {}) {
        const { min, max, required = true } = options;
        
        if (!value || value === '') {
            if (required) {
                return { valid: false, message: `Por favor ingresa ${fieldName}` };
            }
            return { valid: true };
        }
        
        const length = value.length;
        
        if (min !== undefined && length < min) {
            return { 
                valid: false, 
                message: `${fieldName} debe tener al menos ${min} caracteres (actualmente tiene ${length})` 
            };
        }
        
        if (max !== undefined && length > max) {
            return { 
                valid: false, 
                message: `${fieldName} no puede exceder ${max} caracteres (actualmente tiene ${length})` 
            };
        }
        
        return { valid: true };
    },

    /**
     * Valida un teléfono (formato flexible para República Dominicana)
     */
    validatePhone(value, required = true) {
        if (!value || value.trim() === '') {
            if (required) {
                return { valid: false, message: 'Por favor ingresa un número de teléfono' };
            }
            return { valid: true };
        }
        
        // Eliminar espacios, guiones y paréntesis
        const cleaned = value.replace(/[\s\-\(\)]/g, '');
        
        // Verificar que solo contiene dígitos y opcionalmente un +
        if (!/^\+?\d+$/.test(cleaned)) {
            return { 
                valid: false, 
                message: 'El número de teléfono solo debe contener dígitos (ejemplo: 809-555-1234 o +1-809-555-1234)' 
            };
        }
        
        // Verificar longitud mínima (al menos 10 dígitos sin el +)
        const digitsOnly = cleaned.replace('+', '');
        if (digitsOnly.length < 10) {
            return { 
                valid: false, 
                message: 'El número de teléfono debe tener al menos 10 dígitos (ejemplo: 809-555-1234)' 
            };
        }
        
        return { valid: true };
    },

    /**
     * Valida un formulario completo con reglas personalizadas
     * @param {HTMLFormElement} form - Formulario a validar
     * @param {Object} rules - Objeto con reglas de validación por campo
     * @returns {Object} - { valid: boolean, errors: Array, firstInvalidField: HTMLElement }
     */
    validateForm(form, rules) {
        this.clearFormErrors(form);
        
        const errors = [];
        let firstInvalidField = null;
        
        for (const [fieldName, validators] of Object.entries(rules)) {
            const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
            
            if (!field) {
                console.warn(`Campo no encontrado: ${fieldName}`);
                continue;
            }
            
            const value = field.value;
            
            for (const validator of validators) {
                const result = validator(value);
                
                if (!result.valid) {
                    this.showFieldError(field, result.message);
                    errors.push({ field: fieldName, message: result.message });
                    
                    if (!firstInvalidField) {
                        firstInvalidField = field;
                    }
                    
                    break; // Solo mostrar el primer error de cada campo
                }
            }
            
            // Si pasó todas las validaciones, marcar como válido
            if (!field.classList.contains('is-invalid')) {
                this.showFieldValid(field);
            }
        }
        
        if (errors.length > 0) {
            // Mostrar mensaje global con el primer error
            this.showGlobalError(form, errors[0].message);
            
            // Hacer foco en el primer campo inválido
            if (firstInvalidField) {
                firstInvalidField.focus();
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            firstInvalidField
        };
    },

    /**
     * Agrega validación en tiempo real a un campo
     */
    addLiveValidation(field, validators) {
        const validateField = () => {
            const value = field.value;
            
            for (const validator of validators) {
                const result = validator(value);
                
                if (!result.valid) {
                    this.showFieldError(field, result.message);
                    return;
                }
            }
            
            this.showFieldValid(field);
        };
        
        // Validar al perder el foco
        field.addEventListener('blur', validateField);
        
        // Validar al escribir (con debounce)
        let timeout;
        field.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(validateField, 500);
        });
    },

    /**
     * Previene el envío de un formulario si hay errores
     */
    preventInvalidSubmit(form, rules, onValidSubmit) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const validation = this.validateForm(form, rules);
            
            if (validation.valid && onValidSubmit) {
                onValidSubmit(e);
            }
        });
    }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}

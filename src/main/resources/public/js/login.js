document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    // Configuration constants
    const SESSION_VALIDATION_DELAY_MS = 1000; // Wait time before validating session after error

    // Definir reglas de validación
    const validationRules = {
        username: [
            (value) => FormValidator.validateRequired(value, 'el usuario o correo electrónico'),
            (value) => FormValidator.validateLength(value, 'el usuario', { min: 3 })
        ],
        password: [
            (value) => FormValidator.validateRequired(value, 'la contraseña'),
            (value) => FormValidator.validateLength(value, 'la contraseña', { min: 6 })
        ]
    };

    // Agregar validación en tiempo real
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    
    if (usernameField) {
        FormValidator.addLiveValidation(usernameField, validationRules.username);
    }
    
    if (passwordField) {
        FormValidator.addLiveValidation(passwordField, validationRules.password);
    }

    // Manejar el envío del formulario con validación
    FormValidator.preventInvalidSubmit(form, validationRules, async () => {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        try {
            // Call backend authentication API
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: username,
                    password: password
                }),
                credentials: 'include' // Important for cookies
            });

            // Log response details for debugging
            console.log('[LOGIN] Response status:', response.status);
            console.log('[LOGIN] Response ok:', response.ok);
            console.log('[LOGIN] Response headers:', {
                contentType: response.headers.get('Content-Type'),
                contentLength: response.headers.get('Content-Length')
            });

            // Enhanced JSON parsing with better error handling
            let data;
            try {
                const text = await response.text();
                console.log('[LOGIN] Response text length:', text.length);
                
                if (text && text.trim().length > 0) {
                    try {
                        data = JSON.parse(text);
                        console.log('[LOGIN] Successfully parsed JSON:', data);
                    } catch (jsonError) {
                        console.error('[LOGIN] Error parsing JSON response:', jsonError);
                        console.error('[LOGIN] Response text:', text);
                        // Si el response es OK pero JSON es inválido, asumir éxito
                        if (response.ok) {
                            data = { success: true, message: 'Autenticación exitosa' };
                        } else {
                            throw new Error('Respuesta inválida del servidor');
                        }
                    }
                } else {
                    // Respuesta vacía
                    console.warn('[LOGIN] Empty response received');
                    if (response.ok) {
                        // Respuesta vacía pero exitosa - asumir login exitoso
                        data = { success: true, message: 'Autenticación exitosa' };
                    } else {
                        throw new Error('Respuesta vacía del servidor');
                    }
                }
            } catch (e) {
                console.error('[LOGIN] Error reading response:', e);
                // Si no hay JSON válido pero el response es OK, asumir éxito
                if (response.ok) {
                    data = { success: true, message: 'Autenticación exitosa' };
                } else {
                    throw new Error('Respuesta inválida del servidor');
                }
            }

            if (response.ok && data.success) {
                FormValidator.showGlobalSuccess(form, 'Iniciando sesión...');
                localStorage.setItem('isAdmin', 'true');
                
                // Redirigir después de un breve delay para que se vea el mensaje
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 500);
            } else {
                FormValidator.showGlobalError(form, data.message || 'Usuario o contraseña incorrectos. Por favor verifica tus credenciales e intenta nuevamente.');
                
                // Limpiar el campo de contraseña por seguridad
                passwordField.value = '';
                passwordField.focus();
            }
        } catch (error) {
            console.error('[LOGIN] Error en autenticación:', error);
            
            // El servidor puede haber autenticado exitosamente pero falló al enviar la respuesta
            // Verificar si la sesión se creó correctamente
            console.log('[LOGIN] Attempting to validate session despite error...');
            
            await new Promise(resolve => setTimeout(resolve, SESSION_VALIDATION_DELAY_MS));
            
            try {
                const validateResp = await fetch('/api/auth/validate', {
                    credentials: 'include'
                });
                
                if (validateResp.ok) {
                    const validateData = await validateResp.json();
                    
                    if (validateData.success && validateData.authenticated) {
                        console.log('[LOGIN] Session validated successfully - login was actually successful');
                        FormValidator.showGlobalSuccess(form, 'Iniciando sesión...');
                        localStorage.setItem('isAdmin', 'true');
                        
                        setTimeout(() => {
                            window.location.href = '/index.html';
                        }, 500);
                        return; // Exit successfully
                    }
                }
            } catch (validateError) {
                console.error('[LOGIN] Session validation also failed:', validateError);
            }
            
            // Si llegamos aquí, el error fue real
            FormValidator.showGlobalError(form, 'Error al conectar con el servidor. Por favor intenta nuevamente.');
            passwordField.value = '';
            passwordField.focus();
        }
    });
});

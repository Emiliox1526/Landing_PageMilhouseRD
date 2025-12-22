document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (!form) return;

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

            const data = await response.json();

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
            console.error('Error en autenticación:', error);
            FormValidator.showGlobalError(form, 'Error al conectar con el servidor. Por favor intenta nuevamente.');
            passwordField.value = '';
            passwordField.focus();
        }
    });
});

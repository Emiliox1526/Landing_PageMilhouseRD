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
    FormValidator.preventInvalidSubmit(form, validationRules, () => {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Verificar credenciales
        if (username === '1834jml@gmail.com' && password === 'Desiree2009') {
            FormValidator.showGlobalSuccess(form, 'Iniciando sesión...');
            localStorage.setItem('isAdmin', 'true');
            
            // Redirigir después de un breve delay para que se vea el mensaje
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 500);
        } else {
            FormValidator.showGlobalError(form, 'Usuario o contraseña incorrectos. Por favor verifica tus credenciales e intenta nuevamente.');
            
            // Limpiar el campo de contraseña por seguridad
            passwordField.value = '';
            passwordField.focus();
        }
    });
});

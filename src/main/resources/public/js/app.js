document.addEventListener('DOMContentLoaded', () => {
    /* --- Menú móvil --- */
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }

    /* --- Scroll suave para enlaces internos --- */
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    /* --- Efecto fade-in al hacer scroll --- */
    const fadeElements = document.querySelectorAll('.fade-in');
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    fadeElements.forEach(item => fadeObserver.observe(item));

    /* --- Lógica para sliders multifila (controles con flechas) --- */
    document.querySelectorAll('.left-arrow').forEach(arrow => {
        arrow.addEventListener('click', () => {
            const row = document.getElementById(arrow.dataset.target);
            if (row) row.scrollBy({ left: -300, behavior: 'smooth' });
        });
    });
    document.querySelectorAll('.right-arrow').forEach(arrow => {
        arrow.addEventListener('click', () => {
            const row = document.getElementById(arrow.dataset.target);
            if (row) row.scrollBy({ left: 300, behavior: 'smooth' });
        });
    });
    document.querySelectorAll('.hero-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation(); // para que el click no burbujee al heroSlider
        });
    });
    /* --- Auto-scroll continuo para Projects (fila row1) --- */
    function setupContinuousScroll(sliderRowId, speed = 0.5) {
        const row = document.getElementById(sliderRowId);
        if (!row) return;
        // duplicamos el contenido para crear un bucle infinito
        row.innerHTML += row.innerHTML;
        let curSpeed = speed;
        row.addEventListener('mouseenter', () => curSpeed = speed / 5);
        row.addEventListener('mouseleave', () => curSpeed = speed);
        (function step() {
            row.scrollLeft += curSpeed;
            // cuando llegamos a la mitad, reiniciamos al inicio
            if (row.scrollLeft >= row.scrollWidth / 2) {
                row.scrollLeft = 0;
            }
            requestAnimationFrame(step);
        })();
    }
    // Solo aplicamos al contenedor de id="row1"
    setupContinuousScroll('row1', 0.5);

    /* --- Modal para featured projects --- */
    const modal = document.getElementById('project-modal');
    if (modal) {
        const titleEl = document.getElementById('modal-title');
        const descEl  = document.getElementById('modal-description');
        const vid     = document.getElementById('modal-video');
        const src     = document.getElementById('modal-video-source');
        const locEl   = document.getElementById('modal-location');
        const close   = modal.querySelector('.close');

        function openModal(item) {
            titleEl.textContent = item.dataset.title       || 'Sin título';
            descEl.textContent  = item.dataset.description || 'Sin descripción';
            locEl.textContent   = item.dataset.location    || 'Sin ubicación';
            if (item.dataset.video) {
                src.src = item.dataset.video;
                vid.load();
                vid.style.display = 'block';
            } else {
                vid.style.display = 'none';
            }
            modal.style.display = 'block';
        }
        function closeModal() { modal.style.display = 'none'; }

        if (close) close.addEventListener('click', closeModal);
        window.addEventListener('click', e => { if (e.target === modal) closeModal(); });

        document.querySelectorAll('.slider-row-images').forEach(container => {
            container.addEventListener('click', e => {
                let el = e.target;
                while (el && !el.classList.contains('slide-item')) {
                    el = el.parentElement;
                }
                if (el) openModal(el);
            });
        });
    }

    /* --- Contadores suaves --- */
    const counters = document.querySelectorAll('.counter');
    const countSection = document.querySelector('.hero-counter, .counters-section');
    if (countSection) {
        let started = false;
        new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !started) {
                    started = true;
                    counters.forEach(c => {
                        const end = +c.dataset.target || 0;
                        let start = null;
                        function frame(ts) {
                            if (!start) start = ts;
                            const progress = ts - start;
                            const val = Math.min(end, Math.floor((progress / 2000) * end));
                            c.textContent = val;
                            if (val < end) requestAnimationFrame(frame);
                        }
                        requestAnimationFrame(frame);
                    });
                    obs.unobserve(countSection);
                }
            });
        }, { threshold: 0.3 }).observe(countSection);
    }

    /* --- Hero slider --- */
    const heroSlider = document.querySelector('.hero-slider');
    if (heroSlider) {
        const slides = heroSlider.querySelectorAll('.slide');
        const dots   = document.querySelectorAll('.slider-dots .dot');
        let idx = 0, total = slides.length;

        function show(i) {
            slides.forEach((s, j) => s.classList.toggle('active', j === i));
            dots.forEach((d, j)   => d.classList.toggle('active', j === i));
        }
        let iv = setInterval(() => { idx = (idx + 1) % total; show(idx); }, 5000);

        dots.forEach((d, i) => d.addEventListener('click', () => {
            clearInterval(iv); idx = i; show(i);
            iv = setInterval(() => { idx = (idx + 1) % total; show(idx); }, 5000);
        }));

        const leftA  = document.querySelector('.hero-arrow-left');
        const rightA = document.querySelector('.hero-arrow-right');
        if (leftA && rightA) {
            leftA.addEventListener('click', () => {
                clearInterval(iv);
                idx = (idx - 1 + total) % total;
                show(idx);
                iv = setInterval(() => { idx = (idx + 1) % total; show(idx); }, 5000);
            });
            rightA.addEventListener('click', () => {
                clearInterval(iv);
                idx = (idx + 1) % total;
                show(idx);
                iv = setInterval(() => { idx = (idx + 1) % total; show(idx); }, 5000);
            });
        }
        heroSlider.addEventListener('click', () => {
            const active = heroSlider.querySelector('.slide.active');
            if (active?.dataset.link) window.location.href = active.dataset.link;
        });
    }

    /* --- Modal portfolio --- */
    const pmModal = document.getElementById('portfolio-modal');
    if (pmModal) {
        const pmTitle = document.getElementById('portfolio-modal-title');
        const pmDesc  = document.getElementById('portfolio-modal-description');
        const pmClose = pmModal.querySelector('.close');

        document.querySelectorAll('.portfolio-item-apple').forEach(item => {
            item.addEventListener('click', () => {
                pmTitle.textContent = item.dataset.title || 'Sin título';
                pmDesc.textContent  = item.dataset.description || 'Sin descripción';
                pmModal.style.display = 'block';
            });
        });
        if (pmClose) pmClose.addEventListener('click', () => pmModal.style.display = 'none');
        window.addEventListener('click', e => { if (e.target === pmModal) pmModal.style.display = 'none'; });
    }

    /* --- Envío del formulario de contacto vía Fetch (EmailJS API v1.0) --- */
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        // Definir reglas de validación si FormValidator está disponible
        if (typeof FormValidator !== 'undefined') {
            const validationRules = {
                user_name: [
                    (value) => FormValidator.validateRequired(value, 'tu nombre'),
                    (value) => FormValidator.validateLength(value, 'el nombre', { min: 2, max: 100 })
                ],
                user_email: [
                    (value) => FormValidator.validateEmail(value)
                ],
                message: [
                    (value) => FormValidator.validateRequired(value, 'el mensaje'),
                    (value) => FormValidator.validateLength(value, 'el mensaje', { min: 10, max: 1000 })
                ]
            };
            
            // Agregar validación en tiempo real
            const nameField = contactForm.querySelector('[name="user_name"]');
            const emailField = contactForm.querySelector('[name="user_email"]');
            const messageField = contactForm.querySelector('[name="message"]');
            
            if (nameField) FormValidator.addLiveValidation(nameField, validationRules.user_name);
            if (emailField) FormValidator.addLiveValidation(emailField, validationRules.user_email);
            if (messageField) FormValidator.addLiveValidation(messageField, validationRules.message);
            
            // Prevenir envío inválido
            FormValidator.preventInvalidSubmit(contactForm, validationRules, function() {
                sendContactForm(contactForm);
            });
        } else {
            // Si no hay FormValidator, usar validación básica
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const userName = this.user_name?.value?.trim() || '';
                const userEmail = this.user_email?.value?.trim() || '';
                const message = this.message?.value?.trim() || '';
                
                if (!userName) {
                    alert('Por favor ingresa tu nombre');
                    return;
                }
                if (!userEmail) {
                    alert('Por favor ingresa tu correo electrónico');
                    return;
                }
                if (!message) {
                    alert('Por favor ingresa tu mensaje');
                    return;
                }
                
                sendContactForm(this);
            });
        }
    }
    
    function sendContactForm(form) {
        const params = {
            service_id:   'service_r1yyn21',
            template_id:  'template_qkhrmnq',
            user_id:      'AwfMFTpcQlKMoFh6J',
            template_params: {
                user_name:  form.user_name.value,
                user_email: form.user_email.value,
                message:    form.message.value
            }
        };
        
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        })
        .then(res => {
            if (res.ok) {
                if (typeof FormValidator !== 'undefined') {
                    FormValidator.showGlobalSuccess(form, 'Mensaje enviado correctamente. Te contactaremos pronto.');
                } else {
                    alert('✅ Mensaje enviado correctamente.');
                }
                form.reset();
            } else {
                return res.text().then(text => Promise.reject(text));
            }
        })
        .catch(err => {
            console.error('Error al enviar:', err);
            if (typeof FormValidator !== 'undefined') {
                FormValidator.showGlobalError(form, 'Error al enviar el mensaje. Por favor intenta nuevamente o contáctanos directamente.');
            } else {
                alert('❌ Error al enviar, inténtalo nuevamente.');
            }
        });
    }

    console.log('app.js cargado correctamente');
});

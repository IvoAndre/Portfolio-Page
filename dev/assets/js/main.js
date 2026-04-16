// Three.js Scene Setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x121212, 0.002);
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        // Criar textura de sprite circular para as estrelas
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        const spriteTexture = new THREE.CanvasTexture(canvas);

        // Estrelas principais
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const starSizes = [];
        
        for (let i = 0; i < 3000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starPositions.push(x, y, z);
            starSizes.push(Math.random() * 2 + 0.5);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        starsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
        
        const starsMaterial = new THREE.PointsMaterial({
            size: 2,
            map: spriteTexture,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);

        // Anéis de partículas azuis
        const ringsGroup = new THREE.Group();
        
        for (let ring = 0; ring < 3; ring++) {
            const ringGeometry = new THREE.BufferGeometry();
            const ringPositions = [];
            const ringCount = 50;
            const radius = 60 + ring * 30;
            
            for (let i = 0; i < ringCount; i++) {
                const angle = (i / ringCount) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const y = (Math.random() - 0.5) * 10;
                ringPositions.push(x, y, z);
            }
            
            ringGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ringPositions, 3));
            
            const ringMaterial = new THREE.PointsMaterial({
                size: 3,
                map: spriteTexture,
                transparent: true,
                opacity: 0.4,
                color: 0x3b82f6,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const ringMesh = new THREE.Points(ringGeometry, ringMaterial);
            ringsGroup.add(ringMesh);
        }
        
        scene.add(ringsGroup);

        // Formas geométricas wireframe minimalistas
        const shapes = [];
        const shapeCount = 8;
        
        for (let i = 0; i < shapeCount; i++) {
            const size = Math.random() * 3 + 1;
            const geometry = new THREE.IcosahedronGeometry(size, 0);
            
            const material = new THREE.MeshBasicMaterial({
                color: 0x3b82f6,
                wireframe: true,
                transparent: true,
                opacity: 0.15
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100
            );
            
            shapes.push({
                mesh: mesh,
                rotationSpeed: {
                    x: Math.random() * 0.01 - 0.005,
                    y: Math.random() * 0.01 - 0.005,
                    z: Math.random() * 0.01 - 0.005
                }
            });
            
            scene.add(mesh);
        }

        // Iluminação suave
        const ambientLight = new THREE.AmbientLight(0x1e293b, 2);
        scene.add(ambientLight);

        const light1 = new THREE.PointLight(0x3b82f6, 0.5, 200);
        light1.position.set(50, 50, 50);
        scene.add(light1);

        const light2 = new THREE.PointLight(0x60a5fa, 0.3, 150);
        light2.position.set(-50, -30, -30);
        scene.add(light2);

        camera.position.z = 50;

        // Mouse movement effect
        let mouseX = 0;
        let mouseY = 0;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // Animation Loop
        let time = 0;
        function animate() {
            requestAnimationFrame(animate);
            time += 0.01;

            // Rotação lenta das estrelas
            stars.rotation.y += 0.0001;
            stars.rotation.x += 0.00005;
            
            // Rotação dos anéis
            ringsGroup.rotation.y += 0.0003;
            ringsGroup.rotation.x = Math.sin(time * 0.1) * 0.1;

            // Animação das formas
            shapes.forEach((shapeObj) => {
                shapeObj.mesh.rotation.x += shapeObj.rotationSpeed.x;
                shapeObj.mesh.rotation.y += shapeObj.rotationSpeed.y;
                shapeObj.mesh.rotation.z += shapeObj.rotationSpeed.z;
            });

            // Camera segue o mouse suavemente
            camera.position.x += (mouseX * 3 - camera.position.x) * 0.03;
            camera.position.y += (mouseY * 3 - camera.position.y) * 0.03;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }

        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.project-card, .translation-card, .skill-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';
            card.style.transition = 'all 0.6s ease-out';
            observer.observe(card);
        });

        // Carousel functionality - Synchronized by category
        const carouselGroups = {};

        document.querySelectorAll('.project-carousel').forEach(carousel => {
            const images = carousel.querySelector('.carousel-images');
            const imageElements = carousel.querySelectorAll('.carousel-image');
            const dots = carousel.querySelectorAll('.carousel-dot');
            const prevArrow = carousel.querySelector('.carousel-arrow.prev');
            const nextArrow = carousel.querySelector('.carousel-arrow.next');
            let currentIndex = 0;
            let isHovered = false;

            // Determine category from parent section
            const section = carousel.closest('section');
            const category = section ? section.id : 'default';

            // Initialize category group if not exists
            if (!carouselGroups[category]) {
                carouselGroups[category] = {
                    carousels: [],
                    interval: null
                };
            }

            const carouselObj = {
                element: carousel,
                goToSlide: function(index) {
                    currentIndex = index;
                    images.style.transform = `translateX(-${currentIndex * 100}%)`;
                    dots.forEach((dot, i) => {
                        dot.classList.toggle('active', i === currentIndex);
                    });
                },
                nextSlide: function() {
                    if (isHovered) return; // Skip if hovered
                    currentIndex = (currentIndex + 1) % dots.length;
                    this.goToSlide(currentIndex);
                },
                getCurrentIndex: function() {
                    return currentIndex;
                },
                getDotsLength: function() {
                    return dots.length;
                },
                category: category
            };

            carouselGroups[category].carousels.push(carouselObj);

            // Hover state
            carousel.addEventListener('mouseenter', () => { isHovered = true; });
            carousel.addEventListener('mouseleave', () => { isHovered = false; });

            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    carouselObj.goToSlide(index);
                });
            });

            if (prevArrow) {
                prevArrow.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newIndex = (carouselObj.getCurrentIndex() - 1 + carouselObj.getDotsLength()) % carouselObj.getDotsLength();
                    carouselObj.goToSlide(newIndex);
                });
            }

            if (nextArrow) {
                nextArrow.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newIndex = (carouselObj.getCurrentIndex() + 1) % carouselObj.getDotsLength();
                    carouselObj.goToSlide(newIndex);
                });
            }

            // Image click to open lightbox
            imageElements.forEach((img, index) => {
                img.style.cursor = 'pointer';
                img.addEventListener('click', () => {
                    openLightbox(carousel, index);
                });
            });
        });

        // Start synchronized autoplay for each category
        Object.keys(carouselGroups).forEach(category => {
            const group = carouselGroups[category];
            
            function categoryNextSlide() {
                group.carousels.forEach(c => c.nextSlide());
            }

            group.interval = setInterval(categoryNextSlide, 10000);
        });

        // Lightbox functionality
        const lightbox = document.getElementById('lightbox');
        const lightboxContent = lightbox.querySelector('.lightbox-content');
        const lightboxClose = document.getElementById('lightbox-close');
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');
        const lightboxCounter = document.getElementById('lightbox-counter');
        let currentLightboxItems = [];
        let currentLightboxIndex = 0;

        function renderLightboxItem(element) {
            lightboxContent.innerHTML = '';

            if (element.tagName && element.tagName.toLowerCase() === 'img') {
                const image = document.createElement('img');
                image.src = element.src;
                image.alt = 'Lightbox Image';
                image.className = 'lightbox-image';
                image.id = 'lightbox-image';
                lightboxContent.appendChild(image);
                return;
            }

            if (element.tagName && element.tagName.toLowerCase() === 'svg') {
                const svg = element.cloneNode(true);
                svg.classList.remove('carousel-image');
                svg.removeAttribute('style');
                svg.classList.add('lightbox-image');
                svg.setAttribute('aria-label', 'Lightbox Image');

                const viewBox = svg.getAttribute('viewBox');
                if (viewBox && !svg.getAttribute('width') && !svg.getAttribute('height')) {
                    const parts = viewBox.trim().split(/\s+/);
                    if (parts.length === 4) {
                        svg.setAttribute('width', parts[2]);
                        svg.setAttribute('height', parts[3]);
                    }
                }

                lightboxContent.appendChild(svg);
            }
        }

        function openLightbox(carousel, index) {
            currentLightboxItems = Array.from(carousel.querySelectorAll('.carousel-image'));
            currentLightboxIndex = index;
            updateLightboxImage();
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        function updateLightboxImage() {
            renderLightboxItem(currentLightboxItems[currentLightboxIndex]);
            lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxItems.length}`;
        }

        function lightboxPrevImage() {
            currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxItems.length) % currentLightboxItems.length;
            updateLightboxImage();
        }

        function lightboxNextImage() {
            currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxItems.length;
            updateLightboxImage();
        }

        lightboxClose.addEventListener('click', closeLightbox);
        lightboxPrev.addEventListener('click', lightboxPrevImage);
        lightboxNext.addEventListener('click', lightboxNextImage);

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') lightboxPrevImage();
            if (e.key === 'ArrowRight') lightboxNextImage();
        });

        // Internationalization (i18n)
        const translations = { pt: {}, en: {} };

        async function loadTranslations() {
            const languages = ['pt', 'en'];
            await Promise.all(languages.map(async (lang) => {
                try {
                    const response = await fetch(`assets/i18n/${lang}.json`);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${lang} translations`);
                    }
                    translations[lang] = await response.json();
                } catch (error) {
                    console.error(error);
                    translations[lang] = {};
                }
            }));
        }

        let currentLang = 'pt';

        function setLanguage(lang) {
            currentLang = lang;
            document.documentElement.lang = lang;
            const langMap = translations[lang] || {};
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (langMap[key]) {
                    el.textContent = langMap[key];
                }
            });

            // Update email subject
            const emailBtn = document.getElementById('email-btn');
            const subject = encodeURIComponent(langMap['email.subject'] || '');
            emailBtn.href = `mailto:ivo.daniel.andre@gmail.com?subject=${subject}`;

            // Update email fallback modal subject
            const emailFallbackSubject = document.getElementById('email-fallback-subject');
            emailFallbackSubject.textContent = langMap['email.subject'] || '';

            // Update active button
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === lang);
            });

            // Save preference
            localStorage.setItem('portfolio-lang', lang);
        }

        // Email Fallback Modal Handler
        const emailBtn = document.getElementById('email-btn');
        const fallbackModal = document.getElementById('email-fallback-modal');
        const emailFallbackClose = document.getElementById('email-fallback-close');
        const copyEmailBtn = document.getElementById('copy-email-btn');
        const copySubjectBtn = document.getElementById('copy-subject-btn');
        const emailFallbackAddress = document.getElementById('email-fallback-address');
        const emailFallbackSubject = document.getElementById('email-fallback-subject');

        function closeFallbackModal() {
            fallbackModal.classList.remove('active');
            // Reset copy buttons
            copyEmailBtn.classList.remove('copied');
            copySubjectBtn.classList.remove('copied');
        }

        function copyToClipboard(text, button) {
            navigator.clipboard.writeText(text).then(() => {
                button.classList.add('copied');
                const originalText = button.getAttribute('data-i18n');
                const activeLangMap = translations[document.documentElement.lang || 'pt'] || {};
                button.textContent = activeLangMap['email.fallback.copied'] || 'Copiado!';
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.textContent = activeLangMap['email.fallback.copy'] || 'Copiar';
                }, 2000);
            }).catch(() => {
                alert('Erro ao copiar para a área de transferência.');
            });
        }

        emailBtn.addEventListener('click', (e) => {
            const timeoutId = setTimeout(() => {
                // If we reach here, the mailto handler likely failed
                e.preventDefault();
                fallbackModal.classList.add('active');
            }, 5000);

            // Clear timeout if the email handler worked
            window.addEventListener('focus', () => {
                clearTimeout(timeoutId);
            }, { once: true });
        });

        emailFallbackClose.addEventListener('click', closeFallbackModal);

        fallbackModal.addEventListener('click', (e) => {
            if (e.target === fallbackModal) {
                closeFallbackModal();
            }
        });

        copyEmailBtn.addEventListener('click', () => {
            copyToClipboard(emailFallbackAddress.textContent, copyEmailBtn);
        });

        copySubjectBtn.addEventListener('click', () => {
            copyToClipboard(emailFallbackSubject.textContent, copySubjectBtn);
        });

        document.addEventListener('keydown', (e) => {
            if (!fallbackModal.classList.contains('active')) return;
            if (e.key === 'Escape') closeFallbackModal();
        });

        // Language switcher event listeners
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setLanguage(btn.dataset.lang, true);
            });
        });

        // Get language from URL parameter, localStorage, or browser preference
        function getInitialLanguage() {
            // 1. Check URL parameter ?l=pt or ?l=en
            const urlParams = new URLSearchParams(window.location.search);
            const urlLang = urlParams.get('l');
            if (urlLang === 'pt' || urlLang === 'en') {
                return urlLang;
            }

            // 2. Check localStorage
            const savedLang = localStorage.getItem('portfolio-lang');
            if (savedLang) {
                return savedLang;
            }

            // 3. Detect browser language
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang.startsWith('pt')) {
                return 'pt';
            }
            return 'en';
        }

        // Update URL with language parameter
        function updateUrlLang(lang) {
            const url = new URL(window.location);
            url.searchParams.set('l', lang);
            window.history.replaceState({}, '', url);
        }

        // Modified setLanguage to optionally update URL
        const originalSetLanguage = setLanguage;
        setLanguage = function(lang, updateUrl = false) {
            originalSetLanguage(lang);
            if (updateUrl) {
                updateUrlLang(lang);
            }
        };

        // Initialize language after loading translations
        (async () => {
            await loadTranslations();
            const initialLang = getInitialLanguage();
            setLanguage(initialLang, true);
        })();
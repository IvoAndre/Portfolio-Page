const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
const hardwareThreads = navigator.hardwareConcurrency || 4;

function getQualityProfile() {
    const penalties =
        (prefersReducedMotion ? 2 : 0) +
        (isSmallScreen ? 1 : 0) +
        (hardwareThreads <= 4 ? 1 : 0) +
        (window.devicePixelRatio > 2 ? 1 : 0);

    if (penalties >= 4) {
        return {
            starCount: 700,
            ringCount: 1,
            ringParticles: 28,
            shapeCount: 3,
            maxPixelRatio: 1,
            animateBackground: false
        };
    }

    if (penalties >= 3) {
        return {
            starCount: 1200,
            ringCount: 2,
            ringParticles: 36,
            shapeCount: 5,
            maxPixelRatio: 1.2,
            animateBackground: !prefersReducedMotion
        };
    }

    if (penalties >= 2) {
        return {
            starCount: 1800,
            ringCount: 2,
            ringParticles: 42,
            shapeCount: 6,
            maxPixelRatio: 1.5,
            animateBackground: !prefersReducedMotion
        };
    }

    return {
        starCount: 3000,
        ringCount: 3,
        ringParticles: 50,
        shapeCount: 8,
        maxPixelRatio: 2,
        animateBackground: !prefersReducedMotion
    };
}

const quality = getQualityProfile();

let startBackgroundAnimation = () => {};
let stopBackgroundAnimation = () => {};

(function init3DBackground() {
    if (!window.THREE) return;

    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x121212, 0.002);

    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.maxPixelRatio));
    canvasContainer.appendChild(renderer.domElement);

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

    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    const starSizes = [];

    for (let i = 0; i < quality.starCount; i++) {
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

    const ringsGroup = new THREE.Group();
    for (let ring = 0; ring < quality.ringCount; ring++) {
        const ringGeometry = new THREE.BufferGeometry();
        const ringPositions = [];
        const radius = 60 + ring * 30;

        for (let i = 0; i < quality.ringParticles; i++) {
            const angle = (i / quality.ringParticles) * Math.PI * 2;
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

    const shapes = [];
    for (let i = 0; i < quality.shapeCount; i++) {
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
            mesh,
            rotationSpeed: {
                x: Math.random() * 0.01 - 0.005,
                y: Math.random() * 0.01 - 0.005,
                z: Math.random() * 0.01 - 0.005
            }
        });

        scene.add(mesh);
    }

    const ambientLight = new THREE.AmbientLight(0x1e293b, 2);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(0x3b82f6, 0.5, 200);
    light1.position.set(50, 50, 50);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x60a5fa, 0.3, 150);
    light2.position.set(-50, -30, -30);
    scene.add(light2);

    camera.position.z = 50;

    let mouseX = 0;
    let mouseY = 0;
    if (quality.animateBackground) {
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    let time = 0;
    let animationFrameId = null;

    function renderFrame() {
        if (quality.animateBackground) {
            time += 0.01;
            stars.rotation.y += 0.0001;
            stars.rotation.x += 0.00005;

            ringsGroup.rotation.y += 0.0003;
            ringsGroup.rotation.x = Math.sin(time * 0.1) * 0.1;

            shapes.forEach((shapeObj) => {
                shapeObj.mesh.rotation.x += shapeObj.rotationSpeed.x;
                shapeObj.mesh.rotation.y += shapeObj.rotationSpeed.y;
                shapeObj.mesh.rotation.z += shapeObj.rotationSpeed.z;
            });

            camera.position.x += (mouseX * 3 - camera.position.x) * 0.03;
            camera.position.y += (mouseY * 3 - camera.position.y) * 0.03;
        }

        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }

    function animationLoop() {
        renderFrame();
        animationFrameId = requestAnimationFrame(animationLoop);
    }

    startBackgroundAnimation = function startBg() {
        if (animationFrameId !== null) return;
        animationLoop();
    };

    stopBackgroundAnimation = function stopBg() {
        if (animationFrameId === null) return;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    };

    if (quality.animateBackground) {
        startBackgroundAnimation();
    } else {
        renderFrame();
    }

    document.addEventListener('visibilitychange', () => {
        if (!quality.animateBackground) return;
        if (document.hidden) {
            stopBackgroundAnimation();
        } else {
            startBackgroundAnimation();
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.maxPixelRatio));
        if (!quality.animateBackground) {
            renderFrame();
        }
    });
})();

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function onAnchorClick(event) {
        event.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;

        target.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start'
        });
    });
});

function initActiveNavLinkBySection() {
    const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    if (navLinks.length === 0) return;

    const sectionById = new Map();
    const linkBySectionId = new Map();
    const visibilityBySectionId = new Map();

    navLinks.forEach((link) => {
        const sectionId = link.getAttribute('href').replace('#', '');
        const section = document.getElementById(sectionId);
        if (!section) return;

        sectionById.set(sectionId, section);
        linkBySectionId.set(sectionId, link);
        visibilityBySectionId.set(sectionId, 0);
    });

    const sections = Array.from(sectionById.values());
    if (sections.length === 0) return;

    let activeSectionId = '';

    function setActiveSection(sectionId) {
        if (!sectionId || sectionId === activeSectionId) return;
        activeSectionId = sectionId;

        navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            const isActive = href === `#${sectionId}`;
            link.classList.toggle('is-active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    function resolveSectionFromViewportProbe() {
        const nav = document.querySelector('nav');
        const navHeight = nav ? nav.getBoundingClientRect().height : 0;
        const probeY = navHeight + ((window.innerHeight - navHeight) * 0.35);

        let selectedId = sections[0].id;

        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= probeY) {
                selectedId = section.id;
            }
        });

        const reachedBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
        if (reachedBottom) {
            selectedId = sections[sections.length - 1].id;
        }

        return selectedId;
    }

    function resolveMostVisibleSection() {
        let bestSectionId = '';
        let bestRatio = 0;

        visibilityBySectionId.forEach((ratio, sectionId) => {
            if (ratio > bestRatio) {
                bestRatio = ratio;
                bestSectionId = sectionId;
            }
        });

        if (bestRatio > 0) {
            return bestSectionId;
        }

        return resolveSectionFromViewportProbe();
    }

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            visibilityBySectionId.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        setActiveSection(resolveMostVisibleSection());
    }, {
        threshold: [0, 0.1, 0.25, 0.4, 0.6, 0.8, 1],
        rootMargin: '-80px 0px -45% 0px'
    });

    sections.forEach((section) => sectionObserver.observe(section));
    setActiveSection(resolveSectionFromViewportProbe());

    window.addEventListener('scroll', () => {
        setActiveSection(resolveMostVisibleSection());
    }, { passive: true });

    window.addEventListener('resize', () => {
        setActiveSection(resolveMostVisibleSection());
    });
}

function runAfterPageLoad(callback) {
    if (document.readyState === 'complete') {
        requestAnimationFrame(callback);
        return;
    }

    window.addEventListener('load', () => {
        requestAnimationFrame(callback);
    }, { once: true });
}

function initMobileLangSwitcherAutoHide() {
    const langSwitcher = document.querySelector('.lang-switcher');
    const nav = document.querySelector('nav');
    if (!langSwitcher || !nav) return;

    const mobileQuery = window.matchMedia('(max-width: 768px)');
    let rafId = null;

    function updateFromScroll() {
        rafId = null;

        if (!mobileQuery.matches) {
            langSwitcher.classList.remove('is-hidden-mobile');
            nav.classList.remove('is-scrolled-mobile');
            return;
        }

        const currentScrollY = Math.max(0, window.scrollY);
        const compactThreshold = 8;
        const isCompact = currentScrollY > compactThreshold;

        nav.classList.toggle('is-scrolled-mobile', isCompact);
    }

    function queueScrollUpdate() {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(updateFromScroll);
    }

    window.addEventListener('scroll', queueScrollUpdate, { passive: true });
    window.addEventListener('resize', queueScrollUpdate, { passive: true });

    if (typeof mobileQuery.addEventListener === 'function') {
        mobileQuery.addEventListener('change', queueScrollUpdate);
    } else if (typeof mobileQuery.addListener === 'function') {
        mobileQuery.addListener(queueScrollUpdate);
    }

    updateFromScroll();
}

runAfterPageLoad(() => {
    initActiveNavLinkBySection();
    initMobileLangSwitcherAutoHide();
});

if (prefersReducedMotion) {
    document.querySelectorAll('.project-card, .translation-card, .skill-card').forEach((card) => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });
} else {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });

    document.querySelectorAll('.project-card, .translation-card, .skill-card').forEach((card) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
}

document.querySelectorAll('.carousel-image').forEach((element) => {
    if (element.tagName.toLowerCase() !== 'img') return;

    if (!element.hasAttribute('loading')) element.setAttribute('loading', 'lazy');
    if (!element.hasAttribute('decoding')) element.setAttribute('decoding', 'async');
    if (!element.hasAttribute('width')) element.setAttribute('width', '1280');
    if (!element.hasAttribute('height')) element.setAttribute('height', '720');
});

const carouselGroups = {};

function getCarouselTitle(carousel) {
    const projectCard = carousel.closest('.project-card');
    const heading = projectCard ? projectCard.querySelector('h3') : null;
    return heading ? heading.textContent.trim() : 'Projeto';
}

document.querySelectorAll('.project-carousel').forEach((carousel) => {
    const images = carousel.querySelector('.carousel-images');
    const imageElements = carousel.querySelectorAll('.carousel-image');
    const dots = carousel.querySelectorAll('.carousel-dot');
    const prevArrow = carousel.querySelector('.carousel-arrow.prev');
    const nextArrow = carousel.querySelector('.carousel-arrow.next');
    const title = getCarouselTitle(carousel);

    let currentIndex = 0;
    let isHovered = false;
    let suppressImageClickUntil = 0;
    let dragState = {
        active: false,
        pointerId: null,
        pointerType: '',
        hasPointerCapture: false,
        startX: 0,
        startY: 0,
        deltaX: 0,
        horizontalLock: false
    };

    function setTrackTransitionEnabled(enabled) {
        images.style.transition = enabled ? '' : 'none';
    }

    function getCarouselWidth() {
        return carousel.getBoundingClientRect().width || carousel.clientWidth || 1;
    }

    function isInteractiveTarget(target) {
        if (!target || !target.closest) return false;
        return Boolean(target.closest('.carousel-arrow, .carousel-dot, a, button, input, textarea, select, label'));
    }

    function resetDragState() {
        dragState = {
            active: false,
            pointerId: null,
            pointerType: '',
            hasPointerCapture: false,
            startX: 0,
            startY: 0,
            deltaX: 0,
            horizontalLock: false
        };
        carousel.classList.remove('is-dragging');
        isHovered = carousel.matches(':hover');
    }

    function finishDrag(commitSwipe) {
        if (!dragState.active) return;

        const hadHorizontalDrag = dragState.horizontalLock;

        const swipeThreshold = Math.max(40, getCarouselWidth() * 0.12);
        const shouldChangeSlide =
            commitSwipe && hadHorizontalDrag && Math.abs(dragState.deltaX) >= swipeThreshold;

        setTrackTransitionEnabled(true);

        if (shouldChangeSlide) {
            if (dragState.deltaX < 0) {
                carouselObj.nextSlide(true);
            } else {
                carouselObj.prevSlide();
            }
            suppressImageClickUntil = Date.now() + 350;
        } else {
            carouselObj.goToSlide(currentIndex);
            if (hadHorizontalDrag) {
                suppressImageClickUntil = Date.now() + 250;
            }
        }

        if (
            dragState.hasPointerCapture
            && dragState.pointerId !== null
            && typeof carousel.releasePointerCapture === 'function'
            && carousel.hasPointerCapture(dragState.pointerId)
        ) {
            carousel.releasePointerCapture(dragState.pointerId);
        }

        resetDragState();
    }

    function onPointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (isInteractiveTarget(event.target)) return;

        dragState.active = true;
        dragState.pointerId = event.pointerId;
        dragState.pointerType = event.pointerType || '';
        dragState.hasPointerCapture = false;
        dragState.startX = event.clientX;
        dragState.startY = event.clientY;
        dragState.deltaX = 0;
        dragState.horizontalLock = false;
        isHovered = true;

        if (dragState.pointerType !== 'mouse' && typeof carousel.setPointerCapture === 'function') {
            carousel.setPointerCapture(event.pointerId);
            dragState.hasPointerCapture = true;
        }
    }

    function onPointerMove(event) {
        if (!dragState.active) return;
        if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) return;

        if (dragState.pointerType === 'mouse' && (event.buttons & 1) !== 1) {
            finishDrag(false);
            return;
        }

        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;
        dragState.deltaX = deltaX;

        if (!dragState.horizontalLock) {
            const moveThreshold = 8;
            if (Math.abs(deltaX) < moveThreshold && Math.abs(deltaY) < moveThreshold) return;

            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                finishDrag(false);
                return;
            }

            dragState.horizontalLock = true;
            carousel.classList.add('is-dragging');
        }

        setTrackTransitionEnabled(false);
        const baseOffset = -currentIndex * getCarouselWidth();
        images.style.transform = `translateX(${baseOffset + deltaX}px)`;

        if (event.cancelable) {
            event.preventDefault();
        }
    }

    function onPointerUp(event) {
        if (!dragState.active) return;
        if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) return;
        finishDrag(true);
    }

    function onWindowPointerUp(event) {
        if (!dragState.active) return;
        if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) return;
        finishDrag(true);
    }

    function onWindowPointerCancel(event) {
        if (!dragState.active) return;
        if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) return;
        finishDrag(false);
    }

    const section = carousel.closest('section');
    const category = section ? section.id : 'default';
    if (!carouselGroups[category]) {
        carouselGroups[category] = {
            carousels: [],
            interval: null
        };
    }

    carousel.setAttribute('tabindex', '0');
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-label', `Carrossel ${title}`);

    if (prevArrow) {
        prevArrow.setAttribute('type', 'button');
        prevArrow.setAttribute('aria-label', 'Imagem anterior');
    }
    if (nextArrow) {
        nextArrow.setAttribute('type', 'button');
        nextArrow.setAttribute('aria-label', 'Proxima imagem');
    }

    dots.forEach((dot, index) => {
        dot.setAttribute('role', 'button');
        dot.setAttribute('tabindex', '0');
        dot.setAttribute('aria-label', `Ir para imagem ${index + 1}`);
    });

    const carouselObj = {
        element: carousel,
        category,
        getCurrentIndex() {
            return currentIndex;
        },
        getDotsLength() {
            return dots.length;
        },
        goToSlide(index) {
            currentIndex = index;
            images.style.transform = `translateX(-${currentIndex * 100}%)`;
            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle('active', dotIndex === currentIndex);
            });
        },
        nextSlide(isManual = false) {
            if (!isManual && isHovered) return;
            currentIndex = (currentIndex + 1) % dots.length;
            this.goToSlide(currentIndex);
        },
        prevSlide() {
            currentIndex = (currentIndex - 1 + dots.length) % dots.length;
            this.goToSlide(currentIndex);
        }
    };

    carouselGroups[category].carousels.push(carouselObj);

    carousel.addEventListener('mouseenter', () => {
        isHovered = true;
    });

    carousel.addEventListener('mouseleave', () => {
        isHovered = false;
    });

    carousel.addEventListener('pointerdown', onPointerDown);
    carousel.addEventListener('pointermove', onPointerMove);
    carousel.addEventListener('pointerup', onPointerUp);
    carousel.addEventListener('pointercancel', () => finishDrag(false));
    carousel.addEventListener('pointerleave', () => {
        if (dragState.active && dragState.pointerType === 'mouse') {
            finishDrag(false);
        }
    });
    carousel.addEventListener('lostpointercapture', () => finishDrag(false));
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerCancel);

    carousel.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            carouselObj.prevSlide();
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            carouselObj.nextSlide(true);
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            openLightbox(carousel, carouselObj.getCurrentIndex());
        }
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            carouselObj.goToSlide(index);
        });

        dot.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                carouselObj.goToSlide(index);
            }
        });
    });

    if (prevArrow) {
        prevArrow.addEventListener('click', (event) => {
            event.stopPropagation();
            carouselObj.prevSlide();
        });
    }

    if (nextArrow) {
        nextArrow.addEventListener('click', (event) => {
            event.stopPropagation();
            carouselObj.nextSlide(true);
        });
    }

    carousel.addEventListener('click', (event) => {
        if (Date.now() < suppressImageClickUntil) return;
        if (isInteractiveTarget(event.target)) return;
        if (!event.target.closest('.carousel-images, .carousel-image, picture')) return;
        openLightbox(carousel, carouselObj.getCurrentIndex());
    });

    imageElements.forEach((img, index) => {
        img.style.cursor = 'pointer';
        img.addEventListener('dragstart', (event) => {
            event.preventDefault();
        });

        img.addEventListener('click', (event) => {
            if (Date.now() < suppressImageClickUntil) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            event.stopPropagation();
            openLightbox(carousel, index);
        });
    });
});

function startCarouselAutoplay() {
    if (prefersReducedMotion || document.hidden) return;

    Object.keys(carouselGroups).forEach((category) => {
        const group = carouselGroups[category];
        if (group.interval) return;

        const categoryNextSlide = () => {
            group.carousels.forEach((carouselObj) => carouselObj.nextSlide());
        };

        group.interval = setInterval(categoryNextSlide, 10000);
    });
}

function stopCarouselAutoplay() {
    Object.keys(carouselGroups).forEach((category) => {
        const group = carouselGroups[category];
        if (!group.interval) return;
        clearInterval(group.interval);
        group.interval = null;
    });
}

startCarouselAutoplay();

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopCarouselAutoplay();
        stopBackgroundAnimation();
    } else {
        startCarouselAutoplay();
        startBackgroundAnimation();
    }
});

const lightbox = document.getElementById('lightbox');
const lightboxContent = lightbox.querySelector('.lightbox-content');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxCounter = document.getElementById('lightbox-counter');
let currentLightboxItems = [];
let currentLightboxIndex = 0;

lightbox.setAttribute('role', 'dialog');
lightbox.setAttribute('aria-modal', 'true');
lightbox.setAttribute('aria-hidden', 'true');

function renderLightboxItem(element) {
    lightboxContent.innerHTML = '';

    if (element.tagName && element.tagName.toLowerCase() === 'img') {
        const image = document.createElement('img');
        image.src = element.currentSrc || element.src;
        image.alt = element.alt || 'Lightbox image';
        image.className = 'lightbox-image';
        image.id = 'lightbox-image';
        image.width = element.naturalWidth || 1280;
        image.height = element.naturalHeight || 720;
        lightboxContent.appendChild(image);
        return;
    }

    if (element.tagName && element.tagName.toLowerCase() === 'svg') {
        const svg = element.cloneNode(true);
        svg.classList.remove('carousel-image');
        svg.removeAttribute('style');
        svg.classList.add('lightbox-image');
        svg.setAttribute('aria-label', 'Lightbox image');

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

function updateLightboxImage() {
    renderLightboxItem(currentLightboxItems[currentLightboxIndex]);
    lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxItems.length}`;
}

function openLightbox(carousel, index) {
    currentLightboxItems = Array.from(carousel.querySelectorAll('.carousel-image'));
    currentLightboxIndex = index;
    updateLightboxImage();
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
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

lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
        closeLightbox();
    }
});

const translations = { pt: {}, en: {} };
const i18nIssues = [];
const i18nAlert = document.getElementById('i18n-alert');
let currentLang = 'pt';

function setI18nAlert(message) {
    if (!i18nAlert) return;
    if (!message) {
        i18nAlert.hidden = true;
        i18nAlert.textContent = '';
        return;
    }
    i18nAlert.hidden = false;
    i18nAlert.textContent = message;
}

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
            i18nIssues.push(`load-${lang}`);
            translations[lang] = {};
        }
    }));
}

function validateTranslationKeys() {
    const ptKeys = Object.keys(translations.pt || {});
    const enKeys = Object.keys(translations.en || {});
    const missingInEn = ptKeys.filter((key) => !enKeys.includes(key));
    const missingInPt = enKeys.filter((key) => !ptKeys.includes(key));

    if (missingInEn.length || missingInPt.length) {
        i18nIssues.push('keys-mismatch');
    }
}

function getLangMap(lang) {
    const selected = translations[lang] || {};
    if (Object.keys(selected).length > 0) return selected;
    return translations.pt || {};
}

function updateSeo(langMap) {
    const seoTitle = langMap['seo.title'] || 'Portfolio | Ivo Andre';
    const seoDescription = langMap['seo.description'] || 'Portfolio pessoal com projetos e contacto.';

    document.title = seoTitle;

    const metaDescription = document.getElementById('meta-description');
    if (metaDescription) metaDescription.setAttribute('content', seoDescription);

    const ogTitle = document.getElementById('og-title');
    if (ogTitle) ogTitle.setAttribute('content', seoTitle);

    const ogDescription = document.getElementById('og-description');
    if (ogDescription) ogDescription.setAttribute('content', seoDescription);

    const twitterTitle = document.getElementById('twitter-title');
    if (twitterTitle) twitterTitle.setAttribute('content', seoTitle);

    const twitterDescription = document.getElementById('twitter-description');
    if (twitterDescription) twitterDescription.setAttribute('content', seoDescription);

    const canonicalUrl = document.getElementById('canonical-url');
    if (canonicalUrl) canonicalUrl.setAttribute('href', 'https://portfolio.rivodani.com');

    const ogUrl = document.getElementById('og-url');
    if (ogUrl) ogUrl.setAttribute('content', 'https://portfolio.rivodani.com');
}

function updateA11yLabels(langMap) {
    const prevLabel = langMap['a11y.carousel.prev'] || 'Imagem anterior';
    const nextLabel = langMap['a11y.carousel.next'] || 'Proxima imagem';
    const dotLabel = langMap['a11y.carousel.dot'] || 'Ir para imagem';
    const regionLabel = langMap['a11y.carousel.region'] || 'Carrossel do projeto';
    const lightboxCloseLabel = langMap['a11y.lightbox.close'] || 'Fechar imagem ampliada';
    const lightboxPrevLabel = langMap['a11y.lightbox.prev'] || 'Imagem anterior';
    const lightboxNextLabel = langMap['a11y.lightbox.next'] || 'Proxima imagem';

    document.querySelectorAll('.project-carousel').forEach((carousel) => {
        const title = getCarouselTitle(carousel);
        carousel.setAttribute('aria-label', `${regionLabel}: ${title}`);
    });

    document.querySelectorAll('.carousel-arrow.prev').forEach((button) => {
        button.setAttribute('aria-label', prevLabel);
    });

    document.querySelectorAll('.carousel-arrow.next').forEach((button) => {
        button.setAttribute('aria-label', nextLabel);
    });

    document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
        dot.setAttribute('aria-label', `${dotLabel} ${index % 2 === 0 ? 1 : 2}`);
    });

    lightboxClose.setAttribute('aria-label', lightboxCloseLabel);
    lightboxPrev.setAttribute('aria-label', lightboxPrevLabel);
    lightboxNext.setAttribute('aria-label', lightboxNextLabel);
}

function setLanguage(lang, updateUrl = false) {
    currentLang = lang;
    document.documentElement.lang = lang;

    const langMap = getLangMap(lang);

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.getAttribute('data-i18n');
        if (langMap[key]) {
            element.textContent = langMap[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (langMap[key]) {
            element.setAttribute('placeholder', langMap[key]);
        }
    });

    updateA11yLabels(langMap);
    updateSeo(langMap);

    const emailBtn = document.getElementById('email-btn');
    const subject = encodeURIComponent(langMap['email.subject'] || '');
    emailBtn.href = `mailto:ivo.daniel.andre@gmail.com?subject=${subject}`;

    const emailFallbackSubject = document.getElementById('email-fallback-subject');
    emailFallbackSubject.textContent = langMap['email.subject'] || '';

    document.querySelectorAll('.lang-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.lang === lang);
    });

    if (i18nIssues.length > 0) {
        const warning = langMap['i18n.warning.load'] || 'Algumas traducoes nao foram carregadas corretamente.';
        setI18nAlert(warning);
    } else {
        setI18nAlert('');
    }

    localStorage.setItem('portfolio-lang', lang);

    if (updateUrl) {
        const url = new URL(window.location);
        url.searchParams.set('l', lang);
        window.history.replaceState({}, '', url);
    }
}

function getInitialLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('l');
    if (urlLang === 'pt' || urlLang === 'en') {
        return urlLang;
    }

    const savedLang = localStorage.getItem('portfolio-lang');
    if (savedLang === 'pt' || savedLang === 'en') {
        return savedLang;
    }

    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang && browserLang.toLowerCase().startsWith('pt')) {
        return 'pt';
    }

    return 'en';
}

const contactForm = document.getElementById('contact-form');
const contactFormStatus = document.getElementById('contact-form-status');
const formStartedAt = document.getElementById('form-started-at');
const honeypotField = document.getElementById('contact-company');
const CONTACT_FORM_ENDPOINT = 'https://portfolio-contact-form.ivoandre.workers.dev/api/contact';

function resetContactTimer() {
    if (formStartedAt) {
        formStartedAt.value = String(Date.now());
    }
}

function setContactStatus(type, key) {
    if (!contactFormStatus) return;
    const langMap = getLangMap(currentLang);
    contactFormStatus.classList.remove('success', 'error');
    if (type) {
        contactFormStatus.classList.add(type);
    }
    contactFormStatus.textContent = langMap[key] || '';
}

async function submitContactForm(event) {
    event.preventDefault();

    if (!contactForm) return;

    if (honeypotField && honeypotField.value.trim() !== '') {
        setContactStatus('error', 'contact.form.status.bot');
        return;
    }

    const startedAt = Number(formStartedAt ? formStartedAt.value : Date.now());
    if (Date.now() - startedAt < 2500) {
        setContactStatus('error', 'contact.form.status.fast');
        return;
    }

    if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        setContactStatus('error', 'contact.form.status.invalid');
        return;
    }

    const messageField = document.getElementById('contact-message');
    const linkMatches = (messageField.value.match(/https?:\/\//gi) || []).length;
    if (linkMatches > 2) {
        setContactStatus('error', 'contact.form.status.links');
        return;
    }

    setContactStatus('', 'contact.form.status.sending');

    const payload = {
        name: document.getElementById('contact-name')?.value || '',
        email: document.getElementById('contact-email')?.value || '',
        message: messageField.value,
        company: honeypotField ? honeypotField.value : '',
        formStartedAt: startedAt
    };

    try {
        const response = await fetch(CONTACT_FORM_ENDPOINT, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Failed to submit form');
        }

        setContactStatus('success', 'contact.form.status.success');
        contactForm.reset();
        resetContactTimer();
    } catch (error) {
        setContactStatus('error', 'contact.form.status.error');
    }
}

if (contactForm) {
    contactForm.addEventListener('submit', submitContactForm);
    resetContactTimer();
}

const emailBtn = document.getElementById('email-btn');
const fallbackModal = document.getElementById('email-fallback-modal');
const emailFallbackClose = document.getElementById('email-fallback-close');
const copyEmailBtn = document.getElementById('copy-email-btn');
const copySubjectBtn = document.getElementById('copy-subject-btn');
const emailFallbackAddress = document.getElementById('email-fallback-address');
const emailFallbackSubject = document.getElementById('email-fallback-subject');

function closeFallbackModal() {
    fallbackModal.classList.remove('active');
    copyEmailBtn.classList.remove('copied');
    copySubjectBtn.classList.remove('copied');
}

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        button.classList.add('copied');
        const activeLangMap = getLangMap(currentLang);
        button.textContent = activeLangMap['email.fallback.copied'] || 'Copiado!';
        setTimeout(() => {
            button.classList.remove('copied');
            button.textContent = activeLangMap['email.fallback.copy'] || 'Copiar';
        }, 2000);
    }).catch(() => {
        setContactStatus('error', 'contact.form.status.error');
    });
}

emailBtn.addEventListener('click', (event) => {
    const timeoutId = setTimeout(() => {
        event.preventDefault();
        fallbackModal.classList.add('active');
    }, 5000);

    window.addEventListener('focus', () => {
        clearTimeout(timeoutId);
    }, { once: true });
});

emailFallbackClose.addEventListener('click', closeFallbackModal);

fallbackModal.addEventListener('click', (event) => {
    if (event.target === fallbackModal) {
        closeFallbackModal();
    }
});

copyEmailBtn.addEventListener('click', () => {
    copyToClipboard(emailFallbackAddress.textContent, copyEmailBtn);
});

copySubjectBtn.addEventListener('click', () => {
    copyToClipboard(emailFallbackSubject.textContent, copySubjectBtn);
});

document.addEventListener('keydown', (event) => {
    if (lightbox.classList.contains('active')) {
        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') lightboxPrevImage();
        if (event.key === 'ArrowRight') lightboxNextImage();
        return;
    }

    if (fallbackModal.classList.contains('active') && event.key === 'Escape') {
        closeFallbackModal();
    }
});

document.querySelectorAll('.lang-btn').forEach((button) => {
    button.addEventListener('click', () => {
        setLanguage(button.dataset.lang, true);
    });
});

(async () => {
    await loadTranslations();
    validateTranslationKeys();
    const initialLang = getInitialLanguage();
    setLanguage(initialLang, true);
})();

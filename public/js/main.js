/* ==========================================================================
   LEX Briefly — Shared front-end behaviour
   Extracted from the inline <script> block duplicated across every page:
   sidebar collapse/expand, mobile drawer, header scroll effect, scroll
   reveal animations, and the hero particle canvas.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // --- Sidebar Toggle Logic ---
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebarIcon = document.getElementById('sidebarIcon');
    const mainContent = document.getElementById('mainContent');
    const topHeader = document.getElementById('topHeader');

    let isSidebarExpanded = true;

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isSidebarExpanded = !isSidebarExpanded;
            if (isSidebarExpanded) {
                sidebar.classList.remove('sidebar-collapsed');
                sidebar.classList.add('sidebar-expanded');
                sidebarIcon.classList.replace('ph-caret-right', 'ph-caret-left');
                mainContent.classList.remove('md:ml-20');
                mainContent.classList.add('md:ml-64');
                topHeader.classList.remove('md:left-20');
                topHeader.classList.add('md:left-64');
            } else {
                sidebar.classList.remove('sidebar-expanded');
                sidebar.classList.add('sidebar-collapsed');
                sidebarIcon.classList.replace('ph-caret-left', 'ph-caret-right');
                mainContent.classList.remove('md:ml-64');
                mainContent.classList.add('md:ml-20');
                topHeader.classList.remove('md:left-64');
                topHeader.classList.add('md:left-20');
            }
        });
    }

    // --- Mobile Drawer Logic ---
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');

    if (mobileMenuBtn && mobileDrawer) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileDrawer.classList.remove('-translate-x-full');
        });
    }
    if (closeDrawerBtn && mobileDrawer) {
        closeDrawerBtn.addEventListener('click', () => {
            mobileDrawer.classList.add('-translate-x-full');
        });
    }
    if (mobileDrawer) {
        mobileDrawer.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                if (link.getAttribute('href').startsWith('#')) {
                    mobileDrawer.classList.add('-translate-x-full');
                }
            });
        });
    }

    // --- Header Scroll Effect ---
    const header = document.getElementById('topHeader');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.classList.add('shadow-lg');
                header.style.backgroundColor = 'rgba(7, 26, 53, 0.9)';
            } else {
                header.classList.remove('shadow-lg');
                header.style.backgroundColor = 'rgba(7, 26, 53, 0.8)';
            }
        });
    }

    // --- Scroll Reveal Animations ---
    const reveals = document.querySelectorAll('.reveal');
    const revealOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        });
    }, revealOptions);
    reveals.forEach((reveal) => revealOnScroll.observe(reveal));

    // --- Particle Canvas Background ---
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resizeCanvas() {
            canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
            canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                const colors = ['rgba(30, 77, 255, 0.3)', 'rgba(30, 77, 255, 0.5)', 'rgba(212, 175, 55, 0.3)'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            const numParticles = window.innerWidth < 768 ? 40 : 100;
            for (let i = 0; i < numParticles; i++) particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => { p.update(); p.draw(); });
            requestAnimationFrame(animateParticles);
        }

        initParticles();
        animateParticles();
    }

    // --- Global Search Bar → routes to the appropriate page ---
    const globalSearch = document.getElementById('globalSearchInput');
    if (globalSearch) {
        globalSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && globalSearch.value.trim()) {
                window.location.href = `/resource.html?q=${encodeURIComponent(globalSearch.value.trim())}`;
            }
        });
    }
});
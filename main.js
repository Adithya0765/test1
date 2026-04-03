/* ============================================
   Qaulium AI - Main JavaScript
   ============================================ */

(function () {
    'use strict';

    // --- Theme toggle ---
    var themeToggle = document.getElementById('themeToggle');
    var savedTheme = localStorage.getItem('qualium-theme');
    var prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('qualium-theme', theme);
    }

    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme(prefersDarkQuery.matches ? 'dark' : 'light');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    prefersDarkQuery.addEventListener('change', function (e) {
        if (!localStorage.getItem('qualium-theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // --- Header scroll state ---
    var header = document.getElementById('siteHeader');
    var lastScroll = 0;

    function updateHeader() {
        var scrollY = window.scrollY;
        if (!header) return;
        if (scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        lastScroll = scrollY;
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();

    // --- Mobile navigation ---
    var navToggle = document.getElementById('navToggle');
    var mobileNav = document.getElementById('mobileNav');

    if (navToggle && mobileNav) {
        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('active');
            mobileNav.classList.toggle('open');
            document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
        });

        mobileNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navToggle.classList.remove('active');
                mobileNav.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Mobile accordion dropdowns ---
    function setupMobileAccordion(toggleId, menuId) {
        var toggle = document.getElementById(toggleId);
        var menu = document.getElementById(menuId);
        if (!toggle || !menu) return;

        toggle.addEventListener('click', function () {
            var isOpen = menu.classList.contains('open');

            document.querySelectorAll('.mobile-nav-submenu').forEach(function (m) {
                m.classList.remove('open');
            });
            document.querySelectorAll('.mobile-nav-accordion-toggle').forEach(function (t) {
                t.classList.remove('open');
            });

            if (!isOpen) {
                menu.classList.add('open');
                toggle.classList.add('open');
            }
        });
    }

    setupMobileAccordion('mobileProductsToggle', 'mobileProductsMenu');
    setupMobileAccordion('mobileResearchToggle', 'mobileResearchMenu');

    // --- Mobile nav CTA opens modal ---
    var mobileNavCta = document.getElementById('mobileNavCta');
    if (mobileNavCta) {
        mobileNavCta.addEventListener('click', function (e) {
            e.preventDefault();

            if (navToggle) navToggle.classList.remove('active');
            if (mobileNav) mobileNav.classList.remove('open');
            document.body.style.overflow = '';

            var modal = document.getElementById('registerModal');
            if (modal) {
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
            } else {
                window.location.href = '/registration';
            }
        });
    }

    // --- Desktop products dropdown ---
    var productDropdown = document.getElementById('productDropdown');
    if (productDropdown) {
        productDropdown.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                // Let links work normally
            });
        });
    }

    // --- Desktop research dropdown ---
    var researchDropdown = document.getElementById('researchDropdown');
    if (researchDropdown) {
        researchDropdown.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                // Let links work normally
            });
        });
    }

    // --- Quantum Circuit: random build animation ---
    (function () {
        var container = document.getElementById('qcCircuit');
        if (!container) return;

        var QUBITS = 3;
        var COLS = 6;
        var GATE_DELAY = 200;
        var HOLD_TIME = 5000;
        var FADE_TIME = 400;

        var singleGates = ['H', 'X', 'Y', 'Z', 'S', 'T', 'Rz'];
        var meterSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 18 A8 8 0 0 1 20 18"/><line x1="12" y1="18" x2="17" y2="7"/></svg>';

        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

        function generateCircuit() {
            var grid = [];
            for (var r = 0; r < QUBITS; r++) {
                grid[r] = [];
                for (var c = 0; c < COLS; c++) grid[r][c] = null;
            }

            var cnots = [];
            var numCnot = randInt(1, 2);

            for (var i = 0; i < numCnot; i++) {
                var col = randInt(0, COLS - 2);
                var ctrlRow = randInt(0, QUBITS - 2);
                var tgtRow = ctrlRow + 1;

                if (!grid[ctrlRow][col] && !grid[tgtRow][col]) {
                    grid[ctrlRow][col] = { type: 'ctrl' };
                    grid[tgtRow][col] = { type: 'tgt' };
                    cnots.push({ ctrl: ctrlRow, tgt: tgtRow, col: col });
                }
            }

            for (var r2 = 0; r2 < QUBITS; r2++) {
                for (var c2 = 0; c2 < COLS; c2++) {
                    if (!grid[r2][c2]) {
                        if (Math.random() < 0.45) {
                            grid[r2][c2] = { type: 'gate', label: pick(singleGates) };
                        }
                    }
                }
            }

            if (Math.random() < 0.5) {
                var mRow = randInt(0, QUBITS - 1);
                grid[mRow][COLS - 1] = { type: 'meter' };
            }

            return { grid: grid, cnots: cnots };
        }

        function buildDOM(circuit) {
            container.innerHTML = '';
            var gridEl = document.createElement('div');
            gridEl.className = 'qc-grid';
            gridEl.style.setProperty('--qc-cols', COLS);

            var elements = [];

            for (var r = 0; r < QUBITS; r++) {
                var lbl = document.createElement('div');
                lbl.className = 'qc-cell qc-label-cell';
                lbl.textContent = 'q\u2080\u2081\u2082'[0] + '\u2080\u2081\u2082'[r];
                gridEl.appendChild(lbl);
                elements.push({ el: lbl, col: -1 });

                for (var c = 0; c < COLS; c++) {
                    var cell = document.createElement('div');
                    cell.className = 'qc-cell';

                    var entry = circuit.grid[r][c];
                    if (entry) {
                        var gateEl;
                        if (entry.type === 'gate') {
                            gateEl = document.createElement('div');
                            gateEl.className = 'qc-gate';
                            gateEl.textContent = entry.label;
                        } else if (entry.type === 'ctrl') {
                            gateEl = document.createElement('div');
                            gateEl.className = 'qc-ctrl';
                        } else if (entry.type === 'tgt') {
                            gateEl = document.createElement('div');
                            gateEl.className = 'qc-tgt';
                            gateEl.textContent = '\u2295';
                        } else if (entry.type === 'meter') {
                            gateEl = document.createElement('div');
                            gateEl.className = 'qc-meter';
                            gateEl.innerHTML = meterSvg;
                        }
                        cell.appendChild(gateEl);
                        elements.push({ el: gateEl, col: c });
                    }

                    gridEl.appendChild(cell);
                }
            }

            container.appendChild(gridEl);

            elements.sort(function (a, b) { return a.col - b.col; });

            var vlines = [];
            circuit.cnots.forEach(function (cn) {
                var vl = document.createElement('div');
                vl.className = 'qc-vline';
                container.appendChild(vl);
                vlines.push({ el: vl, cnot: cn });
            });

            return { elements: elements, vlines: vlines, gridEl: gridEl };
        }

        function positionVLines(vlines) {
            var cRect = container.getBoundingClientRect();
            vlines.forEach(function (v) {
                var cn = v.cnot;
                var gridEl = container.querySelector('.qc-grid');
                if (!gridEl) return;
                var ctrlIdx = cn.ctrl * (COLS + 1) + 1 + cn.col;
                var tgtIdx = cn.tgt * (COLS + 1) + 1 + cn.col;
                var cells = gridEl.children;
                if (!cells[ctrlIdx] || !cells[tgtIdx]) return;
                var cr = cells[ctrlIdx].getBoundingClientRect();
                var tr = cells[tgtIdx].getBoundingClientRect();
                v.el.style.left = (cr.left + cr.width / 2 - cRect.left - 1) + 'px';
                v.el.style.top = (cr.top + cr.height / 2 - cRect.top) + 'px';
                v.el.style.height = (tr.top + tr.height / 2 - cr.top - cr.height / 2) + 'px';
            });
        }

        function animateIn(dom, callback) {
            var delay = 0;
            var colGroups = {};

            dom.elements.forEach(function (item) {
                var key = item.col;
                if (!colGroups[key]) colGroups[key] = [];
                colGroups[key].push(item.el);
            });

            var cols = Object.keys(colGroups).sort(function (a, b) { return a - b; });
            cols.forEach(function (colKey) {
                colGroups[colKey].forEach(function (el) {
                    setTimeout(function () { el.classList.add('qc-pop'); }, delay);
                });
                delay += GATE_DELAY;
            });

            setTimeout(function () {
                positionVLines(dom.vlines);
                dom.vlines.forEach(function (v) { v.el.classList.add('qc-pop'); });
            }, delay);

            setTimeout(callback, delay + HOLD_TIME);
        }

        function fadeOutAll(dom, callback) {
            var allEls = container.querySelectorAll('.qc-gate, .qc-ctrl, .qc-tgt, .qc-meter, .qc-vline, .qc-label-cell');
            allEls.forEach(function (el) {
                el.style.animation = 'qcFadeOut ' + FADE_TIME + 'ms ease forwards';
            });
            setTimeout(callback, FADE_TIME + 100);
        }

        function cycle() {
            var circuit = generateCircuit();
            var dom = buildDOM(circuit);
            requestAnimationFrame(function () {
                animateIn(dom, function () {
                    fadeOutAll(dom, function () {
                        cycle();
                    });
                });
            });
        }

        cycle();
    })();

    // --- Scroll-reveal ---
    var revealTargets = [
        '.hero-content',
        '.hero-visual',
        '.arch-block',
        '.benchmark-table-wrap',
        '.benchmark-note',
        '.dev-card',
        '.code-example',
        '.research-card',
        '.capability-card',
        '.contact-info',
        '.contact-form-wrap',
        '.section-heading',
        '.section-intro',
        '.section-label',
        '.cta-banner',
        '.usecase-card',
        '.careers-value-card',
        '.role-card',
        '.careers-apply-wrap',
        '.dev-card-horizontal',
        '.layer-surface'
    ];

    var elements = document.querySelectorAll(revealTargets.join(','));
    elements.forEach(function (el) {
        el.classList.add('reveal');
    });

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });

    elements.forEach(function (el) {
        observer.observe(el);
    });

    // --- Smooth scroll for nav links ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                var headerHeight = header ? header.offsetHeight : 72;
                var targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Active nav link tracking ---
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

    function updateActiveNav() {
        var scrollPos = window.scrollY + 120;
        sections.forEach(function (section) {
            var top = section.offsetTop;
            var height = section.offsetHeight;
            var id = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(function (link) {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });

    // --- Registration Modal ---
    var registerModal = document.getElementById('registerModal');
    var modalClose = document.getElementById('modalClose');
    var registerForm = document.getElementById('registerForm');
    var formStatus = document.getElementById('formStatus');
    var portalRegisterBtn = document.getElementById('portalRegisterBtn');

    var itiRegPhone = null;
    var itiCareerPhone = null;

    function initIntlPhoneInput(inputId) {
        var input = document.getElementById(inputId);
        if (!input || typeof window.intlTelInput !== 'function') return null;
        return window.intlTelInput(input, {
            initialCountry: 'auto',
            strictMode: true,
            nationalMode: false,
            autoPlaceholder: 'polite',
            showSelectedDialCode: true,
            separateDialCode: false,
            countrySearch: false,
            loadUtilsOnInit: true,
            dropdownContainer: document.body,
            geoIpLookup: function (callback) {
                fetch('https://ipapi.co/json/')
                    .then(function (res) { return res.json(); })
                    .then(function (data) { callback((data && data.country_code) ? data.country_code : 'us'); })
                    .catch(function () { callback('us'); });
            }
        });
    }

    itiRegPhone = null;
    itiCareerPhone = null;

    var careerPhoneInput = document.getElementById('careerPhone');
    if (careerPhoneInput) {
        setTimeout(function () {
            itiCareerPhone = initIntlPhoneInput('careerPhone');
        }, 300);
    }

    function openModal() {
        if (!registerModal) return;
        registerModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (!itiRegPhone) {
            itiRegPhone = initIntlPhoneInput('regPhone');
        }
    }

    function closeModal() {
        if (!registerModal) return;
        registerModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (modalClose && registerModal) {
        modalClose.addEventListener('click', closeModal);

        registerModal.addEventListener('click', function (e) {
            if (e.target === registerModal) closeModal();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && registerModal.classList.contains('open')) {
                closeModal();
            }
        });
    }

    var tryStudioBtn = document.querySelector('a[href="#developer"].btn-secondary');
    if (tryStudioBtn && registerModal) {
        tryStudioBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openModal();
        });
    }

    var navCtaBtn = document.querySelector('.nav-cta');
    if (navCtaBtn) {
        navCtaBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openModal();
        });
    }

    var ctaBannerBtn = document.querySelector('.cta-banner .btn');
    if (ctaBannerBtn && registerModal && ctaBannerBtn.getAttribute('href') === '#') {
        ctaBannerBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openModal();
        });
    }

    var ctaRegisterBtn = document.getElementById('ctaRegisterBtn');
    if (ctaRegisterBtn && registerModal) {
        ctaRegisterBtn.addEventListener('click', function () {
            openModal();
        });
    }

    if (portalRegisterBtn && registerModal) {
        portalRegisterBtn.addEventListener('click', function () {
            openModal();
        });
    }

    // --- Registration form submission ---
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var firstName = document.getElementById('regFirstName').value.trim();
            var lastName = document.getElementById('regLastName').value.trim();
            var email = document.getElementById('regEmail').value.trim();
            var phone = document.getElementById('regPhone').value.trim();
            var company = document.getElementById('regCompany').value.trim();
            var role = document.getElementById('regRole').value.trim();
            var useCase = document.getElementById('regUseCase').value;
            var registrationSource = (registerForm.getAttribute('data-registration-source') || '').trim();

            if (!registrationSource) {
                registrationSource = window.location.pathname.indexOf('registration') !== -1
                    ? 'public_registration_portal'
                    : 'landing_modal';
            }

            if (!firstName || !lastName || !email || !company || !role || !useCase) {
                showStatus('Please fill in all required fields.', 'error');
                return;
            }

            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                showStatus('Please enter a valid email address.', 'error');
                return;
            }

            if (itiRegPhone) {
                if (!itiRegPhone.isValidNumber()) {
                    showStatus('Please enter a valid international phone number.', 'error');
                    return;
                }
                phone = itiRegPhone.getNumber();
            }

            var btn = document.getElementById('registerBtn');
            btn.textContent = 'Registering...';
            btn.disabled = true;

            var payload = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: phone,
                company: company,
                role: role,
                useCase: useCase,
                source: registrationSource
            };

            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.success) {
                    showStatus('Registration successful! A confirmation email has been sent to ' + email + '.', 'success');
                    registerForm.reset();
                    if (itiRegPhone) itiRegPhone.setNumber('');

                    var redirectTo = (registerForm.getAttribute('data-redirect-on-success') || '').trim();
                    var redirectDelay = parseInt(registerForm.getAttribute('data-redirect-delay-ms') || '2200', 10);

                    if (!redirectTo && window.location.pathname.indexOf('registration') !== -1) {
                        redirectTo = '/';
                    }

                    if (redirectTo) {
                        setTimeout(function () {
                            window.location.replace(redirectTo);
                        }, isNaN(redirectDelay) ? 2200 : redirectDelay);
                    }

                    setTimeout(function () {
                        closeModal();
                        if (formStatus) {
                            formStatus.style.display = 'none';
                            formStatus.className = 'form-status';
                        }
                    }, 4000);
                } else {
                    showStatus(data.message || 'Registration failed. Please try again.', 'error');
                }
                btn.textContent = 'Register';
                btn.disabled = false;
            })
            .catch(function () {
                showStatus('Unable to connect to server. Please try again later.', 'error');
                btn.textContent = 'Register';
                btn.disabled = false;
            });
        });
    }

    function showStatus(message, type) {
        if (!formStatus) return;
        formStatus.textContent = message;
        formStatus.className = 'form-status ' + type;
    }

    // --- Careers form ---
    var careerForm = document.getElementById('careerForm');
    var careerFormStatus = document.getElementById('careerFormStatus');
    var careerApplyBtn = document.getElementById('careerApplyBtn');
    var careerRoleField = document.getElementById('careerRole');

    function showCareerStatus(message, type) {
        if (!careerFormStatus) return;
        careerFormStatus.textContent = message;
        careerFormStatus.className = 'form-status ' + type;
    }

    if (careerRoleField) {
        var roleParam = new URLSearchParams(window.location.search).get('role');
        if (roleParam) {
            careerRoleField.value = roleParam;
        }
    }

    if (careerForm) {
        careerForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var payload = {
                firstName: document.getElementById('careerFirstName').value.trim(),
                lastName: document.getElementById('careerLastName').value.trim(),
                email: document.getElementById('careerEmail').value.trim(),
                phone: document.getElementById('careerPhone').value.trim(),
                roleApplied: document.getElementById('careerRole').value,
                location: document.getElementById('careerLocation').value.trim(),
                university: document.getElementById('careerUniversity').value.trim(),
                degree: document.getElementById('careerDegree').value.trim(),
                graduationYear: document.getElementById('careerGraduationYear').value.trim(),
                availability: document.getElementById('careerAvailability').value.trim(),
                linkedinUrl: document.getElementById('careerLinkedIn').value.trim(),
                portfolioUrl: document.getElementById('careerPortfolio').value.trim(),
                resumeUrl: document.getElementById('careerResume').value.trim(),
                coverLetter: document.getElementById('careerCoverLetter').value.trim()
            };

            if (!payload.firstName || !payload.lastName || !payload.email || !payload.phone || !payload.roleApplied || !payload.location || !payload.university || !payload.degree || !payload.graduationYear || !payload.availability || !payload.resumeUrl || !payload.coverLetter) {
                showCareerStatus('Please fill all required fields before submitting.', 'error');
                return;
            }

            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(payload.email)) {
                showCareerStatus('Please enter a valid email address.', 'error');
                return;
            }

            if (itiCareerPhone) {
                if (!itiCareerPhone.isValidNumber()) {
                    showCareerStatus('Please enter a valid international phone number.', 'error');
                    return;
                }
                payload.phone = itiCareerPhone.getNumber();
            }

            if (careerApplyBtn) {
                careerApplyBtn.textContent = 'Submitting...';
                careerApplyBtn.disabled = true;
            }

            fetch('/api/careers/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.success) {
                    showCareerStatus('Application submitted successfully. A confirmation email has been sent to ' + payload.email + '.', 'success');
                    careerForm.reset();
                    if (itiCareerPhone) itiCareerPhone.setNumber('');
                } else {
                    showCareerStatus(data.message || 'Unable to submit application right now. Please try again.', 'error');
                }
                if (careerApplyBtn) {
                    careerApplyBtn.textContent = 'Submit Application';
                    careerApplyBtn.disabled = false;
                }
            })
            .catch(function () {
                showCareerStatus('Unable to connect to server. Please try again later.', 'error');
                if (careerApplyBtn) {
                    careerApplyBtn.textContent = 'Submit Application';
                    careerApplyBtn.disabled = false;
                }
            });
        });
    }

    // --- Contact form ---
    var form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = document.getElementById('name').value.trim();
            var email = document.getElementById('email').value.trim();
            var message = document.getElementById('message').value.trim();
            var company = document.getElementById('company').value.trim();

            var btn = form.querySelector('button[type="submit"]');
            var statusEl = form.querySelector('.contact-form-status') || (function () {
                var s = document.createElement('div');
                s.className = 'form-status contact-form-status';
                form.appendChild(s);
                return s;
            }());

            if (!name || !email || !message || !company) {
                btn.textContent = 'Send Message';
                btn.disabled = false;
                statusEl.className = 'form-status error contact-form-status';
                statusEl.textContent = 'Please fill in all required fields.';
                return;
            }

            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                btn.textContent = 'Send Message';
                btn.disabled = false;
                statusEl.className = 'form-status error contact-form-status';
                statusEl.textContent = 'Please enter a valid email address.';
                return;
            }

            btn.textContent = 'Sending...';
            btn.disabled = true;
            statusEl.textContent = '';
            statusEl.className = 'form-status contact-form-status';

            fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, email: email, company: company, message: message })
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.success) {
                    btn.textContent = 'Message Sent';
                    form.reset();
                    statusEl.className = 'form-status success contact-form-status';
                    statusEl.textContent = 'Your message has been sent successfully.';
                } else {
                    btn.textContent = 'Send Message';
                    btn.disabled = false;
                    statusEl.className = 'form-status error contact-form-status';
                    statusEl.textContent = data.message || 'Failed to send message. Please try again.';
                    return;
                }
                setTimeout(function () {
                    btn.textContent = 'Send Message';
                    btn.disabled = false;
                }, 3000);
            })
            .catch(function () {
                btn.textContent = 'Send Message';
                btn.disabled = false;
                statusEl.className = 'form-status error contact-form-status';
                statusEl.textContent = 'Unable to connect to server. Please try again later.';
            });
        });
    }

    // --- Horizontal scroll for capabilities section ---
    (function () {
        var outer = document.getElementById('capabilitiesOuter');
        var section = document.getElementById('capabilities');
        var track = document.getElementById('capabilitiesTrack');
        var container = document.getElementById('capabilitiesScroll');

        if (!outer || !section || !track || !container) return;

        function isDesktop() {
            return window.innerWidth > 768;
        }

        function getHeaderHeight() {
            return header ? header.offsetHeight : 72;
        }

        function getHorizontalDistance() {
            return Math.max(0, track.scrollWidth - container.clientWidth);
        }

        function setupCapabilitiesScroll() {
            if (!isDesktop()) {
                outer.style.height = '';
                track.style.transform = '';
                container.scrollLeft = 0;
                return;
            }

            var horizontalDistance = getHorizontalDistance();
            var stickyHeight = section.offsetHeight;
            outer.style.height = (stickyHeight + horizontalDistance) + 'px';
            syncCapabilitiesToScroll();
        }

        function getProgress() {
            var horizontalDistance = getHorizontalDistance();
            if (horizontalDistance <= 0) return 0;

            var outerRect = outer.getBoundingClientRect();
            var headerHeight = getHeaderHeight();
            var maxTravel = horizontalDistance;
            var travelled = Math.min(Math.max(headerHeight - outerRect.top, 0), maxTravel);

            return travelled / maxTravel;
        }

        function syncCapabilitiesToScroll() {
            if (!isDesktop()) return;
            var horizontalDistance = getHorizontalDistance();
            var p = getProgress();
            var x = -p * horizontalDistance;
            track.style.transform = 'translate3d(' + x + 'px, 0, 0)';
        }

        function handleWheel(e) {
            if (!isDesktop()) return;

            var horizontalDistance = getHorizontalDistance();
            if (horizontalDistance <= 0) return;

            var outerRect = outer.getBoundingClientRect();
            var headerHeight = getHeaderHeight();
            var stickyStart = outerRect.top <= headerHeight;
            var stickyEnd = outerRect.bottom > section.offsetHeight + headerHeight;

            if (!(stickyStart && stickyEnd)) return;

            var p = getProgress();
            var goingDown = e.deltaY > 0;
            var goingUp = e.deltaY < 0;

            if ((goingDown && p < 1) || (goingUp && p > 0)) {
                e.preventDefault();
                window.scrollTo(0, window.scrollY + e.deltaY);
            }
        }

        function initCapabilitiesScroll() {
            setupCapabilitiesScroll();
            syncCapabilitiesToScroll();
        }

        window.addEventListener('scroll', syncCapabilitiesToScroll, { passive: true });
        window.addEventListener('resize', function () {
            setupCapabilitiesScroll();
            syncCapabilitiesToScroll();
        });
        window.addEventListener('load', initCapabilitiesScroll);
        window.addEventListener('wheel', handleWheel, { passive: false });

        if (document.readyState === 'complete') {
            initCapabilitiesScroll();
        } else {
            window.addEventListener('load', initCapabilitiesScroll);
        }

        // Touch support
        var touchStartX = 0;
        var touchStartY = 0;
        var lastTouchX = 0;
        var touchActive = false;

        container.addEventListener('touchstart', function (e) {
            touchStartX = lastTouchX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchActive = true;
        }, { passive: true });

        container.addEventListener('touchmove', function (e) {
            if (!touchActive || isDesktop()) return;

            var currentX = e.touches[0].clientX;
            var currentY = e.touches[0].clientY;
            var dx = Math.abs(touchStartX - currentX);
            var dy = Math.abs(touchStartY - currentY);

            if (dx > dy && dx > 8) {
                e.preventDefault();
                container.scrollLeft += (lastTouchX - currentX);
                lastTouchX = currentX;
            }
        }, { passive: false });

        container.addEventListener('touchend', function () {
            touchActive = false;
        }, { passive: true });
    })();

    // --- Horizontal scroll for dev platform section ---
    (function () {
        var devPlatformScroll = document.getElementById('devPlatformScroll');
        if (!devPlatformScroll) return;

        var touchStartX = 0;
        var touchStartY = 0;
        var isTouching = false;

        function handleTouchStart(e) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isTouching = true;
        }

        function handleTouchMove(e) {
            if (!isTouching) return;

            var touchX = e.touches[0].clientX;
            var touchY = e.touches[0].clientY;
            var deltaX = Math.abs(touchStartX - touchX);
            var deltaY = Math.abs(touchStartY - touchY);

            if (deltaX > deltaY && deltaX > 10) {
                e.preventDefault();
            }
        }

        function handleTouchEnd() {
            isTouching = false;
        }

        devPlatformScroll.addEventListener('touchstart', handleTouchStart, { passive: true });
        devPlatformScroll.addEventListener('touchmove', handleTouchMove, { passive: false });
        devPlatformScroll.addEventListener('touchend', handleTouchEnd, { passive: true });
    })();

})();
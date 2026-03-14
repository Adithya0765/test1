(function () {
    'use strict';

    var root = document.documentElement;
    var themeToggle = document.getElementById('themeToggle');
    var savedTheme = localStorage.getItem('qstudio-theme');

    function setTheme(theme) {
        root.setAttribute('data-theme', theme);
        localStorage.setItem('qstudio-theme', theme);
    }

    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme('light');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var current = root.getAttribute('data-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    var header = document.getElementById('siteHeader');
    function updateHeader(scrollY) {
        if (!header) return;
        if (scrollY > 8) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

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

    var revealTargets = [
        '.hero-content',
        '.section-label',
        '.section-heading',
        '.section-intro',
        '.arch-block',
        '.dev-card',
        '.workflow-card',
        '.research-card',
        '.integration-card',
        '.cta-box'
    ];

    var revealElements = document.querySelectorAll(revealTargets.join(','));
    revealElements.forEach(function (el) {
        el.classList.add('reveal');
    });

    if ('IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                } else {
                    entry.target.classList.remove('visible');
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -60px 0px'
        });

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });
    } else {
        revealElements.forEach(function (el) {
            el.classList.add('visible');
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (event) {
            var targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;

            var target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();
            var headerHeight = header ? header.offsetHeight : 72;
            var targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });

    var navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)[href^="#"]');
    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));

    function setActiveLink(scrollY) {
        var y = scrollY + 120;
        var current = '';

        sections.forEach(function (section) {
            var top = section.offsetTop;
            var height = section.offsetHeight;
            if (y >= top && y < top + height) {
                current = '#' + section.id;
            }
        });

        navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === current);
        });
    }

    var latestScrollY = window.scrollY;
    var scrollTicking = false;

    function runScrollUpdates() {
        updateHeader(latestScrollY);
        setActiveLink(latestScrollY);
        scrollTicking = false;
    }

    function onScroll() {
        latestScrollY = window.scrollY;
        if (!scrollTicking) {
            scrollTicking = true;
            window.requestAnimationFrame(runScrollUpdates);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    runScrollUpdates();

    var modal = document.getElementById('accessModal');
    var accessForm = document.getElementById('accessForm');
    var modalStatus = document.getElementById('modalStatus');

    function openModal() {
        if (!modal) return;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-open-modal="accessModal"]').forEach(function (btn) {
        btn.addEventListener('click', openModal);
    });

    document.querySelectorAll('[data-close-modal="accessModal"]').forEach(function (btn) {
        btn.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modal && modal.classList.contains('open')) {
            closeModal();
        }
    });

    if (accessForm) {
        accessForm.addEventListener('submit', function (event) {
            event.preventDefault();

            var submitBtn = accessForm.querySelector('button[type="submit"]');
            var formData = new FormData(accessForm);
            var name = String(formData.get('name') || '').trim();
            var email = String(formData.get('email') || '').trim().toLowerCase();
            var org = String(formData.get('org') || '').trim();
            var useCase = String(formData.get('useCase') || '').trim();

            var parts = name.split(/\s+/).filter(Boolean);
            var firstName = parts.length ? parts[0] : '';
            var lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'Studio User';

            modalStatus.textContent = 'Submitting your request...';
            modalStatus.classList.remove('is-error', 'is-success');
            modalStatus.classList.add('is-pending');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';
            }

            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    phone: '',
                    company: org,
                    role: 'Qaulium Studio Early Access',
                    useCase: useCase,
                    source: 'qstudio_landing'
                })
            })
                .then(function (response) {
                    return response.json().catch(function () { return {}; }).then(function (data) {
                        return { ok: response.ok, data: data };
                    });
                })
                .then(function (result) {
                    if (!result.ok) {
                        throw new Error(result.data.message || 'Unable to submit your request right now.');
                    }

                    modalStatus.textContent = 'Thanks' + (firstName ? ', ' + firstName : '') + '. Your early access request is confirmed.';
                    modalStatus.classList.remove('is-pending', 'is-error');
                    modalStatus.classList.add('is-success');
                    accessForm.reset();

                    setTimeout(function () {
                        modalStatus.textContent = '';
                        closeModal();
                    }, 1400);
                })
                .catch(function (err) {
                    modalStatus.textContent = err.message || 'Something went wrong. Please try again.';
                    modalStatus.classList.remove('is-pending', 'is-success');
                    modalStatus.classList.add('is-error');
                })
                .finally(function () {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Submit';
                    }
                });
        });
    }
})();

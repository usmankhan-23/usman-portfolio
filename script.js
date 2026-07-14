const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const animatedItems = document.querySelectorAll("[data-animate]");
const typedStatus = document.querySelector("#typed-status");
const skillTabs = document.querySelectorAll("[data-skill-tab]");
const skillPanels = document.querySelectorAll("[data-skill-panel]");
const contactForm = document.querySelector(".contact-form");
const caseLinks = document.querySelectorAll("[data-case-link]");
const caseStudies = document.querySelectorAll("[data-case-study]");
const caseCloseButtons = document.querySelectorAll("[data-case-close]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canUseGsap = Boolean(window.gsap && window.ScrollTrigger && !prefersReducedMotion);

document.body.classList.toggle("has-gsap", canUseGsap);

function runPremiumInteractions() {
    if (prefersReducedMotion) {
        return;
    }

    document.querySelectorAll(".btn").forEach((button) => {
        button.addEventListener("pointermove", (event) => {
            const bounds = button.getBoundingClientRect();
            const x = event.clientX - bounds.left - bounds.width / 2;
            const y = event.clientY - bounds.top - bounds.height / 2;

            button.style.setProperty("--mx", `${x * 0.12}px`);
            button.style.setProperty("--my", `${y * 0.18}px`);
        });

        button.addEventListener("pointerleave", () => {
            button.style.setProperty("--mx", "0px");
            button.style.setProperty("--my", "0px");
        });
    });

    document.querySelectorAll(".project-card, .case-panel, .graph-card").forEach((surface) => {
        surface.addEventListener("pointermove", (event) => {
            const bounds = surface.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width) * 100;
            const y = ((event.clientY - bounds.top) / bounds.height) * 100;

            surface.style.setProperty("--spot-x", `${x.toFixed(2)}%`);
            surface.style.setProperty("--spot-y", `${y.toFixed(2)}%`);
        });

        surface.addEventListener("pointerleave", () => {
            surface.style.setProperty("--spot-x", "50%");
            surface.style.setProperty("--spot-y", "20%");
        });
    });
}

function runActiveNavigation() {
    const navMap = Array.from(navLinks)
        .map((link) => {
            const href = link.getAttribute("href");

            if (!href || !href.startsWith("#")) {
                return null;
            }

            const section = document.getElementById(href.slice(1));
            return section ? { link, section } : null;
        })
        .filter(Boolean);

    if (!navMap.length || !("IntersectionObserver" in window)) {
        return;
    }

    const navObserver = new IntersectionObserver(
        (entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (!visible) {
                return;
            }

            navMap.forEach(({ link, section }) => {
                link.classList.toggle("is-active", section === visible.target);
            });
        },
        {
            rootMargin: "-18% 0px -64% 0px",
            threshold: [0.08, 0.18, 0.32]
        }
    );

    navMap.forEach(({ section }) => navObserver.observe(section));
}

navToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
    });
});

skillTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const activeCategory = tab.dataset.skillTab;

        skillTabs.forEach((item) => {
            const isActive = item === tab;
            item.classList.toggle("is-active", isActive);
            item.setAttribute("aria-selected", String(isActive));
        });

        skillPanels.forEach((panel) => {
            const isActive = panel.dataset.skillPanel === activeCategory;
            panel.classList.toggle("is-active", isActive);
            panel.hidden = !isActive;
        });
    });
});

function openCaseStudy(targetId) {
    const target = document.querySelector(targetId);

    if (!target) {
        return;
    }

    caseStudies.forEach((section) => {
        const isTarget = section === target;
        section.hidden = !isTarget;
        section.classList.toggle("is-open", isTarget);
    });

    const targetItems = target.querySelectorAll("[data-animate]");

    if (canUseGsap) {
        gsap.set(targetItems, { autoAlpha: 0, y: 34 });
        gsap.to(targetItems, {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            ease: "power3.out",
            stagger: 0.08
        });
        ScrollTrigger.refresh();
    } else {
        targetItems.forEach((item) => {
            item.classList.add("is-visible");
        });
    }

    window.setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 20);
}

function closeCaseStudies() {
    caseStudies.forEach((section) => {
        section.hidden = true;
        section.classList.remove("is-open");
    });

    document.querySelector("#projects").scrollIntoView({ behavior: "smooth", block: "start" });
}

caseLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        openCaseStudy(link.getAttribute("href"));
    });
});

caseCloseButtons.forEach((button) => {
    button.addEventListener("click", closeCaseStudies);
});

if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const name = String(formData.get("name")).trim();
        const email = String(formData.get("email")).trim();
        const message = String(formData.get("message")).trim();
        const status = contactForm.querySelector(".form-status");
        const subject = encodeURIComponent(`Portfolio message from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

        window.location.href = `mailto:usmankhan312007@gmail.com?subject=${subject}&body=${body}`;
        status.textContent = "Opening your email app with the message ready to send.";
        contactForm.reset();
    });
}

function runFallbackReveal() {
    if (!("IntersectionObserver" in window)) {
        animatedItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.16
        }
    );

    animatedItems.forEach((item, index) => {
        item.style.transitionDelay = `${index * 80}ms`;
        revealObserver.observe(item);
    });
}

function runGsapMotion() {
    gsap.registerPlugin(ScrollTrigger);

    gsap.set(animatedItems, {
        autoAlpha: 0,
        y: 48
    });

    gsap.to(".scroll-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
            start: "top top",
            end: "bottom bottom",
            scrub: 0.2
        }
    });

    gsap.timeline({ defaults: { ease: "power4.out" } })
        .to(".site-header", { autoAlpha: 1, y: 0, duration: 0.45 })
        .to(".hero .eyebrow", { autoAlpha: 1, y: 0, duration: 0.58 }, "-=0.12")
        .to("#hero-title", { autoAlpha: 1, y: 0, duration: 0.82 }, "-=0.28")
        .to(".hero-text", { autoAlpha: 1, y: 0, duration: 0.62 }, "-=0.34")
        .to(".hero-actions", { autoAlpha: 1, y: 0, duration: 0.54 }, "-=0.32")
        .to(".hero-stats", { autoAlpha: 1, y: 0, duration: 0.54 }, "-=0.28")
        .to(".hero-visual", { autoAlpha: 1, y: 0, duration: 0.72 }, "-=0.46");

    animatedItems.forEach((item) => {
        if (item.closest(".hero") || item.matches(".site-header")) {
            return;
        }

        gsap.to(item, {
            autoAlpha: 1,
            y: 0,
            duration: 0.84,
            ease: "power3.out",
            scrollTrigger: {
                trigger: item,
                start: "top 84%",
                once: true
            }
        });
    });

    gsap.utils.toArray(".stack-showcase article, .skill-card, .project-card, .course-card, .discrete-topic, .calculus-topic, .case-panel, .timeline-placeholder").forEach((card) => {
        card.addEventListener("mouseenter", () => {
            gsap.to(card, {
                y: -8,
                duration: 0.28,
                ease: "power2.out"
            });
        });

        card.addEventListener("mouseleave", () => {
            gsap.to(card, {
                y: 0,
                duration: 0.34,
                ease: "power2.out"
            });
        });
    });

    gsap.to(".flight-console", {
        y: -28,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    gsap.utils.toArray(".project-card").forEach((card, index) => {
        gsap.fromTo(card,
            { clipPath: "inset(0 0 18% 0)" },
            {
                clipPath: "inset(0 0 0% 0)",
                ease: "none",
                scrollTrigger: {
                    trigger: card,
                    start: "top 92%",
                    end: "top 42%",
                    scrub: 0.6
                }
            }
        );

        gsap.to(card.querySelector(".project-index"), {
            rotate: index % 2 === 0 ? 12 : -12,
            ease: "none",
            scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });

    gsap.utils.toArray("[data-flight-card]").forEach((card, index) => {
        gsap.fromTo(card,
            { yPercent: index % 2 === 0 ? 16 : -10 },
            {
                yPercent: 0,
                ease: "none",
                scrollTrigger: {
                    trigger: card,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.8
                }
            }
        );
    });

    const revealCurrentViewport = () => {
        ScrollTrigger.refresh();
        gsap.utils.toArray("[data-animate]").forEach((item) => {
            if (item.closest("[hidden]")) {
                return;
            }

            const rect = item.getBoundingClientRect();

            if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
                gsap.set(item, { autoAlpha: 1, y: 0 });
            }
        });
    };

    window.addEventListener("load", revealCurrentViewport, { once: true });
    window.addEventListener("hashchange", () => {
        window.requestAnimationFrame(revealCurrentViewport);
    });
}

if (canUseGsap) {
    runGsapMotion();
} else {
    runFallbackReveal();
}

runPremiumInteractions();
runActiveNavigation();

if (window.location.hash && document.querySelector(`${window.location.hash}[data-case-study]`)) {
    openCaseStudy(window.location.hash);
}

const statusWords = ["Foundations", "Coursework", "Projects", "Research"];
let wordIndex = 0;
let letterIndex = 0;
let isDeleting = false;

function typeStatus() {
    const currentWord = statusWords[wordIndex];
    const visibleText = currentWord.slice(0, letterIndex);
    typedStatus.textContent = visibleText || " ";

    if (!isDeleting && letterIndex < currentWord.length) {
        letterIndex += 1;
        window.setTimeout(typeStatus, 90);
        return;
    }

    if (!isDeleting && letterIndex === currentWord.length) {
        isDeleting = true;
        window.setTimeout(typeStatus, 950);
        return;
    }

    if (isDeleting && letterIndex > 0) {
        letterIndex -= 1;
        window.setTimeout(typeStatus, 45);
        return;
    }

    isDeleting = false;
    wordIndex = (wordIndex + 1) % statusWords.length;
    window.setTimeout(typeStatus, 220);
}

typeStatus();

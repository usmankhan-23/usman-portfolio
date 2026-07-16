const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const animatedItems = document.querySelectorAll("[data-animate]");
const typedStatus = document.querySelector("#typed-status");
const skillTabs = document.querySelectorAll("[data-skill-tab]");
const skillPanels = document.querySelectorAll("[data-skill-panel]");
const academicTabs = document.querySelectorAll("[data-academic-tab]");
const academicPanels = document.querySelectorAll("[data-academic-panel]");
const contactForm = document.querySelector(".contact-form");
const caseLinks = document.querySelectorAll("[data-case-link]");
const caseStudies = document.querySelectorAll("[data-case-study]");
const caseCloseButtons = document.querySelectorAll("[data-case-close]");
const flightLogRoute = document.querySelector("[data-flight-card]");
const flightLogEntries = document.querySelectorAll("[data-flight-log-entry]");
const flightLogTriggers = document.querySelectorAll(".flight-log-trigger");
const flightLogStorageKey = "usmanFlightLogChapter";
const academicStorageKey = "usmanAcademicCategory";
const flightLogChapterCount = flightLogEntries.length || 9;
const flightLogChapterMeta = {
    1: {
        context: "launch",
        actions: [{ label: "Review Launch Point", target: "#home" }]
    },
    2: {
        context: "programming-fundamentals",
        actions: [{ label: "Open Coursework", target: "#coursework" }]
    },
    3: {
        context: "mathematical-thinking",
        actions: [
            { label: "Discrete Structure", target: "#discrete" },
            { label: "Calculus Project", target: "#calculus" }
        ]
    },
    4: {
        context: "software-architecture",
        actions: [{ label: "Review Concepts", target: "#skills" }]
    },
    5: {
        context: "mission-archive",
        actions: [
            { label: "Open Mission Archive", target: "#projects" },
            { label: "QuizMaster Case Study", target: "#quizmaster-case-study" },
            { label: "Tumble Pop Case Study", target: "#tumble-pop-case-study" }
        ]
    },
    6: {
        context: "interactive-portfolio",
        actions: [{ label: "Inspect Skill Stack", target: "#skills" }]
    },
    7: {
        context: "communication",
        actions: [{ label: "Start a Conversation", target: "#contact" }]
    },
    8: {
        context: "current-stack",
        actions: [{ label: "View Current Skills", target: "#skills" }]
    },
    9: {
        context: "next-destination",
        actions: [{ label: "Contact Muhammad", target: "#contact" }]
    }
};
const journeyIntro = document.querySelector("[data-journey-intro]");
const beginJourneyButton = document.querySelector("[data-begin-journey]");
const skipIntroButton = document.querySelector("[data-skip-intro]");
const pageShell = document.querySelector(".page-shell");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canUseGsap = Boolean(window.gsap && window.ScrollTrigger && !prefersReducedMotion);
const introStorageKey = "usmanJourneyIntroComplete";
const urlParams = new URLSearchParams(window.location.search);
const shouldReplayIntro = urlParams.get("replayIntro") === "1";
const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;
const motionTokens = {
    duration: {
        instant: 0.18,
        fast: 0.32,
        normal: 0.54,
        slow: 0.82,
        cinematic: 1.34
    },
    ease: {
        enter: "power3.out",
        exit: "power2.in",
        move: "power3.inOut",
        soft: "sine.inOut"
    },
    distance: {
        small: 10,
        normal: 22,
        large: 36
    },
    stagger: {
        tight: 0.045,
        normal: 0.07
    }
};
const heroRevealSelectors = [
    ".site-header",
    ".hero .eyebrow",
    "#hero-title",
    ".hero-text",
    ".hero-actions",
    ".hero-stats",
    ".hero-visual"
];
let shouldRunJourneyIntro = false;
let heroRevealComplete = false;
let isAircraftReadyForIntro = false;
let introStarted = false;
let introCompleting = false;
let introCompleted = false;
let introTimeline = null;
let introRevealTimeline = null;
let heroRevealTimeline = null;
let introSkipFinishTimer = null;
let caseStudyTimeline = null;
let skillPanelTimeline = null;
let previousFocusedElement = null;
const flightLogState = {
    activeChapter: 1,
    expandedChapter: 1,
    lastTimelineChapter: 1,
    relatedMission: flightLogChapterMeta[1]?.context ?? null,
    isTimelineInView: false
};

document.body.classList.toggle("has-gsap", canUseGsap);

try {
    shouldRunJourneyIntro = Boolean(
        journeyIntro &&
        (shouldReplayIntro || (sessionStorage.getItem(introStorageKey) !== "true" && !window.location.hash))
    );
} catch (error) {
    shouldRunJourneyIntro = Boolean(journeyIntro && (shouldReplayIntro || !window.location.hash));
}

function runPremiumInteractions() {
    if (prefersReducedMotion || !supportsFinePointer) {
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

function selectSkillTab(activeTab) {
    const activeCategory = activeTab.dataset.skillTab;
    const nextPanel = Array.from(skillPanels).find((panel) => panel.dataset.skillPanel === activeCategory);

    if (!nextPanel) {
        return;
    }

    skillPanelTimeline?.kill();
    skillPanelTimeline = null;
    window.gsap?.killTweensOf?.(skillPanels);

    skillTabs.forEach((item) => {
        const isActive = item === activeTab;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
    });

    skillPanels.forEach((panel) => {
        const isActive = panel === nextPanel;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
    });

    if (!canUseGsap) {
        return;
    }

    skillPanelTimeline = gsap.timeline({
        defaults: {
            ease: motionTokens.ease.enter,
            overwrite: true
        },
        onComplete: () => {
            nextPanel.style.transform = "";
            skillPanelTimeline = null;
        }
    });
    skillPanelTimeline.fromTo(nextPanel,
        { autoAlpha: 0, y: motionTokens.distance.small, scale: 0.996 },
        {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: motionTokens.duration.normal
        }
    );
}

skillTabs.forEach((tab) => {
    tab.addEventListener("click", () => selectSkillTab(tab));
    tab.addEventListener("keydown", (event) => {
        const tabList = Array.from(skillTabs);
        const currentIndex = tabList.indexOf(tab);
        const keyOffset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

        if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            const nextTab = event.key === "Home" ? tabList[0] : tabList[tabList.length - 1];
            nextTab.focus();
            selectSkillTab(nextTab);
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            const activeTab = tabList.find((item) => item.getAttribute("aria-selected") === "true") || tab;
            activeTab.focus({ preventScroll: true });
            return;
        }

        if (!keyOffset) {
            return;
        }

        event.preventDefault();
        const nextIndex = (currentIndex + keyOffset + skillTabs.length) % skillTabs.length;
        const nextTab = tabList[nextIndex];
        nextTab.focus();
        selectSkillTab(nextTab);
    });
});

function selectAcademicCategory(activeTab, options = {}) {
    const activeCategory = activeTab.dataset.academicTab;
    const nextPanel = Array.from(academicPanels).find((panel) => panel.dataset.academicPanel === activeCategory);

    if (!nextPanel) {
        return;
    }

    academicTabs.forEach((item) => {
        const isActive = item === activeTab;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
    });

    academicPanels.forEach((panel) => {
        const isActive = panel === nextPanel;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
    });

    try {
        sessionStorage.setItem(academicStorageKey, activeCategory);
    } catch (error) {
        // Session storage can be unavailable in restricted browser modes.
    }

    if (options.updateHash && nextPanel.id && window.location.hash !== `#${nextPanel.id}`) {
        history.pushState(null, "", `#${nextPanel.id}`);
    }
}

function getAcademicTabFromHash(hash = window.location.hash) {
    if (!hash) {
        return null;
    }

    const panelId = hash.slice(1);
    const panel = Array.from(academicPanels).find((item) => item.id === panelId);

    if (!panel) {
        return null;
    }

    return Array.from(academicTabs).find((tab) => tab.dataset.academicTab === panel.dataset.academicPanel) || null;
}

function restoreAcademicCategory() {
    const hashTab = getAcademicTabFromHash();

    if (hashTab) {
        selectAcademicCategory(hashTab);
        return;
    }

    try {
        const storedCategory = sessionStorage.getItem(academicStorageKey);
        const storedTab = Array.from(academicTabs).find((tab) => tab.dataset.academicTab === storedCategory);

        if (storedTab) {
            selectAcademicCategory(storedTab);
        }
    } catch (error) {
        return;
    }
}

academicTabs.forEach((tab) => {
    tab.addEventListener("click", () => selectAcademicCategory(tab, { updateHash: true }));
    tab.addEventListener("keydown", (event) => {
        const tabList = Array.from(academicTabs);
        const currentIndex = tabList.indexOf(tab);
        const keyOffset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

        if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            const nextTab = event.key === "Home" ? tabList[0] : tabList[tabList.length - 1];
            nextTab.focus();
            selectAcademicCategory(nextTab, { updateHash: true });
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            const activeTab = tabList.find((item) => item.getAttribute("aria-selected") === "true") || tab;
            activeTab.focus({ preventScroll: true });
            return;
        }

        if (!keyOffset) {
            return;
        }

        event.preventDefault();
        const nextIndex = (currentIndex + keyOffset + academicTabs.length) % academicTabs.length;
        const nextTab = tabList[nextIndex];
        nextTab.focus();
        selectAcademicCategory(nextTab, { updateHash: true });
    });
});

restoreAcademicCategory();
window.addEventListener("hashchange", restoreAcademicCategory);

function getFlightLogEntryByIndex(index) {
    return Array.from(flightLogEntries).find((entry) => Number(entry.dataset.flightLogIndex) === Number(index));
}

function getFlightLogChapterFromHash(hash = window.location.hash) {
    const match = /^#flight-log-(\d+)$/.exec(hash || "");
    const chapter = match ? Number(match[1]) : null;

    return chapter >= 1 && chapter <= flightLogChapterCount ? chapter : null;
}

function getStoredFlightLogChapter() {
    try {
        const storedChapter = Number(sessionStorage.getItem(flightLogStorageKey));

        if (storedChapter >= 1 && storedChapter <= flightLogChapterCount) {
            return storedChapter;
        }
    } catch (error) {
        return null;
    }

    return null;
}

function storeFlightLogChapter(index) {
    try {
        sessionStorage.setItem(flightLogStorageKey, String(index));
    } catch (error) {
        // Session storage is optional; the Flight Log remains fully usable without it.
    }
}

function setFlightLogRouteProgress(options = {}) {
    if (!flightLogRoute) {
        return;
    }

    const rect = flightLogRoute.getBoundingClientRect();
    const viewportPoint = window.innerHeight * 0.58;
    const travel = rect.height + window.innerHeight * 0.22;
    const scrollProgress = Math.max(0, Math.min(1, (viewportPoint - rect.top) / travel));
    const chapterProgress = flightLogChapterCount > 1
        ? (flightLogState.activeChapter - 1) / (flightLogChapterCount - 1)
        : 0;
    const progress = options.scrollOnly ? scrollProgress : Math.max(scrollProgress, chapterProgress);

    flightLogRoute.style.setProperty("--flight-log-progress", `${(progress * 100).toFixed(1)}%`);
    flightLogRoute.dataset.activeChapter = String(flightLogState.activeChapter);
    flightLogRoute.dataset.relatedMission = flightLogState.relatedMission || "";
}

function setFlightLogHistoryState(index, mode = "replace") {
    if (window.location.hash !== "#timeline" && !getFlightLogChapterFromHash()) {
        return;
    }

    const nextState = {
        ...(window.history.state || {}),
        section: "timeline",
        flightLogChapter: index
    };

    const nextHash = `#flight-log-${index}`;

    if (mode === "push" && window.location.hash !== nextHash) {
        window.history.pushState(nextState, "", nextHash);
        return;
    }

    window.history.replaceState(nextState, "", nextHash);
}

function dispatchFlightLogChapter(index, source = "interaction") {
    window.dispatchEvent(new CustomEvent("flight-log:chapter", {
        detail: {
            index,
            source,
            context: flightLogState.relatedMission,
            inTimeline: flightLogState.isTimelineInView
        }
    }));
}

function activateFlightLog(entry, options = {}) {
    if (!entry) {
        return;
    }

    const selectedIndex = Number(entry.dataset.flightLogIndex || 1);
    const chapterMeta = flightLogChapterMeta[selectedIndex] || {};

    flightLogState.activeChapter = selectedIndex;
    flightLogState.expandedChapter = selectedIndex;
    flightLogState.lastTimelineChapter = selectedIndex;
    flightLogState.relatedMission = chapterMeta.context || null;

    flightLogEntries.forEach((item) => {
        const isSelected = item === entry;
        const itemIndex = Number(item.dataset.flightLogIndex || 1);
        const trigger = item.querySelector(".flight-log-trigger");
        const panel = item.querySelector(".flight-log-panel");

        item.classList.toggle("is-expanded", isSelected);
        item.classList.toggle("is-complete", itemIndex < selectedIndex);
        item.classList.toggle("is-future", itemIndex > selectedIndex);
        item.toggleAttribute("data-current-flight-log", isSelected);
        trigger?.setAttribute("aria-expanded", String(isSelected));
        trigger?.setAttribute("aria-current", isSelected ? "step" : "false");

        if (panel) {
            panel.hidden = !isSelected;
        }
    });

    if (options.persist !== false) {
        storeFlightLogChapter(selectedIndex);
    }

    if (options.syncHistory !== false) {
        const historyMode = options.historyMode || (options.source ? "replace" : "push");
        setFlightLogHistoryState(selectedIndex, historyMode);
    }

    setFlightLogRouteProgress();
    dispatchFlightLogChapter(selectedIndex, options.source || "interaction");

    if (window.location.hash === "#timeline" || getFlightLogChapterFromHash()) {
        window.dispatchEvent(new CustomEvent("journey:hash-restored", {
            detail: { hash: "#timeline" }
        }));
    }

    if (options.focus) {
        entry.querySelector(".flight-log-trigger")?.focus({ preventScroll: true });
    }
}

function collapseFlightLog() {
    flightLogEntries.forEach((entry) => {
        const trigger = entry.querySelector(".flight-log-trigger");
        const panel = entry.querySelector(".flight-log-panel");

        entry.classList.remove("is-expanded");
        entry.removeAttribute("data-current-flight-log");
        trigger?.setAttribute("aria-expanded", "false");

        if (panel) {
            panel.hidden = true;
        }
    });

    flightLogState.expandedChapter = null;
    setFlightLogRouteProgress();
}

function createFlightLogActions(entry) {
    const index = Number(entry.dataset.flightLogIndex || 1);
    const meta = flightLogChapterMeta[index];
    const panel = entry.querySelector(".flight-log-panel");

    if (!panel || !meta?.actions?.length || panel.querySelector(".flight-log-actions")) {
        return;
    }

    const actionGroup = document.createElement("div");
    actionGroup.className = "flight-log-actions";
    actionGroup.setAttribute("aria-label", `Related destinations for Flight Log ${String(index).padStart(3, "0")}`);

    meta.actions.forEach((action) => {
        if (action.target === "#projects" && panel.querySelector(".flight-log-mission-link")) {
            return;
        }

        const link = document.createElement("a");
        link.className = "flight-log-action";
        link.href = action.target;
        link.dataset.flightLogTarget = action.target;
        link.textContent = action.label;
        actionGroup.append(link);
    });

    panel.append(actionGroup);
}

function scrollToFlightLogChapter(index, options = {}) {
    const entry = getFlightLogEntryByIndex(index);
    const timeline = document.querySelector("#timeline");
    const headerOffset = document.querySelector(".site-header")?.offsetHeight ?? 0;
    const target = entry || timeline;

    if (!target) {
        return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset - 18;
    window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReducedMotion || options.immediate ? "auto" : "smooth"
    });
}

function scheduleFlightLogChapterScroll(index, options = {}) {
    scrollToFlightLogChapter(index, options);
    window.requestAnimationFrame(() => scrollToFlightLogChapter(index, { immediate: true }));

    [160, 420, 900, 1600, 2400].forEach((delay) => {
        window.setTimeout(() => scrollToFlightLogChapter(index, { immediate: true }), delay);
    });
}

function restoreFlightLogContext(options = {}) {
    const hashChapter = getFlightLogChapterFromHash();
    const historyChapter = Number(window.history.state?.flightLogChapter);
    const storedChapter = getStoredFlightLogChapter();
    const chapter = hashChapter || historyChapter || storedChapter || flightLogState.lastTimelineChapter || 1;
    const entry = getFlightLogEntryByIndex(chapter);

    if (!entry) {
        return;
    }

    activateFlightLog(entry, {
        focus: Boolean(options.focus),
        persist: true,
        source: options.source || "restore",
        syncHistory: window.location.hash === "#timeline"
    });

    if (options.scroll) {
        scheduleFlightLogChapterScroll(chapter, { immediate: options.immediate });
    }
}

function navigateFromFlightLog(targetHash, options = {}) {
    if (!targetHash || !targetHash.startsWith("#")) {
        return;
    }

    const target = document.querySelector(targetHash);
    const activeChapter = flightLogState.activeChapter;

    if (!target) {
        return;
    }

    storeFlightLogChapter(activeChapter);

    if (target.matches("[data-case-study]")) {
        window.history.replaceState({
            ...(window.history.state || {}),
            section: "timeline",
            flightLogChapter: activeChapter
        }, "", `#flight-log-${activeChapter}`);
        openCaseStudy(targetHash);
        return;
    }

    const headerOffset = document.querySelector(".site-header")?.offsetHeight ?? 0;
    window.history.pushState({
        section: targetHash.slice(1),
        fromFlightLogChapter: activeChapter
    }, "", targetHash);
    window.scrollTo({
        top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset - 16),
        behavior: prefersReducedMotion || options.immediate ? "auto" : "smooth"
    });
    window.dispatchEvent(new CustomEvent("journey:hash-restored", {
        detail: { hash: targetHash }
    }));
}

function setupFlightLog() {
    if (!flightLogEntries.length) {
        return;
    }

    flightLogEntries.forEach((entry) => {
        const index = Number(entry.dataset.flightLogIndex || 1);

        if (!entry.id) {
            entry.id = `flight-log-${index}`;
        }

        createFlightLogActions(entry);
    });
    restoreFlightLogContext({
        source: "initial",
        scroll: window.location.hash === "#timeline",
        immediate: true
    });
    setFlightLogRouteProgress();

    flightLogTriggers.forEach((trigger, index) => {
        trigger.addEventListener("click", () => {
            const entry = trigger.closest("[data-flight-log-entry]");
            const isExpanded = trigger.getAttribute("aria-expanded") === "true";

            if (isExpanded) {
                return;
            }

            activateFlightLog(entry);
        });

        trigger.addEventListener("keydown", (event) => {
            const keyMap = {
                ArrowDown: 1,
                ArrowRight: 1,
                ArrowUp: -1,
                ArrowLeft: -1
            };

            if (event.key === "Escape") {
                event.preventDefault();
                collapseFlightLog();
                trigger.focus({ preventScroll: true });
                return;
            }

            if (event.key === "Home") {
                event.preventDefault();
                activateFlightLog(flightLogEntries[0], { focus: true });
                return;
            }

            if (event.key === "End") {
                event.preventDefault();
                activateFlightLog(flightLogEntries[flightLogEntries.length - 1], { focus: true });
                return;
            }

            const offset = keyMap[event.key];

            if (!offset) {
                return;
            }

            event.preventDefault();
            const nextIndex = (index + offset + flightLogEntries.length) % flightLogEntries.length;
            activateFlightLog(flightLogEntries[nextIndex], { focus: true });
        });
    });

    document.querySelector(".flight-log-mission-link")?.addEventListener("click", (event) => {
        event.preventDefault();
        navigateFromFlightLog("#projects");
    });

    flightLogRoute?.addEventListener("click", (event) => {
        const link = event.target.closest("[data-flight-log-target]");

        if (!link || link.classList.contains("flight-log-mission-link")) {
            return;
        }

        event.preventDefault();
        navigateFromFlightLog(link.dataset.flightLogTarget);
    });

    let routeProgressFrame = null;
    const requestRouteProgress = () => {
        if (routeProgressFrame !== null) {
            return;
        }

        routeProgressFrame = window.requestAnimationFrame(() => {
            routeProgressFrame = null;
            setFlightLogRouteProgress();
        });
    };

    window.addEventListener("scroll", requestRouteProgress, { passive: true });
    window.addEventListener("resize", requestRouteProgress, { passive: true });
    window.addEventListener("popstate", () => {
        if (window.location.hash === "#timeline" || getFlightLogChapterFromHash() || window.history.state?.flightLogChapter) {
            restoreFlightLogContext({
                source: "popstate",
                scroll: window.location.hash === "#timeline" || Boolean(getFlightLogChapterFromHash()),
                immediate: true
            });
        }
    });

    if ("IntersectionObserver" in window) {
        const timeline = document.querySelector("#timeline");

        if (timeline) {
            const observer = new IntersectionObserver(
                (entries) => {
                    const isVisible = entries.some((entry) => entry.isIntersecting);
                    flightLogState.isTimelineInView = isVisible;

                    if (isVisible) {
                        restoreFlightLogContext({ source: "timeline-return" });
                    }
                },
                {
                    rootMargin: "-24% 0px -46% 0px",
                    threshold: 0.08
                }
            );

            observer.observe(timeline);
        }
    }
}

function isCaseStudyHash(hash = window.location.hash) {
    return Boolean(hash && document.querySelector(`${hash}[data-case-study]`));
}

function setCaseStudyUrl(hash) {
    if (!hash || window.location.hash === hash) {
        return;
    }

    window.history.pushState({ caseStudy: hash }, "", hash);
}

function clearCaseStudyUrl() {
    if (!isCaseStudyHash()) {
        return;
    }

    const cleanUrl = `${window.location.pathname}${window.location.search}#projects`;
    window.history.pushState({ section: "projects" }, "", cleanUrl);
}

function openCaseStudy(targetId, options = {}) {
    const target = document.querySelector(targetId);

    if (!target) {
        return;
    }

    if (options.updateHistory !== false) {
        setCaseStudyUrl(targetId);
    }

    previousFocusedElement = document.activeElement;
    caseStudyTimeline?.kill();
    window.gsap?.killTweensOf?.(caseStudies);

    caseStudies.forEach((section) => {
        const isTarget = section === target;
        section.hidden = !isTarget;
        section.classList.toggle("is-open", isTarget);
    });

    const targetItems = target.querySelectorAll("[data-animate]");

    if (canUseGsap) {
        gsap.set(target, { autoAlpha: 0, y: motionTokens.distance.small });
        gsap.set(targetItems, { autoAlpha: 0, y: motionTokens.distance.normal });
        caseStudyTimeline = gsap.timeline({
            defaults: {
                ease: motionTokens.ease.enter,
                overwrite: true
            },
            onComplete: () => {
                caseStudyTimeline = null;
                ScrollTrigger.refresh();
            }
        });
        caseStudyTimeline
            .to(target, {
                autoAlpha: 1,
                y: 0,
                duration: motionTokens.duration.fast
            })
            .to(targetItems, {
                autoAlpha: 1,
                y: 0,
                duration: motionTokens.duration.normal,
                stagger: motionTokens.stagger.tight
            }, "-=0.1");
    } else {
        targetItems.forEach((item) => {
            item.classList.add("is-visible");
        });
    }

    window.setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.querySelector("[data-case-close]")?.focus({ preventScroll: true });
    }, 20);
}

function closeCaseStudies(options = {}) {
    caseStudyTimeline?.kill();
    caseStudyTimeline = null;

    caseStudies.forEach((section) => {
        section.hidden = true;
        section.classList.remove("is-open");
    });

    if (options.updateHistory !== false) {
        clearCaseStudyUrl();
    }

    const restoreProjectsStage = () => {
        window.dispatchEvent(new CustomEvent("journey:hash-restored", {
            detail: { hash: "#projects" }
        }));
    };
    const scrollToProjects = (behavior = "smooth") => {
        const projects = document.querySelector("#projects");
        const headerOffset = document.querySelector(".site-header")?.offsetHeight ?? 0;

        if (!projects) {
            return;
        }

        window.scrollTo({
            top: Math.max(0, projects.getBoundingClientRect().top + window.scrollY - headerOffset - 16),
            behavior: prefersReducedMotion ? "auto" : behavior
        });
    };

    scrollToProjects();
    previousFocusedElement?.focus?.({ preventScroll: true });
    previousFocusedElement = null;
    window.ScrollTrigger?.refresh?.();
    restoreProjectsStage();
    window.requestAnimationFrame(() => scrollToProjects("auto"));
    window.setTimeout(restoreProjectsStage, 120);
    window.setTimeout(() => scrollToProjects("auto"), 180);
    window.setTimeout(restoreProjectsStage, 520);
}

function handleCaseStudyKeydown(event) {
    if (event.key !== "Escape") {
        return;
    }

    const openCaseStudySection = Array.from(caseStudies).find((section) => !section.hidden);

    if (openCaseStudySection) {
        event.preventDefault();
        closeCaseStudies();
    }
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

document.addEventListener("keydown", handleCaseStudyKeydown);

window.addEventListener("popstate", () => {
    if (isCaseStudyHash()) {
        openCaseStudy(window.location.hash, { updateHistory: false });
        return;
    }

    const openCaseStudySection = Array.from(caseStudies).find((section) => !section.hidden);

    if (openCaseStudySection) {
        closeCaseStudies({ updateHistory: false });
    }

    restoreHashNavigation();
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

    animatedItems.forEach((item) => {
        revealObserver.observe(item);
    });
}

function revealHeroContent(options = {}) {
    if (heroRevealComplete && !options.immediate) {
        return;
    }

    if (options.immediate) {
        heroRevealTimeline?.kill();
        heroRevealTimeline = null;
    }

    heroRevealComplete = true;
    [".hero-copy", ".flight-chapters"].forEach((selector) => {
        document.querySelectorAll(selector).forEach((item) => {
            item.style.opacity = "1";
            item.style.visibility = "visible";
        });
    });

    if (!canUseGsap || options.immediate) {
        heroRevealSelectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((item) => {
                item.classList.add("is-visible");
                item.style.opacity = "1";
                item.style.visibility = "visible";
                item.style.transform = "translateY(0)";
            });
        });
        return;
    }

    const heroItems = heroRevealSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    heroRevealTimeline?.kill();
    heroRevealTimeline = gsap.timeline({
        defaults: {
            ease: motionTokens.ease.enter,
            overwrite: true
        }
    });

    heroRevealTimeline
        .to(".site-header", {
            autoAlpha: 1,
            y: 0,
            duration: motionTokens.duration.fast
        }, 0)
        .to(".hero .eyebrow", {
            autoAlpha: 1,
            y: 0,
            duration: motionTokens.duration.normal
        }, 0.08)
        .to("#hero-title", {
            autoAlpha: 1,
            y: 0,
            duration: motionTokens.duration.slow
        }, 0.16)
        .to(".hero-text", {
            autoAlpha: 1,
            y: 0,
            duration: motionTokens.duration.normal
        }, 0.32)
        .to(".hero-actions", {
            autoAlpha: 1,
            y: 0,
            duration: motionTokens.duration.normal
        }, 0.44)
        .to(".hero-stats", {
            autoAlpha: 1,
            y: 0,
            duration: motionTokens.duration.normal
        }, 0.54)
        .to(".hero-visual", {
            autoAlpha: 1,
            y: 0,
            duration: motionTokens.duration.slow
        }, 0.38)
        .eventCallback("onComplete", () => {
            heroItems.forEach((item) => item.classList.add("is-visible"));
            heroRevealTimeline = null;
        });
}

function runGsapMotion() {
    gsap.registerPlugin(ScrollTrigger);

    gsap.set(animatedItems, {
        autoAlpha: 0,
        y: motionTokens.distance.normal
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

    animatedItems.forEach((item) => {
        if (item.closest(".hero") || item.matches(".site-header")) {
            return;
        }

        gsap.to(item, {
            autoAlpha: 1,
            y: 0,
            duration: motionTokens.duration.normal,
            ease: motionTokens.ease.enter,
            overwrite: "auto",
            scrollTrigger: {
                trigger: item,
                start: "top 88%",
                once: true
            }
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

function markIntroComplete() {
    try {
        sessionStorage.setItem(introStorageKey, "true");
    } catch (error) {
        // Session storage may be unavailable in strict browser modes.
    }

    document.documentElement.classList.remove("journey-intro-pending");
    document.documentElement.classList.add("journey-intro-seen");
}

function getIntroFocusableElements() {
    if (!journeyIntro || journeyIntro.hidden) {
        return [];
    }

    return Array.from(journeyIntro.querySelectorAll("button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
        .filter((element) => !element.hidden && element.offsetParent !== null);
}

function setBackgroundInert(isInert) {
    if (!pageShell) {
        return;
    }

    if ("inert" in pageShell) {
        pageShell.inert = isInert;
    }

    pageShell.setAttribute("aria-hidden", String(isInert));
}

function handleIntroKeydown(event) {
    if (event.key === "Escape") {
        skipJourneyIntro();
        return;
    }

    if (event.key !== "Tab") {
        return;
    }

    const focusable = getIntroFocusableElements();

    if (!focusable.length) {
        event.preventDefault();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function cleanupIntroAccessibility() {
    journeyIntro?.removeEventListener("keydown", handleIntroKeydown);
    document.removeEventListener("keydown", handleIntroKeydown);
    setBackgroundInert(false);
}

function restoreHashNavigation() {
    if (!window.location.hash || window.location.hash === "#home") {
        return;
    }

    const flightLogChapter = getFlightLogChapterFromHash();
    const hashTarget = flightLogChapter
        ? getFlightLogEntryByIndex(flightLogChapter)
        : document.querySelector(window.location.hash);
    const stageHash = flightLogChapter ? "#timeline" : window.location.hash;

    if (!hashTarget) {
        return;
    }

    const scrollToHashTarget = () => {
        const headerOffset = document.querySelector(".site-header")?.offsetHeight ?? 0;
        const targetTop = hashTarget.getBoundingClientRect().top + window.scrollY - headerOffset - 16;
        window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: "auto"
        });
        window.ScrollTrigger?.refresh?.();
        window.ScrollTrigger?.update?.();
        window.dispatchEvent(new Event("scroll"));

        if (flightLogChapter) {
            restoreFlightLogContext({
                source: "hash",
                scroll: false,
                immediate: true
            });
        }

        window.dispatchEvent(new CustomEvent("journey:hash-restored", {
            detail: { hash: stageHash }
        }));
    };

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(scrollToHashTarget);
    });

    [180, 520, 900, 1500].forEach((delay) => {
        window.setTimeout(scrollToHashTarget, delay);
    });
}

function setIntroAircraftReady(options = {}) {
    if (!shouldRunJourneyIntro || introCompleted || !beginJourneyButton) {
        return;
    }

    isAircraftReadyForIntro = true;
    beginJourneyButton.disabled = false;
    beginJourneyButton.textContent = options.failed ? "Continue" : "Initialize Flight";
    beginJourneyButton.dataset.ready = options.failed ? "fallback" : "true";
    beginJourneyButton.focus({ preventScroll: true });
}

function finishJourneyIntro(options = {}) {
    if (introSkipFinishTimer) {
        window.clearTimeout(introSkipFinishTimer);
        introSkipFinishTimer = null;
    }

    introCompleted = true;
    introCompleting = false;
    cleanupIntroAccessibility();

    if (journeyIntro) {
        journeyIntro.hidden = true;
        journeyIntro.style.opacity = "";
        journeyIntro.style.visibility = "";
        journeyIntro.style.transform = "";
    }

    document.body.classList.remove("journey-intro-active");
    revealHeroContent({ immediate: Boolean(options.immediate) || prefersReducedMotion });
    document.querySelector("#hero-title")?.focus({ preventScroll: true });
    window.ScrollTrigger?.refresh?.();
    restoreHashNavigation();
}

function skipJourneyIntro() {
    if (introCompleted) {
        return;
    }

    introCompleting = true;
    introStarted = true;
    beginJourneyButton?.setAttribute("disabled", "");
    skipIntroButton?.setAttribute("disabled", "");
    introTimeline?.kill();
    introRevealTimeline?.kill();
    heroRevealTimeline?.kill();
    introTimeline = null;
    introRevealTimeline = null;
    heroRevealTimeline = null;
    cleanupIntroAccessibility();

    if (!journeyIntro || journeyIntro.hidden) {
        finishJourneyIntro({ immediate: true });
        return;
    }

    markIntroComplete();
    window.dispatchEvent(new CustomEvent("journey:intro-skip", {
        detail: { immediate: true }
    }));
    revealHeroContent({ immediate: true });

    if (!canUseGsap) {
        finishJourneyIntro({ immediate: true });
        return;
    }

    introTimeline = gsap.timeline({
        defaults: { ease: motionTokens.ease.enter, overwrite: true },
        onComplete: () => finishJourneyIntro({ immediate: true })
    })
        .set(".journey-intro__content > *", { clearProps: "transform" }, 0)
        .to(".journey-intro__content", {
            autoAlpha: 0,
            y: -6,
            duration: 0.2
        }, 0)
        .to(".journey-intro", {
            autoAlpha: 0,
            duration: 0.26
        }, 0.02);

    introSkipFinishTimer = window.setTimeout(() => {
        finishJourneyIntro({ immediate: true });
    }, 420);
}

function completeJourneyIntro() {
    if (introCompleted || introCompleting) {
        return;
    }

    introCompleting = true;
    introTimeline?.kill();
    introRevealTimeline?.kill();
    heroRevealTimeline?.kill();
    introTimeline = null;
    introRevealTimeline = null;
    heroRevealTimeline = null;

    if (!journeyIntro || journeyIntro.hidden) {
        finishJourneyIntro({ immediate: prefersReducedMotion });
        return;
    }

    markIntroComplete();
    window.dispatchEvent(new CustomEvent("journey:intro-complete", {
        detail: { skipped: false }
    }));

    if (!canUseGsap || prefersReducedMotion) {
        finishJourneyIntro({ immediate: true });
        return;
    }

    const compactIntro = window.matchMedia("(max-width: 768px)").matches;
    const beginTiming = compactIntro
        ? {
            statusFadeAt: 0.72,
            heroRevealAt: 1.05,
            overlayStart: 0.08,
            overlayRevealDuration: 0.56,
            overlayFinishDuration: 1.85,
            firstOverlayOpacity: 0.64
        }
        : {
            statusFadeAt: 1.08,
            heroRevealAt: 1.35,
            overlayStart: 0.12,
            overlayRevealDuration: 0.85,
            overlayFinishDuration: 3.05,
            firstOverlayOpacity: 0.64
        };

    introTimeline = gsap.timeline({
        defaults: { ease: motionTokens.ease.move, overwrite: true },
        onComplete: () => finishJourneyIntro({ immediate: false })
    })
        .set("[data-begin-journey]", {
            display: "none"
        }, 0)
        .call(() => {
            const status = journeyIntro?.querySelector(".journey-intro__subtitle");

            if (status) {
                status.textContent = "Departure sequence initiated";
            }
        }, null, 0)
        .to(".journey-intro__eyebrow, .journey-intro__title, .journey-intro__manifest", {
            autoAlpha: 0,
            y: -motionTokens.distance.small,
            duration: compactIntro ? 0.48 : 0.64
        }, 0)
        .to(".journey-intro__subtitle", {
            autoAlpha: 0,
            y: -6,
            duration: 0.42
        }, beginTiming.statusFadeAt)
        .to(".journey-intro", {
            keyframes: [
                {
                    autoAlpha: beginTiming.firstOverlayOpacity,
                    duration: beginTiming.overlayRevealDuration,
                    ease: "sine.out"
                },
                {
                    autoAlpha: 0,
                    duration: beginTiming.overlayFinishDuration,
                    ease: "sine.inOut"
                }
            ]
        }, beginTiming.overlayStart)
        .call(() => {
            revealHeroContent();
        }, null, beginTiming.heroRevealAt);
}

function setupJourneyIntro() {
    if (!journeyIntro) {
        revealHeroContent({ immediate: !canUseGsap });
        return;
    }

    if (!shouldRunJourneyIntro) {
        journeyIntro.hidden = true;
        document.body.classList.remove("journey-intro-active");
        cleanupIntroAccessibility();
        window.dispatchEvent(new CustomEvent("journey:intro-skip"));
        revealHeroContent({ immediate: true });
        restoreHashNavigation();
        return;
    }

    previousFocusedElement = document.activeElement;
    journeyIntro.hidden = false;
    beginJourneyButton.disabled = true;
    beginJourneyButton.textContent = "Preparing Flight";
    document.body.classList.add("journey-intro-active");
    setBackgroundInert(true);
    journeyIntro.addEventListener("keydown", handleIntroKeydown);
    document.addEventListener("keydown", handleIntroKeydown);
    window.dispatchEvent(new CustomEvent("journey:intro-ready"));
    window.requestAnimationFrame(() => skipIntroButton?.focus({ preventScroll: true }));

    if (canUseGsap) {
        gsap.set(".journey-intro__content > *", { y: motionTokens.distance.small });
        gsap.set(".journey-intro__manifest span", { autoAlpha: 0, x: -10 });
        gsap.set(".journey-intro__atmosphere", { autoAlpha: 0.28, scale: 1.08 });
        introRevealTimeline = gsap.timeline({ defaults: { ease: "power3.out" } })
            .to(".journey-intro__atmosphere", { autoAlpha: 0.62, scale: 1, duration: motionTokens.duration.cinematic })
            .to(".journey-intro__content > *", {
                y: 0,
                duration: motionTokens.duration.normal,
                stagger: motionTokens.stagger.normal
            }, "-=0.86")
            .to(".journey-intro__manifest span", {
                autoAlpha: 1,
                x: 0,
                duration: motionTokens.duration.fast,
                stagger: motionTokens.stagger.tight
            }, "-=0.22");
    }

    beginJourneyButton?.addEventListener("click", () => {
        if (!isAircraftReadyForIntro || introStarted) {
            return;
        }

        introStarted = true;
        beginJourneyButton.disabled = true;
        completeJourneyIntro();
    });
    skipIntroButton?.addEventListener("click", skipJourneyIntro);

    window.addEventListener("journey:aircraft-ready", () => setIntroAircraftReady(), { once: true });
    window.addEventListener("journey:aircraft-failed", () => setIntroAircraftReady({ failed: true }), { once: true });
    window.setTimeout(() => setIntroAircraftReady({ failed: true }), 7000);
}

if (canUseGsap) {
    runGsapMotion();
} else {
    runFallbackReveal();
}

setupJourneyIntro();
setupFlightLog();
runPremiumInteractions();
runActiveNavigation();

if (isCaseStudyHash()) {
    openCaseStudy(window.location.hash, { updateHistory: false });
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

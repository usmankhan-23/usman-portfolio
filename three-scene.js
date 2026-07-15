import * as THREE from "three";
import { GLTFLoader } from "./assets/vendor/GLTFLoader.js";

const canvas = document.querySelector("#portfolio-scene");
const loaderBadge = document.querySelector("[data-scene-loader]");
const sceneStage = document.querySelector(".cinematic-stage");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;

if (!canvas) {
    console.warn("Portfolio scene canvas was not found.");
} else {
const loaderText = loaderBadge?.querySelector("span");

function setLoaderMessage(message) {
    if (loaderText) {
        loaderText.textContent = message;
    }
}

function setSceneFallback(message, error) {
    if (error) {
        console.warn(message, error);
    }

    document.body.classList.add("scene-fallback");
    canvas.dataset.aircraftReady = "false";
    canvas.dataset.sceneFallback = "true";
    canvas.hidden = true;
    setLoaderMessage(message);
    loaderBadge?.classList.add("is-fallback");
    window.dispatchEvent(new CustomEvent("journey:aircraft-failed", {
        detail: { message }
    }));
}

function clearSceneFallback() {
    document.body.classList.remove("scene-fallback");
    canvas.hidden = false;
    canvas.dataset.sceneFallback = "false";
    loaderBadge?.classList.remove("is-fallback");
}

function createRenderer() {
    const rendererOptions = {
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    };
    let context = null;

    try {
        context = canvas.getContext("webgl2", rendererOptions) || canvas.getContext("webgl", rendererOptions);
    } catch (error) {
        setSceneFallback("3D flight scene unavailable", error);
        return null;
    }

    if (!context) {
        setSceneFallback("3D flight scene unavailable");
        return null;
    }

    try {
        const renderer = new THREE.WebGLRenderer({
            canvas,
            context,
            ...rendererOptions
        });

        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.04;
        renderer.setClearColor(0xeee2cc, 0);
        clearSceneFallback();

        return renderer;
    } catch (error) {
        setSceneFallback("3D flight scene unavailable", error);
        return null;
    }
}

setLoaderMessage("Preparing flight systems");

const renderer = createRenderer();

if (renderer) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xeee2cc, 0.026);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
    const clock = new THREE.Clock();
    const gltfLoader = new GLTFLoader();

    const aircraftPositionGroup = new THREE.Group();
    const aircraftBankGroup = new THREE.Group();
    const aircraftPointerGroup = new THREE.Group();
    const aircraftFloatGroup = new THREE.Group();
    const aircraftRotationGroup = new THREE.Group();
    const atmosphereGroup = new THREE.Group();
    const pathGroup = new THREE.Group();

    aircraftPositionGroup.add(aircraftBankGroup);
    aircraftBankGroup.add(aircraftPointerGroup);
    aircraftPointerGroup.add(aircraftFloatGroup);
    aircraftFloatGroup.add(aircraftRotationGroup);
    scene.add(aircraftPositionGroup);
    scene.add(atmosphereGroup);
    scene.add(pathGroup);

    const tempBox = new THREE.Box3();
    const tempSize = new THREE.Vector3();
    const tempCenter = new THREE.Vector3();
    const tempCameraPosition = new THREE.Vector3();
    const tempCameraTarget = new THREE.Vector3();
    const pointerTarget = new THREE.Vector2();
    const pointerCurrent = new THREE.Vector2();
    const pointerNeutral = new THREE.Vector2();
    const sceneLights = {
        hemisphere: null,
        key: null,
        fill: null,
        rim: null,
        under: null
    };

    const flightState = {
        currentStage: "hero",
        rotationSpeed: 0,
        targetRotationSpeed: 0,
        basePosition: new THREE.Vector3(),
        targetPosition: new THREE.Vector3(),
        baseScale: 1,
        targetScale: 1,
        bank: 0,
        targetBank: 0,
        transitionBank: 0,
        targetRouteBankMax: 0.12,
        pitch: 0,
        targetPitch: 0,
        floatAmount: 0.065,
        targetFloatAmount: 0.065,
        floatSpeed: 0.82,
        targetFloatSpeed: 0.82,
        driftAmount: 0.04,
        targetDriftAmount: 0.04,
        pointerInfluence: 1,
        targetPointerInfluence: 1,
        cameraPointerInfluence: 1,
        targetCameraPointerInfluence: 1,
        environmentPathOpacity: 0.16,
        targetEnvironmentPathOpacity: 0.16,
        particleOpacity: 0.22,
        targetParticleOpacity: 0.22,
        particleSpeed: 0.08,
        targetParticleSpeed: 0.08,
        fogDensity: 0.026,
        targetFogDensity: 0.026,
        keyLightIntensity: 3.45,
        targetKeyLightIntensity: 3.45,
        rimLightIntensity: 4.2,
        targetRimLightIntensity: 4.2,
        cameraPosition: new THREE.Vector3(0.15, 1.05, 7.35),
        targetCameraPosition: new THREE.Vector3(0.15, 1.05, 7.35),
        cameraTarget: new THREE.Vector3(0, -0.12, -0.78),
        targetCameraTarget: new THREE.Vector3(0, -0.12, -0.78),
        pointerX: 0,
        pointerY: 0,
        isModelLoaded: false,
        isPageVisible: !document.hidden,
        isSmallScreen: false,
        isTablet: false,
        isTouchOnly: !supportsFinePointer,
        lastPointerMoveTime: 0,
        lastStateWriteTime: 0
    };

    const secondsPerRotation = (seconds) => (Math.PI * 2) / seconds;

    const dampingProfiles = {
        desktop: {
            position: 3.05,
            scale: 3.35,
            bank: 4.75,
            routeBank: 5.05,
            pitch: 3.15,
            rotationSpeed: 1.55,
            float: 3.05,
            drift: 3.2,
            pointer: 3.45,
            cameraPosition: 2.22,
            cameraTarget: 2.18,
            cameraPointer: 3.9,
            environment: 1.95
        },
        tablet: {
            position: 3.35,
            scale: 3.75,
            bank: 4.7,
            routeBank: 5,
            pitch: 3.25,
            rotationSpeed: 1.8,
            float: 3.2,
            drift: 3.35,
            pointer: 3.9,
            cameraPosition: 2.72,
            cameraTarget: 2.68,
            cameraPointer: 4.3,
            environment: 2.2
        },
        mobile: {
            position: 4.05,
            scale: 4.45,
            bank: 5.05,
            routeBank: 5.65,
            pitch: 3.95,
            rotationSpeed: 2.8,
            float: 4.1,
            drift: 4.2,
            pointer: 5.1,
            cameraPosition: 3.7,
            cameraTarget: 3.65,
            cameraPointer: 5.1,
            environment: 2.75
        }
    };

    function getDampingProfile() {
        if (flightState.isSmallScreen) {
            return dampingProfiles.mobile;
        }

        if (flightState.isTablet) {
            return dampingProfiles.tablet;
        }

        return dampingProfiles.desktop;
    }

    const flightStages = {
        opening: {
            position: { x: 1.96, y: -0.24, z: -1.08 },
            scale: 0.82,
            bank: -0.012,
            pitch: 0.018,
            rotationSpeed: secondsPerRotation(28),
            cameraPosition: { x: 0.1, y: 1.02, z: 7.72 },
            cameraTarget: { x: 0.3, y: -0.12, z: -1.08 },
            transitionDuration: 1.65,
            transitionEase: "power3.out",
            floatAmount: 0.036,
            floatSpeed: 0.62,
            driftAmount: 0.014,
            pointerInfluence: 0.34,
            cameraPointerInfluence: 0.28,
            environment: {
                fogDensity: 0.062,
                pathOpacity: 0.04,
                particleOpacity: 0.18,
                particleSpeed: 0.022,
                keyLightIntensity: 2.05,
                rimLightIntensity: 2.35
            },
            tablet: {
                position: { x: 1.16, y: -0.5, z: -1.18 },
                scale: 0.68,
                cameraPosition: { x: 0.04, y: 1, z: 7.96 },
                cameraTarget: { x: 0.12, y: -0.2, z: -1.08 }
            },
            mobile: {
                position: { x: 0.14, y: -1.08, z: -1.58 },
                scale: 0.42,
                bank: 0,
                pitch: 0.01,
                cameraPosition: { x: 0, y: 1, z: 8.22 },
                cameraTarget: { x: 0, y: -0.3, z: -1.14 },
                floatAmount: 0.018,
                driftAmount: 0.006,
                pointerInfluence: 0,
                cameraPointerInfluence: 0
            }
        },
        hero: {
            position: { x: 3.25, y: -0.6, z: -0.66 },
            scale: 1.46,
            bank: 0.012,
            pitch: 0.024,
            routeBankMax: 0.065,
            rotationSpeed: secondsPerRotation(20),
            cameraPosition: { x: 0.34, y: 1.04, z: 7.06 },
            cameraTarget: { x: 0.72, y: -0.06, z: -0.78 },
            transitionDuration: 1.55,
            transitionEase: "power3.out",
            floatAmount: 0.052,
            floatSpeed: 0.66,
            driftAmount: 0.026,
            pointerInfluence: 1,
            cameraPointerInfluence: 1,
            environment: {
                fogDensity: 0.026,
                pathOpacity: 0.16,
                particleOpacity: 0.23,
                particleSpeed: 0.08,
                keyLightIntensity: 3.3,
                rimLightIntensity: 3.95
            },
            tablet: {
                position: { x: 2.0, y: -0.72, z: -0.92 },
                scale: 1.08,
                cameraPosition: { x: 0.18, y: 1.02, z: 7.28 },
                cameraTarget: { x: 0.36, y: -0.12, z: -0.88 }
            },
            mobile: {
                position: { x: 0.1, y: -2.05, z: -1.42 },
                scale: 0.36,
                bank: 0.004,
                pitch: 0.014,
                cameraPosition: { x: 0.02, y: 1.02, z: 8.05 },
                cameraTarget: { x: 0, y: -0.18, z: -1.02 },
                floatAmount: 0.024,
                driftAmount: 0.008,
                pointerInfluence: 0,
                cameraPointerInfluence: 0
            }
        },
        skills: {
            position: { x: 1.25, y: -0.16, z: -0.86 },
            scale: 0.98,
            bank: -0.01,
            pitch: 0.018,
            routeBankMax: 0.058,
            rotationSpeed: secondsPerRotation(25),
            cameraPosition: { x: 0.16, y: 1.01, z: 7.22 },
            cameraTarget: { x: 0.26, y: -0.13, z: -0.92 },
            transitionDuration: 1.8,
            transitionEase: "power3.inOut",
            floatAmount: 0.028,
            floatSpeed: 0.48,
            driftAmount: 0.012,
            pointerInfluence: 0.52,
            cameraPointerInfluence: 0.42,
            environment: {
                fogDensity: 0.023,
                pathOpacity: 0.12,
                particleOpacity: 0.17,
                particleSpeed: 0.045,
                keyLightIntensity: 3.05,
                rimLightIntensity: 3.35
            },
            tablet: {
                position: { x: 0.62, y: -0.46, z: -1.02 },
                scale: 0.76,
                cameraPosition: { x: 0.06, y: 0.98, z: 7.52 },
                cameraTarget: { x: 0.12, y: -0.22, z: -0.96 }
            },
            mobile: {
                position: { x: -0.06, y: -0.62, z: -1.24 },
                scale: 0.58,
                bank: -0.006,
                pitch: 0.012,
                cameraPosition: { x: 0, y: 0.96, z: 7.78 },
                cameraTarget: { x: 0, y: -0.34, z: -1 },
                pointerInfluence: 0,
                cameraPointerInfluence: 0
            }
        },
        coursework: {
            position: { x: 0.44, y: -0.22, z: -1.04 },
            scale: 0.84,
            bank: 0.024,
            pitch: 0.02,
            routeBankMax: 0.072,
            rotationSpeed: secondsPerRotation(31),
            cameraPosition: { x: 0.08, y: 0.98, z: 7.42 },
            cameraTarget: { x: 0.14, y: -0.15, z: -1.02 },
            transitionDuration: 1.9,
            transitionEase: "power2.inOut",
            floatAmount: 0.032,
            floatSpeed: 0.54,
            driftAmount: 0.02,
            pointerInfluence: 0.44,
            cameraPointerInfluence: 0.36,
            environment: {
                fogDensity: 0.024,
                pathOpacity: 0.22,
                particleOpacity: 0.19,
                particleSpeed: 0.07,
                keyLightIntensity: 3.15,
                rimLightIntensity: 3.55
            },
            tablet: {
                position: { x: 0.26, y: -0.54, z: -1.2 },
                scale: 0.66,
                cameraPosition: { x: 0.02, y: 0.96, z: 7.8 },
                cameraTarget: { x: 0.04, y: -0.28, z: -1.06 }
            },
            mobile: {
                position: { x: 0.08, y: -0.64, z: -1.36 },
                scale: 0.54,
                bank: 0.012,
                pitch: 0.012,
                cameraPosition: { x: 0, y: 0.94, z: 7.92 },
                cameraTarget: { x: 0, y: -0.36, z: -1.06 },
                pointerInfluence: 0,
                cameraPointerInfluence: 0
            }
        },
        discrete: {
            position: { x: -0.48, y: -0.2, z: -1.18 },
            scale: 0.78,
            bank: -0.032,
            pitch: 0.014,
            routeBankMax: 0.076,
            rotationSpeed: secondsPerRotation(32),
            cameraPosition: { x: -0.04, y: 0.94, z: 7.58 },
            cameraTarget: { x: -0.08, y: -0.16, z: -1.1 },
            transitionDuration: 1.9,
            transitionEase: "power2.inOut",
            floatAmount: 0.026,
            floatSpeed: 0.5,
            driftAmount: 0.016,
            pointerInfluence: 0.28,
            cameraPointerInfluence: 0.24,
            environment: {
                fogDensity: 0.022,
                pathOpacity: 0.28,
                particleOpacity: 0.2,
                particleSpeed: 0.055,
                keyLightIntensity: 3,
                rimLightIntensity: 3.85
            },
            tablet: {
                position: { x: -0.24, y: -0.56, z: -1.32 },
                scale: 0.62,
                cameraPosition: { x: -0.02, y: 0.94, z: 7.86 },
                cameraTarget: { x: -0.04, y: -0.3, z: -1.1 }
            },
            mobile: {
                position: { x: -0.08, y: -0.66, z: -1.48 },
                scale: 0.5,
                bank: -0.012,
                pitch: 0.01,
                cameraPosition: { x: 0, y: 0.94, z: 8.04 },
                cameraTarget: { x: 0, y: -0.36, z: -1.1 },
                pointerInfluence: 0,
                cameraPointerInfluence: 0
            }
        },
        calculus: {
            position: { x: 0.24, y: -0.06, z: -1.22 },
            scale: 0.8,
            bank: 0.03,
            pitch: 0.026,
            routeBankMax: 0.078,
            rotationSpeed: secondsPerRotation(28),
            cameraPosition: { x: 0.04, y: 1.02, z: 7.5 },
            cameraTarget: { x: 0.08, y: -0.12, z: -1.1 },
            transitionDuration: 1.9,
            transitionEase: "power2.inOut",
            floatAmount: 0.042,
            floatSpeed: 0.6,
            driftAmount: 0.02,
            pointerInfluence: 0.36,
            cameraPointerInfluence: 0.36,
            environment: {
                fogDensity: 0.024,
                pathOpacity: 0.2,
                particleOpacity: 0.2,
                particleSpeed: 0.085,
                keyLightIntensity: 3.22,
                rimLightIntensity: 3.7
            },
            tablet: {
                position: { x: 0.18, y: -0.44, z: -1.32 },
                scale: 0.64,
                cameraPosition: { x: 0.02, y: 0.98, z: 7.86 },
                cameraTarget: { x: 0.02, y: -0.26, z: -1.12 }
            },
            mobile: {
                position: { x: 0.1, y: -0.6, z: -1.42 },
                scale: 0.52,
                bank: 0.012,
                pitch: 0.018,
                cameraPosition: { x: 0, y: 0.96, z: 8.02 },
                cameraTarget: { x: 0, y: -0.34, z: -1.1 },
                pointerInfluence: 0,
                cameraPointerInfluence: 0
            }
        },
        projects: {
            position: { x: -0.72, y: -0.28, z: -1.12 },
            scale: 0.88,
            bank: -0.046,
            pitch: 0.02,
            routeBankMax: 0.095,
            rotationSpeed: secondsPerRotation(24),
            cameraPosition: { x: -0.12, y: 0.9, z: 7.24 },
            cameraTarget: { x: -0.08, y: -0.14, z: -1.02 },
            transitionDuration: 1.6,
            transitionEase: "power3.inOut",
            floatAmount: 0.04,
            floatSpeed: 0.66,
            driftAmount: 0.026,
            pointerInfluence: 0.58,
            cameraPointerInfluence: 0.5,
            environment: {
                fogDensity: 0.025,
                pathOpacity: 0.24,
                particleOpacity: 0.24,
                particleSpeed: 0.105,
                keyLightIntensity: 3.45,
                rimLightIntensity: 4.35
            },
            tablet: {
                position: { x: -0.34, y: -0.58, z: -1.22 },
                scale: 0.7,
                cameraPosition: { x: -0.04, y: 0.94, z: 7.58 },
                cameraTarget: { x: -0.04, y: -0.28, z: -1.02 }
            },
            mobile: {
                position: { x: -0.08, y: -0.66, z: -1.34 },
                scale: 0.54,
                bank: -0.018,
                pitch: 0.014,
                cameraPosition: { x: 0, y: 0.94, z: 7.92 },
                cameraTarget: { x: 0, y: -0.36, z: -1.04 },
                pointerInfluence: 0,
                cameraPointerInfluence: 0
            }
        },
        timeline: {
            position: { x: -0.12, y: -0.38, z: -1.52 },
            scale: 0.66,
            bank: 0.014,
            pitch: 0.012,
            routeBankMax: 0.05,
            rotationSpeed: secondsPerRotation(34),
            cameraPosition: { x: 0, y: 0.86, z: 7.96 },
            cameraTarget: { x: 0.02, y: -0.2, z: -1.18 },
            transitionDuration: 2,
            transitionEase: "power2.inOut",
            floatAmount: 0.024,
            floatSpeed: 0.46,
            driftAmount: 0.018,
            pointerInfluence: 0.18,
            cameraPointerInfluence: 0.18,
            environment: {
                fogDensity: 0.027,
                pathOpacity: 0.31,
                particleOpacity: 0.18,
                particleSpeed: 0.05,
                keyLightIntensity: 2.9,
                rimLightIntensity: 3.25
            },
            tablet: {
                position: { x: -0.08, y: -0.58, z: -1.64 },
                scale: 0.54,
                cameraPosition: { x: 0, y: 0.92, z: 8.16 },
                cameraTarget: { x: 0, y: -0.32, z: -1.2 }
            },
            mobile: {
                position: { x: 0, y: -0.68, z: -1.7 },
                scale: 0.46,
                bank: 0.008,
                pitch: 0.008,
                cameraPosition: { x: 0, y: 0.94, z: 8.22 },
                cameraTarget: { x: 0, y: -0.38, z: -1.16 },
                pointerInfluence: 0,
                cameraPointerInfluence: 0
            }
        },
        contact: {
            position: { x: 0.18, y: -0.6, z: -1.66 },
            scale: 0.64,
            bank: 0.004,
            pitch: -0.012,
            routeBankMax: 0.038,
            rotationSpeed: secondsPerRotation(42),
            cameraPosition: { x: 0.04, y: 0.8, z: 8.12 },
            cameraTarget: { x: 0.04, y: -0.28, z: -1.24 },
            transitionDuration: 2.1,
            transitionEase: "power2.out",
            floatAmount: 0.018,
            floatSpeed: 0.38,
            driftAmount: 0.012,
            pointerInfluence: 0.12,
            cameraPointerInfluence: 0.12,
            environment: {
                fogDensity: 0.03,
                pathOpacity: 0.12,
                particleOpacity: 0.14,
                particleSpeed: 0.035,
                keyLightIntensity: 2.75,
                rimLightIntensity: 2.9
            },
            tablet: {
                position: { x: 0.04, y: -0.66, z: -1.74 },
                scale: 0.52,
                cameraPosition: { x: 0, y: 0.84, z: 8.32 },
                cameraTarget: { x: 0, y: -0.36, z: -1.22 }
            },
            mobile: {
                position: { x: 0, y: -0.72, z: -1.8 },
                scale: 0.44,
                bank: 0,
                pitch: -0.01,
                cameraPosition: { x: 0, y: 0.9, z: 8.34 },
                cameraTarget: { x: 0, y: -0.42, z: -1.18 },
                pointerInfluence: 0,
                cameraPointerInfluence: 0
            }
        }
    };

    let aircraftModel = null;
    let atmospherePoints = null;
    let animationFrameId = null;
    let resizeFrameId = null;
    let initialResizeFrameId = null;
    let resizeObserver = null;
    let lastSceneWidth = 0;
    let lastSceneHeight = 0;
    let lastPixelRatio = 0;
    let stageScrollTriggers = [];
    let stageScrollFallback = null;
    let isDisposed = false;
    const transitionState = {
        active: false,
        fromStage: "hero",
        toStage: "hero",
        startedAt: 0,
        duration: 1.8
    };

    function applyResponsiveStage(stage) {
        const environment = {
            fogDensity: stage.environment?.fogDensity ?? 0.026,
            pathOpacity: stage.environment?.pathOpacity ?? 0.16,
            particleOpacity: stage.environment?.particleOpacity ?? 0.22,
            particleSpeed: stage.environment?.particleSpeed ?? 0.08,
            keyLightIntensity: stage.environment?.keyLightIntensity ?? 3.45,
            rimLightIntensity: stage.environment?.rimLightIntensity ?? 4.2
        };
        const nextStage = {
            position: { ...stage.position },
            scale: stage.scale,
            bank: stage.bank,
            pitch: stage.pitch,
            rotationSpeed: stage.rotationSpeed,
            cameraPosition: { ...stage.cameraPosition },
            cameraTarget: { ...stage.cameraTarget },
            transitionDuration: stage.transitionDuration ?? 1.6,
            transitionEase: stage.transitionEase ?? "power3.out",
            floatAmount: stage.floatAmount ?? 0.05,
            floatSpeed: stage.floatSpeed ?? 0.7,
            driftAmount: stage.driftAmount ?? 0.03,
            pointerInfluence: stage.pointerInfluence ?? 0.5,
            cameraPointerInfluence: stage.cameraPointerInfluence ?? 0.5,
            routeBankMax: stage.routeBankMax ?? 0.12,
            environment
        };

        const tuneMobileStage = () => {
            nextStage.position.x *= 0.76;
            nextStage.position.z *= 0.92;
            nextStage.scale *= 0.96;
            nextStage.bank *= 0.62;
            nextStage.pitch *= 0.72;
            nextStage.routeBankMax = Math.min(nextStage.routeBankMax * 0.68, 0.034);
            nextStage.cameraPosition.x *= 0.62;
            nextStage.cameraPosition.y = nextStage.cameraPosition.y * 0.96 + 0.04;
            nextStage.cameraPosition.z = 7.86 + (nextStage.cameraPosition.z - 7.86) * 0.72;
            nextStage.cameraTarget.x *= 0.55;
            nextStage.cameraTarget.y *= 0.86;
            nextStage.pointerInfluence = 0;
            nextStage.cameraPointerInfluence = 0;
        };

        if (flightState.isSmallScreen && stage.mobile) {
            nextStage.position = { ...stage.mobile.position };
            nextStage.scale = stage.mobile.scale ?? nextStage.scale;
            nextStage.bank = stage.mobile.bank ?? nextStage.bank;
            nextStage.pitch = stage.mobile.pitch ?? nextStage.pitch;
            nextStage.cameraPosition = { ...stage.mobile.cameraPosition };
            nextStage.cameraTarget = { ...stage.mobile.cameraTarget };
            nextStage.floatAmount = stage.mobile.floatAmount ?? nextStage.floatAmount * 0.62;
            nextStage.floatSpeed = stage.mobile.floatSpeed ?? nextStage.floatSpeed * 0.86;
            nextStage.driftAmount = stage.mobile.driftAmount ?? nextStage.driftAmount * 0.48;
            nextStage.pointerInfluence = stage.mobile.pointerInfluence ?? 0;
            nextStage.cameraPointerInfluence = stage.mobile.cameraPointerInfluence ?? 0;
            nextStage.routeBankMax = stage.mobile.routeBankMax ?? Math.min(nextStage.routeBankMax, 0.045);
            tuneMobileStage();
            return nextStage;
        }

        if (flightState.isTablet && stage.tablet) {
            nextStage.position = { ...stage.tablet.position };
            nextStage.scale = stage.tablet.scale ?? nextStage.scale;
            nextStage.bank = stage.tablet.bank ?? nextStage.bank;
            nextStage.pitch = stage.tablet.pitch ?? nextStage.pitch;
            nextStage.cameraPosition = { ...stage.tablet.cameraPosition };
            nextStage.cameraTarget = { ...stage.tablet.cameraTarget };
            nextStage.floatAmount = stage.tablet.floatAmount ?? nextStage.floatAmount * 0.82;
            nextStage.floatSpeed = stage.tablet.floatSpeed ?? nextStage.floatSpeed;
            nextStage.driftAmount = stage.tablet.driftAmount ?? nextStage.driftAmount * 0.72;
            nextStage.pointerInfluence = stage.tablet.pointerInfluence ?? nextStage.pointerInfluence * 0.58;
            nextStage.cameraPointerInfluence = stage.tablet.cameraPointerInfluence ?? nextStage.cameraPointerInfluence * 0.58;
            nextStage.routeBankMax = stage.tablet.routeBankMax ?? Math.min(nextStage.routeBankMax, 0.085);
            return nextStage;
        }

        if (flightState.isSmallScreen) {
            nextStage.position.x *= 0.18;
            nextStage.position.y -= 0.34;
            nextStage.position.z -= 0.82;
            nextStage.scale *= 0.66;
            nextStage.bank *= 0.45;
            nextStage.pitch *= 0.6;
            nextStage.cameraPosition.x *= 0.35;
            nextStage.cameraPosition.y -= 0.04;
            nextStage.cameraPosition.z += 0.72;
            nextStage.cameraTarget.y -= 0.14;
            tuneMobileStage();
        }

        return nextStage;
    }

    function setVectorFromObject(vector, values) {
        vector.set(values.x, values.y, values.z);
    }

    function getHashFlightStageName(hash = window.location.hash) {
        const hashStageMap = {
            "#skills": "skills",
            "#coursework": "coursework",
            "#discrete": "discrete",
            "#calculus": "calculus",
            "#projects": "projects",
            "#timeline": "timeline",
            "#contact": "contact"
        };

        return hashStageMap[hash] ?? null;
    }

    function getInitialFlightStageName() {
        if (
            !prefersReducedMotion &&
            document.documentElement.classList.contains("journey-intro-pending") &&
            document.body.classList.contains("journey-intro-active")
        ) {
            return "opening";
        }

        return getHashFlightStageName() ?? "hero";
    }

    function setFlightStage(stageName, options = {}) {
        const stage = flightStages[stageName];
        const force = Boolean(options.force);
        const settleImmediately = Boolean(options.immediate);

        if (!stage) {
            console.warn(`Unknown flight stage: ${stageName}`);
            return;
        }

        if (!force && flightState.currentStage === stageName) {
            return;
        }

        const responsiveStage = applyResponsiveStage(stage);
        const previousStage = flightState.currentStage;
        flightState.currentStage = stageName;
        transitionState.active = !prefersReducedMotion;
        transitionState.fromStage = previousStage;
        transitionState.toStage = stageName;
        transitionState.startedAt = clock.getElapsedTime();
        transitionState.duration = responsiveStage.transitionDuration;
        setVectorFromObject(flightState.targetPosition, responsiveStage.position);
        flightState.targetScale = responsiveStage.scale;
        flightState.targetBank = responsiveStage.bank;
        flightState.targetRouteBankMax = responsiveStage.routeBankMax;
        flightState.targetPitch = responsiveStage.pitch;
        flightState.targetRotationSpeed = prefersReducedMotion ? 0 : responsiveStage.rotationSpeed;
        flightState.targetFloatAmount = responsiveStage.floatAmount;
        flightState.targetFloatSpeed = responsiveStage.floatSpeed;
        flightState.targetDriftAmount = responsiveStage.driftAmount;
        flightState.targetPointerInfluence = responsiveStage.pointerInfluence;
        flightState.targetCameraPointerInfluence = responsiveStage.cameraPointerInfluence;
        flightState.targetFogDensity = responsiveStage.environment.fogDensity;
        flightState.targetEnvironmentPathOpacity = responsiveStage.environment.pathOpacity;
        flightState.targetParticleOpacity = responsiveStage.environment.particleOpacity;
        flightState.targetParticleSpeed = responsiveStage.environment.particleSpeed;
        flightState.targetKeyLightIntensity = responsiveStage.environment.keyLightIntensity;
        flightState.targetRimLightIntensity = responsiveStage.environment.rimLightIntensity;
        setVectorFromObject(flightState.targetCameraPosition, responsiveStage.cameraPosition);
        setVectorFromObject(flightState.targetCameraTarget, responsiveStage.cameraTarget);
        canvas.dataset.rotationDuration = responsiveStage.rotationSpeed
            ? (Math.PI * 2 / responsiveStage.rotationSpeed).toFixed(1)
            : "0";

        if (settleImmediately) {
            transitionState.active = false;
            flightState.basePosition.copy(flightState.targetPosition);
            flightState.baseScale = flightState.targetScale;
            flightState.bank = flightState.targetBank;
            flightState.pitch = flightState.targetPitch;
            flightState.transitionBank = 0;
            flightState.rotationSpeed = flightState.targetRotationSpeed;
            flightState.floatAmount = flightState.targetFloatAmount;
            flightState.floatSpeed = flightState.targetFloatSpeed;
            flightState.driftAmount = flightState.targetDriftAmount;
            flightState.pointerInfluence = flightState.targetPointerInfluence;
            flightState.cameraPointerInfluence = flightState.targetCameraPointerInfluence;
            flightState.fogDensity = flightState.targetFogDensity;
            flightState.environmentPathOpacity = flightState.targetEnvironmentPathOpacity;
            flightState.particleOpacity = flightState.targetParticleOpacity;
            flightState.particleSpeed = flightState.targetParticleSpeed;
            flightState.keyLightIntensity = flightState.targetKeyLightIntensity;
            flightState.rimLightIntensity = flightState.targetRimLightIntensity;
            flightState.cameraPosition.copy(flightState.targetCameraPosition);
            flightState.cameraTarget.copy(flightState.targetCameraTarget);
        }
    }

    const sectionStageMap = [
        { selector: "#home", stage: "hero" },
        { selector: "#skills", stage: "skills" },
        { selector: "#coursework", stage: "coursework" },
        { selector: "#discrete", stage: "discrete" },
        { selector: "#calculus", stage: "calculus" },
        { selector: "#projects", stage: "projects" },
        { selector: "#timeline", stage: "timeline" },
        { selector: "#contact", stage: "contact" }
    ];

    function getFlightStageElements() {
        return sectionStageMap
            .map(({ selector, stage }) => {
                const element = document.querySelector(selector);
                return element ? { element, stage } : null;
            })
            .filter(Boolean);
    }

    function isProjectCaseStudyOpen() {
        return Boolean(document.querySelector("[data-case-study].is-open"));
    }

    function applyScrollStage(stage) {
        setFlightStage(isProjectCaseStudyOpen() ? "projects" : stage);
    }

    function applyNearestStage(stageElements) {
        if (isProjectCaseStudyOpen()) {
            setFlightStage("projects");
            return;
        }

        const viewportCenter = window.innerHeight * 0.52;
        const nearestStage = stageElements.reduce((nearest, candidate) => {
            const rect = candidate.element.getBoundingClientRect();

            if (rect.height === 0 || rect.bottom < 0 || rect.top > window.innerHeight) {
                return nearest;
            }

            const distance = Math.abs(rect.top + rect.height * 0.5 - viewportCenter);

            if (!nearest || distance < nearest.distance) {
                return { stage: candidate.stage, distance };
            }

            return nearest;
        }, null);

        if (nearestStage && nearestStage.stage !== flightState.currentStage) {
            setFlightStage(nearestStage.stage);
        }
    }

    function setupFlightStageScrollTriggers() {
        const stageElements = getFlightStageElements();

        if (!stageElements.length) {
            return;
        }

        if (window.gsap && window.ScrollTrigger) {
            window.gsap.registerPlugin(window.ScrollTrigger);
            stageScrollTriggers = stageElements.map(({ element, stage }) => {
                return window.ScrollTrigger.create({
                    trigger: element,
                    start: "top 66%",
                    end: "bottom 34%",
                    invalidateOnRefresh: true,
                    onEnter: () => applyScrollStage(stage),
                    onEnterBack: () => applyScrollStage(stage),
                    onRefresh: () => applyNearestStage(stageElements)
                });
            });
            applyNearestStage(stageElements);
            window.ScrollTrigger.refresh();
            return;
        }

        let isScrollQueued = false;
        stageScrollFallback = () => {
            if (isScrollQueued) {
                return;
            }

            isScrollQueued = true;
            window.requestAnimationFrame(() => {
                isScrollQueued = false;
                applyNearestStage(stageElements);
            });
        };

        window.addEventListener("scroll", stageScrollFallback, { passive: true });
        applyNearestStage(stageElements);
    }

    function setupLighting() {
        const hemisphereLight = new THREE.HemisphereLight(0xfff0d4, 0x6b5639, 1.55);
        const keyLight = new THREE.DirectionalLight(0xfff2d7, 3.45);
        const fillLight = new THREE.DirectionalLight(0x8aa895, 1.2);
        const rimLight = new THREE.PointLight(0xb77c35, 4.2, 18);
        const underLight = new THREE.PointLight(0x486b58, 2.4, 15);

        keyLight.position.set(-4.6, 4.8, 5.4);
        fillLight.position.set(3.8, 1.2, 4.5);
        rimLight.position.set(4.6, 2.4, -3.2);
        underLight.position.set(-2.8, -1.8, 2.2);

        sceneLights.hemisphere = hemisphereLight;
        sceneLights.key = keyLight;
        sceneLights.fill = fillLight;
        sceneLights.rim = rimLight;
        sceneLights.under = underLight;
        scene.add(hemisphereLight, keyLight, fillLight, rimLight, underLight);
    }

    function createFlightLines() {
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x73552f,
            transparent: true,
            opacity: 0.16
        });

        for (let i = 0; i < 22; i += 1) {
            const z = -22 + i * 1.7;
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-12, -2.08, z),
                new THREE.Vector3(12, -2.08, z + 0.48)
            ]);
            pathGroup.add(new THREE.Line(geometry, lineMaterial));
        }

        for (let i = -5; i <= 5; i += 1) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(i * 2.1, -2.07, -24),
                new THREE.Vector3(i * 2.1, -2.07, 15)
            ]);
            pathGroup.add(new THREE.Line(geometry, lineMaterial.clone()));
        }
    }

    function createAtmosphere() {
        if (atmospherePoints) {
            atmospherePoints.geometry.dispose();
            atmospherePoints.material.dispose();
            atmosphereGroup.remove(atmospherePoints);
        }

        const count = flightState.isSmallScreen ? 90 : 180;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i += 1) {
            positions[i * 3] = (Math.random() - 0.5) * 34;
            positions[i * 3 + 1] = (Math.random() - 0.22) * 12;
            positions[i * 3 + 2] = -Math.random() * 34;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x7a5a31,
            size: flightState.isSmallScreen ? 0.017 : 0.023,
            transparent: true,
            opacity: 0.22,
            depthWrite: false
        });

        atmospherePoints = new THREE.Points(geometry, material);
        atmospherePoints.position.z = 4;
        atmosphereGroup.add(atmospherePoints);
    }

    function prepareMaterial(material) {
        const clonedMaterial = material.clone();

        clonedMaterial.roughness = Math.min(clonedMaterial.roughness ?? 0.72, 0.86);
        clonedMaterial.metalness = Math.min(clonedMaterial.metalness ?? 0.04, 0.12);
        clonedMaterial.visible = true;
        clonedMaterial.opacity = 1;
        clonedMaterial.transparent = false;
        clonedMaterial.needsUpdate = true;

        return clonedMaterial;
    }

    function forEachAircraftMaterial(callback) {
        if (!aircraftModel) {
            return;
        }

        aircraftModel.traverse((child) => {
            if (!child.isMesh || !child.material) {
                return;
            }

            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(callback);
        });
    }

    function normalizeAircraftModel(model) {
        tempBox.setFromObject(model);
        tempBox.getSize(tempSize);
        tempBox.getCenter(tempCenter);

        const largestDimension = Math.max(tempSize.x, tempSize.y, tempSize.z) || 1;
        const normalizedScale = 3.15 / largestDimension;

        model.position.sub(tempCenter);
        model.scale.setScalar(normalizedScale);
        model.rotation.set(0.08, -0.45, 0.025);
        model.visible = true;

        model.traverse((child) => {
            if (!child.isMesh) {
                return;
            }

            child.castShadow = false;
            child.receiveShadow = false;

            if (child.material) {
                child.material = Array.isArray(child.material)
                    ? child.material.map((material) => prepareMaterial(material))
                    : prepareMaterial(child.material);
            }
        });

        aircraftRotationGroup.add(model);
        aircraftModel = model;
        flightState.isModelLoaded = true;
        clearSceneFallback();
        loaderBadge?.classList.add("is-hidden");
        canvas.dataset.aircraftReady = "true";
        canvas.dataset.rotationDuration = "20";
        canvas.dataset.modelMeshCount = String(countAircraftMeshes(model));
        window.dispatchEvent(new CustomEvent("journey:aircraft-ready"));
    }

    function countAircraftMeshes(model) {
        let meshCount = 0;

        model.traverse((child) => {
            if (child.isMesh) {
                meshCount += 1;
            }
        });

        return meshCount;
    }

    function revealAircraftModel() {
        if (!aircraftModel) {
            return;
        }

        aircraftModel.visible = true;
        clearSceneFallback();
        loaderBadge?.classList.add("is-hidden");

        if (prefersReducedMotion || !window.gsap) {
            forEachAircraftMaterial((material) => {
                material.visible = true;
                material.opacity = 1;
                material.transparent = false;
                material.needsUpdate = true;
            });
            return;
        }

        const targetScaleX = aircraftModel.scale.x;
        const targetScaleY = aircraftModel.scale.y;
        const targetScaleZ = aircraftModel.scale.z;

        aircraftModel.scale.multiplyScalar(0.96);
        gsap.to(aircraftModel.scale, {
            x: targetScaleX,
            y: targetScaleY,
            z: targetScaleZ,
            duration: 1,
            ease: "power3.out"
        });

        forEachAircraftMaterial((material) => {
            material.visible = true;
            material.opacity = 1;
            material.transparent = false;
            material.needsUpdate = true;
        });
    }

    function loadAircraftModel() {
        setLoaderMessage("Preparing flight systems");

        gltfLoader.load(
            "assets/models/stylized_ww1_plane.glb",
            (gltf) => {
                normalizeAircraftModel(gltf.scene);
                setFlightStage(getInitialFlightStageName(), { force: true });
                resizeScene(true);
                revealAircraftModel();
                renderSceneOnce();
                startRenderLoop();
            },
            (event) => {
                if (!event.total) {
                    return;
                }

                const progress = Math.round((event.loaded / event.total) * 100);
                setLoaderMessage(`Preparing flight systems ${progress}%`);
            },
            (error) => {
                setSceneFallback("Aircraft model could not load", error);
            }
        );
    }

    function updateResponsiveState() {
        const wasSmallScreen = flightState.isSmallScreen;
        const wasTablet = flightState.isTablet;
        const cssMobile = sceneStage
            ? Number.parseFloat(getComputedStyle(sceneStage).getPropertyValue("--scene-mobile")) === 1
            : false;

        flightState.isSmallScreen = cssMobile || window.innerWidth < 760;
        flightState.isTablet = !flightState.isSmallScreen && window.innerWidth < 1025;
        flightState.isTouchOnly = !supportsFinePointer || flightState.isSmallScreen;

        if (wasSmallScreen !== flightState.isSmallScreen || wasTablet !== flightState.isTablet) {
            createAtmosphere();
            setFlightStage(flightState.currentStage, { force: true });
        }
    }

    function getSceneBounds() {
        const rect = (sceneStage || canvas).getBoundingClientRect();
        const fallbackWidth = window.innerWidth || canvas.clientWidth || 1;
        const fallbackHeight = window.innerHeight || canvas.clientHeight || 1;

        return {
            width: Math.max(1, Math.round(rect.width || fallbackWidth)),
            height: Math.max(1, Math.round(rect.height || fallbackHeight))
        };
    }

    function renderSceneOnce(delta = 1 / 60) {
        updateCamera(delta);
        renderer.render(scene, camera);
    }

    function resizeScene(force = false) {
        const { width, height } = getSceneBounds();
        updateResponsiveState();
        const maxPixelRatio = flightState.isSmallScreen ? 1.35 : 1.7;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);

        if (
            !force &&
            width === lastSceneWidth &&
            height === lastSceneHeight &&
            pixelRatio === lastPixelRatio
        ) {
            return;
        }

        lastSceneWidth = width;
        lastSceneHeight = height;
        lastPixelRatio = pixelRatio;
        camera.aspect = width / height;
        camera.fov = flightState.isSmallScreen ? 39 : 34;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
        canvas.dataset.sceneWidth = String(width);
        canvas.dataset.sceneHeight = String(height);
    }

    function requestResize() {
        if (resizeFrameId !== null) {
            return;
        }

        resizeFrameId = window.requestAnimationFrame(() => {
            resizeFrameId = null;
            resizeScene();
            renderSceneOnce();
        });
    }

    function handleWindowLoadResize() {
        resizeScene(true);
        renderSceneOnce();
    }

    function scheduleInitialSizing() {
        resizeScene(true);
        initialResizeFrameId = window.requestAnimationFrame(() => {
            initialResizeFrameId = null;
            resizeScene(true);
            renderSceneOnce();
        });
        window.addEventListener("load", handleWindowLoadResize, { once: true });
    }

    function setupResizeObserver() {
        if (!("ResizeObserver" in window)) {
            return;
        }

        resizeObserver = new ResizeObserver(() => {
            requestResize();
        });
        resizeObserver.observe(sceneStage || canvas);
    }

    function handlePointerMove(event) {
        if (flightState.isTouchOnly || prefersReducedMotion) {
            return;
        }

        flightState.lastPointerMoveTime = Date.now();
        pointerTarget.x = event.clientX / window.innerWidth * 2 - 1;
        pointerTarget.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function resetPointerTarget() {
        pointerTarget.set(0, 0);
    }

    function handleVisibilityChange() {
        flightState.isPageVisible = !document.hidden;

        if (flightState.isPageVisible) {
            clock.getDelta();
            startRenderLoop();
        } else {
            stopRenderLoop();
        }
    }

    function handleJourneyIntroReady() {
        if (!prefersReducedMotion) {
            setFlightStage("opening", { force: true });
        }
    }

    function handleJourneyIntroComplete(event) {
        setFlightStage("hero", {
            force: true,
            immediate: Boolean(event?.detail?.immediate)
        });
    }

    function handleHashRestored(event) {
        const stageName = getHashFlightStageName(event?.detail?.hash);

        if (stageName) {
            setFlightStage(stageName);
        }
    }

    function dampVector(current, target, damping, delta) {
        current.x = THREE.MathUtils.damp(current.x, target.x, damping, delta);
        current.y = THREE.MathUtils.damp(current.y, target.y, damping, delta);
        current.z = THREE.MathUtils.damp(current.z, target.z, damping, delta);
    }

    function updatePointer(delta) {
        if (Date.now() - flightState.lastPointerMoveTime > 1100 || prefersReducedMotion) {
            pointerTarget.x = THREE.MathUtils.damp(pointerTarget.x, pointerNeutral.x, 2.2, delta);
            pointerTarget.y = THREE.MathUtils.damp(pointerTarget.y, pointerNeutral.y, 2.2, delta);
        }

        pointerCurrent.x = THREE.MathUtils.damp(pointerCurrent.x, pointerTarget.x, 6.4, delta);
        pointerCurrent.y = THREE.MathUtils.damp(pointerCurrent.y, pointerTarget.y, 6.4, delta);
        flightState.pointerX = pointerCurrent.x;
        flightState.pointerY = pointerCurrent.y;
    }

    function updateAircraftMotion(delta, elapsed) {
        const damping = getDampingProfile();

        flightState.rotationSpeed = THREE.MathUtils.damp(
            flightState.rotationSpeed,
            flightState.targetRotationSpeed,
            damping.rotationSpeed,
            delta
        );
        flightState.floatAmount = THREE.MathUtils.damp(
            flightState.floatAmount,
            flightState.targetFloatAmount,
            damping.float,
            delta
        );
        flightState.floatSpeed = THREE.MathUtils.damp(
            flightState.floatSpeed,
            flightState.targetFloatSpeed,
            damping.float,
            delta
        );
        flightState.driftAmount = THREE.MathUtils.damp(
            flightState.driftAmount,
            flightState.targetDriftAmount,
            damping.drift,
            delta
        );
        flightState.pointerInfluence = THREE.MathUtils.damp(
            flightState.pointerInfluence,
            flightState.targetPointerInfluence,
            damping.pointer,
            delta
        );

        if (prefersReducedMotion) {
            flightState.basePosition.copy(flightState.targetPosition);
            flightState.baseScale = flightState.targetScale;
            flightState.bank = flightState.targetBank;
            flightState.pitch = flightState.targetPitch;
            flightState.transitionBank = 0;
        } else {
            dampVector(flightState.basePosition, flightState.targetPosition, damping.position, delta);
            flightState.baseScale = THREE.MathUtils.damp(
                flightState.baseScale,
                flightState.targetScale,
                damping.scale,
                delta
            );
            flightState.bank = THREE.MathUtils.damp(flightState.bank, flightState.targetBank, damping.bank, delta);
            flightState.pitch = THREE.MathUtils.damp(flightState.pitch, flightState.targetPitch, damping.pitch, delta);

            const remainingX = flightState.targetPosition.x - flightState.basePosition.x;
            const remainingDistanceSq = flightState.basePosition.distanceToSquared(flightState.targetPosition);
            const routeBankFade = THREE.MathUtils.smoothstep(remainingDistanceSq, 0.005, 0.105);
            const routeBankTarget = remainingDistanceSq > 0.0045
                ? THREE.MathUtils.clamp(
                    -remainingX * 0.03 * routeBankFade,
                    -flightState.targetRouteBankMax,
                    flightState.targetRouteBankMax
                )
                : 0;
            flightState.transitionBank = THREE.MathUtils.damp(
                flightState.transitionBank,
                routeBankTarget,
                damping.routeBank,
                delta
            );

            if (transitionState.active && remainingDistanceSq < 0.004 && Math.abs(flightState.transitionBank) < 0.004) {
                transitionState.active = false;
            }
        }

        aircraftPositionGroup.position.copy(flightState.basePosition);
        aircraftPositionGroup.scale.setScalar(flightState.baseScale);
        aircraftBankGroup.rotation.z = prefersReducedMotion
            ? flightState.targetBank
            : THREE.MathUtils.clamp(flightState.bank + flightState.transitionBank, -0.18, 0.18);
        aircraftBankGroup.rotation.x = prefersReducedMotion ? flightState.targetPitch : flightState.pitch;

        if (!prefersReducedMotion) {
            aircraftRotationGroup.rotation.y += delta * flightState.rotationSpeed;
            aircraftFloatGroup.position.y = Math.sin(elapsed * flightState.floatSpeed) * flightState.floatAmount;
            aircraftFloatGroup.position.x = Math.sin(elapsed * 0.42) * flightState.driftAmount;
            aircraftFloatGroup.rotation.x = Math.sin(elapsed * 0.72) * 0.018;
            aircraftFloatGroup.rotation.z = Math.sin(elapsed * 0.58) * 0.02;
            aircraftPointerGroup.rotation.x = -flightState.pointerY * 0.028 * flightState.pointerInfluence;
            aircraftPointerGroup.rotation.z = -flightState.pointerX * 0.042 * flightState.pointerInfluence;
            aircraftPointerGroup.rotation.y = flightState.pointerX * 0.036 * flightState.pointerInfluence;
            return;
        }

        aircraftRotationGroup.rotation.y = -0.62;
        aircraftPointerGroup.rotation.set(0, 0, 0);
        aircraftFloatGroup.position.set(0, 0, 0);
        aircraftFloatGroup.rotation.set(0, 0, 0);
    }

    function updateCamera(delta) {
        const damping = getDampingProfile();

        if (prefersReducedMotion) {
            flightState.cameraPosition.copy(flightState.targetCameraPosition);
            flightState.cameraTarget.copy(flightState.targetCameraTarget);
            flightState.cameraPointerInfluence = 0;
        } else {
            dampVector(flightState.cameraPosition, flightState.targetCameraPosition, damping.cameraPosition, delta);
            dampVector(flightState.cameraTarget, flightState.targetCameraTarget, damping.cameraTarget, delta);
            flightState.cameraPointerInfluence = THREE.MathUtils.damp(
                flightState.cameraPointerInfluence,
                flightState.targetCameraPointerInfluence,
                damping.cameraPointer,
                delta
            );
        }

        tempCameraPosition.copy(flightState.cameraPosition);
        tempCameraPosition.x += flightState.pointerX * 0.074 * flightState.cameraPointerInfluence;
        tempCameraPosition.y += flightState.pointerY * 0.034 * flightState.cameraPointerInfluence;
        tempCameraTarget.copy(flightState.cameraTarget);

        camera.position.copy(tempCameraPosition);
        camera.lookAt(tempCameraTarget);
    }

    function updateEnvironment(delta, elapsed) {
        const damping = getDampingProfile();

        flightState.environmentPathOpacity = THREE.MathUtils.damp(
            flightState.environmentPathOpacity,
            flightState.targetEnvironmentPathOpacity,
            damping.environment,
            delta
        );
        flightState.particleOpacity = THREE.MathUtils.damp(
            flightState.particleOpacity,
            flightState.targetParticleOpacity,
            damping.environment,
            delta
        );
        flightState.particleSpeed = THREE.MathUtils.damp(
            flightState.particleSpeed,
            flightState.targetParticleSpeed,
            damping.environment,
            delta
        );
        flightState.fogDensity = THREE.MathUtils.damp(
            flightState.fogDensity,
            flightState.targetFogDensity,
            damping.environment,
            delta
        );
        flightState.keyLightIntensity = THREE.MathUtils.damp(
            flightState.keyLightIntensity,
            flightState.targetKeyLightIntensity,
            damping.environment,
            delta
        );
        flightState.rimLightIntensity = THREE.MathUtils.damp(
            flightState.rimLightIntensity,
            flightState.targetRimLightIntensity,
            damping.environment,
            delta
        );

        scene.fog.density = prefersReducedMotion ? flightState.targetFogDensity : flightState.fogDensity;

        if (sceneLights.key) {
            sceneLights.key.intensity = prefersReducedMotion
                ? flightState.targetKeyLightIntensity
                : flightState.keyLightIntensity;
        }

        if (sceneLights.rim) {
            sceneLights.rim.intensity = prefersReducedMotion
                ? flightState.targetRimLightIntensity
                : flightState.rimLightIntensity;
        }

        pathGroup.children.forEach((line) => {
            if (line.material) {
                line.material.opacity = prefersReducedMotion
                    ? flightState.targetEnvironmentPathOpacity
                    : flightState.environmentPathOpacity;
            }
        });

        if (atmospherePoints?.material) {
            atmospherePoints.material.opacity = prefersReducedMotion
                ? flightState.targetParticleOpacity
                : flightState.particleOpacity;
        }

        if (!prefersReducedMotion) {
            pathGroup.position.z = (elapsed * (0.28 + flightState.particleSpeed * 1.7)) % 1.7;
            pathGroup.rotation.y = flightState.pointerX * 0.014;

            if (atmospherePoints) {
                atmospherePoints.position.z = 4 + (elapsed * flightState.particleSpeed) % 4;
                atmospherePoints.rotation.y += delta * (0.012 + flightState.particleSpeed * 0.08);
            }
            return;
        }

        pathGroup.position.z = 0;
        pathGroup.rotation.y = 0;
    }

    function updateSceneDataset(elapsed) {
        if (elapsed - flightState.lastStateWriteTime < 0.25) {
            return;
        }

        flightState.lastStateWriteTime = elapsed;
        canvas.dataset.aircraftRotationY = aircraftRotationGroup.rotation.y.toFixed(4);
        canvas.dataset.flightStage = flightState.currentStage;
        canvas.dataset.reducedMotion = String(prefersReducedMotion);
    }

    function render() {
        if (isDisposed) {
            return;
        }

        animationFrameId = window.requestAnimationFrame(render);

        if (!flightState.isPageVisible) {
            return;
        }

        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.getElapsedTime();

        updatePointer(delta);
        updateAircraftMotion(delta, elapsed);
        updateCamera(delta);
        updateEnvironment(delta, elapsed);
        updateSceneDataset(elapsed);

        renderer.render(scene, camera);
    }

    function startRenderLoop() {
        if (animationFrameId !== null || isDisposed) {
            return;
        }

        clock.getDelta();
        render();
    }

    function stopRenderLoop() {
        if (animationFrameId === null) {
            return;
        }

        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    function disposeMaterial(material) {
        material.dispose();
    }

    function cleanupScene() {
        if (isDisposed) {
            return;
        }

        isDisposed = true;
        stopRenderLoop();

        window.removeEventListener("resize", requestResize);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerleave", resetPointerTarget);
        window.removeEventListener("load", handleWindowLoadResize);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("journey:intro-ready", handleJourneyIntroReady);
        window.removeEventListener("journey:intro-complete", handleJourneyIntroComplete);
        window.removeEventListener("journey:intro-skip", handleJourneyIntroComplete);
        window.removeEventListener("journey:hash-restored", handleHashRestored);
        window.removeEventListener("pagehide", cleanupScene);
        stageScrollTriggers.forEach((trigger) => trigger.kill());
        stageScrollTriggers = [];
        resizeObserver?.disconnect();

        if (initialResizeFrameId !== null) {
            window.cancelAnimationFrame(initialResizeFrameId);
            initialResizeFrameId = null;
        }

        if (stageScrollFallback) {
            window.removeEventListener("scroll", stageScrollFallback);
        }

        scene.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }

            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(disposeMaterial);
                } else {
                    disposeMaterial(child.material);
                }
            }
        });

        renderer.dispose();
    }

    setupLighting();
    createFlightLines();
    updateResponsiveState();
    createAtmosphere();
    setFlightStage(getInitialFlightStageName(), { force: true });
    setupFlightStageScrollTriggers();
    scheduleInitialSizing();
    setupResizeObserver();
    loadAircraftModel();

    window.addEventListener("resize", requestResize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", resetPointerTarget, { passive: true });
    window.addEventListener("journey:intro-ready", handleJourneyIntroReady);
    window.addEventListener("journey:intro-complete", handleJourneyIntroComplete);
    window.addEventListener("journey:intro-skip", handleJourneyIntroComplete);
    window.addEventListener("journey:hash-restored", handleHashRestored);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", cleanupScene, { once: true });

    renderSceneOnce();
    startRenderLoop();
}
}

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
        pitch: 0,
        targetPitch: 0,
        cameraPosition: new THREE.Vector3(0.15, 1.05, 7.35),
        targetCameraPosition: new THREE.Vector3(0.15, 1.05, 7.35),
        cameraTarget: new THREE.Vector3(0, -0.12, -0.78),
        targetCameraTarget: new THREE.Vector3(0, -0.12, -0.78),
        pointerX: 0,
        pointerY: 0,
        isModelLoaded: false,
        isPageVisible: !document.hidden,
        isSmallScreen: false,
        isTouchOnly: !supportsFinePointer,
        lastPointerMoveTime: 0,
        lastStateWriteTime: 0
    };

    const flightStages = {
        opening: {
            position: { x: 1.85, y: 0.04, z: 0.16 },
            scale: 0.92,
            bank: 0.02,
            pitch: 0.04,
            rotationSpeed: 0.28,
            cameraPosition: { x: 0.18, y: 1.12, z: 7.65 },
            cameraTarget: { x: 0, y: -0.12, z: -0.78 }
        },
        hero: {
            position: { x: 3.1, y: -0.42, z: -0.38 },
            scale: 1.78,
            bank: 0.02,
            pitch: 0.035,
            rotationSpeed: (Math.PI * 2) / 20,
            cameraPosition: { x: 0.35, y: 1.08, z: 6.65 },
            cameraTarget: { x: 0.72, y: 0.02, z: -0.68 },
            mobile: {
                position: { x: 0.18, y: -0.54, z: -1.08 },
                scale: 0.78,
                bank: 0.01,
                pitch: 0.02,
                cameraPosition: { x: 0.02, y: 0.98, z: 7.45 },
                cameraTarget: { x: 0, y: -0.28, z: -0.92 }
            }
        },
        skills: {
            position: { x: 1.22, y: -0.02, z: -0.38 },
            scale: 0.94,
            bank: -0.05,
            pitch: 0.03,
            rotationSpeed: (Math.PI * 2) / 22,
            cameraPosition: { x: 0.02, y: 1, z: 7.05 },
            cameraTarget: { x: 0, y: -0.1, z: -0.82 }
        },
        coursework: {
            position: { x: 0.82, y: -0.08, z: -0.72 },
            scale: 0.9,
            bank: 0.07,
            pitch: 0.025,
            rotationSpeed: (Math.PI * 2) / 22,
            cameraPosition: { x: -0.08, y: 0.96, z: 6.85 },
            cameraTarget: { x: 0, y: -0.1, z: -0.86 }
        },
        discrete: {
            position: { x: -0.72, y: -0.12, z: -1.02 },
            scale: 0.88,
            bank: -0.08,
            pitch: 0.02,
            rotationSpeed: (Math.PI * 2) / 23,
            cameraPosition: { x: -0.18, y: 0.92, z: 6.62 },
            cameraTarget: { x: 0, y: -0.12, z: -0.88 }
        },
        calculus: {
            position: { x: 0.72, y: -0.12, z: -1.08 },
            scale: 0.88,
            bank: 0.08,
            pitch: 0.02,
            rotationSpeed: (Math.PI * 2) / 23,
            cameraPosition: { x: 0.14, y: 0.92, z: 6.62 },
            cameraTarget: { x: 0, y: -0.12, z: -0.9 }
        },
        projects: {
            position: { x: -1.18, y: -0.2, z: -1.25 },
            scale: 0.86,
            bank: -0.1,
            pitch: 0.015,
            rotationSpeed: (Math.PI * 2) / 21,
            cameraPosition: { x: -0.28, y: 0.86, z: 6.38 },
            cameraTarget: { x: 0, y: -0.12, z: -0.92 }
        },
        timeline: {
            position: { x: 0.36, y: -0.18, z: -1.18 },
            scale: 0.84,
            bank: 0.04,
            pitch: 0.018,
            rotationSpeed: (Math.PI * 2) / 24,
            cameraPosition: { x: 0, y: 0.88, z: 6.55 },
            cameraTarget: { x: 0, y: -0.12, z: -0.9 }
        },
        contact: {
            position: { x: 1.1, y: -0.24, z: -1.36 },
            scale: 0.82,
            bank: 0.06,
            pitch: 0.02,
            rotationSpeed: (Math.PI * 2) / 24,
            cameraPosition: { x: 0.24, y: 0.84, z: 6.4 },
            cameraTarget: { x: 0, y: -0.12, z: -0.92 }
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
    let stageObserver = null;
    let stageScrollFallback = null;
    let isDisposed = false;

    function applyResponsiveStage(stage) {
        const nextStage = {
            position: { ...stage.position },
            scale: stage.scale,
            bank: stage.bank,
            pitch: stage.pitch,
            rotationSpeed: stage.rotationSpeed,
            cameraPosition: { ...stage.cameraPosition },
            cameraTarget: { ...stage.cameraTarget }
        };

        if (flightState.isSmallScreen && stage.mobile) {
            nextStage.position = { ...stage.mobile.position };
            nextStage.scale = stage.mobile.scale;
            nextStage.bank = stage.mobile.bank;
            nextStage.pitch = stage.mobile.pitch;
            nextStage.cameraPosition = { ...stage.mobile.cameraPosition };
            nextStage.cameraTarget = { ...stage.mobile.cameraTarget };
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
        }

        return nextStage;
    }

    function setVectorFromObject(vector, values) {
        vector.set(values.x, values.y, values.z);
    }

    function setFlightStage(stageName) {
        const stage = flightStages[stageName];

        if (!stage) {
            console.warn(`Unknown flight stage: ${stageName}`);
            return;
        }

        const responsiveStage = applyResponsiveStage(stage);
        flightState.currentStage = stageName;
        setVectorFromObject(flightState.targetPosition, responsiveStage.position);
        flightState.targetScale = responsiveStage.scale;
        flightState.targetBank = responsiveStage.bank;
        flightState.targetPitch = responsiveStage.pitch;
        flightState.targetRotationSpeed = prefersReducedMotion ? 0 : responsiveStage.rotationSpeed;
        setVectorFromObject(flightState.targetCameraPosition, responsiveStage.cameraPosition);
        setVectorFromObject(flightState.targetCameraTarget, responsiveStage.cameraTarget);
    }

    function getFlightStageElements() {
        const stageSelectors = [
            { name: "hero", selector: "#home" },
            { name: "skills", selector: "#skills" },
            { name: "coursework", selector: "#coursework" },
            { name: "discrete", selector: "#discrete, #discrete-case-study" },
            { name: "calculus", selector: "#calculus, #calculus-case-study" },
            { name: "projects", selector: "#projects, #quizmaster-case-study, #tumble-pop-case-study" },
            { name: "timeline", selector: ".flight-chapters" },
            { name: "contact", selector: "#contact" }
        ];

        return stageSelectors.flatMap(({ name, selector }) => {
            return Array.from(document.querySelectorAll(selector)).map((element) => {
                element.dataset.flightStage = element.dataset.flightStage || name;
                return { name, element };
            });
        });
    }

    function setupFlightStageObserver() {
        const stageElements = getFlightStageElements();

        if (!stageElements.length) {
            return;
        }

        const applyNearestStage = () => {
            const viewportCenter = window.innerHeight * 0.5;
            const nearestStage = stageElements.reduce((nearest, candidate) => {
                const rect = candidate.element.getBoundingClientRect();

                if (rect.height === 0 || rect.bottom < 0 || rect.top > window.innerHeight) {
                    return nearest;
                }

                const distance = Math.abs(rect.top + rect.height * 0.5 - viewportCenter);

                if (!nearest || distance < nearest.distance) {
                    return { name: candidate.name, distance };
                }

                return nearest;
            }, null);

            if (nearestStage && nearestStage.name !== flightState.currentStage) {
                setFlightStage(nearestStage.name);
            }
        };

        if ("IntersectionObserver" in window) {
            stageObserver = new IntersectionObserver(
                (entries) => {
                    const visibleEntries = entries
                        .filter((entry) => entry.isIntersecting)
                        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                    const nextStage = visibleEntries[0]?.target?.dataset?.flightStage;

                    if (nextStage && nextStage !== flightState.currentStage) {
                        setFlightStage(nextStage);
                    }
                },
                {
                    root: null,
                    rootMargin: "-22% 0px -44% 0px",
                    threshold: [0.12, 0.28, 0.5, 0.72]
                }
            );

            stageElements.forEach(({ element }) => stageObserver.observe(element));
            applyNearestStage();
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
                applyNearestStage();
            });
        };

        window.addEventListener("scroll", stageScrollFallback, { passive: true });
        applyNearestStage();
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
                setFlightStage("hero");
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
        const cssMobile = sceneStage
            ? Number.parseFloat(getComputedStyle(sceneStage).getPropertyValue("--scene-mobile")) === 1
            : false;

        flightState.isSmallScreen = cssMobile || window.innerWidth < 760;

        if (wasSmallScreen !== flightState.isSmallScreen) {
            createAtmosphere();
            setFlightStage(flightState.currentStage);
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

    function dampVector(current, target, damping, delta) {
        current.x = THREE.MathUtils.damp(current.x, target.x, damping, delta);
        current.y = THREE.MathUtils.damp(current.y, target.y, damping, delta);
        current.z = THREE.MathUtils.damp(current.z, target.z, damping, delta);
    }

    function updatePointer(delta) {
        if (Date.now() - flightState.lastPointerMoveTime > 1100 || prefersReducedMotion) {
            pointerTarget.lerp(pointerNeutral, 0.035);
        }

        pointerCurrent.x = THREE.MathUtils.damp(pointerCurrent.x, pointerTarget.x, 7, delta);
        pointerCurrent.y = THREE.MathUtils.damp(pointerCurrent.y, pointerTarget.y, 7, delta);
        flightState.pointerX = pointerCurrent.x;
        flightState.pointerY = pointerCurrent.y;
    }

    function updateAircraftMotion(delta, elapsed) {
        const positionDamping = 3.2;
        const rotationDamping = 4.2;

        flightState.rotationSpeed = THREE.MathUtils.damp(
            flightState.rotationSpeed,
            flightState.targetRotationSpeed,
            3.4,
            delta
        );
        dampVector(flightState.basePosition, flightState.targetPosition, positionDamping, delta);
        flightState.baseScale = THREE.MathUtils.damp(flightState.baseScale, flightState.targetScale, 3.6, delta);
        flightState.bank = THREE.MathUtils.damp(flightState.bank, flightState.targetBank, rotationDamping, delta);
        flightState.pitch = THREE.MathUtils.damp(flightState.pitch, flightState.targetPitch, rotationDamping, delta);

        aircraftPositionGroup.position.copy(flightState.basePosition);
        aircraftPositionGroup.scale.setScalar(flightState.baseScale);
        aircraftBankGroup.rotation.z = prefersReducedMotion ? flightState.targetBank : flightState.bank;
        aircraftBankGroup.rotation.x = prefersReducedMotion ? flightState.targetPitch : flightState.pitch;

        if (!prefersReducedMotion) {
            aircraftRotationGroup.rotation.y += delta * flightState.rotationSpeed;
            aircraftFloatGroup.position.y = Math.sin(elapsed * 0.82) * (flightState.isSmallScreen ? 0.038 : 0.065);
            aircraftFloatGroup.position.x = Math.sin(elapsed * 0.42) * (flightState.isSmallScreen ? 0.018 : 0.04);
            aircraftFloatGroup.rotation.x = Math.sin(elapsed * 0.72) * 0.018;
            aircraftFloatGroup.rotation.z = Math.sin(elapsed * 0.58) * 0.02;
            aircraftPointerGroup.rotation.x = -flightState.pointerY * (flightState.isSmallScreen ? 0.012 : 0.028);
            aircraftPointerGroup.rotation.z = -flightState.pointerX * (flightState.isSmallScreen ? 0.018 : 0.042);
            aircraftPointerGroup.rotation.y = flightState.pointerX * (flightState.isSmallScreen ? 0.016 : 0.036);
            return;
        }

        aircraftRotationGroup.rotation.y = -0.62;
        aircraftPointerGroup.rotation.set(0, 0, 0);
        aircraftFloatGroup.position.set(0, 0, 0);
        aircraftFloatGroup.rotation.set(0, 0, 0);
    }

    function updateCamera(delta) {
        if (prefersReducedMotion) {
            flightState.cameraPosition.copy(flightState.targetCameraPosition);
            flightState.cameraTarget.copy(flightState.targetCameraTarget);
        } else {
            dampVector(flightState.cameraPosition, flightState.targetCameraPosition, 3, delta);
            dampVector(flightState.cameraTarget, flightState.targetCameraTarget, 3, delta);
        }

        const pointerStrength = flightState.isSmallScreen ? 0.28 : 1;
        tempCameraPosition.copy(flightState.cameraPosition);
        tempCameraPosition.x += flightState.pointerX * 0.1 * pointerStrength;
        tempCameraPosition.y += flightState.pointerY * 0.045 * pointerStrength;
        tempCameraTarget.copy(flightState.cameraTarget);

        camera.position.copy(tempCameraPosition);
        camera.lookAt(tempCameraTarget);
    }

    function updateEnvironment(delta, elapsed) {
        if (!prefersReducedMotion) {
            pathGroup.position.z = (elapsed * 0.42) % 1.7;
            pathGroup.rotation.y = flightState.pointerX * 0.014;

            if (atmospherePoints) {
                atmospherePoints.position.z = 4 + (elapsed * 0.08) % 4;
                atmospherePoints.rotation.y += delta * 0.018;
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
        window.removeEventListener("pagehide", cleanupScene);
        stageObserver?.disconnect();
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
    setFlightStage("hero");
    setupFlightStageObserver();
    scheduleInitialSizing();
    setupResizeObserver();
    loadAircraftModel();

    window.addEventListener("resize", requestResize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", resetPointerTarget, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", cleanupScene, { once: true });

    renderSceneOnce();
    startRenderLoop();
}
}

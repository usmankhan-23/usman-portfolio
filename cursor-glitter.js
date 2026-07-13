(() => {
    const canvas = document.querySelector("#cursor-glitter");

    if (!canvas) {
        return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d", { alpha: true });

    if (!ctx || reduceMotion) {
        canvas.style.display = "none";
        return;
    }

    const palette = [38, 42, 31, 145, 18, 202];
    const pointer = {
        x: window.innerWidth * 0.68,
        y: window.innerHeight * 0.36,
        px: window.innerWidth * 0.68,
        py: window.innerHeight * 0.36,
        active: false,
        speed: 0
    };
    const follower = {
        x: pointer.x,
        y: pointer.y
    };
    const particles = [];
    const ambient = [];

    let width = 0;
    let height = 0;
    let dpr = 1;
    let spawnCarry = 0;
    let lastTime = performance.now();

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        createAmbient();
    }

    function createAmbient() {
        ambient.length = 0;
        const count = Math.min(240, Math.max(90, Math.floor((width * height) / 9400)));

        for (let i = 0; i < count; i += 1) {
            ambient.push({
                x: Math.random() * width,
                y: Math.random() * height,
                depth: 0.18 + Math.random() * 0.82,
                size: 0.45 + Math.random() * 1.3,
                hue: palette[Math.floor(Math.random() * palette.length)],
                phase: Math.random() * Math.PI * 2,
                drift: 0.12 + Math.random() * 0.34
            });
        }
    }

    function setPointer(x, y) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;

        pointer.px = pointer.x;
        pointer.py = pointer.y;
        pointer.x = x;
        pointer.y = y;
        pointer.speed = Math.min(80, Math.hypot(dx, dy));
        pointer.active = true;
    }

    function addParticle(force = 1) {
        const angle = Math.random() * Math.PI * 2;
        const ring = 26 + Math.random() * (86 + pointer.speed * 0.9);
        const tangent = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.8;
        const hue = palette[Math.floor(Math.random() * palette.length)];
        const speed = 0.35 + Math.random() * 1.9 + pointer.speed * 0.015;

        particles.push({
            x: follower.x + Math.cos(angle) * ring,
            y: follower.y + Math.sin(angle) * ring,
            vx: Math.cos(tangent) * speed + (Math.random() - 0.5) * force,
            vy: Math.sin(tangent) * speed + (Math.random() - 0.5) * force,
            angle: tangent,
            spin: (Math.random() - 0.5) * 0.12,
            length: 4 + Math.random() * 17 + pointer.speed * 0.04,
            width: 0.8 + Math.random() * 1.8,
            hue,
            life: 0,
            maxLife: 48 + Math.random() * 56
        });
    }

    function spawn(dt) {
        const speedBoost = Math.min(7, pointer.speed * 0.08);
        spawnCarry += dt * (0.028 + speedBoost * 0.026);

        if (pointer.active) {
            spawnCarry += dt * 0.022;
        }

        while (spawnCarry >= 1) {
            addParticle(1 + speedBoost);
            spawnCarry -= 1;
        }

        if (particles.length > 360) {
            particles.splice(0, particles.length - 360);
        }
    }

    function drawAmbient(time) {
        const parallaxX = (follower.x - width / 2) * 0.035;
        const parallaxY = (follower.y - height / 2) * 0.025;

        for (const dot of ambient) {
            let x = dot.x + parallaxX * dot.depth + Math.cos(time * dot.drift + dot.phase) * 5;
            let y = dot.y + parallaxY * dot.depth + Math.sin(time * dot.drift + dot.phase) * 4;

            x = ((x % width) + width) % width;
            y = ((y % height) + height) % height;

            const alpha = 0.1 + dot.depth * 0.24;
            ctx.fillStyle = `hsla(${dot.hue}, 92%, 68%, ${alpha})`;
            ctx.fillRect(x, y, dot.size, dot.size);
        }
    }

    function drawHalo() {
        const radius = 150 + pointer.speed * 1.8;
        const halo = ctx.createRadialGradient(follower.x, follower.y, 0, follower.x, follower.y, radius);

        halo.addColorStop(0, "rgba(168, 115, 44, 0.18)");
        halo.addColorStop(0.42, "rgba(72, 107, 88, 0.09)");
        halo.addColorStop(1, "rgba(142, 62, 47, 0)");

        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(follower.x, follower.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawParticles() {
        for (let i = particles.length - 1; i >= 0; i -= 1) {
            const p = particles[i];
            const progress = p.life / p.maxLife;
            const alpha = Math.sin(progress * Math.PI) * 0.86;
            const len = p.length * (1 - progress * 0.28);
            const x2 = Math.cos(p.angle) * len;
            const y2 = Math.sin(p.angle) * len;

            ctx.lineWidth = p.width;
            ctx.strokeStyle = `hsla(${p.hue}, 96%, 66%, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p.x - x2 * 0.42, p.y - y2 * 0.42);
            ctx.lineTo(p.x + x2, p.y + y2);
            ctx.stroke();

            if (alpha > 0.5) {
                ctx.fillStyle = `hsla(${p.hue}, 100%, 72%, ${alpha * 0.42})`;
                ctx.fillRect(p.x, p.y, 1.4, 1.4);
            }

            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.986;
            p.vy *= 0.986;
            p.angle += p.spin;
            p.life += 1;

            if (p.life >= p.maxLife) {
                particles.splice(i, 1);
            }
        }
    }

    function render(now) {
        const dt = Math.min(32, now - lastTime);
        lastTime = now;

        follower.x += (pointer.x - follower.x) * 0.13;
        follower.y += (pointer.y - follower.y) * 0.13;
        pointer.speed *= 0.9;

        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = "lighter";
        drawAmbient(now * 0.001);
        drawHalo();
        spawn(dt);
        drawParticles();
        ctx.globalCompositeOperation = "source-over";

        window.requestAnimationFrame(render);
    }

    window.addEventListener("pointermove", (event) => {
        setPointer(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener("pointerdown", (event) => {
        setPointer(event.clientX, event.clientY);
        for (let i = 0; i < 28; i += 1) {
            addParticle(5);
        }
    }, { passive: true });

    window.addEventListener("touchmove", (event) => {
        if (event.touches.length > 0) {
            setPointer(event.touches[0].clientX, event.touches[0].clientY);
        }
    }, { passive: true });

    window.addEventListener("resize", resize);

    resize();
    for (let i = 0; i < 36; i += 1) {
        addParticle(2);
    }
    window.requestAnimationFrame(render);
})();

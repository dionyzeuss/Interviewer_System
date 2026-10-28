(() => {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const canHover = window.matchMedia("(hover: hover)").matches;

  /* ---------- 0. Smooth light/dark switch ---------- */
  const themeBtn = document.getElementById("themeToggle");
  let themeTimer = null;
  if (themeBtn) {
    // Capture phase: runs before the click handler in script.js changes the theme
    themeBtn.addEventListener(
      "click",
      () => {
        const root = document.documentElement;
        root.classList.add("theme-transition");
        clearTimeout(themeTimer);
        themeTimer = setTimeout(
          () => root.classList.remove("theme-transition"),
          800,
        );
      },
      true,
    );
  }

  /* ---------- 1. Card tilt ---------- */
  if (!reduceMotion && canHover) {
    const cards = document.querySelectorAll(
      ".welcome-card, .interviewer-card, .answer-card, .results-card",
    );

    cards.forEach((card) => {
      card.classList.add("tilt");

      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--rx", `${(-y * 13).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${(x * 16).toFixed(2)}deg`);
        card.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- 1b. Tiles and buttons tilt on their own ---------- */
  if (!reduceMotion && canHover) {
    const MINI =
      ".role-card, .session-info > div, .results-stats > div, .recording-panel, " +
      ".review-item, .timer-card, .primary-btn, .secondary-btn, .record-btn, .theme-toggle";

    document.querySelectorAll(MINI).forEach((el) => el.classList.add("mini"));

    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(MINI);
      if (!el) return;
      el.classList.add("mini");
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--tx", `${(-y * 14).toFixed(1)}deg`);
      el.style.setProperty("--ty", `${(x * 16).toFixed(1)}deg`);
    });

    document.addEventListener("pointerout", (e) => {
      const el = e.target.closest && e.target.closest(MINI);
      if (!el || el.contains(e.relatedTarget)) return;
      el.style.setProperty("--tx", "0deg");
      el.style.setProperty("--ty", "0deg");
    });
  }

  /* ---------- 2. Three.js background scene ---------- */
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  script.onload = initScene;
  script.onerror = () =>
    console.warn("3D background skipped: Three.js did not load.");
  document.head.appendChild(script);

  function initScene() {
    const THREE = window.THREE;
    if (!THREE) return;

    const canvas = document.createElement("canvas");
    canvas.id = "bg3d";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;" +
      "opacity:0;transition:opacity 1.4s ease;";
    document.body.prepend(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 8;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.PointLight(0xffffff, 1.1, 40);
    key.position.set(5, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0x60a5fa, 1.2, 40);
    rim.position.set(-6, -3, 3);
    scene.add(rim);

    // Hero object: a glossy torus knot
    const knotMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.55,
      roughness: 0.22,
      transparent: true,
      opacity: 0.92,
    });
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.15, 0.34, 180, 28),
      knotMat,
    );

    // Wireframe shell around it
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.1, 1),
      shellMat,
    );

    const hero = new THREE.Group();
    hero.add(knot, shell);
    scene.add(hero);

    // Left side: ring, gem, wireframe cube and a glossy orb
    const mk = (extra) =>
      new THREE.MeshStandardMaterial(
        Object.assign(
          { color: 0x2563eb, metalness: 0.55, roughness: 0.22 },
          extra,
        ),
      );
    const ringMat = mk({});
    const gemMat = mk({ flatShading: true, roughness: 0.15 });
    const orbMat = mk({ roughness: 0.1 });
    const cubeMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.27, 24, 90),
      ringMat,
    );
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.85), gemMat);
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.3), cubeMat);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 40, 40), orbMat);
    ring.position.set(0.4, 2.4, 0);
    gem.position.set(-1.1, 0.2, 1);
    cube.position.set(1.2, -1.2, -1);
    orb.position.set(-0.6, -2.6, 0.5);
    const left = new THREE.Group();
    left.add(ring, gem, cube, orb);
    scene.add(left);

    // Floating particles
    const count = 260;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0x2563eb,
      size: 0.05,
      transparent: true,
      opacity: 0.55,
    });
    const dots = new THREE.Points(dotGeo, dotMat);
    scene.add(dots);

    // Layout: hero sits to the right on wide screens, behind the content on phones
    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const wide = w > 900;
      hero.position.set(wide ? 4.6 : 0, wide ? -0.4 : 2.6, wide ? 0 : -3);
      hero.scale.setScalar(wide ? 1 : 0.7);
      left.visible = wide;
      left.position.set(-5.2, 0, -1);
    }
    resize();
    window.addEventListener("resize", resize);

    // Pointer parallax
    const mouse = { x: 0, y: 0 };
    window.addEventListener("pointermove", (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Colours follow the theme and the interview state
    const palette = {
      light: new THREE.Color(0x2563eb),
      dark: new THREE.Color(0x7db0ff),
      rec: new THREE.Color(0xdc2626),
    };
    const current = new THREE.Color(0x2563eb);
    const speakerEl = document.getElementById("speakerStatus");
    const micEl = document.getElementById("micIcon");
    let spin = 0.25;
    let pulse = 0;

    const clock = new THREE.Clock();
    let running = true;

    function frame() {
      if (!running) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      const recording = micEl && micEl.classList.contains("recording");
      const speaking = speakerEl && speakerEl.classList.contains("speaking");
      const dark = document.documentElement.dataset.theme === "dark";

      const target = recording
        ? palette.rec
        : dark
          ? palette.dark
          : palette.light;
      current.lerp(target, 0.06);
      knotMat.color.copy(current);
      shellMat.color.copy(current);
      dotMat.color.copy(current);
      ringMat.color.copy(current);
      gemMat.color.copy(current);
      orbMat.color.copy(current);
      cubeMat.color.copy(current);
      dotMat.opacity += ((dark ? 0.8 : 0.55) - dotMat.opacity) * 0.06;

      // Speed and pulse react to what the interviewer and candidate are doing
      spin += ((recording ? 1.1 : speaking ? 0.7 : 0.25) - spin) * 0.05;
      pulse += ((speaking ? 1 : 0) - pulse) * 0.08;
      const s = 1 + pulse * (0.06 + Math.sin(t * 7) * 0.04);

      knot.rotation.x += dt * spin;
      knot.rotation.y += dt * spin * 1.3;
      shell.rotation.y -= dt * spin * 0.5;
      shell.scale.setScalar(s);
      knot.scale.setScalar(s);
      dots.rotation.y = t * 0.02;
      ring.rotation.x += dt * spin * 0.9;
      ring.rotation.y += dt * spin * 0.5;
      ring.position.y = 2.4 + Math.sin(t * 0.8) * 0.2;
      gem.rotation.y += dt * spin * 1.2;
      gem.rotation.x += dt * spin * 0.4;
      gem.position.y = 0.2 + Math.sin(t * 0.9 + 1) * 0.25;
      cube.rotation.x += dt * spin * 0.6;
      cube.rotation.z += dt * spin * 0.8;
      orb.position.y = -2.6 + Math.sin(t * 1.1 + 2) * 0.3;

      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        running = false;
      } else if (!reduceMotion) {
        running = true;
        clock.getDelta();
        requestAnimationFrame(frame);
      }
    });

    if (reduceMotion) {
      renderer.render(scene, camera); // one still frame, no animation
    } else {
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(() => (canvas.style.opacity = "1"));
  }
})();

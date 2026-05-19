/* =====================================================
   Vertical Green — immersive 3D scrolling experience
   Three.js (floating leaves) + GSAP ScrollTrigger + Lenis
   ===================================================== */

window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('hide'), 700);
});

/* ----------------------------------------------------
   1. LENIS SMOOTH SCROLL
   ---------------------------------------------------- */
const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1.0,
  touchMultiplier: 1.4,
});
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

/* progress bar */
const progressBar = document.querySelector('.scroll-progress span');
lenis.on('scroll', ({ scroll, limit }) => {
  const p = limit ? (scroll / limit) * 100 : 0;
  if (progressBar) progressBar.style.width = p + '%';
});

/* ----------------------------------------------------
   2. THREE.JS — floating leaves over the whole site
   ---------------------------------------------------- */
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07110b, 0.06);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

/* Lights */
const ambient = new THREE.AmbientLight(0xb6dcb9, 0.6);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xcde9c9, 0.9);
dir.position.set(4, 6, 5);
scene.add(dir);
const rim = new THREE.PointLight(0x6fb578, 1.4, 30);
rim.position.set(-4, -2, 4);
scene.add(rim);

/* Procedural leaf texture (canvas) */
function makeLeafTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');

  // leaf body
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 130);
  grad.addColorStop(0, '#c5e8b3');
  grad.addColorStop(0.5, '#6ea76c');
  grad.addColorStop(1, '#264e2a');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(128, 16);
  ctx.bezierCurveTo(230, 60, 230, 200, 128, 240);
  ctx.bezierCurveTo(26, 200, 26, 60, 128, 16);
  ctx.fill();

  // central vein
  ctx.strokeStyle = 'rgba(20,50,25,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(128, 24);
  ctx.lineTo(128, 232);
  ctx.stroke();

  // side veins
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const y = 50 + i * 22;
    ctx.beginPath();
    ctx.moveTo(128, y);
    ctx.quadraticCurveTo(150 + i*4, y + 14, 200 - i*8, y + 22 + i*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(128, y);
    ctx.quadraticCurveTo(106 - i*4, y + 14, 56 + i*8, y + 22 + i*2);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

const leafTex = makeLeafTexture();
leafTex.minFilter = THREE.LinearFilter;

/* Leaves */
const leafCount = 70;
const leaves = [];
const leafGroup = new THREE.Group();
scene.add(leafGroup);

for (let i = 0; i < leafCount; i++) {
  const mat = new THREE.MeshStandardMaterial({
    map: leafTex,
    transparent: true,
    alphaTest: 0.15,
    side: THREE.DoubleSide,
    roughness: 0.85,
    metalness: 0.0,
    color: new THREE.Color().setHSL(0.3 + Math.random()*0.08, 0.45, 0.55),
  });
  const geo = new THREE.PlaneGeometry(0.9, 1.1);
  const mesh = new THREE.Mesh(geo, mat);

  mesh.position.set(
    (Math.random() - 0.5) * 22,
    (Math.random() - 0.5) * 26,
    (Math.random() - 0.5) * 14
  );
  mesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );

  const scale = 0.5 + Math.random() * 1.5;
  mesh.scale.set(scale, scale, scale);

  leaves.push({
    mesh,
    speed: 0.05 + Math.random() * 0.12,
    swayX: 0.4 + Math.random() * 0.9,
    swayY: 0.3 + Math.random() * 0.6,
    rotSpeed: (Math.random() - 0.5) * 0.005,
    phase: Math.random() * Math.PI * 2,
    baseY: mesh.position.y,
  });
  leafGroup.add(mesh);
}

/* Particles (dust / pollen) */
const pCount = 400;
const pGeo = new THREE.BufferGeometry();
const positions = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  positions[i*3]   = (Math.random() - 0.5) * 30;
  positions[i*3+1] = (Math.random() - 0.5) * 30;
  positions[i*3+2] = (Math.random() - 0.5) * 18;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const pMat = new THREE.PointsMaterial({
  color: 0xd6efce,
  size: 0.04,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const points = new THREE.Points(pGeo, pMat);
scene.add(points);

/* Mouse parallax */
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

/* Resize */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* Scroll-tracked camera move */
let scrollT = 0;
lenis.on('scroll', ({ scroll, limit }) => {
  scrollT = limit ? scroll / limit : 0;
});

/* Animate */
const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();

  // Leaves drift
  leaves.forEach((l, i) => {
    l.mesh.position.x += Math.sin(t * l.speed + l.phase) * 0.003 * l.swayX;
    l.mesh.position.y = l.baseY + Math.cos(t * l.speed * 0.7 + l.phase) * l.swayY;
    l.mesh.position.y -= 0.004 * l.speed; // gentle fall
    l.mesh.rotation.x += l.rotSpeed;
    l.mesh.rotation.y += l.rotSpeed * 0.7;

    // recycle leaves that fall too far
    if (l.mesh.position.y < -16) {
      l.mesh.position.y = 16;
      l.baseY = 16;
    }
  });

  // Particles slow drift
  const pos = points.geometry.attributes.position.array;
  for (let i = 0; i < pCount; i++) {
    pos[i*3+1] -= 0.005;
    if (pos[i*3+1] < -15) pos[i*3+1] = 15;
  }
  points.geometry.attributes.position.needsUpdate = true;
  points.rotation.y = t * 0.02;

  // Camera glide on scroll + mouse parallax
  const targetX = mouseX * 0.4 + Math.sin(scrollT * Math.PI * 2) * 0.3;
  const targetY = -mouseY * 0.3 + scrollT * -1.2;
  camera.position.x += (targetX - camera.position.x) * 0.04;
  camera.position.y += (targetY - camera.position.y) * 0.04;
  camera.position.z = 8 - scrollT * 1.2;
  camera.lookAt(0, 0, 0);

  // Rim light pulse
  rim.intensity = 1.2 + Math.sin(t * 0.6) * 0.3;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

/* ----------------------------------------------------
   3. GSAP SCROLL ANIMATIONS
   ---------------------------------------------------- */
gsap.registerPlugin(ScrollTrigger);

/* sync ScrollTrigger to Lenis */
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ----- HERO word reveal ----- */
gsap.to('.reveal-word', {
  opacity: 1,
  y: 0,
  filter: 'blur(0px)',
  duration: 1.6,
  ease: 'expo.out',
  stagger: 0.18,
  delay: 0.6,
});
gsap.to('.hero .reveal', {
  opacity: 1,
  y: 0,
  duration: 1.4,
  ease: 'power3.out',
  stagger: 0.18,
  delay: 1.4,
});

/* HERO bg slow zoom on scroll */
gsap.to('.hero-bg', {
  scale: 1.35,
  yPercent: 12,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
});

/* ----- Generic .reveal sections ----- */
gsap.utils.toArray('section:not(.hero) .reveal').forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 1.4,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});

/* ----- Big quote line-by-line reveal ----- */
gsap.utils.toArray('.line-reveal').forEach((line) => {
  gsap.from(line, {
    yPercent: 105,
    duration: 1.4,
    ease: 'power4.out',
    scrollTrigger: { trigger: line, start: 'top 88%' },
  });
});

/* Full-quote block lines */
gsap.utils.toArray('.line-reveal-block span').forEach((line, i) => {
  gsap.from(line, {
    yPercent: 110,
    duration: 1.6,
    ease: 'power4.out',
    delay: i * 0.12,
    scrollTrigger: {
      trigger: '.full-quote',
      start: 'top 70%',
    },
  });
});

/* ----- Parallax scene layers ----- */
gsap.utils.toArray('.parallax-scene').forEach((scene) => {
  const layers = scene.querySelectorAll('.layer');
  layers.forEach((layer) => {
    const depth = parseFloat(layer.dataset.depth || 0.2);
    gsap.to(layer, {
      yPercent: -30 * depth * 2,
      ease: 'none',
      scrollTrigger: {
        trigger: scene,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
  const card = scene.querySelector('.overlay-card');
  if (card) {
    gsap.from(card, {
      opacity: 0, y: 80,
      duration: 1.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: scene, start: 'top 70%' },
    });
  }
});

/* ----- Philosophy floating images ----- */
gsap.utils.toArray('.ph-img').forEach((img, i) => {
  gsap.to(img, {
    y: -60 + (i * -20),
    rotation: (i - 1) * 1.5,
    ease: 'none',
    scrollTrigger: {
      trigger: '.philosophy',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
  gsap.from(img, {
    opacity: 0,
    y: 80,
    duration: 1.4,
    ease: 'power3.out',
    delay: i * 0.15,
    scrollTrigger: { trigger: '.philosophy', start: 'top 70%' },
  });
});

/* ----- Horizontal pinned products ----- */
const track = document.querySelector('.track');
if (track) {
  const moveX = () => -(track.scrollWidth - window.innerWidth + 80);
  gsap.to(track, {
    x: moveX,
    ease: 'none',
    scrollTrigger: {
      trigger: '.products',
      start: 'top top',
      end: () => `+=${track.scrollWidth}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  /* per-card tilt on enter */
  gsap.utils.toArray('.product-card').forEach((card, i) => {
    gsap.from(card, {
      opacity: 0.4,
      y: 50,
      rotation: i % 2 ? -3 : 3,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        containerAnimation: ScrollTrigger.getById('productsScroll'),
        start: 'left 90%',
      },
    });
  });
}

/* ----- Project grid stagger ----- */
gsap.utils.toArray('.proj').forEach((p, i) => {
  gsap.from(p, {
    opacity: 0, y: 60,
    duration: 1.2,
    ease: 'power3.out',
    delay: (i % 4) * 0.08,
    scrollTrigger: { trigger: p, start: 'top 90%' },
  });
});

/* ----- Full quote bg parallax ----- */
gsap.to('.full-quote', {
  backgroundPosition: '50% 80%',
  ease: 'none',
  scrollTrigger: {
    trigger: '.full-quote',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  },
});

/* ----- Stats counter ----- */
gsap.utils.toArray('.num').forEach((el) => {
  const target = parseInt(el.dataset.target, 10);
  const obj = { val: 0 };
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.floor(obj.val); },
      });
    },
  });
});

/* ----- CTA bg parallax ----- */
gsap.to('.cta-bg', {
  yPercent: -15,
  scale: 1.2,
  ease: 'none',
  scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true },
});

/* smooth anchor scroll */
document.querySelectorAll('.nav a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) lenis.scrollTo(target, { offset: -20, duration: 1.6 });
  });
});

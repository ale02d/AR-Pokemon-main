import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { MindARThree } from 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  ICONS,
  STATUS_MESSAGES,
  TIMING,
  TARGET_DIAMETER_M,
  DEFAULT_MODEL_ROTATION,
  DEFAULT_SKELETON_ROTATION,
  DEFAULT_MODEL_SCALE,
  IDENTITY_ROTATION,
} from './config/config.js';

import { targetConfigs } from './config/targetInfo.js';

const dom = {
  container: document.querySelector('#ar-container'),
  startButton: document.querySelector('#start-ar'),
  changeButton: document.querySelector('#btn-change'),
  statusText: document.querySelector('#status-text'),
  scanEffect: document.querySelector('#scan-effect'),
  scannerBadgeIcon: document.querySelector('.scanner-badge img'),
  uiLoading: document.querySelector('#ui-loading'),
  uiCamera: document.querySelector('#ui-camera'),
  uiScanning: document.querySelector('#ui-scanning'),
  uiDetected: document.querySelector('#ui-detected'),
};

dom.cameraLabel = dom.startButton.querySelector('.camera-label');
dom.cameraIcon = dom.startButton.querySelector('.camera-icon');
dom.loadingTitle = dom.uiLoading.querySelector('h1');
dom.changeButtonLabel = dom.changeButton.querySelector('span');

const eatSound = new Audio('Assets/captura.mp3');
const gltfLoader = new GLTFLoader();
const clock = new THREE.Clock();


const FOUND_SOUND_FILE = 'Assets/captura2.mp3';
const foundSound = FOUND_SOUND_FILE ? new Audio(FOUND_SOUND_FILE) : null;
let audioCtx = null;
const unlockAudio = () => {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (error) {
    console.warn('Audio no disponible:', error);
  }
};

const playFoundSound = () => {
  if (foundSound) {
    foundSound.currentTime = 0;
    foundSound.play().catch(() => {});
    return;
  }

  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const notes = [659.25, 783.99, 987.77, 1318.51];

  notes.forEach((frequency, index) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const start = now + index * 0.09;

    oscillator.type = 'square';
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.3);
  });
};

const createStarTexture = (color) => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.4;
  const inner = outer * 0.45;

  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = color;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const STAR_TEXTURES = ['#ffd60a', '#e63946', '#9d4edd', '#ff7b00', '#ff4fa3', '#ffffff']
  .map(createStarTexture);

const burstParticleGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
const burstParticleMaterial = new THREE.MeshStandardMaterial({ color: 0xe63946 });


let started = false;
let mindarThree;
let renderer;
let scene;
let camera;
let sceneReady = false;
let activeTargetState = null;
let targetStates = [];
let isTransitioning = false;

dom.uiLoading.style.display = 'block';
dom.uiCamera.style.display = 'none';
dom.uiScanning.style.display = 'none';
dom.uiDetected.style.display = 'none';
dom.changeButton.style.display = 'none';


const updateStatus = (message) => {
  dom.statusText.textContent = message;
};

const updateChangeButtonLabel = (state) => {
  dom.changeButtonLabel.textContent = state && state.modelIndex === -1 ? 'REINICIAR' : 'Capturar';
};

const setControlState = (state) => {
  dom.startButton.dataset.state = state;

  if (state === 'starting') {
    dom.startButton.disabled = true;
    dom.cameraLabel.textContent = 'Iniciando cámara AR';
    dom.cameraIcon.src = ICONS.cameraOn;
    dom.scannerBadgeIcon.src = ICONS.badgeFood;
    dom.scannerBadgeIcon.classList.remove('is-qr');
    dom.scannerBadgeIcon.classList.add('is-food');
    dom.loadingTitle.textContent = 'Cargando';
    document.body.classList.add('ar-starting');
    document.body.classList.remove('ar-active', 'ar-paused');
    return;
  }

  dom.startButton.disabled = false;

  if (state === 'active') {
    dom.cameraLabel.textContent = 'Pausar cámara AR';
    dom.cameraIcon.src = ICONS.cameraOff;
    document.body.classList.add('ar-active');
    document.body.classList.remove('ar-paused', 'ar-starting');
    return;
  }

  if (state === 'paused') {
    dom.cameraLabel.textContent = 'Reanudar cámara AR';
    dom.cameraIcon.src = ICONS.cameraOn;
    dom.scannerBadgeIcon.src = ICONS.badgeQr;
    dom.scannerBadgeIcon.classList.remove('is-food');
    dom.scannerBadgeIcon.classList.add('is-qr');
    document.body.classList.remove('ar-active');
    document.body.classList.add('ar-paused');
    document.body.classList.remove('ar-starting');
    dom.loadingTitle.textContent = 'Listo para comenzar';
    return;
  }

  dom.cameraLabel.textContent = 'Iniciar cámara AR';
  dom.cameraIcon.src = ICONS.cameraOn;
  dom.scannerBadgeIcon.src = ICONS.badgeQr;
  dom.scannerBadgeIcon.classList.remove('is-food');
  dom.scannerBadgeIcon.classList.add('is-qr');
  document.body.classList.remove('ar-active', 'ar-paused', 'ar-starting');
  dom.loadingTitle.textContent = 'Listo para comenzar';
};

const loadGltf = (path) => {
  return new Promise((resolve, reject) => {
    gltfLoader.load(path, (gltf) => resolve(gltf), undefined, reject);
  });
};

const createTargetState = (config) => ({
  config,
  anchor: mindarThree.addAnchor(config.targetIndex),
  currentModel: null,
  skeletonModel: null,
  infoPanel: null,
  loadTimeout: null,
  mixer: null,
  idleBase: null,
  modelIndex: 0,
  isLoadingModel: false,
  isSkeletonExpired: false,
  isVisible: false,
});

const applyOrientation = (object3d, config, rotationPreset) => {
  const rotation = config.usesIdentityRotation
    ? IDENTITY_ROTATION
    : config.rotation ?? rotationPreset;
  object3d.rotation.set(rotation.x, rotation.y, rotation.z);
};

const applyScale = (object3d, config) => {
  const scale = config.scale ?? DEFAULT_MODEL_SCALE;
  object3d.scale.setScalar(scale);
};

const createInfoPanel = (config) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');

  // Fondo morado
  ctx.fillStyle = 'rgba(60, 9, 108, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Borde amarillo con brillo
  ctx.strokeStyle = '#ffd60a';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ffd60a';
  ctx.shadowBlur = 15;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  ctx.shadowBlur = 0;

  // Título
  ctx.fillStyle = '#ffd60a';
  ctx.shadowColor = '#ffd60a';
  ctx.shadowBlur = 15;

  ctx.font = '700 34px Rajdhani';
  ctx.fillText(config.title, 20, 40);

  ctx.shadowBlur = 0;

  // Línea separadora
  ctx.strokeStyle = 'rgba(255, 214, 10, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, 60);
  ctx.lineTo(490, 60);
  ctx.stroke();

  // Estadísticas
  ctx.fillStyle = '#ffffff';
  ctx.font = '500 22px Rajdhani';

  config.stats.forEach((stat, index) => {
    ctx.fillText(`${stat.label}: ${stat.value}`, 20, 100 + index * 45);
  });

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const geometry = new THREE.PlaneGeometry(1.6, 0.8);
  const panel = new THREE.Mesh(geometry, material);

  panel.position.set(0, 1.2, 0);
  return panel;
};

const sessionId = globalThis.crypto?.randomUUID
  ? globalThis.crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const callApiEndpoint = (target) => {
  fetch("https://register-interaction-api-psi.vercel.app/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      interactive: "comedor-ar",
      target: target,
      session: sessionId,
      device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
      os: navigator.userAgent
    })
  });
};

const createParticles = (state, position) => {
  const particles = [];
  for (let i = 0; i < 10; i++) {
    const cube = new THREE.Mesh(burstParticleGeometry, burstParticleMaterial);
    cube.position.copy(position);
    cube.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.05,
      Math.random() * 0.05,
      (Math.random() - 0.5) * 0.05
    );

    state.anchor.group.add(cube);
    particles.push(cube);
  }

  const animateParticles = () => {
    for (let index = particles.length - 1; index >= 0; index--) {
      const particle = particles[index];
      particle.position.add(particle.userData.velocity);
      particle.userData.velocity.y -= TIMING.particleGravity;
      particle.scale.multiplyScalar(TIMING.particleDecay);

      if (particle.scale.x < 0.01) {
        state.anchor.group.remove(particle);
        particles.splice(index, 1);
      }
    }

    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    }
  };

  animateParticles();
};

const createStarBurst = (state, origin = new THREE.Vector3(0, 0.4, 0), count = 36) => {
  const group = new THREE.Group();
  group.position.copy(origin);
  group.renderOrder = 10;
  state.anchor.group.add(group);

  const stars = [];

  for (let i = 0; i < count; i++) {
    const material = new THREE.SpriteMaterial({
      map: STAR_TEXTURES[i % STAR_TEXTURES.length],
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false,
    });
    const star = new THREE.Sprite(material);

    // Dirección aleatoria en todas direcciones
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 0.015 + Math.random() * 0.03;

    star.userData.velocity = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    ).multiplyScalar(speed);
    star.userData.baseScale = 0.1 + Math.random() * 0.14;
    star.userData.spin = (Math.random() - 0.5) * 0.2;
    star.userData.life = 0;
    star.scale.setScalar(0.001);

    group.add(star);
    stars.push(star);
  }

  const animate = () => {
    let alive = 0;

    stars.forEach((star) => {
      if (star.userData.life >= 1) return;
      alive++;

      star.userData.life += 0.018;
      const life = Math.min(star.userData.life, 1);

      star.position.add(star.userData.velocity);
      star.userData.velocity.multiplyScalar(0.97);
      star.userData.velocity.y -= 0.0003;
      star.material.rotation += star.userData.spin;

      const popIn = Math.min(life * 8, 1);
      star.scale.setScalar(star.userData.baseScale * popIn * (1 - life * 0.4));
      star.material.opacity = 1 - life * life;
    });

    if (alive > 0) {
      requestAnimationFrame(animate);
      return;
    }

    state.anchor.group.remove(group);
    stars.forEach((star) => star.material.dispose());
  };

  requestAnimationFrame(animate);
};

// Reduce las líneas de corte de las UVs: sin mipmaps (que mezclan los bordes)
// y con filtrado anisotrópico para mantener la nitidez
const improveTextures = (model) => {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (material.map) {
        material.map.anisotropy = maxAniso;
        material.map.generateMipmaps = false;
        material.map.minFilter = THREE.LinearFilter;
        material.map.needsUpdate = true;
      }
    });
  });
};

const stopModelAnimation = (state) => {
  if (state.mixer) {
    state.mixer.stopAllAction();
    state.mixer = null;
  }
  state.idleBase = null;
};

// Usa las animaciones del .glb; si no tiene, hace una animación "idle" procedural
const startModelAnimation = (state, gltf) => {
  stopModelAnimation(state);

  if (gltf.animations && gltf.animations.length > 0) {
    state.mixer = new THREE.AnimationMixer(gltf.scene);
    const idleClip =
      gltf.animations.find((clip) => /idle|walk|fly|float|loop/i.test(clip.name)) ||
      gltf.animations[0];
    state.mixer.clipAction(idleClip).play();
    console.log('Animación:', idleClip.name, `(${gltf.animations.length} disponibles)`);
    return;
  }

  console.log('El modelo no trae animaciones, usando animación idle');
  state.idleBase = {
    y: gltf.scene.position.y,
    rotY: gltf.scene.rotation.y,
    scale: gltf.scene.scale.x,
  };
};

const updateModelAnimation = (state, delta, elapsed) => {
  if (!state.currentModel) return;

  if (state.mixer) {
    state.mixer.update(delta);
    return;
  }

  if (state.idleBase) {
    const model = state.currentModel;
    model.position.y = state.idleBase.y + Math.sin(elapsed * 2.2) * 0.05;
    model.rotation.y = state.idleBase.rotY + Math.sin(elapsed * 1.1) * 0.25;
    const breathe = 1 + Math.sin(elapsed * 2.2) * 0.03;
    model.scale.setScalar(state.idleBase.scale * breathe);
  }
};

const safeStarBurst = (state) => {
  try {
    createStarBurst(state);
  } catch (error) {
    console.error('Error en la explosión de estrellas:', error);
  }
};

const pulseSkeleton = (state) => {
  const start = performance.now();
  const baseScale = state.skeletonModel.scale.x;

  const animate = (time) => {
    if (!state.skeletonModel) return;

    const t = (time - start) * 0.005;
    const pulseScale = baseScale * (1 + Math.sin(t) * 0.05);
    state.skeletonModel.scale.set(pulseScale, pulseScale, pulseScale);
    state.skeletonModel.rotation.y += 0.01;

    state.skeletonModel.traverse((child) => {
      if (child.isMesh) {
        child.material.opacity = 0.7 + Math.sin(t) * 0.3;
      }
    });

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
};

const loadSkeleton = async (state) => {
  const model = (await loadGltf(state.config.skeletonPath)).scene;

  if (!state.isVisible || state.isSkeletonExpired || state.currentModel) {
    return;
  }

  state.skeletonModel = model;

  // Silueta morada brillante
  state.skeletonModel.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0x9d4edd,
        emissive: 0x7b2cbf,
        emissiveIntensity: 3.5,
        transparent: true,
        opacity: 0.9,
      });
    }
  });

  applyScale(state.skeletonModel, state.config);
  state.skeletonModel.position.set(0, 0, 0);
  applyOrientation(state.skeletonModel, state.config, DEFAULT_SKELETON_ROTATION);

  state.anchor.group.add(state.skeletonModel);
  pulseSkeleton(state);
};

const fadeOutSkeleton = (state, duration = TIMING.pulseFadeMs) => {
  if (!state.skeletonModel) return;

  const skeleton = state.skeletonModel;
  const startTime = performance.now();

  const fade = (time) => {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);

    skeleton.traverse((child) => {
      if (child.isMesh) {
        child.material.opacity = 1 - t;
      }
    });

    if (t < 1) {
      requestAnimationFrame(fade);
      return;
    }

    state.anchor.group.remove(skeleton);
    if (state.skeletonModel === skeleton) {
      state.skeletonModel = null;
    }
  };

  requestAnimationFrame(fade);
};

const loadModel = async (state, path) => {
  if (state.isLoadingModel) return;

  state.isLoadingModel = true;
  dom.changeButton.disabled = true;

  if (state.currentModel) {
    createParticles(state, state.currentModel.position.clone());
    stopModelAnimation(state);
    state.anchor.group.remove(state.currentModel);
    state.currentModel = null;
  }

  try {
    const gltf = await loadGltf(path);
    const model = gltf.scene;

    if (!state.isVisible) {
      return;
    }

    state.currentModel = model;
    improveTextures(model);
    applyScale(state.currentModel, state.config);
    state.currentModel.position.set(0, 0, 0);
    applyOrientation(state.currentModel, state.config, DEFAULT_MODEL_ROTATION);

    startModelAnimation(state, gltf);
    state.anchor.group.add(state.currentModel);
    console.log('Modelo cargado:', path, 'escala:', state.config.scale);

    // Explosión de estrellas cuando aparece el Pokémon
    if (state.modelIndex === 0) {
      safeStarBurst(state);
    }
  } catch (error) {
    console.error('Error al cargar el modelo:', error);
    updateStatus(STATUS_MESSAGES.modelLoadError(state.config.statusLabel));
  } finally {
    state.isLoadingModel = false;
    if (activeTargetState === state && state.currentModel) {
      dom.changeButton.disabled = false;
    }
  }
};

const clearTargetModels = (state) => {
  if (state.loadTimeout) {
    clearTimeout(state.loadTimeout);
    state.loadTimeout = null;
  }

  if (state.skeletonModel) {
    state.anchor.group.remove(state.skeletonModel);
    state.skeletonModel = null;
  }

  if (state.currentModel) {
    stopModelAnimation(state);
    state.anchor.group.remove(state.currentModel);
    state.currentModel = null;
  }

  if (state.infoPanel) {
    state.anchor.group.remove(state.infoPanel);
    state.infoPanel = null;
  }

  state.modelIndex = 0;
  state.isLoadingModel = false;
  state.isSkeletonExpired = false;
  updateChangeButtonLabel(state);
};

const showTargetUi = (state) => {
  activeTargetState = state;
  dom.uiScanning.style.display = 'none';
  dom.uiDetected.style.display = 'block';
  dom.uiDetected.textContent = 'Target detectado: ' + state.config.title;
  // 'flex' (no 'block') para conservar el layout de la pokébola + texto
  dom.changeButton.style.display = 'flex';
  dom.changeButton.disabled = true;
  updateChangeButtonLabel(state);
};

const hideTargetUi = (state) => {
  if (activeTargetState !== state) return;

  const visibleState = targetStates.find((targetState) => targetState.isVisible && targetState !== state);
  activeTargetState = visibleState || null;

  if (activeTargetState) {
    showTargetUi(activeTargetState);
    return;
  }

  dom.uiDetected.style.display = 'none';
  dom.uiScanning.style.display = started ? 'block' : 'none';
  dom.changeButton.style.display = 'none';
  dom.scanEffect.style.display = 'none';
};

const handleTargetFound = (state) => {
  if (state.isVisible) return;

  state.isVisible = true;
  showTargetUi(state);
  updateStatus(STATUS_MESSAGES.targetDetected(state.config.statusLabel));

  if (!state.infoPanel) {
    state.infoPanel = createInfoPanel(state.config);
    state.anchor.group.add(state.infoPanel);
  }

  callApiEndpoint(state.config.title);
  playFoundSound();
  safeStarBurst(state);
  dom.scanEffect.style.display = 'block';

  if (state.loadTimeout || state.currentModel || state.skeletonModel) return;

  state.isSkeletonExpired = false;

  loadSkeleton(state).catch((error) => {
    console.error('Error al cargar skeleton:', error);
    updateStatus(STATUS_MESSAGES.skeletonLoadError(state.config.statusLabel));
  });

  state.loadTimeout = setTimeout(() => {
    state.isSkeletonExpired = true;
    fadeOutSkeleton(state, TIMING.skeletonFadeMs);

    setTimeout(() => {
      loadModel(state, state.config.models[0]);
      if (activeTargetState === state) {
        dom.scanEffect.style.display = 'none';
      }
    }, TIMING.skeletonFadeMs);

    state.loadTimeout = null;
  }, TIMING.skeletonHoldMs);
};

const handleTargetLost = (state) => {
  if (!state.isVisible && !state.currentModel && !state.skeletonModel && !state.infoPanel) return;

  state.isVisible = false;
  clearTargetModels(state);
  hideTargetUi(state);
  updateStatus(STATUS_MESSAGES.scanning);
};

const forceTargetLost = (state) => {
  handleTargetLost(state);
  state.anchor.group.visible = false;
};

const setArLayerVisible = (isVisible) => {
  if (!renderer || !renderer.domElement) return;
  renderer.domElement.style.visibility = isVisible ? 'visible' : 'hidden';
};

const clearArFrame = () => {
  if (!renderer) return;
  renderer.clear(true, true, true);
};

const setupTarget = (state) => {
  state.anchor.onTargetFound = () => handleTargetFound(state);
  state.anchor.onTargetLost = () => handleTargetLost(state);
};

const setupScene = () => {
  if (sceneReady) return;

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x7a8ca5, 1.4);
  scene.add(hemisphereLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(1, 2, 1.5);
  scene.add(directionalLight);

  targetStates = targetConfigs.map(createTargetState);
  targetStates.forEach(setupTarget);

  sceneReady = true;
};

const stopAR = () => {
  if (!started || !mindarThree || isTransitioning) return;

  isTransitioning = true;
  dom.startButton.disabled = true;

  targetStates.forEach(forceTargetLost);
  activeTargetState = null;
  clearArFrame();
  setArLayerVisible(false);

  renderer.setAnimationLoop(null);
  mindarThree.stop();
  started = false;

  dom.scanEffect.style.display = 'none';
  dom.uiScanning.style.display = 'none';
  dom.uiDetected.style.display = 'none';
  dom.uiCamera.style.display = 'none';
  dom.uiLoading.style.display = 'block';
  dom.changeButton.style.display = 'none';

  updateStatus(STATUS_MESSAGES.paused);
  setControlState('paused');
  isTransitioning = false;
};

const startAR = async () => {
  if (started || isTransitioning) return;

  unlockAudio();
  isTransitioning = true;
  setControlState('starting');
  updateStatus(STATUS_MESSAGES.requestingCamera);
  dom.uiLoading.style.display = 'grid';
  dom.uiCamera.style.display = 'none';

  try {
    if (!mindarThree) {
      mindarThree = new MindARThree({
        container: dom.container,
        imageTargetSrc: 'Assets/Targets/targetsQR.mind',
        uiScanning: false,
        uiLoading: false,
        maxTrack: targetConfigs.length,
        filterMinCF: 0.0001,
        filterBeta: 0.01,
      });

      ({ renderer, scene, camera } = mindarThree);
      setupScene();
    }

    setArLayerVisible(true);
    await mindarThree.start();
    dom.uiLoading.style.display = 'none';
    dom.uiCamera.style.display = 'none';
    dom.uiScanning.style.display = 'block';
    updateStatus(STATUS_MESSAGES.scanning);
    started = true;
    setControlState('active');

    clock.getDelta();

    renderer.setAnimationLoop(() => {
      if (!started) return;

      const delta = clock.getDelta();
      const elapsed = clock.elapsedTime;

      targetStates.forEach((state) => {
        if (state.anchor.group.visible && !state.isVisible) {
          handleTargetFound(state);
        } else if (!state.anchor.group.visible && state.isVisible) {
          handleTargetLost(state);
        }

        if (state.infoPanel) {
          state.infoPanel.lookAt(camera.position);
        }

        updateModelAnimation(state, delta, elapsed);

      });

      renderer.render(scene, camera);
    });
  } catch (error) {
    console.error(error);
    updateStatus(STATUS_MESSAGES.startError);
    setControlState('idle');
  } finally {
    isTransitioning = false;
  }
};


dom.startButton.addEventListener('click', () => {
  if (started) {
    stopAR();
    return;
  }
  startAR();
});

dom.changeButton.addEventListener('click', () => {
  const state = activeTargetState;

  if (!state || !state.anchor || state.isLoadingModel) return;

  if (state.currentModel) {
    createParticles(state, state.currentModel.position.clone());
  }

  state.modelIndex++;

  if (state.modelIndex >= state.config.models.length) {
    state.modelIndex = -1;
  }

  const isEating = state.modelIndex !== 0;

  if (isEating) {
    eatSound.currentTime = 0;
    eatSound.play();
  }

  if (state.modelIndex !== -1) {
    updateChangeButtonLabel(state);
    loadModel(state, state.config.models[state.modelIndex]);
    return;
  }

  if (state.currentModel) {
    stopModelAnimation(state);
    state.anchor.group.remove(state.currentModel);
    state.currentModel = null;
  }

  updateChangeButtonLabel(state);
});

setControlState('idle');
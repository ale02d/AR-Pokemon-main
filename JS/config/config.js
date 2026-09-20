export const ICONS = {
  cameraOn: '../../Assets/svg/camera-ON.svg',
  cameraOff: '../../Assets/svg/camera-OFF.svg',
  badgeQr: '../../Assets/svg/qr.svg',
  badgeFood: '../../Assets/svg/qr.svg', 
};

export const STATUS_MESSAGES = {
  requestingCamera:
    'Solicitando acceso a la cámara... Por favor permite el acceso a la cámara.',
  scanning: 'Busca una tarjeta Pokémon con la cámara.',
  paused: 'Cámara en pausa. Toca el botón para continuar.',
  startError: 'No se pudo iniciar la cámara. Usa localhost o HTTPS y acepta los permisos.',
  targetDetected: (label) => `¡Encontraste a ${label}!`,
  modelLoadError: (label) => `No se pudo cargar el modelo de ${label}.`,
  skeletonLoadError: (label) => `No se pudo cargar el esqueleto de ${label}.`,
};

export const TIMING = {particleGravity: 0.002, particleDecay: 0.95, pulseFadeMs: 400, skeletonHoldMs: 2000,skeletonFadeMs: 400,     
};

export const TARGET_DIAMETER_M = 0.175;
export const DEFAULT_MODEL_SCALE = 1;
export const DEFAULT_MODEL_ROTATION = { x: Math.PI / 2, y: 0, z: 0 };
export const DEFAULT_SKELETON_ROTATION = { x: Math.PI / 2, y: 0, z: 0 };
export const IDENTITY_ROTATION = { x: 0, y: 0, z: 0 };
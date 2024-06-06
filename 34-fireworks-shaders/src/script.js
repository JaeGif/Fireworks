import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import fireworkVertex from './shaders/vertex.glsl';
import fireworkFragment from './shaders/fragment.glsl';
import gsap from 'gsap';
import { Sky } from 'three/addons/objects/Sky.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
/**
 * Base
 */
// Debug

let gui;
if (window.location.hash === '#debug') gui = new GUI({ width: 340 });
const gltfLoader = new GLTFLoader();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// import suzanne mesh

let suzanne = null;

gltfLoader.load('./suzanne.glb', (gltf) => {
  suzanne = gltf.scene;
});

// Loaders
const textureLoader = new THREE.TextureLoader();
const textures = [
  textureLoader.load('./particles/1.png'),
  textureLoader.load('./particles/2.png'),
  textureLoader.load('./particles/3.png'),
  textureLoader.load('./particles/4.png'),
  textureLoader.load('./particles/5.png'),
  textureLoader.load('./particles/6.png'),
  textureLoader.load('./particles/7.png'),
  textureLoader.load('./particles/8.png'),
];
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight + 1,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};
sizes.resolution = new THREE.Vector2(
  sizes.width * sizes.pixelRatio,
  sizes.height * sizes.pixelRatio
);

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight + 1;
  sizes.resolution.set(
    sizes.width * sizes.pixelRatio,
    sizes.height * sizes.pixelRatio
  );
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2); // in case user changes screens
  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(1.5, 0, 6);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Fireworks
 */
const mousePosition = {
  x: 0,
  y: 0,
};
canvas.addEventListener('mousemove', (e) => {
  mousePosition.x = (e.clientX / sizes.width) * 2 - 1;
  mousePosition.y = -(e.clientY / sizes.height) * 2 + 1;
});
const createFireworks = (position, size, texture, radius, color, type) => {
  let geometry = null;
  let count = Math.round(400 + Math.random() * 1000);

  if (type === 'suzanne') {
    geometry = suzanne.children[0].geometry;
    count = suzanne.children[0].geometry.attributes.position.count;
  } else {
    geometry = new THREE.BufferGeometry();
  }

  const positionArray = new Float32Array(count * 3);
  const sizesArray = new Float32Array(count);
  const timeMultipliersArray = new Float32Array(count);
  // const suzanneArray = suzanne.children[0].geometry.attributes.position.array;
  for (let i = 0; i < count; i++) {
    // need to create 1 spherical/obj
    const i3 = i * 3;
    if (type !== 'suzanne') {
      const spherical = new THREE.Spherical(
        radius * (0.75 + Math.random() * 0.25),
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      );

      const position = new THREE.Vector3();
      position.setFromSpherical(spherical);

      positionArray[i3 + 0] = position.x;
      positionArray[i3 + 1] = position.y;
      positionArray[i3 + 2] = position.z;
    }

    sizesArray[i] = Math.random();

    timeMultipliersArray[i] = 1 + Math.random(); // add the 1 so the random particles
    // lifespan is faster
  }
  if (type !== 'suzanne') {
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positionArray, 3)
    );
  }

  geometry.setAttribute(
    'aSize',
    new THREE.Float32BufferAttribute(sizesArray, 1)
  );
  geometry.setAttribute(
    'aTimeMultiplier',
    new THREE.Float32BufferAttribute(timeMultipliersArray, 1)
  );

  // material
  texture.flipY = false;
  const material = new THREE.ShaderMaterial({
    vertexShader: fireworkVertex,
    fragmentShader: fireworkFragment,
    uniforms: {
      uSize: new THREE.Uniform(size),
      uResolution: new THREE.Uniform(sizes.resolution),
      uTexture: new THREE.Uniform(texture),
      uColor: new THREE.Uniform(color),
      uProgress: new THREE.Uniform(0),
    },
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });

  // Points
  const firework = new THREE.Points(geometry, material);
  firework.rotation.set(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  );

  firework.position.copy(position);
  scene.add(firework);

  // destroy

  const destroy = () => {
    // destroys firework
    // EXTREMELY IMPORTANT TO CLEAN GPU MEMORY
    scene.remove(firework);
    geometry.dispose();
    material.dispose();
  };

  // animate
  gsap.to(material.uniforms.uProgress, {
    value: 1,
    duration: 3,
    ease: 'linear',
    onComplete: destroy,
  });
};

const createRandomFirework = () => {
  const position = new THREE.Vector3(
    mousePosition.x * 2,
    mousePosition.y * 2,
    Math.random() * 4 - 1
  );
  const size = 0.1 + Math.random() * 0.1;
  // pick random texture
  const texture = textures[Math.floor(Math.random() * textures.length)];

  const radius = 0.5 + Math.random();
  const color = new THREE.Color();
  color.setHSL(Math.random() * 360, 1, 0.55); // use HSL for random colors
  const typeI = Math.floor(Math.random() * 2);
  let type = 'spherical';
  switch (typeI) {
    case 0:
      type = 'suzanne';
      break;
    case 1:
      type = 'spherical';
      break;
    default:
      type = 'spherical';
      break;
  }

  createFireworks(position, size, texture, radius, color, type);
};

canvas.addEventListener('click', createRandomFirework);

// add the sky class for a nicer background
// Sky

const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const sun = new THREE.Vector3();

/// GUI

const skyParameters = {
  turbidity: 10,
  rayleigh: 3,
  mieCoefficient: 0.1,
  mieDirectionalG: 0.95,
  elevation: -2.15,
  azimuth: 180,
  exposure: renderer.toneMappingExposure,
};

function updateSky() {
  const uniforms = sky.material.uniforms;
  uniforms['turbidity'].value = skyParameters.turbidity;
  uniforms['rayleigh'].value = skyParameters.rayleigh;
  uniforms['mieCoefficient'].value = skyParameters.mieCoefficient;
  uniforms['mieDirectionalG'].value = skyParameters.mieDirectionalG;

  const phi = THREE.MathUtils.degToRad(90 - skyParameters.elevation);
  const theta = THREE.MathUtils.degToRad(skyParameters.azimuth);

  sun.setFromSphericalCoords(1, phi, theta);

  uniforms['sunPosition'].value.copy(sun);

  renderer.toneMappingExposure = skyParameters.exposure;
  renderer.render(scene, camera);
}
if (gui) {
  gui.add(skyParameters, 'turbidity', 0.0, 20.0, 0.1).onChange(updateSky);
  gui.add(skyParameters, 'rayleigh', 0.0, 4, 0.001).onChange(updateSky);
  gui.add(skyParameters, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(updateSky);
  gui.add(skyParameters, 'mieDirectionalG', 0.0, 1, 0.001).onChange(updateSky);
  gui.add(skyParameters, 'elevation', -5, 10, 0.01).onChange(updateSky);
  gui.add(skyParameters, 'azimuth', -180, 180, 0.1).onChange(updateSky);
  gui.add(skyParameters, 'exposure', 0, 1, 0.0001).onChange(updateSky);
}
updateSky();

/**
 * Animate
 */

// 1. Explode
// 2. Scale Up
// 3. Fall
// 4. Scale down
// 5. Twinkle out

const tick = () => {
  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

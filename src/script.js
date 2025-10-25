import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug / GUI
const gui = new dat.GUI({ width: 310 })

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(3, 3, 3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Galaxy generator parameters
 */
const parameters = {
  stars: 100000,
  size: 0.01,
  radius: 5,
  branches: 3,
  spin: 1,
  randomness: 0.2,
  randomnessPower: 3,
  insideColor: '#ff6030',
  outsideColor: '#1b3984'
}

/**
 * Galaxy state
 */
let geometry = null
let material = null
let points = null

/**
 * generateGalaxy
 */
const generateGalaxy = () => {
  // Destroy old galaxy
  if (points !== null) {
    geometry.dispose()
    material.dispose()
    scene.remove(points)
  }

  // Geometry
  geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(parameters.stars * 3)
  const colors = new Float32Array(parameters.stars * 3)

  const colorInside = new THREE.Color(parameters.insideColor)
  const colorOutside = new THREE.Color(parameters.outsideColor)

  for (let i = 0; i < parameters.stars; i++) {
    const i3 = i * 3

    const radius = Math.random() * parameters.radius

    const spinAngle = radius * parameters.spin
    const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2

    const baseX = Math.cos(branchAngle + spinAngle) * radius
    const baseY = 0
    const baseZ = Math.sin(branchAngle + spinAngle) * radius

    const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
    const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
    const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius

    positions[i3 + 0] = baseX + randomX
    positions[i3 + 1] = baseY + randomY
    positions[i3 + 2] = baseZ + randomZ

    const mixedColor = colorInside.clone()
    mixedColor.lerp(colorOutside, radius / parameters.radius)

    colors[i3 + 0] = mixedColor.r
    colors[i3 + 1] = mixedColor.g
    colors[i3 + 2] = mixedColor.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  // Material
  material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  })

  // Points
  points = new THREE.Points(geometry, material)
  scene.add(points)
}

// Initial generation
generateGalaxy()

gui.add(parameters, 'stars').min(100).max(1000000).step(100).onFinishChange(generateGalaxy).name('Stars')
gui.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy).name('Size')
gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy).name('Radius')
gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy).name('Branches')
gui.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy).name('Spin')
gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy).name('Randomness')
gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy).name('Randomness Power')
gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy).name('Inside Color')
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy).name('Outside Color')

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // Optional galaxy rotation
  if (points) {
    points.rotation.y = elapsedTime * 0.15
  }

  controls.update()
  renderer.render(scene, camera)
  window.requestAnimationFrame(tick)
}

tick()

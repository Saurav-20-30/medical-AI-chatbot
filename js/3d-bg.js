// Add Three.js and GSAP via CDN in the HTML, this file assumes they exist.

let scene, camera, renderer;
let particles, linesMesh;
const maxParticleCount = 800;
let particleCount = 800;
const r = 50;
const rHalf = r / 2;

let effectController = {
    showDots: true,
    showLines: true,
    minDistance: 7,
    limitConnections: false,
    maxConnections: 20,
    particleCount: 500
};

let positions, colors, particlesData;

function init3D() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    // SCENE
    scene = new THREE.Scene();
    // Dark professional fog matching CSS
    scene.fog = new THREE.FogExp2(0x00020a, 0.015);

    // CAMERA
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.z = 40;

    // RENDERER
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;

    // PARTICLES DATA
    particlesData = [];
    positions = new Float32Array(maxParticleCount * 3);
    colors = new Float32Array(maxParticleCount * 3);
    
    const pMaterial = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.15,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: true
    });

    for (let i = 0; i < maxParticleCount; i++) {
        const x = Math.random() * r - r / 2;
        const y = Math.random() * r - r / 2;
        const z = Math.random() * r - r / 2;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        particlesData.push({
            velocity: new THREE.Vector3(-0.02 + Math.random() * 0.04, -0.02 + Math.random() * 0.04, -0.02 + Math.random() * 0.04),
            numConnections: 0
        });
    }

    const pGeometry = new THREE.BufferGeometry();
    pGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    particles = new THREE.Points(pGeometry, pMaterial);
    scene.add(particles);

    // LINES (Neural Network Connections)
    const segments = maxParticleCount * maxParticleCount;
    const linePositions = new Float32Array(segments * 3);
    const lineColors = new Float32Array(segments * 3);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeometry.computeBoundingSphere();
    
    const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.2
    });

    linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    // RESIZE LISTENER
    window.addEventListener('resize', onWindowResize);
    // MOUSE INTERACTION
    document.addEventListener('mousemove', onMouseMove);

    animate();
}

let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

function onMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.05;
    mouseY = (event.clientY - windowHalfY) * 0.05;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    // Smooth camera movement based on mouse
    targetX = mouseX * 0.15;
    targetY = mouseY * 0.15;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    // Update particles and lines
    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;

    for (let i = 0; i < particleCount; i++) particlesData[i].numConnections = 0;

    for (let i = 0; i < particleCount; i++) {
        // move particles
        const particleData = particlesData[i];
        
        positions[i * 3] += particleData.velocity.x;
        positions[i * 3 + 1] += particleData.velocity.y;
        positions[i * 3 + 2] += particleData.velocity.z;

        if (positions[i * 3 + 1] < -rHalf || positions[i * 3 + 1] > rHalf) particleData.velocity.y = -particleData.velocity.y;
        if (positions[i * 3] < -rHalf || positions[i * 3] > rHalf) particleData.velocity.x = -particleData.velocity.x;
        if (positions[i * 3 + 2] < -rHalf || positions[i * 3 + 2] > rHalf) particleData.velocity.z = -particleData.velocity.z;

        if (effectController.limitConnections && particleData.numConnections >= effectController.maxConnections) continue;

        // Check collision
        for (let j = i + 1; j < particleCount; j++) {
            const particleDataB = particlesData[j];
            if (effectController.limitConnections && particleDataB.numConnections >= effectController.maxConnections) continue;

            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < effectController.minDistance) {
                particleData.numConnections++;
                particleDataB.numConnections++;

                const alpha = 1.0 - dist / effectController.minDistance;

                linesMesh.geometry.attributes.position.array[vertexpos++] = positions[i * 3];
                linesMesh.geometry.attributes.position.array[vertexpos++] = positions[i * 3 + 1];
                linesMesh.geometry.attributes.position.array[vertexpos++] = positions[i * 3 + 2];

                linesMesh.geometry.attributes.position.array[vertexpos++] = positions[j * 3];
                linesMesh.geometry.attributes.position.array[vertexpos++] = positions[j * 3 + 1];
                linesMesh.geometry.attributes.position.array[vertexpos++] = positions[j * 3 + 2];

                // Connecting line color (Teal to Blue)
                linesMesh.geometry.attributes.color.array[colorpos++] = 0.05; // R
                linesMesh.geometry.attributes.color.array[colorpos++] = 0.58; // G
                linesMesh.geometry.attributes.color.array[colorpos++] = 0.53; // B 
                
                linesMesh.geometry.attributes.color.array[colorpos++] = 0.22; // R
                linesMesh.geometry.attributes.color.array[colorpos++] = 0.74; // G
                linesMesh.geometry.attributes.color.array[colorpos++] = 0.97; // B

                numConnected++;
            }
        }
    }

    linesMesh.geometry.setDrawRange(0, numConnected * 2);
    linesMesh.geometry.attributes.position.needsUpdate = true;
    linesMesh.geometry.attributes.color.needsUpdate = true;
    particles.geometry.attributes.position.needsUpdate = true;

    // Rotate whole scene slowly
    const time = clock.getElapsedTime();
    scene.rotation.y = time * 0.05;
    scene.rotation.z = time * 0.02;

    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init3D);

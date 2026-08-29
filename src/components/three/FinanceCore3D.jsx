import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function FinanceCore3D({ scrollProgress = 0, interactive = true }) {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // Check WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 18);

    // Renderer (Matte professional aesthetic, crisp pixel ratio)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting (Professional studio soft key & fill)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x2563eb, 1.2); // Steel blue
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0f172a, 0.9); // Deep slate
    dirLight2.position.set(-10, -10, -5);
    scene.add(dirLight2);

    // Master Group
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Central Geometric Core (Fintech Ledger Cube surrounded by concentric data rings)
    const coreGeo = new THREE.BoxGeometry(3.2, 3.2, 3.2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep slate
      roughness: 0.25,
      metalness: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Core Wireframe overlay
    const wireGeo = new THREE.WireframeGeometry(coreGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 1.5 });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    wireMesh.scale.set(1.02, 1.02, 1.02);
    coreMesh.add(wireMesh);

    // 2. Concentric Data Coordinate Rings
    const ring1Geo = new THREE.TorusGeometry(3.6, 0.04, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x64748b });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(4.8, 0.03, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    coreGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(6.2, 0.02, 16, 100);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1 });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.z = Math.PI / 6;
    coreGroup.add(ring3);

    // 3. Orbiting Transaction / Data Nodes (Bank, Gateway, Ledger clusters)
    const nodeCount = 36;
    const nodeGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const nodeMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.7 }), // Bank: Blue
      new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3, metalness: 0.7 }), // Gateway: Emerald
      new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.3, metalness: 0.7 }), // Ledger: Indigo
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 })  // Exception: Amber
    ];

    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const mat = nodeMaterials[i % nodeMaterials.length];
      const node = new THREE.Mesh(nodeGeo, mat);
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 4.2 + (i % 4) * 0.9;
      const yOffset = ((i % 5) - 2) * 1.1;

      node.position.set(
        Math.cos(angle) * radius,
        yOffset,
        Math.sin(angle) * radius
      );

      node.userData = {
        baseAngle: angle,
        radius: radius,
        speed: 0.003 + (i % 3) * 0.002,
        yOffset: yOffset
      };

      coreGroup.add(node);
      nodes.push(node);
    }

    // 4. Subtle connecting lines between correlated transaction pairs
    const lineMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.25 });
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(nodeCount * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lines = new THREE.Line(lineGeo, lineMat);
    coreGroup.add(lines);

    // Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 1.2;
      targetY = y * 1.2;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse follow
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Base rotation
      coreGroup.rotation.y = elapsedTime * 0.2 + mouseX * 0.8;
      coreGroup.rotation.x = Math.sin(elapsedTime * 0.15) * 0.1 + mouseY * 0.8;

      // Core pulsating rotation
      coreMesh.rotation.x = elapsedTime * 0.35;
      coreMesh.rotation.y = elapsedTime * 0.45;

      // Rings differential rotation
      ring1.rotation.z = elapsedTime * 0.15;
      ring2.rotation.x = elapsedTime * -0.2;
      ring3.rotation.y = elapsedTime * 0.25;

      // Update orbiting data nodes
      const posArray = lineGeo.attributes.position.array;
      nodes.forEach((node, idx) => {
        const u = node.userData;
        const currentAngle = u.baseAngle + elapsedTime * u.speed * 8;
        node.position.x = Math.cos(currentAngle) * u.radius;
        node.position.z = Math.sin(currentAngle) * u.radius;
        node.position.y = u.yOffset + Math.sin(elapsedTime * 1.5 + idx) * 0.3;

        // update line positions
        posArray[idx * 3] = node.position.x;
        posArray[idx * 3 + 1] = node.position.y;
        posArray[idx * 3 + 2] = node.position.z;
      });
      lineGeo.attributes.position.needsUpdate = true;

      // Scroll effect adjustment
      if (scrollProgress > 0) {
        coreGroup.position.y = Math.sin(scrollProgress * Math.PI) * 0.8;
        coreGroup.scale.setScalar(1 + scrollProgress * 0.15);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      // Dispose Three.js objects
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      nodeGeo.dispose();
      nodeMaterials.forEach(m => m.dispose());
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
    };
  }, [scrollProgress, interactive]);

  if (!hasWebGL) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 bg-slate-100 border-2 border-slate-900 brutal-shadow">
        <div className="text-center font-mono">
          <div className="text-sm font-bold uppercase text-slate-900 mb-1">Financial Core Engine</div>
          <div className="text-xs text-slate-600">3-Way Multi-Source Matching Pipeline Active</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[380px] sm:min-h-[460px] relative overflow-hidden"
      style={{ touchAction: 'none' }}
    />
  );
}

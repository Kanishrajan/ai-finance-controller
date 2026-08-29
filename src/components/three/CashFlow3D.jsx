import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function CashFlow3D({ inflow = 820000, outflow = 560000, net = 260000 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x059669, 1.2);
    dirLight.position.set(5, 10, 10);
    scene.add(dirLight);

    const group = new THREE.Group();
    scene.add(group);

    // 1. Central Cash Reserve Reservoir (Cylinder)
    const tankGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.2, 32);
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const tankMesh = new THREE.Mesh(tankGeo, tankMat);
    group.add(tankMesh);

    // Tank outline rings
    const topRingGeo = new THREE.TorusGeometry(1.65, 0.05, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    const topRing = new THREE.Mesh(topRingGeo, ringMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 1.6;
    tankMesh.add(topRing);

    const botRing = new THREE.Mesh(topRingGeo, ringMat);
    botRing.rotation.x = Math.PI / 2;
    botRing.position.y = -1.6;
    tankMesh.add(botRing);

    // 2. Inflow Pipe (Left)
    const pipeGeo = new THREE.CylinderGeometry(0.3, 0.3, 4.0, 16);
    const pipeMatIn = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3, metalness: 0.7 });
    const pipeIn = new THREE.Mesh(pipeGeo, pipeMatIn);
    pipeIn.rotation.z = Math.PI / 2;
    pipeIn.position.set(-3.6, 0.6, 0);
    group.add(pipeIn);

    // 3. Outflow Pipe (Right)
    const pipeMatOut = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.7 });
    const pipeOut = new THREE.Mesh(pipeGeo, pipeMatOut);
    pipeOut.rotation.z = Math.PI / 2;
    pipeOut.position.set(3.6, -0.6, 0);
    group.add(pipeOut);

    // 4. Moving Inflow / Outflow Particles
    const particleCount = 40;
    const pGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const pInMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const pOutMat = new THREE.MeshBasicMaterial({ color: 0xf87171 });

    const inParticles = [];
    const outParticles = [];

    for (let i = 0; i < particleCount; i++) {
      const pIn = new THREE.Mesh(pGeo, pInMat);
      pIn.position.set(-5.5 + Math.random() * 3.8, 0.6 + (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
      pIn.userData = { speed: 0.04 + Math.random() * 0.02 };
      group.add(pIn);
      inParticles.push(pIn);

      const pOut = new THREE.Mesh(pGeo, pOutMat);
      pOut.position.set(1.6 + Math.random() * 3.8, -0.6 + (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
      pOut.userData = { speed: 0.04 + Math.random() * 0.02 };
      group.add(pOut);
      outParticles.push(pOut);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: nw, height: nh } = entry.contentRect;
        if (nw > 0 && nh > 0) {
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh);
        }
      }
    });
    resizeObserver.observe(container);

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      group.rotation.y = Math.sin(t * 0.3) * 0.2;
      tankMesh.rotation.y = t * 0.4;

      // Animate Inflow Particles (moving right toward tank)
      inParticles.forEach(p => {
        p.position.x += p.userData.speed;
        if (p.position.x >= -1.6) {
          p.position.x = -5.5;
        }
      });

      // Animate Outflow Particles (moving right away from tank)
      outParticles.forEach(p => {
        p.position.x += p.userData.speed;
        if (p.position.x >= 5.6) {
          p.position.x = 1.6;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      tankGeo.dispose();
      tankMat.dispose();
      topRingGeo.dispose();
      ringMat.dispose();
      pipeGeo.dispose();
      pipeMatIn.dispose();
      pipeMatOut.dispose();
      pGeo.dispose();
      pInMat.dispose();
      pOutMat.dispose();
      renderer.dispose();
    };
  }, [inflow, outflow, net]);

  return (
    <div className="relative w-full h-full min-h-[340px] bg-slate-50 border-2 border-slate-900 brutal-shadow overflow-hidden">
      <div className="absolute top-3 left-3 z-10 bg-white/95 px-3 py-1.5 border border-slate-900 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900">
        3D Treasury Liquidity & Directional Cash Flow
      </div>

      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-3 bg-white/95 px-3 py-1.5 border border-slate-900 text-[10px] font-mono">
        <span className="flex items-center gap-1 text-emerald-700 font-bold">← Inflow Pipeline</span>
        <span className="flex items-center gap-1 text-slate-900 font-bold">● Central Cash Reservoir</span>
        <span className="flex items-center gap-1 text-rose-700 font-bold">Outflow Pipeline →</span>
      </div>

      <div ref={containerRef} className="w-full h-full min-h-[340px]" />
    </div>
  );
}

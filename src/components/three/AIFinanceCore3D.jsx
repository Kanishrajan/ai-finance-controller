import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function AIFinanceCore3D({ confidence = 0.96, exceptionCount = 4 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x4f46e5, 1.4);
    dirLight.position.set(5, 8, 10);
    scene.add(dirLight);

    const group = new THREE.Group();
    scene.add(group);

    // 1. Central Icosahedron AI Brain
    const icoGeo = new THREE.IcosahedronGeometry(2.0, 1);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: false
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    group.add(icoMesh);

    // Wireframe Cage
    const wireGeo = new THREE.WireframeGeometry(icoGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x4f46e5 });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    wireMesh.scale.setScalar(1.03);
    icoMesh.add(wireMesh);

    // 2. Multi-tier Neural Orbit Rings
    const r1Geo = new THREE.TorusGeometry(3.2, 0.03, 16, 80);
    const r1Mat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    const r1 = new THREE.Mesh(r1Geo, r1Mat);
    group.add(r1);

    const r2Geo = new THREE.TorusGeometry(4.2, 0.03, 16, 80);
    const r2Mat = new THREE.MeshBasicMaterial({ color: 0x059669 });
    const r2 = new THREE.Mesh(r2Geo, r2Mat);
    r2.rotation.x = Math.PI / 3;
    group.add(r2);

    // 3. Floating Diagnostic Nodes
    const diagNodes = [];
    const sphereGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 });

    for (let i = 0; i < 8; i++) {
      const sp = new THREE.Mesh(sphereGeo, sphereMat);
      const angle = (i / 8) * Math.PI * 2;
      sp.position.set(Math.cos(angle) * 3.6, Math.sin(i * 1.5) * 0.8, Math.sin(angle) * 3.6);
      group.add(sp);
      diagNodes.push(sp);
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

      group.rotation.y = t * 0.2;
      icoMesh.rotation.x = t * 0.3;
      icoMesh.rotation.y = t * 0.4;
      r1.rotation.z = t * 0.25;
      r2.rotation.y = t * -0.3;

      diagNodes.forEach((node, i) => {
        node.position.y = Math.sin(t * 2 + i) * 0.6;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      icoGeo.dispose();
      icoMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      r1Geo.dispose();
      r1Mat.dispose();
      r2Geo.dispose();
      r2Mat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      renderer.dispose();
    };
  }, [confidence, exceptionCount]);

  return (
    <div className="relative w-full h-full min-h-[320px] bg-slate-50 border-2 border-slate-900 brutal-shadow overflow-hidden">
      <div className="absolute top-3 left-3 z-10 bg-white/95 px-3 py-1.5 border border-slate-900 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900">
        AI Semantic Decision Core
      </div>
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 px-3 py-1.5 border border-slate-900 text-[10px] font-mono font-bold text-indigo-900">
        Confidence Model: {Math.round(confidence * 100)}% Match Precision
      </div>
      <div ref={containerRef} className="w-full h-full min-h-[320px]" />
    </div>
  );
}

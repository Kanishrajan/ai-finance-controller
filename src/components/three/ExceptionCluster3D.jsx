import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function ExceptionCluster3D({ exceptions = [], onSelect = null }) {
  const containerRef = useRef(null);
  const [activeEx, setActiveEx] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xd97706, 1.2);
    dirLight.position.set(5, 12, 8);
    scene.add(dirLight);

    const group = new THREE.Group();
    scene.add(group);

    // 3 Severity Radar Rings
    const ringGeo1 = new THREE.RingGeometry(2.4, 2.45, 64);
    const ringGeo2 = new THREE.RingGeometry(4.2, 4.25, 64);
    const ringGeo3 = new THREE.RingGeometry(6.0, 6.05, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide });

    const r1 = new THREE.Mesh(ringGeo1, ringMat);
    r1.rotation.x = Math.PI / 2;
    group.add(r1);

    const r2 = new THREE.Mesh(ringGeo2, ringMat);
    r2.rotation.x = Math.PI / 2;
    group.add(r2);

    const r3 = new THREE.Mesh(ringGeo3, ringMat);
    r3.rotation.x = Math.PI / 2;
    group.add(r3);

    // Exception Nodes
    const items = exceptions.length > 0 ? exceptions.slice(0, 32) : [
      { id: 'EX-001', type: 'AMOUNT_MISMATCH', severity: 'CRITICAL', difference: 12500, amount: 95000 },
      { id: 'EX-002', type: 'MISSING_TRANSACTION', severity: 'HIGH', difference: 4800, amount: 4800 },
      { id: 'EX-003', type: 'DUPLICATE_TRANSACTION', severity: 'MEDIUM', difference: 1200, amount: 1200 },
      { id: 'EX-004', type: 'DATE_MISMATCH', severity: 'LOW', difference: 0, amount: 34000 }
    ];

    const nodes = [];
    const sphereGeo = new THREE.SphereGeometry(0.26, 16, 16);

    const mats = {
      AMOUNT_MISMATCH: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 }), // Amber
      MISSING_TRANSACTION: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.7 }), // Coral/Red
      DUPLICATE_TRANSACTION: new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.3, metalness: 0.7 }), // Purple
      DUPLICATE: new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.3, metalness: 0.7 }),
      DATE_MISMATCH: new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.3, metalness: 0.7 }), // Indigo
      LOW_CONFIDENCE: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.7 })
    };

    items.forEach((ex, idx) => {
      const mat = mats[ex.type] || mats.AMOUNT_MISMATCH;
      const mesh = new THREE.Mesh(sphereGeo, mat);

      let rad = 2.4;
      if (ex.severity === 'HIGH') rad = 4.2;
      else if (ex.severity === 'CRITICAL') rad = 5.8;
      else rad = 1.8 + (idx % 2) * 0.8;

      const angle = (idx / items.length) * Math.PI * 2;
      const x = Math.cos(angle) * rad;
      const z = Math.sin(angle) * rad;
      const y = Math.sin(idx * 1.2) * 0.6;

      mesh.position.set(x, y, z);
      mesh.userData = { ex, id: ex.id, baseX: x, baseY: y, baseZ: z };
      group.add(mesh);
      nodes.push(mesh);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodes);
      if (hits.length > 0) {
        container.style.cursor = 'pointer';
        setActiveEx(hits[0].object.userData.ex);
      } else {
        container.style.cursor = 'default';
      }
    };

    const onClick = () => {
      if (activeEx && onSelect) {
        onSelect(activeEx);
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);

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
      group.rotation.y = t * 0.18;
      nodes.forEach((n, i) => {
        n.position.y = n.userData.baseY + Math.sin(t * 2 + i) * 0.15;
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      sphereGeo.dispose();
      Object.values(mats).forEach(m => m.dispose());
      ringGeo1.dispose();
      ringGeo2.dispose();
      ringGeo3.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, [exceptions, onSelect]);

  return (
    <div className="relative w-full h-full min-h-[360px] bg-slate-50 border-2 border-slate-900 brutal-shadow overflow-hidden">
      <div className="absolute top-3 left-3 z-10 bg-white/95 px-3 py-1.5 border border-slate-900 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900">
        3D Exception Risk Horizon Matrix
      </div>

      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 bg-white/95 px-3 py-1.5 border border-slate-900 text-[10px] font-mono">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Variance</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>Missing</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>Duplicate</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>Date Lag</span>
      </div>

      {activeEx && (
        <div className="absolute top-3 right-3 z-10 p-3 bg-white border-2 border-slate-900 brutal-shadow text-xs max-w-xs animate-in fade-in">
          <div className="font-mono font-bold text-slate-900">{activeEx.id || activeEx.transaction_id}</div>
          <div className="text-[11px] font-semibold text-rose-700 mt-1 uppercase">
            {activeEx.type?.replace(/_/g, ' ') || 'EXCEPTION'}
          </div>
          <div className="text-xs font-mono font-bold text-slate-900 mt-1">
            Amount: ₹{(activeEx.amount || 0).toLocaleString('en-IN')}
          </div>
          {activeEx.difference !== 0 && activeEx.difference && (
            <div className="text-[11px] font-mono text-amber-700">
              Variance: ₹{Math.abs(activeEx.difference).toFixed(2)}
            </div>
          )}
        </div>
      )}

      <div ref={containerRef} className="w-full h-full min-h-[360px]" />
    </div>
  );
}

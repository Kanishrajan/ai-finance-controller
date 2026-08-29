import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function TransactionNetwork3D({ transactions = [], onSelect = null }) {
  const containerRef = useRef(null);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x2563eb, 1.2);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Grid Plane
    const gridHelper = new THREE.GridHelper(16, 16, 0x0f172a, 0xe2e8f0);
    gridHelper.position.y = -3.5;
    rootGroup.add(gridHelper);

    const sample = transactions.length > 0 ? transactions.slice(0, 30) : [
      { id: 'TX-101', amount: 45000, status: 'MATCHED', confidence: 0.99 },
      { id: 'TX-102', amount: 12500, status: 'MATCHED', confidence: 0.95 },
      { id: 'TX-103', amount: 8900, status: 'OPEN', confidence: 0.65 }
    ];

    const nodes = [];
    const sphereGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const matMatched = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3, metalness: 0.7 });
    const matException = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 });
    const matUnresolved = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.7 });

    sample.forEach((tx, i) => {
      const isMatched = tx.status === 'MATCHED' || tx.match_status === 'MATCHED';
      const isEx = tx.status === 'OPEN' || tx.classification === 'AMOUNT_MISMATCH';
      const mat = isMatched ? matMatched : isEx ? matException : matUnresolved;

      const mesh = new THREE.Mesh(sphereGeo, mat);
      const theta = (i / sample.length) * Math.PI * 2;
      const r = 2.5 + (i % 3) * 1.5;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const y = ((i % 5) - 2) * 0.8;

      mesh.position.set(x, y, z);
      mesh.userData = { tx, id: tx.id, baseX: x, baseY: y, baseZ: z };
      rootGroup.add(mesh);
      nodes.push(mesh);

      // Connecting links
      if (i > 0 && i % 2 === 0) {
        const prev = nodes[i - 1];
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          mesh.position,
          prev.position
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.4 });
        const line = new THREE.Line(lineGeo, lineMat);
        rootGroup.add(line);
      }
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
        setSelectedTx(hits[0].object.userData.tx);
      } else {
        container.style.cursor = 'default';
      }
    };

    const onClick = () => {
      if (selectedTx && onSelect) {
        onSelect(selectedTx);
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
      rootGroup.rotation.y = t * 0.15;
      nodes.forEach((n, idx) => {
        n.position.y = n.userData.baseY + Math.sin(t * 2 + idx) * 0.15;
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
      matMatched.dispose();
      matException.dispose();
      matUnresolved.dispose();
      gridHelper.dispose();
      renderer.dispose();
    };
  }, [transactions, onSelect]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-50 border-2 border-slate-900 brutal-shadow overflow-hidden">
      <div className="absolute top-3 left-3 z-10 bg-white/95 px-3 py-1.5 border border-slate-900 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900">
        3D Transaction Cluster Topology
      </div>

      {selectedTx && (
        <div className="absolute bottom-3 right-3 z-10 p-3 bg-white border-2 border-slate-900 brutal-shadow text-xs max-w-xs animate-in fade-in">
          <div className="font-mono font-bold text-slate-900">{selectedTx.id || selectedTx.transaction_id}</div>
          <div className="text-xs font-mono font-bold text-emerald-700 mt-1">
            ₹{(selectedTx.amount || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            Status: <span className="font-semibold text-slate-900">{selectedTx.status || 'MATCHED'}</span>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full min-h-[380px]" />
    </div>
  );
}

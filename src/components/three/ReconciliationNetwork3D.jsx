import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function ReconciliationNetwork3D({
  transactions = [],
  onSelectTransaction = null,
  selectedTxId = null
}) {
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 16);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x2563eb, 1.2);
    dirLight.position.set(5, 10, 10);
    scene.add(dirLight);

    const group = new THREE.Group();
    scene.add(group);

    // 3 Ingestion Source Stages (Bank, Gateway, Ledger) on the Left & Central Matching Hub
    const nodeObjects = [];
    const sphereGeo = new THREE.SphereGeometry(0.28, 16, 16);

    // Materials
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.6 }); // Blue
    const gwMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.6 });   // Sky Blue
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.3, metalness: 0.6 });  // Indigo
    const matchMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.2, metalness: 0.8 }); // Emerald
    const exMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.8 });   // Amber

    // Central Engine Hub
    const hubGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 32);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubMesh.rotation.x = Math.PI / 2;
    hubMesh.position.set(0, 0, 0);
    group.add(hubMesh);

    // Stage labels / planes
    const items = transactions.length > 0 ? transactions.slice(0, 24) : [
      { id: 'TX-BANK-101', source: 'BANK', amount: 45000, status: 'MATCHED', confidence: 0.98 },
      { id: 'TX-GW-102', source: 'GATEWAY', amount: 12500, status: 'MATCHED', confidence: 0.95 },
      { id: 'TX-LED-103', source: 'LEDGER', amount: 28000, status: 'MATCHED', confidence: 0.99 },
      { id: 'TX-EX-104', source: 'BANK', amount: 8900, status: 'OPEN', classification: 'AMOUNT_MISMATCH', confidence: 0.62 },
      { id: 'TX-GW-105', source: 'GATEWAY', amount: 3400, status: 'OPEN', classification: 'MISSING_TRANSACTION', confidence: 0.45 },
      { id: 'TX-LED-106', source: 'LEDGER', amount: 115000, status: 'MATCHED', confidence: 1.0 },
      { id: 'TX-BANK-107', source: 'BANK', amount: 15400, status: 'MATCHED', confidence: 0.94 },
      { id: 'TX-GW-108', source: 'GATEWAY', amount: 62000, status: 'MATCHED', confidence: 0.97 },
      { id: 'TX-EX-109', source: 'LEDGER', amount: 7800, status: 'OPEN', classification: 'DATE_MISMATCH', confidence: 0.70 },
      { id: 'TX-BANK-110', source: 'BANK', amount: 4500, status: 'MATCHED', confidence: 0.92 }
    ];

    // Build Nodes & Links
    const lineMatMatched = new THREE.LineBasicMaterial({ color: 0x059669, transparent: true, opacity: 0.4 });
    const lineMatException = new THREE.LineBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.5 });
    const lineMatDefault = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.25 });

    items.forEach((tx, idx) => {
      const isMatched = tx.status === 'MATCHED' || tx.match_status === 'MATCHED';
      const isException = tx.status === 'OPEN' || tx.severity || tx.difference !== 0;

      let mat = bankMat;
      if (tx.source === 'GATEWAY' || tx.gateway_id) mat = gwMat;
      else if (tx.source === 'LEDGER' || tx.ledger_id) mat = ledMat;
      if (isMatched) mat = matchMat;
      if (isException) mat = exMat;

      const node = new THREE.Mesh(sphereGeo, mat);

      // Position along 3D flow arc
      let xPos, yPos, zPos;
      if (!isMatched && isException) {
        // Exceptions pushed to upper right exception cluster
        xPos = 3.5 + (idx % 3) * 1.2;
        yPos = 2.0 + Math.floor(idx / 3) * 0.9;
        zPos = ((idx % 2) - 0.5) * 1.5;
      } else if (idx % 3 === 0) {
        // Bank stream (Left)
        xPos = -4.5 - (idx % 2) * 1.0;
        yPos = ((idx % 6) - 2.5) * 1.0;
        zPos = -1.0;
      } else if (idx % 3 === 1) {
        // Gateway stream (Mid-left)
        xPos = -2.5 - (idx % 2) * 0.8;
        yPos = ((idx % 6) - 2.5) * 1.0;
        zPos = 1.0;
      } else {
        // Matched cluster (Right)
        xPos = 3.2 + (idx % 3) * 0.9;
        yPos = ((idx % 6) - 2.5) * 0.8;
        zPos = 0;
      }

      node.position.set(xPos, yPos, zPos);
      node.userData = {
        tx: tx,
        id: tx.id || `TX-${idx}`,
        baseX: xPos,
        baseY: yPos,
        baseZ: zPos,
        phase: idx * 0.35
      };

      group.add(node);
      nodeObjects.push(node);

      // Connection to central hub
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xPos, yPos, zPos),
        new THREE.Vector3(0, 0, 0)
      ]);
      const line = new THREE.Line(
        lineGeo,
        isException ? lineMatException : isMatched ? lineMatMatched : lineMatDefault
      );
      group.add(line);
    });

    // Raycasting for Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeObjects);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        setHoveredNode(hit.userData.tx);
        container.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        container.style.cursor = 'default';
      }
    };

    const handleClick = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeObjects);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (onSelectTransaction) {
          onSelectTransaction(hit.userData.tx);
        }
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handleClick);

    // Resize
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
      const t = clock.getElapsedTime();

      // Gentle orbital motion of the entire graph
      group.rotation.y = Math.sin(t * 0.25) * 0.15;
      group.rotation.x = Math.cos(t * 0.2) * 0.08;

      // Hub spinning slowly
      hubMesh.rotation.z = t * 0.5;

      // Pulse nodes
      nodeObjects.forEach((node) => {
        const u = node.userData;
        node.position.y = u.baseY + Math.sin(t * 1.5 + u.phase) * 0.12;

        if (selectedTxId && (u.id === selectedTxId || u.tx?.id === selectedTxId)) {
          node.scale.setScalar(1.5 + Math.sin(t * 5) * 0.2);
        } else {
          node.scale.setScalar(1.0);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handleClick);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sphereGeo.dispose();
      hubGeo.dispose();
      hubMat.dispose();
      bankMat.dispose();
      gwMat.dispose();
      ledMat.dispose();
      matchMat.dispose();
      exMat.dispose();
      lineMatMatched.dispose();
      lineMatException.dispose();
      lineMatDefault.dispose();
      renderer.dispose();
    };
  }, [transactions, selectedTxId, onSelectTransaction]);

  return (
    <div className="relative w-full h-full min-h-[360px] bg-slate-50 border-2 border-slate-900 brutal-shadow overflow-hidden">
      {/* 3D Viewport Header Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/90 px-3 py-1.5 border border-slate-900 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900">
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        <span>Interactive Reconciliation Network</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 bg-white/95 px-3 py-1.5 border border-slate-900 text-[10px] font-mono">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>Bank</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>Gateway</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>Ledger</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>Matched</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Exception</span>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredNode && (
        <div className="absolute top-3 right-3 z-10 p-3 bg-white border-2 border-slate-900 brutal-shadow text-xs max-w-xs animate-in fade-in">
          <div className="font-mono font-bold text-slate-900">{hoveredNode.id || hoveredNode.transaction_id}</div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Party: <span className="font-semibold text-slate-900">{hoveredNode.merchant || hoveredNode.bankTx?.merchant || 'Enterprise Entity'}</span>
          </div>
          <div className="text-xs font-mono font-bold text-emerald-700 mt-1">
            ₹{(hoveredNode.amount || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            Status: <span className="font-semibold text-slate-800">{hoveredNode.status || 'MATCHED'}</span>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full min-h-[360px]" />
    </div>
  );
}

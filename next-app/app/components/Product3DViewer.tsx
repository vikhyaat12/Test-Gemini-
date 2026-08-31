"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type Product3DViewerProps = {
  productName: string;
  posterUrl?: string;
  autoRotate?: boolean;
  accentColor?: string;
  height?: number | string;
};

export default function Product3DViewer({
  productName,
  posterUrl,
  autoRotate = true,
  accentColor = "#D4AF37",
  height = 420,
}: Product3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Motion preference check
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const width = mount.clientWidth || 400;
    const h = typeof height === "number" ? height : 420;

    const camera = new THREE.PerspectiveCamera(42, width / h, 0.1, 1000);
    camera.position.set(0, 0, 7.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);
    } catch {
      setHasWebGL(false);
      return;
    }

    // Lighting Setup (Pharmaceutical Studio Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    mainKeyLight.position.set(5, 8, 6);
    mainKeyLight.castShadow = true;
    scene.add(mainKeyLight);

    const fillGoldLight = new THREE.DirectionalLight(0xd4af37, 1.6);
    fillGoldLight.position.set(-6, -2, 4);
    scene.add(fillGoldLight);

    const rimVioletLight = new THREE.PointLight(0x7e22ce, 2.0, 20);
    rimVioletLight.position.set(0, -4, -4);
    scene.add(rimVioletLight);

    // Product Group
    const productGroup = new THREE.Group();

    // 1. Luxury Amber/Purple Dropper Bottle Glass Body
    const bottleGeometry = new THREE.CylinderGeometry(1.0, 1.05, 3.2, 32);
    const bottleMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#2A0F3A"),
      transmission: 0.6,
      opacity: 0.95,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      ior: 1.5,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const bottleMesh = new THREE.Mesh(bottleGeometry, bottleMaterial);
    bottleMesh.position.y = -0.2;
    bottleMesh.castShadow = true;
    bottleMesh.receiveShadow = true;
    productGroup.add(bottleMesh);

    // 2. Bottle Shoulder Curve
    const shoulderGeometry = new THREE.SphereGeometry(1.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3);
    const shoulderMesh = new THREE.Mesh(shoulderGeometry, bottleMaterial);
    shoulderMesh.position.y = 1.35;
    shoulderMesh.rotation.x = Math.PI;
    productGroup.add(shoulderMesh);

    // 3. Gold Metallic Collar / Neck
    const neckGeometry = new THREE.CylinderGeometry(0.52, 0.52, 0.65, 32);
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColor),
      metalness: 0.88,
      roughness: 0.22,
    });
    const neckMesh = new THREE.Mesh(neckGeometry, goldMaterial);
    neckMesh.position.y = 1.65;
    productGroup.add(neckMesh);

    // 4. White / Gold Soft Pipette Cap
    const capGeometry = new THREE.CylinderGeometry(0.38, 0.44, 0.75, 32);
    const capMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.05,
    });
    const capMesh = new THREE.Mesh(capGeometry, capMaterial);
    capMesh.position.y = 2.15;
    productGroup.add(capMesh);

    // 5. Pharmaceutical Editorial Label
    const labelGeometry = new THREE.CylinderGeometry(1.01, 1.06, 2.0, 32, 1, true, -Math.PI / 2.2, Math.PI / 1.1);
    const labelMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbf9f5,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.position.y = -0.2;
    productGroup.add(labelMesh);

    // 6. Floating Micro-Gold Halo Ring (Queens Care Clinical Signature)
    const haloGeometry = new THREE.TorusGeometry(1.55, 0.022, 16, 64);
    const haloMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#D4AF37"),
      metalness: 0.95,
      roughness: 0.1,
      emissive: new THREE.Color("#C19A6B"),
      emissiveIntensity: 0.25,
    });
    const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
    haloMesh.rotation.x = Math.PI / 2.3;
    haloMesh.position.y = -0.1;
    productGroup.add(haloMesh);

    scene.add(productGroup);

    // Mouse / Touch Drag Orbit Control
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setIsInteracting(true);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.006;
      targetRotationX = Math.max(-0.4, Math.min(0.4, targetRotationX));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => setIsInteracting(false), 800);
    };

    // Touch Support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        setIsInteracting(true);
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.012;
      targetRotationX += deltaY * 0.008;
      targetRotationX = Math.max(-0.4, Math.min(0.4, targetRotationX));

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);

    // Resize Handler
    const handleResize = () => {
      if (!mount) return;
      const newWidth = mount.clientWidth;
      camera.aspect = newWidth / h;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, h);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle auto-rotation if not interacting and motion allowed
      if (autoRotate && !isDragging && !prefersReducedMotion) {
        targetRotationY += 0.006;
      }

      // Smooth interpolation for smooth inertia
      productGroup.rotation.y += (targetRotationY - productGroup.rotation.y) * 0.08;
      productGroup.rotation.x += (targetRotationX - productGroup.rotation.x) * 0.08;

      // Gentle floating levitation effect
      if (!prefersReducedMotion) {
        productGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;
        haloMesh.rotation.z = elapsedTime * 0.3;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domElement.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);

      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [accentColor, autoRotate, height]);

  if (!hasWebGL) {
    return (
      <div style={{ textAlign: "center", padding: 24 }}>
        {posterUrl && <img src={posterUrl} alt={productName} style={{ maxHeight: 380, objectFit: "contain" }} />}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height, background: "radial-gradient(circle at 50% 50%, #faf8f5 0%, #ede8df 100%)", borderRadius: 8, overflow: "hidden" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: isInteracting ? "grabbing" : "grab" }} />

      {/* Interactive Helper Overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(42, 15, 58, 0.8)",
          color: "#ffffff",
          padding: "5px 14px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.04em",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <span>🔄 Drag to rotate 360°</span>
        <span style={{ color: "#D4AF37" }}>·</span>
        <span>3D Clinical Studio</span>
      </div>
    </div>
  );
}

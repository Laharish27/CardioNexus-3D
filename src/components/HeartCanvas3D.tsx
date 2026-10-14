import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { SelectedVessel, VesselPrediction } from '../types/cardiac';
import {
  Activity,
  Zap,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Scissors,
  CheckCircle,
  AlertTriangle,
  Heart,
  Box,
  Info,
  Compass,
  Eye,
} from 'lucide-react';

interface HeartCanvas3DProps {
  vesselPredictions: {
    LAD: VesselPrediction;
    LCX: VesselPrediction;
    RCA: VesselPrediction;
  };
  overallCadProb: number;
  pulseRate?: number;
  selectedVessel: SelectedVessel;
  onSelectVessel: (vessel: SelectedVessel) => void;
  isCompact?: boolean;
}

export const HeartCanvas3D: React.FC<HeartCanvas3DProps> = ({
  vesselPredictions,
  overallCadProb,
  pulseRate = 72,
  selectedVessel,
  onSelectVessel,
  isCompact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBeating, setIsBeating] = useState(true);
  const [showBloodFlow, setShowBloodFlow] = useState(true);
  const [meshSource, setMeshSource] = useState<'procedural_photoreal' | 'bodyparts3d'>('procedural_photoreal');
  const [crossSectionCut, setCrossSectionCut] = useState<number>(0);
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);
  const [cameraView, setCameraView] = useState<'anterior' | 'posterior' | 'left' | 'right' | 'apex' | 'superior'>('anterior');

  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    mainGroup: THREE.Group;
    heartGroup: THREE.Group;
    bodypartsGroup: THREE.Group;
    myocardiumMesh: THREE.Mesh;
    myocardiumCutMesh: THREE.Mesh;
    anteriorWallMesh: THREE.Mesh;
    lateralWallMesh: THREE.Mesh;
    inferiorWallMesh: THREE.Mesh;
    clipPlane: THREE.Plane;
    vessels: Record<string, { mesh: THREE.Mesh; material: THREE.MeshStandardMaterial; curve: THREE.CatmullRomCurve3 }>;
    secondaryBranches: THREE.Mesh[];
    plaqueMeshes: Record<string, THREE.Group>;
    particles: Record<string, { points: THREE.Points; offsets: Float32Array; curve: THREE.CatmullRomCurve3 }>;
    targetCameraPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    isDragging: boolean;
    previousMousePosition: { x: number; y: number };
  } | null>(null);

  const getVesselColor = (prob: number): THREE.Color => {
    if (prob < 0.40) return new THREE.Color(0x059669); // Restrained emerald patent (<40%)
    if (prob < 0.70) return new THREE.Color(0xd97706); // Warm amber moderate (40-69%)
    return new THREE.Color(0xdc2626); // Restrained clinical red (>=70% or >=50%)
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene with clean medical clinical studio background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // Light cool slate studio

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 8.5);
    const targetCameraPos = new THREE.Vector3(0, 1.2, 8.5);
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    // 3. High-Precision WebGL Renderer with local clipping enabled
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.localClippingEnabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Clinical Medical Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbf5, 1.9);
    keyLight.position.set(6, 9, 7);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
    fillLight.position.set(-7, -2, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf1f5f9, 0.9);
    rimLight.position.set(0, -5, -4);
    scene.add(rimLight);

    // Subtle clinical shadow catcher plane underneath
    const shadowGeo = new THREE.PlaneGeometry(12, 12);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.08 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -3.2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Master Container Groups
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const heartGroup = new THREE.Group();
    heartGroup.rotation.z = -0.18;
    heartGroup.rotation.y = 0.25;
    mainGroup.add(heartGroup);

    const bodypartsGroup = new THREE.Group();
    bodypartsGroup.visible = false;
    mainGroup.add(bodypartsGroup);

    // Clipping plane for cavity slicing (slices along Z/anterior axis)
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10);

    // ==========================================
    // 5. PHOTOREALISTIC PROCEDURAL CARDIAC MYOCARDIUM
    // ==========================================
    // Procedural Myocardial Muscle Fiber Bump Texture
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 400; i++) {
      bCtx.strokeStyle = Math.random() > 0.5 ? '#9e9e9e' : '#616161';
      bCtx.lineWidth = Math.random() * 2 + 0.5;
      bCtx.beginPath();
      const y = Math.random() * 512;
      bCtx.moveTo(0, y);
      bCtx.bezierCurveTo(170, y + (Math.random() - 0.5) * 20, 340, y + (Math.random() - 0.5) * 20, 512, y);
      bCtx.stroke();
    }
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.repeat.set(3, 3);

    // Myocardial material with lifelike flesh tone, specular response, and clipping support
    const myocardiumMat = new THREE.MeshStandardMaterial({
      color: 0xa81d24,
      bumpMap: bumpTexture,
      bumpScale: 0.038,
      roughness: 0.38,
      metalness: 0.08,
      clippingPlanes: [clipPlane],
      clipShadows: true,
    });

    // Anatomical Ventricle Shape (Left & Right Ventricular composite)
    const ventGeo = new THREE.SphereGeometry(1.72, 64, 64);
    const vPos = ventGeo.attributes.position;
    for (let i = 0; i < vPos.count; i++) {
      let x = vPos.getX(i);
      let y = vPos.getY(i);
      let z = vPos.getZ(i);

      if (y < 0) {
        // Taper down to apex with leftward/anterior tilt
        const factor = 1 - Math.abs(y) * 0.44;
        x *= factor;
        z *= factor;
        y *= 1.38;
        x -= Math.pow(Math.abs(y) * 0.25, 2) * 0.25;
      } else {
        // Base expands at atrioventricular groove
        x *= 1.18;
        z *= 1.12;
      }
      vPos.setXYZ(i, x, y, z);
    }
    ventGeo.computeVertexNormals();

    const myocardiumMesh = new THREE.Mesh(ventGeo, myocardiumMat);
    myocardiumMesh.castShadow = true;
    myocardiumMesh.receiveShadow = true;
    myocardiumMesh.userData = { name: 'MYOCARDIUM' };
    heartGroup.add(myocardiumMesh);

    // Internal Ventricular Cavity Interior (Thick LV & Thinner RV chamber walls)
    const cavityMat = new THREE.MeshStandardMaterial({
      color: 0x4a0e17,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.BackSide,
      clippingPlanes: [clipPlane],
    });
    const cavityGeo = ventGeo.clone();
    cavityGeo.scale(0.84, 0.84, 0.84);
    const myocardiumCutMesh = new THREE.Mesh(cavityGeo, cavityMat);
    heartGroup.add(myocardiumCutMesh);

    // Interventricular Septum Wall Mesh
    const septumMat = new THREE.MeshStandardMaterial({
      color: 0x7a141d,
      roughness: 0.5,
      clippingPlanes: [clipPlane],
    });
    const septumGeo = new THREE.BoxGeometry(0.24, 2.4, 1.8);
    const septumMesh = new THREE.Mesh(septumGeo, septumMat);
    septumMesh.position.set(-0.08, -0.2, 0.1);
    septumMesh.rotation.y = 0.15;
    heartGroup.add(septumMesh);

    // Anterior Wall Segment (targeted for RWMA dyskinesis modeling)
    const anteriorWallMat = new THREE.MeshStandardMaterial({
      color: 0xa81d24,
      roughness: 0.38,
      bumpMap: bumpTexture,
      bumpScale: 0.035,
      clippingPlanes: [clipPlane],
    });
    const anteriorWallGeo = new THREE.SphereGeometry(1.74, 32, 32, 0, Math.PI * 0.65, 0, Math.PI * 0.65);
    const anteriorWallMesh = new THREE.Mesh(anteriorWallGeo, anteriorWallMat);
    anteriorWallMesh.position.set(-0.2, -0.2, 0.25);
    heartGroup.add(anteriorWallMesh);

    // Lateral Wall Segment (LCX territory)
    const lateralWallMat = new THREE.MeshStandardMaterial({ color: 0xa81d24, roughness: 0.38, clippingPlanes: [clipPlane] });
    const lateralWallGeo = new THREE.SphereGeometry(1.73, 32, 32, Math.PI * 0.65, Math.PI * 0.5, 0, Math.PI * 0.6);
    const lateralWallMesh = new THREE.Mesh(lateralWallGeo, lateralWallMat);
    lateralWallMesh.position.set(-0.35, -0.2, -0.15);
    heartGroup.add(lateralWallMesh);

    // Inferior Wall Segment (RCA territory)
    const inferiorWallMat = new THREE.MeshStandardMaterial({ color: 0xa81d24, roughness: 0.38, clippingPlanes: [clipPlane] });
    const inferiorWallGeo = new THREE.SphereGeometry(1.73, 32, 32, Math.PI * 1.15, Math.PI * 0.5, 0, Math.PI * 0.6);
    const inferiorWallMesh = new THREE.Mesh(inferiorWallGeo, inferiorWallMat);
    inferiorWallMesh.position.set(0.25, -0.4, -0.1);
    heartGroup.add(inferiorWallMesh);

    // Epicardial Sulcus Fat Pads (Anterior & Posterior Adipose Cushions)
    const sulcusFatGroup = new THREE.Group();
    const fatMat = new THREE.MeshStandardMaterial({
      color: 0xecd078,
      roughness: 0.65,
      metalness: 0.05,
      clippingPlanes: [clipPlane],
    });
    const fatCurveAnterior = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.25, 1.3, 0.7),
      new THREE.Vector3(-0.32, 0.8, 1.15),
      new THREE.Vector3(-0.26, 0.1, 1.35),
      new THREE.Vector3(-0.16, -0.7, 1.25),
      new THREE.Vector3(-0.1, -1.4, 0.85),
    ]);
    sulcusFatGroup.add(new THREE.Mesh(new THREE.TubeGeometry(fatCurveAnterior, 32, 0.22, 12, false), fatMat));

    const fatCurveAVGroove = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.35, 1.35, 0.7),
      new THREE.Vector3(1.15, 1.05, 0.6),
      new THREE.Vector3(1.45, 0.3, 0.4),
      new THREE.Vector3(1.35, -0.5, -0.1),
      new THREE.Vector3(0.8, -1.1, -0.5),
    ]);
    sulcusFatGroup.add(new THREE.Mesh(new THREE.TubeGeometry(fatCurveAVGroove, 32, 0.2, 12, false), fatMat));
    heartGroup.add(sulcusFatGroup);

    // Left and Right Atria with Auricles
    const atriumMat = new THREE.MeshStandardMaterial({
      color: 0x881e28,
      roughness: 0.45,
      clippingPlanes: [clipPlane],
    });
    const leftAtrium = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 32), atriumMat);
    leftAtrium.position.set(-0.75, 1.45, -0.35);
    heartGroup.add(leftAtrium);

    // Left Atrial Appendage (Auricle)
    const laa = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.7, 16), atriumMat);
    laa.position.set(-0.85, 1.2, 0.45);
    laa.rotation.set(0.3, 0.4, -0.5);
    heartGroup.add(laa);

    const rightAtrium = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 32), atriumMat);
    rightAtrium.position.set(0.95, 1.35, 0.18);
    heartGroup.add(rightAtrium);

    // Right Atrial Appendage
    const raa = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.8, 16), atriumMat);
    raa.position.set(0.7, 1.6, 0.65);
    raa.rotation.set(-0.3, -0.2, 0.6);
    heartGroup.add(raa);

    // Superior & Inferior Vena Cava (Deoxygenated systemic venous trunks)
    const cavaMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.32,
      clippingPlanes: [clipPlane],
    });
    const svcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.15, 1.6, -0.1),
      new THREE.Vector3(1.22, 2.7, -0.15),
    ]);
    heartGroup.add(new THREE.Mesh(new THREE.TubeGeometry(svcCurve, 16, 0.28, 16, false), cavaMat));

    const ivcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.05, 0.7, -0.3),
      new THREE.Vector3(1.1, -0.6, -0.4),
    ]);
    heartGroup.add(new THREE.Mesh(new THREE.TubeGeometry(ivcCurve, 16, 0.28, 16, false), cavaMat));

    // Aortic Arch & Descending Aorta
    const aortaMat = new THREE.MeshStandardMaterial({
      color: 0xc81e2b,
      roughness: 0.25,
      metalness: 0.12,
      clippingPlanes: [clipPlane],
    });
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.15, 0.15),
      new THREE.Vector3(-0.08, 2.2, 0.05),
      new THREE.Vector3(-0.35, 3.15, -0.2),
      new THREE.Vector3(-0.9, 3.25, -0.55),
      new THREE.Vector3(-1.35, 2.5, -0.9),
      new THREE.Vector3(-1.42, 1.35, -1.15),
    ]);
    const aortaMesh = new THREE.Mesh(new THREE.TubeGeometry(aortaCurve, 48, 0.45, 24, false), aortaMat);
    aortaMesh.castShadow = true;
    aortaMesh.userData = { name: 'AORTA' };
    heartGroup.add(aortaMesh);

    // Supra-Aortic Branches (Brachiocephalic, Carotid, Subclavian)
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.95, 16), aortaMat);
    b1.position.set(-0.32, 3.55, -0.2);
    b1.rotation.z = -0.15;
    heartGroup.add(b1);

    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.9, 16), aortaMat);
    b2.position.set(-0.62, 3.6, -0.36);
    b2.rotation.z = -0.18;
    heartGroup.add(b2);

    const b3 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.85, 16), aortaMat);
    b3.position.set(-0.92, 3.5, -0.52);
    b3.rotation.z = -0.22;
    heartGroup.add(b3);

    // Main Pulmonary Artery & Branches
    const pulmonaryMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.32,
      clippingPlanes: [clipPlane],
    });
    const pulmonaryCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.35, 1.15, 0.65),
      new THREE.Vector3(0.12, 2.1, 0.45),
      new THREE.Vector3(-0.18, 2.45, 0.15),
      new THREE.Vector3(-0.7, 2.35, -0.25),
    ]);
    heartGroup.add(new THREE.Mesh(new THREE.TubeGeometry(pulmonaryCurve, 32, 0.42, 20, false), pulmonaryMat));

    // Right Pulmonary Branch passing under aorta
    const rpaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 2.45, 0.15),
      new THREE.Vector3(0.65, 2.35, -0.3),
      new THREE.Vector3(1.35, 2.2, -0.6),
    ]);
    heartGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rpaCurve, 24, 0.3, 16, false), pulmonaryMat));

    // ==========================================
    // 6. DETAILED CORONARY ARTERIAL TREE (LAD, LCX, RCA & SUB-BRANCHES)
    // ==========================================
    const vessels: Record<string, { mesh: THREE.Mesh; material: THREE.MeshStandardMaterial; curve: THREE.CatmullRomCurve3 }> = {};
    const secondaryBranches: THREE.Mesh[] = [];
    const plaqueMeshes: Record<string, THREE.Group> = {};
    const particles: Record<string, { points: THREE.Points; offsets: Float32Array; curve: THREE.CatmullRomCurve3 }> = {};

    // LAD (Left Anterior Descending - Anterior interventricular artery)
    const ladCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.22, 1.48, 0.82),
      new THREE.Vector3(-0.32, 1.0, 1.25),
      new THREE.Vector3(-0.26, 0.25, 1.46),
      new THREE.Vector3(-0.15, -0.55, 1.36),
      new THREE.Vector3(-0.1, -1.35, 0.96),
      new THREE.Vector3(-0.06, -2.05, 0.32),
    ]);

    // LCX (Left Circumflex - Left AV groove)
    const lcxCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.26, 1.42, 0.78),
      new THREE.Vector3(-0.88, 1.08, 0.72),
      new THREE.Vector3(-1.48, 0.48, 0.46),
      new THREE.Vector3(-1.62, -0.22, -0.1),
      new THREE.Vector3(-1.42, -0.92, -0.62),
      new THREE.Vector3(-1.02, -1.42, -0.82),
    ]);

    // RCA (Right Coronary Artery - Right AV groove & PDA)
    const rcaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.36, 1.38, 0.72),
      new THREE.Vector3(0.96, 1.02, 0.86),
      new THREE.Vector3(1.42, 0.28, 0.76),
      new THREE.Vector3(1.52, -0.52, 0.36),
      new THREE.Vector3(1.22, -1.22, -0.22),
      new THREE.Vector3(0.62, -1.72, -0.42),
      new THREE.Vector3(0.12, -2.02, -0.22),
    ]);

    const vesselCurves = { LAD: ladCurve, LCX: lcxCurve, RCA: rcaCurve };

    // Build Main Arteries & Dynamic Stenosis Lesions
    (['LAD', 'LCX', 'RCA'] as const).forEach((vName) => {
      const curve = vesselCurves[vName];
      const prob = vesselPredictions[vName].probability;
      const color = getVesselColor(prob);

      // Main Arterial Lumen Tube
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.13, 16, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.22,
        metalness: 0.15,
        clippingPlanes: [clipPlane],
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.castShadow = true;
      tubeMesh.userData = { name: vName, isVessel: true };
      heartGroup.add(tubeMesh);

      vessels[vName] = { mesh: tubeMesh, material: tubeMat, curve };

      // High-Fidelity Atherosclerotic Plaque Cuff & Stenosis Halo
      const plaqueGroup = new THREE.Group();
      plaqueGroup.visible = prob >= 0.5;

      const midPt = curve.getPointAt(0.48);

      // 1. Calcified / Lipid Atheroma Core
      const atheromaCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 24, 24),
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          roughness: 0.35,
          metalness: 0.05,
          clippingPlanes: [clipPlane],
        })
      );
      atheromaCore.position.copy(midPt);
      atheromaCore.scale.set(1.25, 0.7, 1.25);
      plaqueGroup.add(atheromaCore);

      // 2. Circumferential Stenosis Band (clinical red warning collar)
      const warningBand = new THREE.Mesh(
        new THREE.TorusGeometry(0.26, 0.04, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0xdc2626 })
      );
      warningBand.position.copy(midPt);
      warningBand.rotation.x = Math.PI / 2;
      plaqueGroup.add(warningBand);

      plaqueMeshes[vName] = plaqueGroup;
      heartGroup.add(plaqueGroup);

      // 3. Directional Erythrocyte Flow Particles
      const particleCount = 32;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const offsets = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        offsets[i] = i / particleCount;
        const p = curve.getPointAt(offsets[i]);
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: color,
        size: 0.09,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });

      const particlePoints = new THREE.Points(particleGeo, particleMat);
      heartGroup.add(particlePoints);
      particles[vName] = { points: particlePoints, offsets, curve };
    });

    // Sub-Branches: Diagonal Branches (D1, D2 from LAD)
    const d1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3, 0.8, 1.28),
      new THREE.Vector3(-0.65, 0.45, 1.3),
      new THREE.Vector3(-0.95, 0.05, 1.15),
    ]);
    const d1Mesh = new THREE.Mesh(
      new THREE.TubeGeometry(d1Curve, 20, 0.07, 10, false),
      new THREE.MeshStandardMaterial({ color: getVesselColor(vesselPredictions.LAD.probability), roughness: 0.3 })
    );
    heartGroup.add(d1Mesh);
    secondaryBranches.push(d1Mesh);

    const d2Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 0.0, 1.42),
      new THREE.Vector3(-0.55, -0.4, 1.25),
      new THREE.Vector3(-0.75, -0.85, 1.0),
    ]);
    const d2Mesh = new THREE.Mesh(
      new THREE.TubeGeometry(d2Curve, 20, 0.06, 10, false),
      new THREE.MeshStandardMaterial({ color: getVesselColor(vesselPredictions.LAD.probability), roughness: 0.3 })
    );
    heartGroup.add(d2Mesh);
    secondaryBranches.push(d2Mesh);

    // Sub-Branches: Obtuse Marginal (OM1, OM2 from LCX)
    const om1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.35, 0.6, 0.55),
      new THREE.Vector3(-1.45, 0.0, 0.6),
      new THREE.Vector3(-1.3, -0.6, 0.5),
    ]);
    const om1Mesh = new THREE.Mesh(
      new THREE.TubeGeometry(om1Curve, 20, 0.065, 10, false),
      new THREE.MeshStandardMaterial({ color: getVesselColor(vesselPredictions.LCX.probability), roughness: 0.3 })
    );
    heartGroup.add(om1Mesh);
    secondaryBranches.push(om1Mesh);

    // Sub-Branches: Acute Marginal (from RCA)
    const amCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.48, -0.2, 0.5),
      new THREE.Vector3(1.2, -0.6, 0.8),
      new THREE.Vector3(0.7, -1.1, 0.9),
    ]);
    const amMesh = new THREE.Mesh(
      new THREE.TubeGeometry(amCurve, 20, 0.065, 10, false),
      new THREE.MeshStandardMaterial({ color: getVesselColor(vesselPredictions.RCA.probability), roughness: 0.3 })
    );
    heartGroup.add(amMesh);
    secondaryBranches.push(amMesh);

    // ==========================================
    // 7. BODYPARTS3D ANATOMICAL MESHES (DBCLS JAPAN)
    // ==========================================
    const objLoader = new OBJLoader();
    const bpMeshes: Array<{ file: string; color: number; name: string }> = [
      { file: 'aorta.obj', color: 0xc81e2b, name: 'Aorta' },
      { file: 'lad.obj', color: getVesselColor(vesselPredictions.LAD.probability).getHex(), name: 'LAD' },
      { file: 'lcx.obj', color: getVesselColor(vesselPredictions.LCX.probability).getHex(), name: 'LCX' },
      { file: 'rca.obj', color: getVesselColor(vesselPredictions.RCA.probability).getHex(), name: 'RCA' },
      { file: 'anterior_wall.obj', color: 0x991b1b, name: 'Anterior Wall LV' },
      { file: 'lateral_wall.obj', color: 0x881337, name: 'Lateral Wall LV' },
      { file: 'inferior_wall.obj', color: 0x7f1d1d, name: 'Inferior Wall LV' },
      { file: 'rv_wall.obj', color: 0xb91c1c, name: 'Right Ventricle' },
    ];

    bpMeshes.forEach(({ file, color, name }) => {
      objLoader.load(
        `/models/bodyparts3d/${file}`,
        (obj) => {
          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = child as THREE.Mesh;
              // Normalize coordinates to origin [-2.5, 2.5]
              m.geometry.translate(-25.056, 128.78, -1231.2);
              m.geometry.scale(0.055, 0.055, 0.055);
              m.geometry.computeVertexNormals();
              m.castShadow = true;
              m.receiveShadow = true;

              m.material = new THREE.MeshStandardMaterial({
                color,
                roughness: name.includes('Wall') || name.includes('Ventricle') ? 0.42 : 0.25,
                metalness: 0.1,
              });
              m.userData = { name, isBodyParts: true };
            }
          });
          bodypartsGroup.add(obj);
        },
        undefined,
        (err) => console.warn(`Notice on ${file}:`, err)
      );
    });

    // Raycaster & Mouse Dragging
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    threeRef.current = {
      scene,
      camera,
      renderer,
      mainGroup,
      heartGroup,
      bodypartsGroup,
      myocardiumMesh,
      myocardiumCutMesh,
      anteriorWallMesh,
      lateralWallMesh,
      inferiorWallMesh,
      clipPlane,
      vessels,
      secondaryBranches,
      plaqueMeshes,
      particles,
      targetCameraPos,
      targetLookAt,
      isDragging,
      previousMousePosition,
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        mainGroup.rotation.y += deltaX * 0.007;
        mainGroup.rotation.x += deltaY * 0.007;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        raycaster.setFromCamera(mouse, camera);
        const activeContainer = meshSource === 'bodyparts3d' ? bodypartsGroup : heartGroup;
        const intersects = raycaster.intersectObjects(activeContainer.children, true);
        let foundHover: string | null = null;
        for (const hit of intersects) {
          const nm = hit.object.userData?.name;
          if (nm && ['LAD', 'LCX', 'RCA', 'Aorta', 'AORTA'].includes(nm)) {
            foundHover = nm.toUpperCase();
            break;
          }
        }
        setHoveredVessel(foundHover);
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const activeContainer = meshSource === 'bodyparts3d' ? bodypartsGroup : heartGroup;
      const intersects = raycaster.intersectObjects(activeContainer.children, true);
      for (const hit of intersects) {
        const name = hit.object.userData?.name;
        if (name) {
          const upper = name.toUpperCase();
          if (upper.includes('LAD')) onSelectVessel('LAD');
          else if (upper.includes('LCX')) onSelectVessel('LCX');
          else if (upper.includes('RCA')) onSelectVessel('RCA');
          else if (upper.includes('AORTA')) onSelectVessel('AORTA');
          return;
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetCameraPos.z = Math.max(4.0, Math.min(12.5, targetCameraPos.z + e.deltaY * 0.007));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('click', onClick);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ==========================================
    // 8. ANIMATION LOOP: REALISTIC CARDIAC CYCLE & WRINGING
    // ==========================================
    let animId: number;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) * 0.001;

      camera.position.lerp(targetCameraPos, 0.06);
      camera.lookAt(targetLookAt);

      if (isBeating) {
        // Biomechanical Cardiac Cycle: Asymmetric Systole (35%) vs Diastole (65%)
        const bps = pulseRate / 60;
        const cycleProgress = (elapsed * bps) % 1.0;

        let radialScale = 1.0;
        let longitudinalScale = 1.0;
        let torsionAngle = 0.0;

        if (cycleProgress < 0.35) {
          // Rapid Systolic Contraction & Ejection with apical torsion
          const sysPhase = cycleProgress / 0.35;
          const contraction = Math.sin(sysPhase * Math.PI);
          radialScale = 1.0 - contraction * 0.075;
          longitudinalScale = 1.0 - contraction * 0.06;
          torsionAngle = -Math.sin(sysPhase * Math.PI) * 0.045; // Counterclockwise apical wringing
        } else {
          // Diastolic Relaxation & Ventricular Filling
          const diaPhase = (cycleProgress - 0.35) / 0.65;
          const elasticRecoil = Math.sin(diaPhase * Math.PI);
          radialScale = 1.0 + elasticRecoil * 0.02;
          longitudinalScale = 1.0 + elasticRecoil * 0.015;
          torsionAngle = Math.sin(diaPhase * Math.PI) * 0.015;
        }

        heartGroup.scale.set(radialScale, longitudinalScale, radialScale);
        heartGroup.rotation.y = 0.25 + torsionAngle;
        bodypartsGroup.scale.set(radialScale, longitudinalScale, radialScale);

        // Echocardiographic RWMA (Wall Motion Abnormality) Dyskinesis Modeling
        const ladProb = vesselPredictions.LAD.probability;
        if (ladProb >= 0.50) {
          // Paradoxical systolic bulging (hypokinesis / akinesis) in ischemic anterior wall
          const dyskinesis = Math.sin(cycleProgress * Math.PI * 2) * 0.08 * ladProb;
          anteriorWallMesh.scale.set(1.0 + dyskinesis, 1.0 + dyskinesis * 0.4, 1.0 + dyskinesis);
        } else {
          anteriorWallMesh.scale.set(1, 1, 1);
        }
      }

      // Coronary Erythrocyte Flow Dynamics
      if (showBloodFlow) {
        (['LAD', 'LCX', 'RCA'] as const).forEach((vName) => {
          const pData = particles[vName];
          if (!pData) return;
          const prob = vesselPredictions[vName].probability;
          // Post-stenotic flow slows down proportional to lesion severity
          const flowSpeed = Math.max(0.25, 1.3 - prob * 1.05) * 0.25;

          const posAttr = pData.points.geometry.attributes.position as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;

          for (let i = 0; i < pData.offsets.length; i++) {
            pData.offsets[i] = (pData.offsets[i] + flowSpeed * 0.025) % 1.0;
            const pt = pData.curve.getPointAt(pData.offsets[i]);
            posArr[i * 3] = pt.x;
            posArr[i * 3 + 1] = pt.y;
            posArr[i * 3 + 2] = pt.z;
          }
          posAttr.needsUpdate = true;
        });
      }

      // Update 3D Spatial Pins for Floating Badges
      const updateNodePin = (worldPos: THREE.Vector3, elementId: string) => {
        const v = worldPos.clone();
        v.applyMatrix4(heartGroup.matrixWorld);
        v.project(camera);
        const el = document.getElementById(elementId);
        if (el) {
          if (v.z < 1.0) {
            const x = (v.x * 0.5 + 0.5) * container.clientWidth;
            const y = (-(v.y * 0.5) + 0.5) * container.clientHeight;
            el.style.transform = `translate(${x}px, ${y}px)`;
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
          } else {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
          }
        }
      };

      updateNodePin(new THREE.Vector3(-0.25, 0.3, 1.45), 'pin-lad');
      updateNodePin(new THREE.Vector3(-1.45, 0.48, 0.46), 'pin-lcx');
      updateNodePin(new THREE.Vector3(1.42, 0.28, 0.76), 'pin-rca');

      // Subtle slow anatomical orbit when user is not manually rotating
      if (!isDragging) {
        mainGroup.rotation.y += 0.0012;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('click', onClick);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [pulseRate]);

  // Mesh Source Switching (Procedural Arterial Twin vs BodyParts3D)
  useEffect(() => {
    if (!threeRef.current) return;
    const { heartGroup, bodypartsGroup } = threeRef.current;
    if (meshSource === 'bodyparts3d') {
      heartGroup.visible = false;
      bodypartsGroup.visible = true;
    } else {
      heartGroup.visible = true;
      bodypartsGroup.visible = false;
    }
  }, [meshSource]);

  // Dynamic Stenosis Updating & Ischemia Discoloration
  useEffect(() => {
    if (!threeRef.current) return;
    const { vessels, secondaryBranches, plaqueMeshes, particles, anteriorWallMesh, lateralWallMesh, inferiorWallMesh, bodypartsGroup } = threeRef.current;

    (['LAD', 'LCX', 'RCA'] as const).forEach((vName) => {
      const prob = vesselPredictions[vName].probability;
      const color = getVesselColor(prob);
      const v = vessels[vName];
      if (v) {
        v.material.color.copy(color);
      }
      const pl = plaqueMeshes[vName];
      if (pl) pl.visible = prob >= 0.5;

      const p = particles[vName];
      if (p) (p.points.material as THREE.PointsMaterial).color.copy(color);
    });

    // Update BodyParts3D meshes color
    bodypartsGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        const nm = m.userData?.name;
        if (nm === 'LAD') (m.material as THREE.MeshStandardMaterial).color.copy(getVesselColor(vesselPredictions.LAD.probability));
        if (nm === 'LCX') (m.material as THREE.MeshStandardMaterial).color.copy(getVesselColor(vesselPredictions.LCX.probability));
        if (nm === 'RCA') (m.material as THREE.MeshStandardMaterial).color.copy(getVesselColor(vesselPredictions.RCA.probability));
      }
    });

    // Myocardial Ischemia Darkening (Cyanotic / Hypoperfused tissue response)
    if (vesselPredictions.LAD.probability >= 0.50) {
      (anteriorWallMesh.material as THREE.MeshStandardMaterial).color.setHex(0x5a181e);
    } else {
      (anteriorWallMesh.material as THREE.MeshStandardMaterial).color.setHex(0xa81d24);
    }

    if (vesselPredictions.LCX.probability >= 0.50) {
      (lateralWallMesh.material as THREE.MeshStandardMaterial).color.setHex(0x5a181e);
    } else {
      (lateralWallMesh.material as THREE.MeshStandardMaterial).color.setHex(0xa81d24);
    }

    if (vesselPredictions.RCA.probability >= 0.50) {
      (inferiorWallMesh.material as THREE.MeshStandardMaterial).color.setHex(0x5a181e);
    } else {
      (inferiorWallMesh.material as THREE.MeshStandardMaterial).color.setHex(0xa81d24);
    }
  }, [vesselPredictions, overallCadProb]);

  // Cavity Slicer: Real-time clipping plane adjustment
  useEffect(() => {
    if (!threeRef.current) return;
    const { clipPlane } = threeRef.current;
    if (crossSectionCut > 0) {
      // Moves clipping plane from anterior to posterior to slice chambers open
      clipPlane.constant = 1.5 - crossSectionCut * 2.2;
    } else {
      clipPlane.constant = 10; // No clipping
    }
  }, [crossSectionCut]);

  // Camera presets handler
  const setPresetAngle = (view: 'anterior' | 'posterior' | 'left' | 'right' | 'apex' | 'superior') => {
    if (!threeRef.current) return;
    const { targetCameraPos, targetLookAt, mainGroup } = threeRef.current;
    setCameraView(view);

    mainGroup.rotation.set(0, 0, 0);

    switch (view) {
      case 'anterior':
        targetCameraPos.set(0, 0.8, 8.5);
        targetLookAt.set(0, 0, 0);
        break;
      case 'posterior':
        targetCameraPos.set(0, 0.8, -8.5);
        targetLookAt.set(0, 0, 0);
        break;
      case 'left':
        targetCameraPos.set(-8.5, 0.5, 0);
        targetLookAt.set(0, 0, 0);
        break;
      case 'right':
        targetCameraPos.set(8.5, 0.5, 0);
        targetLookAt.set(0, 0, 0);
        break;
      case 'apex':
        targetCameraPos.set(-0.5, -7.5, 3.5);
        targetLookAt.set(-0.2, -0.5, 0);
        break;
      case 'superior':
        targetCameraPos.set(0, 8.5, 1.0);
        targetLookAt.set(0, 0.5, 0);
        break;
    }
  };

  const focusOnVessel = (vName: 'LAD' | 'LCX' | 'RCA') => {
    onSelectVessel(vName);
    if (!threeRef.current) return;
    const { targetCameraPos, targetLookAt, mainGroup } = threeRef.current;
    mainGroup.rotation.set(0, 0, 0);

    if (vName === 'LAD') {
      targetCameraPos.set(-0.4, 0.3, 5.8);
      targetLookAt.set(-0.2, -0.2, 0.9);
    } else if (vName === 'LCX') {
      targetCameraPos.set(-5.6, 0.5, 2.2);
      targetLookAt.set(-1.0, 0.2, 0.2);
    } else if (vName === 'RCA') {
      targetCameraPos.set(5.5, 0.4, 2.8);
      targetLookAt.set(0.8, 0.0, 0.3);
    }
  };

  const handleZoom = (dir: 'in' | 'out') => {
    if (!threeRef.current) return;
    const { targetCameraPos } = threeRef.current;
    const factor = dir === 'in' ? 0.8 : 1.25;
    targetCameraPos.multiplyScalar(factor);
    targetCameraPos.clampLength(4.0, 13.0);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden rounded-xl bg-slate-100/60 border border-slate-200">
      {/* 3D Canvas Viewport */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Spatial Artery Badges */}
      <div
        id="pin-lad"
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-full transition-opacity duration-150 pointer-events-auto"
        style={{ opacity: 0 }}
      >
        <button
          onClick={() => focusOnVessel('LAD')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md border flex items-center gap-1.5 transition-transform hover:scale-105 ${
            vesselPredictions.LAD.probability >= 0.5
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              vesselPredictions.LAD.probability >= 0.5 ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          />
          <span>LAD: {(vesselPredictions.LAD.probability * 100).toFixed(0)}%</span>
        </button>
        <div className="w-0.5 h-2.5 bg-slate-400 mx-auto" />
      </div>

      <div
        id="pin-lcx"
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-full transition-opacity duration-150 pointer-events-auto"
        style={{ opacity: 0 }}
      >
        <button
          onClick={() => focusOnVessel('LCX')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md border flex items-center gap-1.5 transition-transform hover:scale-105 ${
            vesselPredictions.LCX.probability >= 0.5
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              vesselPredictions.LCX.probability >= 0.5 ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          />
          <span>LCX: {(vesselPredictions.LCX.probability * 100).toFixed(0)}%</span>
        </button>
        <div className="w-0.5 h-2.5 bg-slate-400 mx-auto" />
      </div>

      <div
        id="pin-rca"
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-full transition-opacity duration-150 pointer-events-auto"
        style={{ opacity: 0 }}
      >
        <button
          onClick={() => focusOnVessel('RCA')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md border flex items-center gap-1.5 transition-transform hover:scale-105 ${
            vesselPredictions.RCA.probability >= 0.5
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              vesselPredictions.RCA.probability >= 0.5 ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          />
          <span>RCA: {(vesselPredictions.RCA.probability * 100).toFixed(0)}%</span>
        </button>
        <div className="w-0.5 h-2.5 bg-slate-400 mx-auto" />
      </div>

      {/* Floating Status & Heart Rate Overlay (Top Left) */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-700 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-500 font-medium">Heart Rate: </span>
            <span className="text-slate-900 font-mono font-bold">{pulseRate}</span>
            <span className="text-slate-400 text-[10px] ml-1">BPM</span>
          </div>
        </div>

        {hoveredVessel && (
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-teal-500/40 shadow-xs text-xs font-semibold text-teal-900 flex items-center gap-1.5 animate-fadeIn">
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>Target: <strong className="text-slate-900">{hoveredVessel}</strong></span>
          </div>
        )}
      </div>

      {/* View Presets & Zoom Controls (Top Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-xs">
        <button
          onClick={() => focusOnVessel('LAD')}
          className={`px-2 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
            selectedVessel === 'LAD' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Zoom to Left Anterior Descending Artery"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
          LAD
        </button>
        <button
          onClick={() => focusOnVessel('LCX')}
          className={`px-2 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
            selectedVessel === 'LCX' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Zoom to Left Circumflex Artery"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          LCX
        </button>
        <button
          onClick={() => focusOnVessel('RCA')}
          className={`px-2 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
            selectedVessel === 'RCA' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Zoom to Right Coronary Artery"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          RCA
        </button>
        <button
          onClick={() => setPresetAngle('anterior')}
          className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
          title="Reset Camera to Anterior View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Camera View Angle Selector (Right Side) */}
      <div className="absolute right-3 top-16 flex flex-col gap-1 z-10 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-xs text-[10px]">
        {[
          { id: 'anterior', label: 'Anterior' },
          { id: 'posterior', label: 'Posterior' },
          { id: 'left', label: 'Left Lat' },
          { id: 'right', label: 'Right Lat' },
          { id: 'apex', label: 'Apex' },
          { id: 'superior', label: 'Superior' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setPresetAngle(v.id as any)}
            className={`px-2 py-1 rounded text-left font-medium transition ${
              cameraView === v.id ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {v.label}
          </button>
        ))}

        <div className="border-t border-slate-200 my-0.5" />

        <button
          onClick={() => handleZoom('in')}
          className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 flex items-center justify-center"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 flex items-center justify-center"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Anatomical Controls Toolbar (Bottom Left) */}
      <div className="absolute bottom-12 left-3 flex flex-wrap items-center gap-1.5 z-10">
        {/* Model Mode Toggle: Arterial Twin vs BodyParts3D */}
        <div className="bg-white/95 p-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1">
          <button
            onClick={() => setMeshSource('procedural_photoreal')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              meshSource === 'procedural_photoreal'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Arterial Twin
          </button>
          <button
            onClick={() => setMeshSource('bodyparts3d')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition ${
              meshSource === 'bodyparts3d'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>BodyParts3D Meshes</span>
          </button>
        </div>

        {/* Cavity Cross-Section Slicer */}
        {meshSource === 'procedural_photoreal' && (
          <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs text-slate-700">
            <Scissors className="w-3.5 h-3.5 text-teal-700" />
            <span className="text-[11px] font-semibold">Cavity Slicer:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={crossSectionCut}
              onChange={(e) => setCrossSectionCut(parseFloat(e.target.value))}
              className="w-16 accent-teal-700 cursor-pointer"
              title="Slice open internal ventricular chambers"
            />
            {crossSectionCut > 0 && (
              <span className="text-[10px] font-mono text-teal-800 font-bold">
                {(crossSectionCut * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}

        {/* Heartbeat & Flow Toggles */}
        <button
          onClick={() => setIsBeating(!isBeating)}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-xs transition ${
            isBeating
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'bg-white/95 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          title="Toggle biomechanical heartbeat animation"
        >
          {isBeating ? 'Heartbeat: Active' : 'Frozen'}
        </button>

        <button
          onClick={() => setShowBloodFlow(!showBloodFlow)}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-xs transition ${
            showBloodFlow
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'bg-white/95 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          title="Toggle erythrocyte particle stream"
        >
          {showBloodFlow ? 'Erythrocyte Flow: ON' : 'Flow: OFF'}
        </button>
      </div>

      {/* Legend & Anatomical Disclaimers Bar (Bottom Footer) */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-1.5 z-10">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-800">Model-Mapped Stenosis:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Patent (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
            <span>Moderate (40–69%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            <span className="font-bold text-rose-800">Stenosis (&ge;50%)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Vessel-level model probability mapping; not direct 3D lesion fluoroscopy.</span>
        </div>
      </div>
    </div>
  );
};

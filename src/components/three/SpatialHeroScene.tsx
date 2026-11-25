import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import type { Group } from 'three';
import type { PropertySearchItemResponse } from '../../types/api';
import type { HeroBedSlot } from '../../utils/heroBeds';

function BunkBed({
  position,
  bottomBed,
  topBed,
  selectedBedId,
  onSelectBed,
}: {
  position: [number, number, number];
  bottomBed?: HeroBedSlot;
  topBed?: HeroBedSlot;
  selectedBedId: string | null;
  onSelectBed?: (bedId: string) => void;
}) {
  const postPositions: [number, number][] = [
    [-0.52, -0.88],
    [0.52, -0.88],
    [-0.52, 0.88],
    [0.52, 0.88],
  ];

  const getColor = (bed?: HeroBedSlot, fallback = '#10b981') => {
    if (!bed) return fallback;
    if (bed.bedId === selectedBedId) return '#22d3ee';
    if (bed.status === 'AVAILABLE') return '#10b981';
    return '#475569';
  };

  return (
    <group position={position}>
      {postPositions.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.72, z]}>
          <cylinderGeometry args={[0.032, 0.032, 1.5, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}

      {/* Bottom Bunk */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[1.06, 0.08, 1.78]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
      </mesh>
      <RoundedBox args={[0.98, 0.14, 1.7]} radius={0.04} position={[0, 0.28, 0]}>
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </RoundedBox>
      <RoundedBox
        args={[1.0, 0.15, 1.15]}
        radius={0.04}
        position={[0, 0.295, 0.28]}
        onClick={(e) => {
          if (bottomBed && bottomBed.status === 'AVAILABLE' && onSelectBed) {
            e.stopPropagation();
            onSelectBed(bottomBed.bedId);
          }
        }}
      >
        <meshStandardMaterial color={getColor(bottomBed, '#10b981')} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.1, 0.34]} radius={0.04} position={[0, 0.39, -0.62]}>
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </RoundedBox>

      {/* Top Bunk */}
      <mesh position={[0, 0.96, 0]}>
        <boxGeometry args={[1.06, 0.08, 1.78]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
      </mesh>
      <RoundedBox args={[0.98, 0.14, 1.7]} radius={0.04} position={[0, 1.06, 0]}>
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </RoundedBox>
      <RoundedBox
        args={[1.0, 0.15, 1.15]}
        radius={0.04}
        position={[0, 1.075, 0.28]}
        onClick={(e) => {
          if (topBed && topBed.status === 'AVAILABLE' && onSelectBed) {
            e.stopPropagation();
            onSelectBed(topBed.bedId);
          }
        }}
      >
        <meshStandardMaterial color={getColor(topBed, '#06b6d4')} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.1, 0.34]} radius={0.04} position={[0, 1.17, -0.62]}>
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </RoundedBox>

      {/* Safety Rail & Ladder */}
      <mesh position={[0.52, 1.24, 0.15]}>
        <boxGeometry args={[0.03, 0.04, 1.2]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
      </mesh>
      {[-0.65, -0.35].map((z, idx) => (
        <mesh key={idx} position={[0.56, 0.56, z]}>
          <cylinderGeometry args={[0.02, 0.02, 1.12, 10]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {[0.28, 0.54, 0.8].map((y, idx) => (
        <mesh key={idx} position={[0.56, y, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.3, 10]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function SingleBed({
  position,
  bed,
  selectedBedId,
  onSelectBed,
}: {
  position: [number, number, number];
  bed?: HeroBedSlot;
  selectedBedId: string | null;
  onSelectBed?: (bedId: string) => void;
}) {
  const color = !bed
    ? '#6366f1'
    : bed.bedId === selectedBedId
    ? '#22d3ee'
    : bed.status === 'AVAILABLE'
    ? '#10b981'
    : '#475569';

  return (
    <group position={position}>
      <RoundedBox args={[1.04, 0.65, 0.08]} radius={0.03} position={[0, 0.34, -0.86]}>
        <meshStandardMaterial color="#475569" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.04, 0.14, 1.78]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <RoundedBox args={[0.96, 0.14, 1.68]} radius={0.04} position={[0, 0.27, 0.02]}>
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </RoundedBox>
      <RoundedBox
        args={[0.98, 0.15, 1.12]}
        radius={0.04}
        position={[0, 0.285, 0.3]}
        onClick={(e) => {
          if (bed && bed.status === 'AVAILABLE' && onSelectBed) {
            e.stopPropagation();
            onSelectBed(bed.bedId);
          }
        }}
      >
        <meshStandardMaterial color={color} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.6, 0.1, 0.34]} radius={0.04} position={[0, 0.38, -0.6]}>
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </RoundedBox>
    </group>
  );
}

function HostelRoomDiorama({
  bedSlots,
  selectedBedId,
  onSelectBed,
}: {
  bedSlots: HeroBedSlot[];
  selectedBedId: string | null;
  onSelectBed?: (bedId: string) => void;
}) {
  return (
    <group position={[0, -0.55, 0]} rotation={[0.18, -0.55, 0]}>
      <RoundedBox args={[3.2, 0.12, 2.5]} radius={0.04} position={[0, -0.06, 0]}>
        <meshStandardMaterial color="#1e293b" roughness={0.75} metalness={0.15} />
      </RoundedBox>
      <mesh position={[0, -0.14, 0]}>
        <boxGeometry args={[3.26, 0.04, 2.56]} />
        <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={0.65} />
      </mesh>
      <RoundedBox args={[3.2, 1.65, 0.08]} radius={0.02} position={[0, 0.82, -1.21]}>
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </RoundedBox>

      <BunkBed
        position={[-0.88, 0, -0.15]}
        bottomBed={bedSlots[0]}
        topBed={bedSlots[1]}
        selectedBedId={selectedBedId}
        onSelectBed={onSelectBed}
      />
      <SingleBed
        position={[0.92, 0, -0.15]}
        bed={bedSlots[2]}
        selectedBedId={selectedBedId}
        onSelectBed={onSelectBed}
      />

      <RoundedBox args={[0.36, 0.36, 0.36]} radius={0.03} position={[0.04, 0.18, -0.85]}>
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0.04, 0.44, -0.85]}>
        <cylinderGeometry args={[0.03, 0.05, 0.16, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} />
      </mesh>
      <mesh position={[0.04, 0.56, -0.85]}>
        <coneGeometry args={[0.14, 0.16, 16]} />
        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function PropertyPin({
  property,
  selected,
  onSelect,
}: {
  property: PropertySearchItemResponse;
  selected: boolean;
  onSelect: () => void;
}) {
  if (property.latitude == null || property.longitude == null) return null;
  const surfacePos = latLonToVec3(property.latitude, property.longitude, 1.46);
  const normal = surfacePos.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  const color = selected ? '#22d3ee' : property.availableBedCount > 0 ? '#10b981' : '#f59e0b';

  return (
    <group position={surfacePos} quaternion={quaternion}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.045, 0.075, 20]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh
        position={[0, 0.2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[selected ? 0.08 : 0.06, 14, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 2 : 1.3} />
      </mesh>
    </group>
  );
}

// Dense Fibonacci sphere (220 points) for a gap-free skyline of small landmarks around the globe
const LANDMARK_COUNT = 220;
const DECORATIVE_LANDMARKS = Array.from({ length: LANDMARK_COUNT }, (_, i) => {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / LANDMARK_COUNT);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  const r = 1.445;
  const pos = new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
  const normal = pos.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  const palette = ['#22d3ee', '#38bdf8', '#818cf8', '#10b981'];
  return {
    pos,
    normal,
    quaternion,
    color: new THREE.Color(palette[i % palette.length]),
    baseHeight: 0.045 + (i % 4) * 0.018,
  };
});

function DenseReactiveLandmarks({
  hoverPointRef,
}: {
  hoverPointRef: React.MutableRefObject<THREE.Vector3 | null>;
}) {
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null);
  const beaconMeshRef = useRef<THREE.InstancedMesh>(null);
  const liftsRef = useRef<Float32Array>(new Float32Array(LANDMARK_COUNT));
  const dummy = useRef(new THREE.Object3D());

  useFrame((_, delta) => {
    const bodyMesh = bodyMeshRef.current;
    const beaconMesh = beaconMeshRef.current;
    if (!bodyMesh || !beaconMesh) return;

    const speed = Math.min(1, delta * 14);
    const hoverPt = hoverPointRef.current;

    for (let i = 0; i < LANDMARK_COUNT; i++) {
      const lm = DECORATIVE_LANDMARKS[i];
      let target = 0;
      if (hoverPt) {
        const dist = lm.pos.distanceTo(hoverPt);
        if (dist < 0.85) {
          target = (1 - dist / 0.85) * 0.24;
        }
      }

      const lift = THREE.MathUtils.lerp(liftsRef.current[i], target, speed);
      liftsRef.current[i] = lift;

      const heightScale = 1 + lift * 4.5;
      const bodyHeight = lm.baseHeight * heightScale;

      // Tower body positioned on surface + half its height along normal
      dummy.current.position.copy(lm.pos).addScaledVector(lm.normal, bodyHeight / 2 + lift * 0.25);
      dummy.current.quaternion.copy(lm.quaternion);
      dummy.current.scale.set(1 + lift * 1.4, heightScale, 1 + lift * 1.4);
      dummy.current.updateMatrix();
      bodyMesh.setMatrixAt(i, dummy.current.matrix);
      bodyMesh.setColorAt(i, lm.color);

      // Glowing beacon cap on top of each landmark
      dummy.current.position.copy(lm.pos).addScaledVector(lm.normal, bodyHeight + lift * 0.25 + 0.018);
      dummy.current.scale.setScalar(1 + lift * 2.2);
      dummy.current.updateMatrix();
      beaconMesh.setMatrixAt(i, dummy.current.matrix);
    }

    bodyMesh.instanceMatrix.needsUpdate = true;
    if (bodyMesh.instanceColor) bodyMesh.instanceColor.needsUpdate = true;
    beaconMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodyMeshRef} args={[undefined, undefined, LANDMARK_COUNT]}>
        <boxGeometry args={[0.042, 0.06, 0.042]} />
        <meshStandardMaterial roughness={0.3} metalness={0.5} />
      </instancedMesh>
      <instancedMesh ref={beaconMeshRef} args={[undefined, undefined, LANDMARK_COUNT]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={1.4} />
      </instancedMesh>
    </group>
  );
}

function StayLandmarksGlobe({
  properties,
  selectedPropertyId,
  onSelectProperty,
}: {
  properties: PropertySearchItemResponse[];
  selectedPropertyId: string | null;
  onSelectProperty?: (p: PropertySearchItemResponse) => void;
}) {
  const globeRef = useRef<Group>(null);
  const hoverPointRef = useRef<THREE.Vector3 | null>(null);

  useFrame((_, delta) => {
    if (globeRef.current && properties.length === 0 && !hoverPointRef.current) {
      globeRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={globeRef} rotation={[0.22, 2.9, 0]}>
      <mesh
        onPointerMove={(e) => {
          if (globeRef.current) {
            hoverPointRef.current = globeRef.current.worldToLocal(e.point.clone());
          }
        }}
        onPointerOut={() => {
          hoverPointRef.current = null;
        }}
      >
        <sphereGeometry args={[1.44, 40, 40]} />
        <meshStandardMaterial color="#0b1224" roughness={0.6} metalness={0.35} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.45, 24, 16]} />
        <meshStandardMaterial color="#22d3ee" wireframe transparent opacity={0.14} />
      </mesh>

      <DenseReactiveLandmarks hoverPointRef={hoverPointRef} />

      {/* Real backend verified property pins (when available) */}
      {properties.map((p) => (
        <PropertyPin
          key={p.id}
          property={p}
          selected={selectedPropertyId === p.id}
          onSelect={() => onSelectProperty?.(p)}
        />
      ))}
    </group>
  );
}

export default function SpatialHeroScene({
  mode = 'room',
  bedSlots = [],
  selectedBedId = null,
  onSelectBed,
  properties = [],
  selectedPropertyId = null,
  onSelectProperty,
}: {
  mode?: 'room' | 'globe';
  bedSlots?: HeroBedSlot[];
  selectedBedId?: string | null;
  onSelectBed?: (bedId: string) => void;
  properties?: PropertySearchItemResponse[];
  selectedPropertyId?: string | null;
  onSelectProperty?: (p: PropertySearchItemResponse) => void;
}) {
  return (
    <div className="relative h-60 w-full cursor-grab active:cursor-grabbing sm:h-72" aria-label="Interactive 3D scene">
      <Canvas
        camera={mode === 'globe' ? { position: [0, 0.35, 4.1], fov: 42 } : { position: [0, 1.35, 4.6], fov: 40 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 4]} intensity={1.6} color="#e0f2fe" />
        <pointLight position={[0, 1.2, -0.5]} intensity={1.1} color="#fbbf24" />
        {mode === 'globe' ? (
          <StayLandmarksGlobe
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={onSelectProperty}
          />
        ) : (
          <HostelRoomDiorama
            bedSlots={bedSlots}
            selectedBedId={selectedBedId}
            onSelectBed={onSelectBed}
          />
        )}
        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.75} />
      </Canvas>
      <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-slate-950/75 px-2 py-0.5 text-[10px] text-slate-400">
        Drag to rotate ·{' '}
        {mode === 'globe'
          ? properties.length > 0
            ? `${properties.length} live properties`
            : 'Visual preview'
          : bedSlots.length > 0
          ? 'Tap green bed to select'
          : 'Visual room preview'}
      </span>
    </div>
  );
}

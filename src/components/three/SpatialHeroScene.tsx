import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef } from 'react';
import type { Mesh } from 'three';

function SpatialPrism() {
  const meshRef = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.25;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.7}>
      <mesh ref={meshRef} scale={1.45}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color="#22d3ee"
          emissive="#1e1b4b"
          roughness={0.2}
          metalness={0.75}
          distort={0.22}
          speed={1.5}
          wireframe
        />
      </mesh>
    </Float>
  );
}

export default function SpatialHeroScene() {
  return (
    <div className="h-64 w-full sm:h-80" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 4, 4]} intensity={1.5} color="#38bdf8" />
        <pointLight position={[-4, -3, 2]} intensity={1} color="#818cf8" />
        <SpatialPrism />
      </Canvas>
    </div>
  );
}

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Stars } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

function Sculpture({ entered }: { entered: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ pointer, clock }, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += delta * (entered ? 0.22 : 0.12);
    mesh.current.rotation.x = THREE.MathUtils.damp(mesh.current.rotation.x, pointer.y * 0.24, 2, delta);
    mesh.current.rotation.z = THREE.MathUtils.damp(mesh.current.rotation.z, pointer.x * -0.16, 2, delta);
    const scale = entered ? 1.55 : 1;
    mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), Math.min(delta * 2, 1));
    mesh.current.position.y = Math.sin(clock.elapsedTime * 0.6) * 0.08;
  });
  return <Float speed={1.1} floatIntensity={0.35} rotationIntensity={0.12}>
    <mesh ref={mesh} rotation={[0.4, 0, 0.3]}>
      <torusKnotGeometry args={[1.18, 0.35, 240, 24, 2, 3]} />
      <MeshTransmissionMaterial backside samples={4} resolution={256} transmission={0.7} thickness={0.7} roughness={0.13} chromaticAberration={0.16} anisotropy={0.3} distortion={0.18} distortionScale={0.25} temporalDistortion={0.12} color="#ffae63" metalness={0.35} />
    </mesh>
  </Float>;
}

export default function Scene({ entered }: { entered: boolean }) {
  return <Canvas dpr={[1, 1.7]} camera={{ position: [0, 0, 6.4], fov: 43 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={['#0e0906']} />
    <fog attach="fog" args={['#0e0906', 8, 18]} />
    <ambientLight intensity={1.6} />
    <pointLight position={[-4, 3, 3]} intensity={65} color="#ff6a18" />
    <pointLight position={[4, -2, 2]} intensity={45} color="#ffe0aa" />
    <pointLight position={[0, 4, -3]} intensity={35} color="#b53e0e" />
    <Suspense fallback={null}><Sculpture entered={entered} /><Stars radius={40} depth={30} count={950} factor={2} saturation={0.5} fade speed={0.4} /></Suspense>
  </Canvas>;
}

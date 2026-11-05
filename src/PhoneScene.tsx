import { Suspense, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type Props = { progress: MutableRefObject<number>; reduced: boolean };

/**
 * Six camera setups, aligned with the CENTER of each full-screen chapter.
 * 02: horizontal extreme edge close-up.
 * 03: complete rear view, no extra zoom.
 * 04: vertical extreme edge close-up.
 * 05: rear camera cluster macro shot.
 * 01 and 06 preserve their original full-product compositions.
 */
const SHOTS = [
  { x:1.46, y:.54, z:0, yaw:-.35, pitch:.07, roll:-.10, zoom:1.00, cameraFocus:0 },
  { x:1.53, y:.32, z:0, yaw:-1.52, pitch:0, roll:-Math.PI/2, zoom:2.15, cameraFocus:0 },
  { x:1.48, y:.32, z:0, yaw:-2.93, pitch:-.06, roll:-.06, zoom:1.11, cameraFocus:0 },
  { x:1.52, y:.28, z:0, yaw:-4.68, pitch:0, roll:0, zoom:2.20, cameraFocus:0 },
  { x:1.43, y:.13, z:0, yaw:-3.06, pitch:.09, roll:-.09, zoom:2.25, cameraFocus:1 },
  { x:1.48, y:.14, z:0, yaw:-6.63, pitch:.04, roll:-.07, zoom:1.06, cameraFocus:0 },
] as const;

function interpolateShot(progress:number) {
  // Each section occupies 1/6 of the scroll journey. Land on its shot
  // halfway through that section, then hold the composition for reading.
  const scaled = THREE.MathUtils.clamp(progress*SHOTS.length-.5,0,SHOTS.length-1);
  const index = Math.min(SHOTS.length-2,Math.floor(scaled));
  const raw = scaled-index;
  // A generous hold near both ends prevents constant spinning while reading.
  const t = THREE.MathUtils.smoothstep(raw,.12,.88);
  const a=SHOTS[index],b=SHOTS[index+1];
  return {
    x:THREE.MathUtils.lerp(a.x,b.x,t),
    y:THREE.MathUtils.lerp(a.y,b.y,t),
    z:THREE.MathUtils.lerp(a.z,b.z,t),
    yaw:THREE.MathUtils.lerp(a.yaw,b.yaw,t),
    pitch:THREE.MathUtils.lerp(a.pitch,b.pitch,t),
    roll:THREE.MathUtils.lerp(a.roll,b.roll,t),
    zoom:THREE.MathUtils.lerp(a.zoom,b.zoom,t),
    cameraFocus:THREE.MathUtils.lerp(a.cameraFocus,b.cameraFocus,t),
  };
}

function Phone({ progress, reduced }: Props) {
  const gltf = useGLTF('/phone.glb');
  const root = useRef<THREE.Group>(null);
  const { object, portraitRotation, portraitSize } = useMemo(() => {
    // Normalize the actual Blender mesh axes rather than guessing a 90° angle.
    // Longest dimension = height, middle = width, shortest = thickness.
    const original = gltf.scene.children[0] || gltf.scene;
    const copy = original.clone(true);
    const bounds = new THREE.Box3().setFromObject(copy);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    copy.position.sub(center);
    const axes = [
      { axis: new THREE.Vector3(1, 0, 0), size: size.x },
      { axis: new THREE.Vector3(0, 1, 0), size: size.y },
      { axis: new THREE.Vector3(0, 0, 1), size: size.z },
    ].sort((a, b) => b.size - a.size);
    const vertical = axes[0].axis;
    const horizontal = axes[1].axis;
    const depth = new THREE.Vector3().crossVectors(horizontal, vertical).normalize();
    const basis = new THREE.Matrix4().makeBasis(horizontal, vertical, depth);
    // Bounding-box axes tell us portrait vs landscape, but not which end is top.
    // This particular Blender export has its camera module at the bottom after
    // axis alignment. Turn the mesh 180° in its screen plane to put cameras on top.
    const portraitRotation = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)
      .multiply(new THREE.Quaternion().setFromRotationMatrix(basis).invert());
    return { object: copy, portraitRotation, portraitSize: { width: axes[1].size, height: axes[0].size } };
  }, [gltf]);

  useFrame(({ clock, viewport }, delta) => {
    if (!root.current) return;
    const p = progress.current;
    const compact = viewport.width < 6;
    const shot = interpolateShot(p);
    const wobble = reduced ? 0 : Math.sin(clock.elapsedTime * .72) * .027;
    const base = compact ? 15.2 : 23.5;
    const targetScale = base * (compact ? 1 + (shot.zoom-1)*.72 : shot.zoom);
    // The rear camera island is in the upper corner of the upright phone.
    // Shift the model in screen space as we zoom, so that corner stays in frame.
    const focusX = Math.min(1.3,portraitSize.width*targetScale*.27)*shot.cameraFocus;
    const focusY = Math.min(1.65,portraitSize.height*targetScale*.31)*shot.cameraFocus;
    const x = (compact ? .18+(shot.x-1.48)*.42 : shot.x) + focusX*(compact ? .45 : 1);
    const y = (compact ? .44+(shot.y-.32)*.42 : shot.y) - focusY*(compact ? .55 : 1);
    root.current.position.x = THREE.MathUtils.damp(root.current.position.x,x,4.1,delta);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y,y+wobble,4.1,delta);
    root.current.position.z = THREE.MathUtils.damp(root.current.position.z,shot.z,3.8,delta);
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y,shot.yaw,3.5,delta);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x,shot.pitch,3.5,delta);
    root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z,shot.roll,3.5,delta);
    root.current.scale.setScalar(THREE.MathUtils.damp(root.current.scale.x,targetScale,3.8,delta));
  });

  return <group ref={root} position={[1.5, 0.4, 0]}>
    <group quaternion={portraitRotation}><primitive object={object}/></group>
  </group>;
}

function StudioLighting({ progress }: { progress: MutableRefObject<number> }) {
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  useFrame((_, delta) => {
    const p = progress.current;
    if(key.current) {
      key.current.intensity = THREE.MathUtils.damp(key.current.intensity,3.2 + Math.sin(p*Math.PI*2)*1.3,2,delta);
      key.current.position.x = THREE.MathUtils.damp(key.current.position.x,3.5 - p*5,2,delta);
    }
    if(rim.current) {
      rim.current.intensity = THREE.MathUtils.damp(rim.current.intensity,2.3 + Math.sin(p*Math.PI*3+.7)*.8,2,delta);
    }
  });
  return <>
    <ambientLight intensity={1.85}/>
    <hemisphereLight args={['#ffffff','#777c86',2.2]}/>
    <directionalLight ref={key} position={[3.5,5,6]} intensity={3.2} color="#ffffff"/>
    <directionalLight ref={rim} position={[-5,1,-4]} intensity={2.4} color="#b4c7df"/>
    <pointLight position={[-3,-3,4]} intensity={55} color="#e1e8f1"/>
  </>;
}

export default function PhoneScene(props: Props) {
  return <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 8], fov: 42 }} gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}>
    <StudioLighting progress={props.progress}/>
    <Suspense fallback={null}><Phone {...props}/></Suspense>
  </Canvas>;
}

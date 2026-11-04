import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function Robot({interactive}:{interactive:boolean}){
  const head=useRef<THREE.Group>(null);
  const body=useRef<THREE.Group>(null);
  const eyes=useRef<THREE.Group>(null);
  const gaze=useRef(new THREE.Vector2());
  const cursor=useRef(new THREE.Vector2());
  useEffect(()=>{
    if(!interactive)return;
    const onMove=(event:PointerEvent)=>{cursor.current.set((event.clientX/window.innerWidth)*2-1,1-(event.clientY/window.innerHeight)*2);};
    window.addEventListener('pointermove',onMove,{passive:true});
    return()=>window.removeEventListener('pointermove',onMove);
  },[interactive]);
  useFrame(({clock},delta)=>{
    if(!head.current||!body.current||!eyes.current)return;
    const x=interactive?THREE.MathUtils.clamp(cursor.current.x,-1,1):Math.sin(clock.elapsedTime*.45)*.24;
    const y=interactive?THREE.MathUtils.clamp(cursor.current.y,-1,1):Math.cos(clock.elapsedTime*.5)*.12;
    gaze.current.lerp(new THREE.Vector2(x,y),1-Math.exp(-delta*4));
    head.current.rotation.y=THREE.MathUtils.damp(head.current.rotation.y,gaze.current.x*.5,3,delta);
    head.current.rotation.x=THREE.MathUtils.damp(head.current.rotation.x,-gaze.current.y*.23,3,delta);
    eyes.current.position.x=THREE.MathUtils.damp(eyes.current.position.x,gaze.current.x*.085,5,delta);
    eyes.current.position.y=THREE.MathUtils.damp(eyes.current.position.y,.07+gaze.current.y*.055,5,delta);
    body.current.position.y=Math.sin(clock.elapsedTime*1.1)*.045;
  });
  return <group position={[0,-.12,0]}>
    <group ref={body}>
      <RoundedBox args={[1.38,1.24,.92]} radius={.3} smoothness={5} position={[0,-.76,0]}>
        <meshStandardMaterial color="#2d3835" metalness={.62} roughness={.33}/>
      </RoundedBox>
      <RoundedBox args={[.68,.14,.09]} radius={.055} position={[0,-.64,.48]}>
        <meshStandardMaterial color="#a4c1b1" emissive="#5b927a" emissiveIntensity={.3} metalness={.25}/>
      </RoundedBox>
      <mesh position={[-.88,-.73,0]} rotation={[0,0,-.22]}><capsuleGeometry args={[.17,.48,6,12]}/><meshStandardMaterial color="#465a51" metalness={.6} roughness={.35}/></mesh>
      <mesh position={[.88,-.73,0]} rotation={[0,0,.22]}><capsuleGeometry args={[.17,.48,6,12]}/><meshStandardMaterial color="#465a51" metalness={.6} roughness={.35}/></mesh>
    </group>
    <group ref={head} position={[0,.43,.05]}>
      <RoundedBox args={[1.66,1.16,.95]} radius={.34} smoothness={6}>
        <meshStandardMaterial color="#879d90" metalness={.63} roughness={.28}/>
      </RoundedBox>
      <RoundedBox args={[1.4,.88,.08]} radius={.26} smoothness={5} position={[0,0,.49]}>
        <meshStandardMaterial color="#14201d" metalness={.3} roughness={.23}/>
      </RoundedBox>
      <group ref={eyes} position={[0,.07,.545]}>
        {[-.38,.38].map(x=><group key={x} position={[x,0,0]}>
          <mesh><sphereGeometry args={[.14,24,16]}/><meshStandardMaterial color="#d7f4df" emissive="#9fdcc0" emissiveIntensity={1.7} toneMapped={false}/></mesh>
          <mesh position={[0,0,-.02]}><sphereGeometry args={[.2,20,12]}/><meshBasicMaterial color="#a7e5c0" transparent opacity={.09}/></mesh>
        </group>)}
      </group>
      <mesh position={[0,-.27,.545]}><boxGeometry args={[.28,.022,.018]}/><meshBasicMaterial color="#a5d9bb"/></mesh>
      <mesh position={[0,.78,0]}><cylinderGeometry args={[.035,.055,.28,12]}/><meshStandardMaterial color="#748f80" metalness={.8}/></mesh>
      <mesh position={[0,.95,0]}><sphereGeometry args={[.09,16,12]}/><meshStandardMaterial color="#d8ebda" emissive="#a2d9b7" emissiveIntensity={.9}/></mesh>
    </group>
  </group>;
}
export default function CursorRobot({interactive=true}:{interactive?:boolean}){
  return <Canvas dpr={[1,1.5]} camera={{position:[0,.1,5.2],fov:39}} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} style={{width:'100%',height:'100%'}}>
    <ambientLight intensity={2}/>
    <directionalLight position={[-3,5,5]} intensity={3} color="#e1ede3"/>
    <pointLight position={[3,-1,3]} intensity={24} color="#7aa993"/>
    <Robot interactive={interactive}/>
  </Canvas>;
}

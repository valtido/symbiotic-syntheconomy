import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Canvas, Vector3 } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';
import { VRButton, XR, Controllers, Hands } from '@react-three/xr';

interface RitualSpace {
  id: string;
  name: string;
  dimensions: Vector3;
  artifacts: Artifact[];
  audioZones: AudioZone[];
}

interface Artifact {
  id: string;
  name: string;
  modelPath: string;
  position: Vector3;
  scale: Vector3;
  culturalData: string;
}

interface AudioZone {
  id: string;
  position: Vector3;
  radius: number;
  audioPath: string;
  volume: number;
}

interface ImmersiveRitualViewerProps {
  ritualSpace: RitualSpace;
  onHapticFeedback: (intensity: number) => void;
}

const ImmersiveRitualViewer: React.FC<ImmersiveRitualViewerProps> = ({ ritualSpace, onHapticFeedback }) => {
  const [isVRActive, setIsVRActive] = useState(false);
  const audioListenerRef = useRef<THREE.AudioListener | null>(null);
  const audioZonesRef = useRef<THREE.PositionalAudio[]>([]);

  // Initialize audio context and spatial audio zones
  useEffect(() => {
    if (!audioListenerRef.current) {
      audioListenerRef.current = new THREE.AudioListener();
    }

    return () => {
      audioZonesRef.current.forEach(audio => audio.stop());
      audioZonesRef.current = [];
    };
  }, [ritualSpace.audioZones]);

  // Handle VR mode toggle
  const toggleVR = () => {
    setIsVRActive(!isVRActive);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <VRButton />
      <Canvas>
        <XR>
          <Controllers />
          <Hands />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <RitualSpaceRenderer ritualSpace={ritualSpace} onHapticFeedback={onHapticFeedback} />
          <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
          <Environment preset="sunset" />
        </XR>
      </Canvas>
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <h3>{ritualSpace.name}</h3>
        <button onClick={toggleVR}>{isVRActive ? 'Exit VR' : 'Enter VR'}</button>
      </div>
    </div>
  );
};

const RitualSpaceRenderer: React.FC<ImmersiveRitualViewerProps> = ({ ritualSpace, onHapticFeedback }) => {
  const { camera } = useThree();
  const playerPosition = useRef(new THREE.Vector3());

  // Update player position for audio and haptic feedback
  useFrame(() => {
    camera.getWorldPosition(playerPosition.current);
    ritualSpace.audioZones.forEach((zone, index) => {
      const distance = playerPosition.current.distanceTo(zone.position as THREE.Vector3);
      if (distance < zone.radius) {
        onHapticFeedback(distance / zone.radius);
      }
    });
  });

  return (
    <group>
      {/* Render ritual space boundaries */}
      <mesh position={[0, 0, 0]} scale={ritualSpace.dimensions as THREE.Vector3}>
        <boxGeometry />
        <meshStandardMaterial color="gray" wireframe />
      </mesh>

      {/* Render cultural artifacts */}
      {ritualSpace.artifacts.map(artifact => (
        <group key={artifact.id} position={artifact.position as THREE.Vector3} scale={artifact.scale as THREE.Vector3}>
          <mesh>
            <boxGeometry />
            <meshStandardMaterial color="brown" />
          </mesh>
          <Text position={[0, 1.5, 0]} rotation={[0, 0, 0]} fontSize={0.5} color="white">
            {artifact.name}
          </Text>
        </group>
      ))}

      {/* Audio zones visualization */}
      {ritualSpace.audioZones.map(zone => (
        <mesh key={zone.id} position={zone.position as THREE.Vector3} scale={[zone.radius * 2, zone.radius * 2, zone.radius * 2]}>
          <sphereGeometry />
          <meshBasicMaterial color="blue" opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
};

export default ImmersiveRitualViewer;

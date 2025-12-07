import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector2, Color, ShaderMaterial, AdditiveBlending, Mesh, Points } from 'three';
import { FLUID_VERTEX_SHADER, FLUID_FRAGMENT_SHADER, PARTICLES_VERTEX_SHADER, PARTICLES_FRAGMENT_SHADER } from '../constants';

interface MHDCanvasProps {
  viscosity: number;
  magneticStrength: number;
  speed: number;
  colorTemp: number;
}

const FluidPlane: React.FC<MHDCanvasProps> = ({ viscosity, magneticStrength, speed, colorTemp }) => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  
  const [hover, setHover] = useState(false);
  
  // Uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0.5, 0.5) },
      uHoverState: { value: 0 },
      uSpeed: { value: speed },
      uStrength: { value: magneticStrength },
      uColorCold: { value: new Color('#000030') }, // Deep Blue
      uColorHot: { value: new Color('#ffffff') }, // White Hot
      uColorTemp: { value: colorTemp },
    }),
    []
  );

  // Update loop
  useFrame((state) => {
    const { clock, pointer } = state;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      
      // Smoothly interpolate mouse position for fluid feel
      // Pointer is -1 to 1, map to 0 to 1 uv space
      const targetX = pointer.x * 0.5 + 0.5;
      const targetY = pointer.y * 0.5 + 0.5;
      
      const currentMouse = materialRef.current.uniforms.uMouse.value;
      
      // Lerp for viscosity delay
      const lerpFactor = 0.1 * (1.0 / (viscosity + 0.1));
      currentMouse.x += (targetX - currentMouse.x) * lerpFactor;
      currentMouse.y += (targetY - currentMouse.y) * lerpFactor;
      
      // Interaction state decay/attack
      const targetHover = hover ? 1.0 : 0.0;
      materialRef.current.uniforms.uHoverState.value += (targetHover - materialRef.current.uniforms.uHoverState.value) * 0.1;

      // Dynamic parameter updates
      materialRef.current.uniforms.uSpeed.value = speed;
      materialRef.current.uniforms.uStrength.value = magneticStrength;
      materialRef.current.uniforms.uColorTemp.value = colorTemp;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      {/* High segment plane for detailed vertex displacement */}
      <planeGeometry args={[10, 10, 256, 256]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={FLUID_VERTEX_SHADER}
        fragmentShader={FLUID_FRAGMENT_SHADER}
        uniforms={uniforms}
        wireframe={false}
      />
    </mesh>
  );
};

const MagneticParticles: React.FC = () => {
    const count = 200;
    const pointsRef = useRef<Points>(null);

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const scales = new Float32Array(count);
        for(let i=0; i<count; i++){
            positions[i*3] = (Math.random() - 0.5) * 8;
            positions[i*3+1] = (Math.random() - 0.5) * 2; // height spread
            positions[i*3+2] = (Math.random() - 0.5) * 8;
            scales[i] = Math.random();
        }
        return { positions, scales };
    }, []);

    useFrame((state) => {
        if(pointsRef.current) {
            (pointsRef.current.material as ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={particles.positions}
                    itemSize={3}
                />
                <bufferAttribute 
                    attach="attributes-aScale"
                    count={count}
                    array={particles.scales}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial 
                vertexShader={PARTICLES_VERTEX_SHADER}
                fragmentShader={PARTICLES_FRAGMENT_SHADER}
                uniforms={{ uTime: { value: 0 } }}
                transparent
                depthWrite={false}
                blending={AdditiveBlending}
            />
        </points>
    )
}

const MHDCanvas: React.FC<MHDCanvasProps> = (props) => {
  return (
    <>
      <color attach="background" args={['#050505']} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#4444ff" />
      <pointLight position={[-10, 5, -10]} intensity={1} color="#ff44ff" />
      
      <FluidPlane {...props} />
      <MagneticParticles />
    </>
  );
};

export default MHDCanvas;
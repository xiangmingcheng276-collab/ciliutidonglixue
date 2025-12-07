import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { SimulationParams, InteractionMode } from './types';
import MHDCanvas from './components/MHDCanvas';
import Overlay from './components/Overlay';

const App: React.FC = () => {
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.MOUSE);
  const [params, setParams] = useState<SimulationParams>({
    speed: 0.5,
    viscosity: 0.1,
    magneticStrength: 1.5,
    colorTemp: 1.0,
  });

  // Auto-pilot demo mode
  useEffect(() => {
    let interval: number;
    if (mode === InteractionMode.AUTO) {
        let time = 0;
        interval = window.setInterval(() => {
            time += 0.05;
            setParams(p => ({
                ...p,
                magneticStrength: 1.5 + Math.sin(time) * 1.0,
                colorTemp: 1.0 + Math.cos(time * 0.5) * 0.5
            }));
        }, 50);
    }
    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Scene */}
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 8, 6], fov: 45 }}
        gl={{ antialias: false, alpha: false }}
        className="absolute inset-0 z-0"
      >
        <Suspense fallback={null}>
          <MHDCanvas
            speed={params.speed}
            viscosity={params.viscosity}
            magneticStrength={params.magneticStrength}
            colorTemp={params.colorTemp}
          />
          
          {/* Post Processing for the Sci-Fi Look */}
          <EffectComposer disableNormalPass>
            {/* Bloom for the white-hot heat effect */}
            <Bloom 
                luminanceThreshold={0.8} 
                mipmapBlur 
                intensity={1.5} 
                radius={0.6}
            />
            {/* Noise for film grain / realism */}
            <Noise opacity={0.05} />
            {/* Vignette to focus attention */}
            <Vignette eskil={false} offset={0.1} darkness={0.8} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10">
        <Overlay 
            params={params} 
            setParams={setParams} 
            mode={mode}
            setMode={setMode}
        />
      </div>
    </div>
  );
};

export default App;

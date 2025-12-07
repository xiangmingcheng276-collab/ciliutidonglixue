import React from 'react';
import { Settings, Hand, MousePointer2, Info, Activity, Zap } from 'lucide-react';
import { SimulationParams, InteractionMode } from '../types';

interface OverlayProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
}

const Overlay: React.FC<OverlayProps> = ({ params, setParams, mode, setMode }) => {
  const handleChange = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tighter mix-blend-difference" style={{ fontFamily: 'monospace' }}>
            MHD CANVAS
          </h1>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs uppercase tracking-widest">
            <Activity size={12} />
            <span>Magnetohydrodynamic Simulation</span>
          </div>
        </div>
        
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-2 flex space-x-2">
            <button
                onClick={() => setMode(InteractionMode.MOUSE)}
                className={`p-2 rounded-md transition-all ${mode === InteractionMode.MOUSE ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-500 hover:text-white'}`}
                title="Mouse Interaction"
            >
                <MousePointer2 size={20} />
            </button>
            <button
                onClick={() => setMode(InteractionMode.AUTO)}
                className={`p-2 rounded-md transition-all ${mode === InteractionMode.AUTO ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:text-white'}`}
                title="Auto-Pilot / Demo Mode"
            >
                <Zap size={20} />
            </button>
            {/* Hand tracking placeholder */}
            <button
                className="p-2 rounded-md text-gray-700 cursor-not-allowed border border-transparent"
                title="MediaPipe Gesture Control (Requires External Assets)"
                disabled
            >
                <Hand size={20} />
            </button>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl p-6 pointer-events-auto space-y-6">
        <div className="flex items-center space-x-2 text-white/80 border-b border-white/10 pb-2 mb-4">
          <Settings size={16} />
          <span className="text-sm font-semibold uppercase tracking-wider">Field Parameters</span>
        </div>

        {/* Magnetic Strength */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-cyan-300">
            <span>Magnetic Flux</span>
            <span>{(params.magneticStrength * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={params.magneticStrength}
            onChange={(e) => handleChange('magneticStrength', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
          />
        </div>

        {/* Viscosity */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-purple-300">
            <span>Viscosity</span>
            <span>{(params.viscosity * 100).toFixed(0)} cP</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={params.viscosity}
            onChange={(e) => handleChange('viscosity', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-400 hover:accent-purple-300"
          />
        </div>

        {/* Speed */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-emerald-300">
            <span>Turbulence</span>
            <span>{(params.speed * 10).toFixed(1)} Hz</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={params.speed}
            onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300"
          />
        </div>
        
        {/* Color Temp */}
        <div className="space-y-2">
           <div className="flex justify-between text-xs text-orange-300">
            <span>Core Temperature</span>
            <span>{(3000 + params.colorTemp * 7000).toFixed(0)} K</span>
          </div>
           <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={params.colorTemp}
            onChange={(e) => handleChange('colorTemp', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-400 hover:accent-orange-300"
          />
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="text-white/30 text-xs font-mono flex items-center space-x-4">
        <div className="flex items-center space-x-1">
            <Info size={12}/>
            <span>GPU SPH Approximation</span>
        </div>
        <span>•</span>
        <span>Three.js r160+</span>
      </div>
    </div>
  );
};

export default Overlay;

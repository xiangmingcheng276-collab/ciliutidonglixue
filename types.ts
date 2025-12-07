export enum InteractionMode {
  MOUSE = 'MOUSE',
  AUTO = 'AUTO'
}

export interface SimulationParams {
  speed: number;
  viscosity: number;
  magneticStrength: number;
  colorTemp: number;
}
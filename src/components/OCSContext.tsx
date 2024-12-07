
// Define the OCSContext type (renamed from EntryParams)
export type OCSContext = {
  wavelengthBounds: { min: number; max: number };
  omitBetaBand: boolean;
  isMaxBasis: boolean;
  wavelengthSampleResolution: number;
  spectralPeaks: {
    peakWavelength1: number;
    peakWavelength2: number;
    peakWavelength3: number;
    peakWavelength4: number;
  };
  activeCones: {
    isCone1Active: boolean;
    isCone2Active: boolean;
    isCone3Active: boolean;
    isCone4Active: boolean;
  };
  selectedSpecies: string | null;
};

// Define the OCSData type to group data from backend
export type OCSData = {
  geometry: THREE.BufferGeometry;
  vertexShader: string;
  fragmentShader: string;
  wavelengths: number[];
  coneResponses: {
    coneResponse1: number[];
    coneResponse2: number[];
    coneResponse3: number[];
    coneResponse4: number[];
  };
};

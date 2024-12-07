import { AppShell, Container, Grid, useMantineTheme, Title, Stack, MantineTheme } from "@mantine/core";
import ObjectColorSolid from "./ObjectColorSolid";
import SliceDisplay from "./SliceDisplay/SliceDisplay";
import GraphDisplay from "./GraphDisplay/GraphDisplay";
import SpectraInputs from "./GraphDisplay/SpectraInputs";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";
import React from "react";

const getWindowDimensions = () => {
  const { innerWidth: width, innerHeight: height } = window;
  return { width, height };
};

const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions(getWindowDimensions());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowDimensions;
};

const OCSStyle: React.CSSProperties = {
  position: "absolute",
  marginTop: "-5%",
  marginLeft: "-2.5%",
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1,
};

const headerStyle = (theme: MantineTheme) => ({
  backgroundColor: theme.colors.myColor[7],
  color: "white",
  display: "flex",
  alignItems: "center",
});

type SpectralPeakType = {
  peak: number;
  isActive: boolean;
};

type SpectralPeaksType = {
  peak1: SpectralPeakType;
  peak2: SpectralPeakType;
  peak3: SpectralPeakType;
  peak4: SpectralPeakType;
};

type SpectralDBEntry = {
  scientificName: string;
  peaks: number[];
  source: string;
  note: string;
};

type SpectralDB = Record<string, SpectralDBEntry>;

// all state/context members
type AppContextType = {
  height: number;
  width: number;

  spectralDB: SpectralDB;
  setSpectralDB: Dispatch<SetStateAction<SpectralDB>>;

  omitBetaBand: boolean;
  setOmitBetaBand: Dispatch<SetStateAction<boolean>>;

  isMaxBasis: boolean;
  setIsMaxBasis: Dispatch<SetStateAction<boolean>>;

  wavelengthSampleResolution: number;
  setWavelengthSampleResolution: Dispatch<SetStateAction<number>>;
  
  spectralPeaksNew: SpectralPeaksType;
  setSpectralPeaksNew: Dispatch<SetStateAction<SpectralPeaksType>>;
  
  spectralPeaks: {
    peakWavelength1: number;
    peakWavelength2: number;
    peakWavelength3: number;
    peakWavelength4: number;
  };
  setSpectralPeaks: Dispatch<SetStateAction<{
    peakWavelength1: number;
    peakWavelength2: number;
    peakWavelength3: number;
    peakWavelength4: number;
  }>>;
  activeCones: {
    isCone1Active: boolean;
    isCone2Active: boolean;
    isCone3Active: boolean;
    isCone4Active: boolean;
  };
  setActiveCones: Dispatch<SetStateAction<{
    isCone1Active: boolean;
    isCone2Active: boolean;
    isCone3Active: boolean;
    isCone4Active: boolean;
  }>>;

  sliceDimension: number;
  setSliceDimension: Dispatch<SetStateAction<number>>;

  submitSwitch: number;
  setSubmitSwitch: Dispatch<SetStateAction<number>>;

  coneResponseType: string;
  setConeResponseType: Dispatch<SetStateAction<string>>;

  wavelengthBounds: {
    min: number;
    max: number;
  };
  setWavelengthBounds: Dispatch<SetStateAction<{
    min: number;
    max: number;
  }>>;

  coneResponses: {
    coneResponse1: Array<number>;
    coneResponse2: Array<number>;
    coneResponse3: Array<number>;
    coneResponse4: Array<number>;
  };
  setConeResponses: Dispatch<SetStateAction<{
    coneResponse1: Array<number>;
    coneResponse2: Array<number>;
    coneResponse3: Array<number>;
    coneResponse4: Array<number>;
  }>>;

  wavelengths: Array<number>;
  setWavelengths: Dispatch<SetStateAction<Array<number>>>;

  sliceVisible: boolean;
  setSliceVisible: Dispatch<SetStateAction<boolean>>;

  sliceSwitch: number;
  setSliceSwitch: Dispatch<SetStateAction<number>>;

  positionY: number;
  setPositionY: Dispatch<SetStateAction<number>>;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const DEFAULT_S_PEAK = 455;
export const DEFAULT_M_PEAK = 543;
export const DEFAULT_L_PEAK = 566;
export const DEFAULT_Q_PEAK = 560;
const MIN_VISIBLE_WAVELENGTH = 390;
const MAX_VISIBLE_WAVELENGTH = 700;

// init state
export const AppContextProvider = ({ children }: { children: ReactNode }) => {

  const [spectralDB, setSpectralDB] = useState<SpectralDB>({});

  const [omitBetaBand, setOmitBetaBand] = useState(true);
  const [isMaxBasis, setIsMaxBasis] = useState(false);
  const [wavelengthSampleResolution, setWavelengthSampleResolution] = useState(20);
  const [spectralPeaks, setSpectralPeaks] = useState({
    peakWavelength1: DEFAULT_S_PEAK,
    peakWavelength2: DEFAULT_M_PEAK,
    peakWavelength3: DEFAULT_L_PEAK,
    peakWavelength4: DEFAULT_Q_PEAK,
  });
  
  const [spectralPeaksNew, setSpectralPeaksNew] = useState<SpectralPeaksType>({
    peak1: { peak: DEFAULT_S_PEAK, isActive: true },
    peak2: { peak: DEFAULT_M_PEAK, isActive: true },
    peak3: { peak: DEFAULT_L_PEAK, isActive: true },
    peak4: { peak: DEFAULT_Q_PEAK, isActive: false },
  });  
  
  const [activeCones, setActiveCones] = useState({
    isCone1Active: true,
    isCone2Active: true,
    isCone3Active: true,
    isCone4Active: false,
  });
  
  const [sliceDimension, setSliceDimension] = useState(2);
  const [conePeaks, setConePeaks] = useState({
    conePeak1: DEFAULT_S_PEAK,
    conePeak2: DEFAULT_M_PEAK,
    conePeak3: DEFAULT_L_PEAK,
    conePeak4: DEFAULT_Q_PEAK,
  });
  const [coneResponseType, setConeResponseType] = useState("Human Tetrachromat");
  const [submitSwitch, setSubmitSwitch] = useState(1);
  const { height, width } = useWindowDimensions();
  const [wavelengthBounds, setWavelengthBounds] = useState({
    min: MIN_VISIBLE_WAVELENGTH,
    max: MAX_VISIBLE_WAVELENGTH,
  });
  const [wavelengths, setWavelengths] = useState([0]);
  const [coneResponses, setConeResponses] = useState({
    coneResponse1: [0],
    coneResponse2: [0],
    coneResponse3: [0],
    coneResponse4: [0],
  });
  const [sliceVisible, setSliceVisible] = useState(false);
  const [sliceSwitch, setSliceSwitch] = useState(0);
  const [positionY, setPositionY] = useState(0);

  return (
    <AppContext.Provider
      value={{

        spectralDB,
        setSpectralDB,

        omitBetaBand,
        setOmitBetaBand,
        isMaxBasis,
        setIsMaxBasis,
        wavelengthSampleResolution,
        setWavelengthSampleResolution,

        spectralPeaks,
        setSpectralPeaks,
        
        spectralPeaksNew,
        setSpectralPeaksNew,

        activeCones,
        setActiveCones,

        height,
        width,
        sliceDimension,
        setSliceDimension,

        coneResponseType,
        setConeResponseType,
        submitSwitch,
        setSubmitSwitch,
        wavelengthBounds,
        setWavelengthBounds,
        wavelengths,
        setWavelengths,
        coneResponses,
        setConeResponses,
        sliceVisible,
        setSliceVisible,
        sliceSwitch,
        setSliceSwitch,
        positionY,
        setPositionY,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => { // **Updated to ensure non-undefined return**
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default function AppLayout() {
  const theme = useMantineTheme();
  const { setSpectralDB } = useAppContext(); // This will now work because AppContextProvider wraps AppLayout.
  
  useEffect(() => {
    
    console.log("Fetching DB data...");
  
    fetch(`http://localhost:5050/get_spectral_db`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then((responseData) => {
        // Ensure responseData has a `data` property and it's an array
        const { data } = responseData;
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format: Expected an array in "data" property');
        }
  
        // Transform array into a SpectralDB map
        const spectralDB: SpectralDB = data.reduce((acc, item) => {
          if (Array.isArray(item)) {
            const [commonName, scientificName, peaks, source, note] = item;
            acc[commonName] = { scientificName, peaks, source, note };
          } else {
            console.warn('Unexpected item format:', item);
          }
          return acc;
        }, {} as SpectralDB);
  
        console.log("SpectralDB:", spectralDB);
        setSpectralDB(spectralDB);
      })
      .catch((error) => console.error('Error fetching or transforming data:', error));
  }, [setSpectralDB]);
  
  return (
      <AppShell
          header={{ height: 50 }}
          padding="sm"
      >
          <AppShell.Header style={headerStyle(theme)}>
              <Title order={3} ml="lg"> Object Color Solid Renderer </Title>
          </AppShell.Header>

          <AppShell.Main>
              <Container my="xl" fluid>
                  <div style={OCSStyle}>
                      <ObjectColorSolid/>
                  </div>
                  <Grid>
                      <Grid.Col span={1} style={{zIndex: 2}}>
                          <SliceDisplay/>
                      </Grid.Col>
                      <Grid.Col span={10} style={{ position: 'relative' }}></Grid.Col>
                      <Grid.Col span={1} style={{zIndex: 2}}>
                          <GraphDisplay/>
                      </Grid.Col>
                  </Grid>
              </Container>
          </AppShell.Main>
      </AppShell>
  );
}

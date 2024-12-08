import {
  AppShell,
  Container,
  Grid,
  useMantineTheme,
  Title,
  ActionIcon,
  Drawer, // Added import
  Button, // Added import
} from '@mantine/core';
import ObjectColorSolid from './ObjectColorSolid';
import SliceDisplay from './SliceDisplay/SliceDisplay';
import GraphDisplay from './GraphDisplay/GraphDisplay';
import SpectraInputs from './GraphDisplay/SpectraInputs';
import { OCSContext, OCSData } from './OCSContext';
import { IconMenu2 } from '@tabler/icons-react'; // Added import
import { Link } from 'react-router-dom'; // Added import

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import React from 'react';
import ocstudioLogo from '../ocstudio.svg';

// Custom hook to get window dimensions
const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState(() => {
    const { innerWidth: width, innerHeight: height } = window;
    return { width, height };
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
};


type SpectralDBEntry = {
  scientificName: string;
  peaks: number[];
  source: string;
  note: string;
};

type Plane = {
  a: number;
  b: number;
  c: number;
  d: number;
}

type SpectralDB = Record<string, SpectralDBEntry>;

// Type definitions for context values
type AppContextType = {
  height: number;
  width: number;
  spectralDB: SpectralDB;
  setSpectralDB: Dispatch<SetStateAction<SpectralDB>>;
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
  sliceVisible: boolean;
  setSliceVisible: Dispatch<SetStateAction<boolean>>;
  sliceSwitch: number;
  setSliceSwitch: Dispatch<SetStateAction<number>>;
  slicePlane: Plane;
  setSlicePlane: Dispatch<SetStateAction<Plane>>;
  fetchTrigger: boolean;
  setFetchTrigger: Dispatch<SetStateAction<boolean>>;
  ocsDataArray: OCSData[];
  setOcsDataArray: Dispatch<SetStateAction<OCSData[]>>;
  entries: OCSContext[];
  setEntries: Dispatch<SetStateAction<OCSContext[]>>;
  selectedEntryIndex: number | null;
  setSelectedEntryIndex: Dispatch<SetStateAction<number | null>>;
};

// Create context
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Default peak values and wavelength bounds
export const DEFAULT_S_PEAK = 455;
export const DEFAULT_M_PEAK = 543;
export const DEFAULT_L_PEAK = 566;
export const DEFAULT_Q_PEAK = 560;
const MIN_VISIBLE_WAVELENGTH = 390;
const MAX_VISIBLE_WAVELENGTH = 700;

// Context provider component
export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [spectralDB, setSpectralDB] = useState<SpectralDB>({});
  const [sliceDimension, setSliceDimension] = useState(2);
  const [coneResponseType, setConeResponseType] = useState("Human Tetrachromat");
  const [submitSwitch, setSubmitSwitch] = useState(1);
  const { height, width } = useWindowDimensions();
  const [wavelengthBounds, setWavelengthBounds] = useState({
    min: MIN_VISIBLE_WAVELENGTH,
    max: MAX_VISIBLE_WAVELENGTH,
  });
  const [sliceVisible, setSliceVisible] = useState(false);
  const [sliceSwitch, setSliceSwitch] = useState(0);
  const [slicePlane, setSlicePlane] = useState({a: 0, b: 0, c: 0, d: 0});
  const [fetchTrigger, setFetchTrigger] = useState(false);
  const [ocsDataArray, setOcsDataArray] = useState<OCSData[]>([]); // State for OCSData
  const [entries, setEntries] = useState<OCSContext[]>([]);        // Entries of OCSContext
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);

  return (
    <AppContext.Provider
      value={{
        height,
        width,
        spectralDB,
        setSpectralDB,
        sliceDimension,
        setSliceDimension,
        coneResponseType,
        setConeResponseType,
        submitSwitch,
        setSubmitSwitch,
        wavelengthBounds,
        setWavelengthBounds,
        sliceVisible,
        setSliceVisible,
        sliceSwitch,
        setSliceSwitch,
        slicePlane,
        setSlicePlane,
        fetchTrigger,
        setFetchTrigger,
        ocsDataArray,
        setOcsDataArray,
        entries,
        setEntries,
        selectedEntryIndex,
        setSelectedEntryIndex,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Main layout component
export default function AppLayout() {
  const theme = useMantineTheme();
  const { setSpectralDB } = useAppContext();
  const [drawerOpened, setDrawerOpened] = useState(false); // Added state for Drawer

  // Fetch spectral database on mount
  useEffect(() => {
    
    console.log("Fetching DB data...");
  
    fetch(`http://localhost:5050/get_spectral_db`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then(responseData => {
        const { data } = responseData;
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format: Expected an array in "data" property');
        }

        // Transform array into a SpectralDB map
        const spectralDB: SpectralDB = data.reduce((acc, item) => {
          if (Array.isArray(item)) {
            const [commonName, scientificName, peaks, source, note] = item;
            acc[commonName] = { scientificName, peaks, source, note };
          }
          return acc;
        }, {});

        setSpectralDB(spectralDB);
      })
      .catch(error => console.error('Error fetching or transforming data:', error));
  }, [setSpectralDB]);

  return (
    <AppShell header={{ height: 50 }} padding="sm">
      {/* Header with title */}
      <AppShell.Header style={{ backgroundColor: '#F5F5F5', color: "black", display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: "2%", paddingLeft: "2%"}}>
        <img src={ocstudioLogo} alt="OCStudio Logo" style={{ height: '95%' }} />
        <div>
          <Button
            component="a"
            href="https://github.com/Object-Color-Solid-Render"
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            style={{ marginRight: '10px' }}
          >
            GitHub
          </Button>
          <Button
            component={Link}
            to="/about"
            variant="subtle"
            style={{ marginRight: '10px' }}
          >
            About Us
          </Button>
          <ActionIcon variant="subtle" onClick={() => setDrawerOpened(true)}>
            <IconMenu2 size={18}/>
          </ActionIcon>
        </div>
      </AppShell.Header>

      {/* Drawer overlay for entry edits */}
      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        title="Edit Entries"
        padding="xl"
        size="md"
        position="right"
        style={{ marginRight: '100px'}}
      >
        <SpectraInputs />
      </Drawer>

      {/* Main content */}
      <AppShell.Main>
        <Container my="xl" fluid>
          <div style={{ position: "absolute", width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1 }}>
            <ObjectColorSolid />
          </div>
          <Grid>
            <Grid.Col span={1} style={{ zIndex: 2 }}>
              <SliceDisplay />
            </Grid.Col>
            <Grid.Col span={10} style={{ position: 'relative' }}></Grid.Col>
            <Grid.Col span={1} style={{ zIndex: 2 }}>
              <GraphDisplay />
            </Grid.Col>
          </Grid>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

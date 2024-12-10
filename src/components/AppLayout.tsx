import {
  AppShell,
  Container,
  ActionIcon,
  Button,
  Box, // Added import
} from '@mantine/core';
import ObjectColorSolid from './ObjectColorSolid';
import SliceDisplay from './SliceDisplay/SliceDisplay';
import GraphDisplay from './GraphDisplay/GraphDisplay';
import SpectraInputs from './GraphDisplay/SpectraInputs';
import { OCSContext, OCSData } from './OCSContext';
import { IconMenu2 } from '@tabler/icons-react'; // Added import
import { Link } from 'react-router-dom'; // Added import
import { PLYExporter } from 'three/examples/jsm/exporters/PLYExporter.js'; // Add this import
import * as THREE from 'three';

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
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

export type SpectralDBEntry = {
  scientificName: string;
  phylum: string;
  className: string;
  order: string;
  pigmentTemplateFunction: string;
  chromophores: string;
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

export type SpectralDB = Record<string, SpectralDBEntry>;

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
  const { setSpectralDB, ocsDataArray, entries } = useAppContext();
  const [sidebarOpened, setSidebarOpened] = useState(true);

  // Draggable Sidebar States
  const [sidebarWidth, setSidebarWidth] = useState(400); // Initial width in pixels
  const [isDragging, setIsDragging] = useState(false); // Dragging state
  const [sidebarHeight, setSidebarHeight] = useState(650); // Initial height in pixels
  const [isDraggingHeight, setIsDraggingHeight] = useState(false); // Dragging state for height
  
  // Handle mouse down on resizer
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  // Handle mouse move globally
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newWidth = Math.max(150, Math.min(e.clientX, 600)); // Clamp between 150px and 600px
      setSidebarWidth(newWidth);
    }
  };
  // Handle mouse down on height resizer
const handleMouseDownHeight = () => {
  setIsDraggingHeight(true);
};

// Handle mouse move for height
const handleMouseMoveHeight = (e: MouseEvent) => {
  if (isDraggingHeight) {
    const newHeight = Math.max(200, Math.min(e.clientY, window.innerHeight - 100)); // Clamp height
    setSidebarHeight(newHeight);
  }
};

// Handle mouse up for height
const handleMouseUpHeight = () => {
  if (isDraggingHeight) {
    setIsDraggingHeight(false);
  }
};


  // Handle mouse up globally
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Add global event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      // Prevent selecting text while dragging
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }

    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isDragging]);

  useEffect(() => {
    if (isDraggingHeight) {
      window.addEventListener('mousemove', handleMouseMoveHeight);
      window.addEventListener('mouseup', handleMouseUpHeight);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection
    } else {
      window.removeEventListener('mousemove', handleMouseMoveHeight);
      window.removeEventListener('mouseup', handleMouseUpHeight);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
  
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveHeight);
      window.removeEventListener('mouseup', handleMouseUpHeight);
    };
  }, [isDraggingHeight]);
  

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
          if (item && typeof item === 'object') {
            const {
              common_name: commonName,
              scientific_name: scientificName,
              phylum,
              class: className,
              order,
              template: pigmentTemplateFunction,
              chromophores,
              lambda_max_values: peaks,
              source,
              note,
            } = item;

            // Map data to SpectralDBEntry structure
            acc[commonName] = {
              scientificName,
              phylum,
              className,
              order,
              pigmentTemplateFunction,
              chromophores,
              peaks: peaks.filter((peak) => peak !== null), // Ensure peaks is an array of numbers
              source,
              note,
            };
          }
          return acc;
        }, {});

        setSpectralDB(spectralDB);
      })
      .catch(error => console.error('Error fetching or transforming data:', error));
  }, [setSpectralDB]);


  const handleDownload = () => {
    const exporter = new PLYExporter();

    ocsDataArray.forEach((ocsData, index) => {
      const geometry = ocsData.geometry;
      const colors = geometry.attributes.color.array; // Get vertex colors
      const material = new THREE.MeshBasicMaterial({ vertexColors: true });
      const mesh = new THREE.Mesh(geometry, material);
      const name = entries[index].entryName || `geometry${index}`;

      // Ensure geometry has vertices and faces
      if (geometry.attributes.position && geometry.index) {
        // Add vertex colors to geometry
        if (colors) {
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        }

        exporter.parse(
          mesh,
          (result) => {
            const blob = new Blob([result], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${name}.ply`;
            link.click();

            URL.revokeObjectURL(url);
          },
          { binary: true }
        );
      } else {
        console.error(`Geometry for ${name} is missing vertices or faces.`);
      }
    });
  };

  return (
    <AppShell
      header={{ height: 50 }}
      padding="sm"
      layout="alt"
      aside={{  // Change from navbar to aside
        width: window.innerWidth * 0.25,
        breakpoint: 'sm',
        collapsed: { mobile: !sidebarOpened, desktop: !sidebarOpened },
      }}
    >
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
            variant="subtle"
            onClick={handleDownload}
            style={{ marginRight: '10px' }}
          >
            Download
          </Button>
          <Button
            component={Link}
            to="/about"
            variant="subtle"
            style={{ marginRight: '10px' }}
          >
            About Us
          </Button>
          <ActionIcon 
            variant="subtle" 
            onClick={() => setSidebarOpened(prev => !prev)}
            color={sidebarOpened ? 'blue' : 'gray'}
          >
            <IconMenu2 size={18}/>
          </ActionIcon>
        </div>
      </AppShell.Header>

      {/* Change Navbar to Aside */}
      <AppShell.Aside p="md" style={{ height: '100%' }}>
        <SpectraInputs />
      </AppShell.Aside>

      {/* Main content */}
      <AppShell.Main style={{height: '100%'}}>

      <Container fluid style={{ display: 'flex', height: '100%' }}>
          {/* Draggable Sidebar */}
          <Box
            style={{
              width: sidebarWidth,
              height: sidebarHeight,
              backgroundColor: '#f8f9fa',
              boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative', // For resizer positioning
              transition: isDragging ? 'none' : 'width 0.2s ease', // Smooth transition when not dragging
              overflow: 'scroll',
              padding: "1%",
              gap: "3%"
            }}
          >
            {/* Sidebar Content */}
            <GraphDisplay />
            <SliceDisplay />

            {/* Resizer width */}
            <div
              onMouseDown={handleMouseDown}
              style={{
                width: '5px',
                cursor: 'col-resize',
                backgroundColor: '#ccc',
                height: '100%',
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 10,
              }}
            />
            {/* Resizer height */}
            <div
            onMouseDown={handleMouseDownHeight}
            style={{
              height: '5px',
              cursor: 'row-resize',
              backgroundColor: '#ccc',
              width: '100%',
              position: 'absolute',
              bottom: 0,
              left: 0,
              zIndex: 10,
            }}
          />

          </Box>

          {/* Main Content Area */}
          <Box
            style={{
              flex: 1,
              padding: '20px',
              position: 'relative',
              overflow: 'auto',
              height: '650px'
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '95%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
              }}
            >
              <ObjectColorSolid />
            </div>
            {/* Additional Content Can Go Here */}
          </Box>
        </Container> 
      </AppShell.Main>
    </AppShell>
  );
};

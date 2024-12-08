import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import AppLayout from "./components/AppLayout";
import { AppContextProvider } from "./components/AppLayout";  // Import the context provider
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AboutUs from './components/AboutUs'; // Added import

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <AppContextProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AppLayout />} />
            <Route path="/about" element={<AboutUs />} />
          </Routes>
        </Router>
      </AppContextProvider>
    </MantineProvider>
  );
}
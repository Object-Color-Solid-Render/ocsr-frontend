import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import AppLayout from "./components/AppLayout";
import { AppContextProvider } from "./components/AppLayout";  // Import the context provider

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <AppContextProvider>
        <AppLayout />
      </AppContextProvider>
    </MantineProvider>
  );
}
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";



// MUI
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#4f52ff" },
    secondary: { main: "#f7b500" },
    background: {
      default: "#070912",
      paper: "rgba(10, 12, 24, 0.72)",
    },
  },
  shape: { borderRadius: 16 },
  // ✅ ADD THIS:
  typography: {
    fontFamily:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontFamily: '"Poppins", "Inter", system-ui, sans-serif' },
    h2: { fontFamily: '"Poppins", "Inter", system-ui, sans-serif' },
    h3: { fontFamily: '"Poppins", "Inter", system-ui, sans-serif' },
    h4: { fontFamily: '"Poppins", "Inter", system-ui, sans-serif' },
    h5: { fontFamily: '"Poppins", "Inter", system-ui, sans-serif' },
    h6: { fontFamily: '"Poppins", "Inter", system-ui, sans-serif' },
    button: { fontFamily: '"Poppins", "Inter", system-ui, sans-serif', fontWeight: 700 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "transparent" },
        "#root": { backgroundColor: "transparent" },
      },
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
        <App />
      
    </ThemeProvider>
  </StrictMode>
);

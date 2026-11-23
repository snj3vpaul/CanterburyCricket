/**
 * MUI theme for the few MUI widgets on the site (award modal, player dialog).
 * Wrap only those widgets in it, so MUI and Emotion stay out of the main bundle.
 */
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#f7b500" },
    secondary: { main: "#f7b500" },
    background: { default: "#070912", paper: "rgba(10, 12, 24, 0.72)" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "var(--font-body)",
    h1: { fontFamily: "var(--font-display)" },
    h2: { fontFamily: "var(--font-display)" },
    h3: { fontFamily: "var(--font-display)" },
    h4: { fontFamily: "var(--font-display)" },
    h5: { fontFamily: "var(--font-display)" },
    h6: { fontFamily: "var(--font-display)" },
    button: { fontFamily: "var(--font-display)", fontWeight: 700 },
  },
});

export default function ClubMuiTheme({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

import { createTheme } from "@mui/material/styles";
const accentColor = "#0141ff";

export const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: accentColor },
    background: {
      default: "#f1f3f4",
      paper: "#ffffff",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: "none" },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: "0.875rem", minHeight: "32px" },
      },
    },
    MuiList: {
      styleOverrides: {
        root: { padding: "4px 0" },
      },
    },
  },
});

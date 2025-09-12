import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import FlowEditor from './FlowEditor';

// Um tema básico para a aplicação
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline normaliza os estilos */}
      <CssBaseline />
      <FlowEditor />
    </ThemeProvider>
  );
}

export default App;

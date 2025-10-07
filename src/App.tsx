import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FlowEditor from './pages/FlowEditor';
import ExecutionPage from './pages/ExecutionPage';

const theme = createTheme({
  // ... seu tema
});

function App() {
  const [page, setPage] = useState('editor');

  const handlePageChange = (
    event: React.MouseEvent<HTMLElement>,
    newPage: string | null,
  ) => {
    if (newPage !== null) {
      setPage(newPage);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            color="primary"
            value={page}
            exclusive
            onChange={handlePageChange}
            aria-label="Página"
          >
            <ToggleButton value="editor">Estruturação</ToggleButton>
            <ToggleButton value="execution">Execução</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          {page === 'editor' ? <FlowEditor /> : <ExecutionPage />}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
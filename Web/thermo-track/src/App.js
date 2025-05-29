import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import Routes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import theme from './styles/theme';
import GlobalStyle from './styles/GlobalStyle';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <>
            <GlobalStyle />
            <Routes />
          </>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

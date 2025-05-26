import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import Routes from './src/routes.js';
import * as SystemUI from 'expo-system-ui';

export default function App() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync("#edb11c");
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor='black' />
      <Routes />
    </NavigationContainer>
  );
}
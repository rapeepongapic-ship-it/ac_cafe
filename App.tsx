import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Analytics } from '@vercel/analytics/react';
import { PageContext } from './src/context/PageContext';
import TopNav from './src/components/TopNav';
import WebTokenGuard from './src/components/WebTokenGuard';
import ReportScreen from './src/screens/ReportScreen';
import SalesScreen from './src/screens/SalesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { seedIfEmpty } from './src/utils/seedData';
import { colors } from './src/utils/theme';

seedIfEmpty();

const IS_WEB = Platform.OS === 'web';

export default function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const navigateTo = useCallback((page: number) => setCurrentPage(page), []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {IS_WEB && <Analytics />}
      <WebTokenGuard>
        <PageContext.Provider value={{ currentPage, navigateTo }}>
          <View style={styles.outer}>
            <View style={styles.frame}>
              <TopNav />
              <View style={{ flex: 1 }}>
                {currentPage === 0 && <ReportScreen />}
                {currentPage === 1 && <SalesScreen />}
                {currentPage === 2 && <SettingsScreen />}
              </View>
            </View>
          </View>
        </PageContext.Provider>
      </WebTokenGuard>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    ...(IS_WEB ? { minHeight: '100vh' as any } : {}),
    backgroundColor: IS_WEB ? '#C4A882' : colors.bg,
    alignItems: IS_WEB ? ('center' as any) : 'stretch',
  },
  frame: {
    flex: 1,
    width: IS_WEB ? ('min(100%, 430px)' as any) : '100%',
    backgroundColor: colors.bg,
    ...(IS_WEB ? ({ boxShadow: '0 0 40px rgba(0,0,0,0.18)' } as any) : {}),
  },
});

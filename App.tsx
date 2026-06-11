import React, { useRef, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PageContext } from './src/context/PageContext';
import FloatingNav from './src/components/FloatingNav';
import WebTokenGuard from './src/components/WebTokenGuard';
import ReportScreen from './src/screens/ReportScreen';
import SalesScreen from './src/screens/SalesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { seedIfEmpty } from './src/utils/seedData';
import { colors } from './src/utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Seed default data once on startup
seedIfEmpty();

export default function App() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const navigateTo = useCallback((page: number) => {
    scrollRef.current?.scrollTo({ x: page * SCREEN_WIDTH, animated: true });
    setCurrentPage(page);
  }, []);

  const handleScroll = useCallback((e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (page !== currentPage) setCurrentPage(page);
  }, [currentPage]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <WebTokenGuard>
        <PageContext.Provider value={{ currentPage, navigateTo }}>
          <View style={styles.container}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleScroll}
              style={styles.pager}
              contentContainerStyle={styles.pagerContent}
            >
              <View style={styles.page}><ReportScreen /></View>
              <View style={styles.page}><SalesScreen /></View>
              <View style={styles.page}><SettingsScreen /></View>
            </ScrollView>
            <FloatingNav />
          </View>
        </PageContext.Provider>
      </WebTokenGuard>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pager: { flex: 1 },
  pagerContent: { flexDirection: 'row' },
  page: { width: SCREEN_WIDTH, flex: 1 },
});

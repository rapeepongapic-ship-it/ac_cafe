import React, { useEffect, useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { ACCESS_TOKEN } from '../config/token';
import { colors, radius } from '../utils/theme';

export default function WebTokenGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'blocked'>('checking');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setStatus('allowed');
      return;
    }
    const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
    setStatus(path === ACCESS_TOKEN ? 'allowed' : 'blocked');
  }, []);

  if (status === 'checking') return null;
  if (status === 'blocked') return <BlockedScreen />;
  return <>{children}</>;
}

function BlockedScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>404</Text>
      </View>
      <Text style={styles.title}>ไม่พบหน้านี้</Text>
      <Text style={styles.sub}>กรุณาใช้ลิงก์ที่ถูกต้อง</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textMuted,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

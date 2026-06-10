import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PAGE_REPORT, PAGE_SALES, PAGE_SETTINGS, usePage } from '../context/PageContext';
import { radius, shadow } from '../utils/theme';

const TABS = [
  { page: PAGE_REPORT,   icon: 'bar-chart',  iconOut: 'bar-chart-outline',  label: 'รายงาน'    },
  { page: PAGE_SALES,    icon: 'pencil',      iconOut: 'pencil-outline',      label: 'บันทึกขาย' },
  { page: PAGE_SETTINGS, icon: 'settings',    iconOut: 'settings-outline',    label: 'ตั้งค่า'   },
] as const;

function NavTab({ tab, active, onPress }: { tab: typeof TABS[number]; active: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      style={[styles.item, active && styles.itemActive]}
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 60, bounciness: 6 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start()}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <Ionicons name={active ? tab.icon : tab.iconOut} size={17} color={active ? '#FFF8F0' : '#C4A882'} />
        <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function FloatingNav() {
  const { currentPage, navigateTo } = usePage();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.pill}>
        {TABS.map((tab) => (
          <NavTab key={tab.page} tab={tab} active={currentPage === tab.page} onPress={() => navigateTo(tab.page)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 6,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#3B2410',
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 5,
    gap: 2,
    ...shadow.md,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    gap: 2,
  },
  itemActive: {
    backgroundColor: '#8B5E3C',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C4A882',
  },
  labelActive: {
    color: '#FFF8F0',
  },
});

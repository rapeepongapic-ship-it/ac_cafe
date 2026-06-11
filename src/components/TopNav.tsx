import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PAGE_REPORT, PAGE_SALES, PAGE_SETTINGS, usePage } from '../context/PageContext';
import { colors, radius } from '../utils/theme';

const TABS = [
  { page: PAGE_REPORT,   icon: 'bar-chart'  as const, iconOut: 'bar-chart-outline'  as const, label: 'รายงาน'    },
  { page: PAGE_SALES,    icon: 'pencil'     as const, iconOut: 'pencil-outline'     as const, label: 'บันทึกขาย' },
  { page: PAGE_SETTINGS, icon: 'settings'   as const, iconOut: 'settings-outline'   as const, label: 'ตั้งค่า'   },
];

export default function TopNav() {
  const { currentPage, navigateTo } = usePage();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      <View style={styles.brand}>
        <Ionicons name="cafe" size={14} color={colors.accent} style={{ marginRight: 6 }} />
        <Text style={styles.brandText}>AC Café</Text>
      </View>
      <View style={styles.segmented}>
        {TABS.map((tab) => {
          const active = currentPage === tab.page;
          return (
            <Pressable
              key={tab.page}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => navigateTo(tab.page)}
            >
              <Ionicons
                name={active ? tab.icon : tab.iconOut}
                size={14}
                color={active ? '#FFF8F0' : colors.textMuted}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.3,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.bgInput,
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: radius.full,
  },
  tabActive: {
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: '#FFF8F0',
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PAGE_SETTINGS, usePage } from '../context/PageContext';
import { colors, radius, shadow, space, typography } from '../utils/theme';

export default function OnboardingScreen() {
  const { navigateTo } = usePage();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="cafe" size={56} color={colors.accent} />
        </View>

        <Text style={styles.heading}>ยินดีต้อนรับ ☕</Text>
        <Text style={styles.sub}>ร้านของคุณมีเมนูอะไรบ้าง?</Text>
        <Text style={styles.body}>
          เริ่มต้นด้วยการตั้งค่าเมนูและแพลตฟอร์มที่ขาย{'\n'}
          เพื่อให้แอปคำนวณรายได้ได้อย่างถูกต้อง
        </Text>

        <View style={styles.steps}>
          <Step icon="restaurant-outline" number="1" label="เพิ่มเมนูพร้อมต้นทุน" />
          <Step icon="storefront-outline" number="2" label="เพิ่มแพลตฟอร์มที่ขาย (Line OA, Lineman)" />
          <Step icon="pencil-outline" number="3" label="บันทึกยอดขายรายวัน" />
          <Step icon="bar-chart-outline" number="4" label="ดูรายงานสรุปรายเดือน" />
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigateTo(PAGE_SETTINGS)}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnText}>ไปตั้งค่าเมนูเลย</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Step({ icon, number, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; number: string; label: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{number}</Text>
      </View>
      <Ionicons name={icon} size={18} color={colors.accent} style={{ marginRight: 10 }} />
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, paddingBottom: space.xl },
  iconWrap: {
    width: 100, height: 100, borderRadius: radius.xl,
    backgroundColor: colors.bgSection,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.lg, borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },
  heading: { ...typography.heading, fontSize: 26, marginBottom: space.xs, textAlign: 'center' },
  sub: { fontSize: 18, fontWeight: '600', color: colors.accent, marginBottom: space.sm, textAlign: 'center' },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: space.xl },
  steps: {
    width: '100%', backgroundColor: colors.bgCard,
    borderRadius: radius.lg, padding: space.md,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: space.xl, ...shadow.sm,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  stepNum: { width: 24, height: 24, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepLabel: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accent, borderRadius: radius.lg,
    paddingVertical: 15, paddingHorizontal: space.xl,
    width: '100%', ...shadow.md,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

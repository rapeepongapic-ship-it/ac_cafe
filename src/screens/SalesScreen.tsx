import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Animated, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PAGE_SETTINGS, usePage } from '../context/PageContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format, subDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { DailySale } from '../types';
import { colors, radius, shadow, space, typography } from '../utils/theme';
import OnboardingScreen from '../components/OnboardingScreen';

type PlatformQtys = Record<string, Record<string, string>>;

const today     = format(new Date(), 'yyyy-MM-dd');
const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

const QUICK_DATES = [
  { label: 'วันนี้',     value: today     },
  { label: 'เมื่อวาน',  value: yesterday },
];

export default function SalesScreen() {
  const { menuItems, platforms, sales, addSale, deleteSale } = useStore();

  if (menuItems.length === 0) return <OnboardingScreen />;

  const [date, setDate] = useState(today);
  const [platformId, setPlatformId] = useState<string>(platforms[0]?.id ?? '');
  const [allQtys, setAllQtys] = useState<PlatformQtys>({});

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const saveBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const selectedPlatform = platforms.find((p) => p.id === platformId);
  const dateSales        = sales.filter((s) => s.date === date);
  const getMenuName      = (id: string) => menuItems.find((m) => m.id === id)?.name ?? id;
  const getPlatformName  = (id: string) => platforms.find((p) => p.id === id)?.name ?? id;

  const getQty = (menuItemId: string) => allQtys[platformId]?.[menuItemId] ?? '';
  const setQty = (menuItemId: string, value: string) => {
    setAllQtys((prev) => ({
      ...prev,
      [platformId]: { ...(prev[platformId] ?? {}), [menuItemId]: value },
    }));
  };

  // Real-time running total for selected platform
  const runningTotal = useMemo(() => {
    if (!selectedPlatform) return null;
    let qty = 0, revenue = 0, cost = 0;
    menuItems.forEach((m) => {
      const q = parseInt(allQtys[platformId]?.[m.id] ?? '0') || 0;
      const price = m.platformPrices.find((x) => x.platformId === platformId)?.pricePerCup ?? 0;
      qty     += q;
      revenue += q * price;
      cost    += q * m.costPerCup;
    });
    const fee    = Math.round(revenue * ((selectedPlatform.feePercent || 0) / 100));
    const profit = revenue - cost - fee;
    return { qty, revenue, profit };
  }, [allQtys, platformId, menuItems, selectedPlatform]);

  const filledPlatformCount = platforms.filter((p) =>
    menuItems.some((m) => parseInt(allQtys[p.id]?.[m.id] ?? '0') > 0)
  ).length;

  const handleSave = () => {
    let savedCount = 0;
    platforms.forEach((platform) => {
      const pQtys = allQtys[platform.id] ?? {};
      const items = menuItems
        .map((m) => ({ menuItemId: m.id, quantity: parseInt(pQtys[m.id] ?? '0') || 0 }))
        .filter((i) => i.quantity > 0);
      if (items.length > 0) { addSale({ date, platformId: platform.id, items }); savedCount++; }
    });
    if (savedCount === 0) { Alert.alert('กรุณากรอกจำนวนแก้วอย่างน้อย 1 รายการ'); return; }
    setAllQtys({});
    Alert.alert('บันทึกสำเร็จ ✓', `บันทึกยอดขายวันที่ ${fmtDate(date)} (${savedCount} platform) เรียบร้อย`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >

            {/* Title */}
            <View style={styles.titleRow}>
              <Text style={styles.title}>บันทึกยอดขาย</Text>
              {filledPlatformCount > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>ยังไม่บันทึก</Text>
                </View>
              )}
            </View>

            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>วันที่</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInputWrap}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.dateInput} value={date} onChangeText={setDate}
                    placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.quickDates}>
                  {QUICK_DATES.map((d) => (
                    <TouchableOpacity
                      key={d.value}
                      style={[styles.quickDateChip, date === d.value && styles.quickDateChipActive]}
                      onPress={() => setDate(d.value)} activeOpacity={0.75}
                    >
                      <Text style={[styles.quickDateText, date === d.value && styles.quickDateTextActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Platform selector */}
            {platforms.length === 0 ? <NoPlatformBanner /> : (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>แพลตฟอร์ม</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {platforms.map((p) => {
                    const hasData = menuItems.some((m) => parseInt(allQtys[p.id]?.[m.id] ?? '0') > 0);
                    const isActive = platformId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => setPlatformId(p.id)} activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isActive ? 'storefront' : 'storefront-outline'} size={13}
                          color={isActive ? '#fff' : colors.textSecondary} style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{p.name}</Text>
                        {hasData && !isActive && <View style={styles.chipDot} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Menu qty input */}
            {selectedPlatform && (
              <View style={styles.section}>
                <View style={styles.qtyHeader}>
                  <Text style={styles.sectionLabel}>จำนวนแก้วที่ขายได้</Text>
                </View>

                {/* Running total — only shown when user has entered something */}
                {runningTotal && runningTotal.qty > 0 && (
                  <View style={styles.runningTotalCard}>
                    <Ionicons name="calculator-outline" size={14} color={colors.accent} style={{ marginRight: 8 }} />
                    <Text style={styles.runningTotalText}>
                      {runningTotal.qty} แก้ว
                    </Text>
                    <View style={styles.runningDot} />
                    <Text style={styles.runningTotalText}>
                      รายได้ {runningTotal.revenue.toLocaleString()} ฿
                    </Text>
                    <View style={styles.runningDot} />
                    <Text style={[styles.runningTotalText, { color: runningTotal.profit >= 0 ? colors.success : colors.danger, fontWeight: '700' }]}>
                      กำไร {runningTotal.profit.toLocaleString()} ฿
                    </Text>
                  </View>
                )}

                <View style={styles.card}>
                  {menuItems.map((m, i) => {
                    const platformPrice = m.platformPrices.find((x) => x.platformId === selectedPlatform.id);
                    const isLast = i === menuItems.length - 1;
                    const qty = getQty(m.id);
                    const filled = parseInt(qty || '0') > 0;
                    return (
                      <View key={m.id} style={[styles.qtyRow, isLast && { borderBottomWidth: 0 }, filled && styles.qtyRowFilled]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.menuName}>{m.name}</Text>
                          {platformPrice && platformPrice.pricePerCup > 0 ? (
                            <Text style={styles.menuPrice}>{platformPrice.pricePerCup} ฿/แก้ว · ต้นทุน {m.costPerCup} ฿</Text>
                          ) : (
                            <Text style={[styles.menuPrice, { color: colors.danger }]}>ยังไม่ตั้งราคา</Text>
                          )}
                        </View>
                        <View style={styles.qtyControl}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => { const c = parseInt(qty || '0') || 0; if (c > 0) setQty(m.id, String(c - 1)); }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="remove" size={16} color={colors.accent} />
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.qtyInput, filled && styles.qtyInputFilled]}
                            value={qty} onChangeText={(v) => setQty(m.id, v)}
                            keyboardType="number-pad" placeholder="0"
                            placeholderTextColor={colors.textMuted} textAlign="center"
                          />
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => { const c = parseInt(qty || '0') || 0; setQty(m.id, String(c + 1)); }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="add" size={16} color={colors.accent} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Animated save button */}
                <Pressable
                  onPressIn={() => Animated.spring(saveBtnScale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
                  onPressOut={() => Animated.spring(saveBtnScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
                  onPress={handleSave}
                >
                  <Animated.View style={[styles.btnSave, { transform: [{ scale: saveBtnScale }] }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.btnSaveText}>
                      บันทึกยอดขาย{filledPlatformCount > 1 ? ` (${filledPlatformCount} platform)` : ''}
                    </Text>
                  </Animated.View>
                </Pressable>
              </View>
            )}

            {/* Saved entries */}
            {dateSales.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>รายการที่บันทึกแล้ว — {fmtDate(date)}</Text>
                {dateSales.map((sale) => (
                  <SaleCard key={sale.id} sale={sale} menuItems={menuItems}
                    getPlatformName={getPlatformName} getMenuName={getMenuName}
                    platforms={platforms}
                    onDelete={() => Alert.alert('ลบรายการ', 'ต้องการลบรายการนี้?', [
                      { text: 'ยกเลิก', style: 'cancel' },
                      { text: 'ลบ', style: 'destructive', onPress: () => deleteSale(sale.id) },
                    ])}
                  />
                ))}
              </View>
            )}

          </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NoPlatformBanner() {
  const { navigateTo } = usePage();
  return (
    <View style={styles.warnBox}>
      <Ionicons name="information-circle-outline" size={18} color="#92400E" style={{ marginRight: 8 }} />
      <Text style={styles.warnText}>ยังไม่มีแพลตฟอร์ม </Text>
      <TouchableOpacity onPress={() => navigateTo(PAGE_SETTINGS)}>
        <Text style={styles.warnLink}>ไปตั้งค่า →</Text>
      </TouchableOpacity>
    </View>
  );
}

function SaleCard({ sale, menuItems, getPlatformName, getMenuName, platforms, onDelete }: {
  sale: DailySale;
  menuItems: ReturnType<typeof useStore>['menuItems'];
  platforms: ReturnType<typeof useStore>['platforms'];
  getMenuName: (id: string) => string;
  getPlatformName: (id: string) => string;
  onDelete: () => void;
}) {
  const totalQty = sale.items.reduce((s, i) => s + i.quantity, 0);
  const platform = platforms.find((p) => p.id === sale.platformId);
  const revenue  = sale.items.reduce((sum, item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    const price = menuItem?.platformPrices.find((x) => x.platformId === sale.platformId)?.pricePerCup ?? 0;
    return sum + (item.quantity * price);
  }, 0);

  return (
    <View style={styles.saleCard}>
      <View style={styles.saleCardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons name="storefront" size={13} color={colors.accent} style={{ marginRight: 5 }} />
          <Text style={styles.saleCardPlatform}>{getPlatformName(sale.platformId)}</Text>
          {platform && platform.feePercent > 0 && (
            <View style={styles.saleFeeBadge}>
              <Text style={styles.saleFeeText}>หัก {platform.feePercent}%</Text>
            </View>
          )}
        </View>
        <View style={styles.saleCardMeta}>
          <Text style={styles.saleCardMetaText}>{totalQty} แก้ว</Text>
          {revenue > 0 && <Text style={styles.saleCardMetaRevenue}> · {revenue.toLocaleString()} ฿</Text>}
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginLeft: 8 }}>
          <Ionicons name="trash-outline" size={17} color={colors.danger} />
        </TouchableOpacity>
      </View>
      <View style={styles.saleItemsWrap}>
        {sale.items.map((item) => (
          <View key={item.menuItemId} style={styles.saleItem}>
            <Ionicons name="cafe-outline" size={12} color={colors.textMuted} style={{ marginRight: 5 }} />
            <Text style={styles.saleItemText}>{getMenuName(item.menuItemId)}</Text>
            <Text style={styles.saleItemQty}> × {item.quantity} แก้ว</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function fmtDate(dateStr: string) {
  try { return format(new Date(dateStr), 'd MMM yyyy', { locale: th }); }
  catch { return dateStr; }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.sm },
  title: { ...typography.heading, flex: 1 },
  pendingBadge: { backgroundColor: colors.bgSection, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  pendingBadgeText: { fontSize: 11, fontWeight: '600', color: colors.accent },
  section: { paddingHorizontal: space.md, marginBottom: space.md },
  sectionLabel: { ...typography.label, marginBottom: space.sm },
  // Date
  dateRow: { gap: 8 },
  dateInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border },
  dateInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  quickDates: { flexDirection: 'row', gap: 8 },
  quickDateChip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  quickDateChipActive: { backgroundColor: colors.bgSection, borderColor: colors.accent },
  quickDateText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  quickDateTextActive: { color: colors.accent },
  // Platform chip
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.bgCard, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginLeft: 5 },
  // Qty section
  qtyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  runningTotalCard: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', backgroundColor: colors.bgSection, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10, borderWidth: 1, borderColor: colors.border, gap: 6 },
  runningTotalText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  runningDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.sm },
  qtyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: space.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  qtyRowFilled: { backgroundColor: '#FEFAF5' },
  menuName: { fontSize: 15, fontWeight: '600', color: colors.text },
  menuPrice: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.bgInput, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  qtyInput: { width: 50, height: 36, backgroundColor: colors.bgInput, borderRadius: radius.sm, fontSize: 16, fontWeight: '700', color: colors.text, borderWidth: 1, borderColor: colors.border, textAlign: 'center', textAlignVertical: 'center' },
  qtyInputFilled: { backgroundColor: colors.bgSection, borderColor: colors.accent },
  btnSave: { flexDirection: 'row', backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 12, ...shadow.md },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  warnBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: space.md, marginBottom: space.md, backgroundColor: '#FEF3C7', borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: '#FDE68A' },
  warnText: { fontSize: 14, color: '#92400E' },
  warnLink: { fontSize: 14, color: '#92400E', fontWeight: '700', textDecorationLine: 'underline' },
  // Sale cards
  saleCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  saleCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  saleCardPlatform: { fontSize: 14, fontWeight: '700', color: colors.accent },
  saleFeeBadge: { marginLeft: 6, backgroundColor: colors.bgInput, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  saleFeeText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  saleCardMeta: { flexDirection: 'row', alignItems: 'center' },
  saleCardMetaText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  saleCardMetaRevenue: { fontSize: 12, fontWeight: '600', color: colors.accent },
  saleItemsWrap: { gap: 3 },
  saleItem: { flexDirection: 'row', alignItems: 'center' },
  saleItemText: { fontSize: 13, color: colors.textSecondary },
  saleItemQty: { fontSize: 13, color: colors.textMuted },
});

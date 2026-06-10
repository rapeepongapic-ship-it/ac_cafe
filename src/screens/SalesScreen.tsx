import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { DailySale } from '../types';
import { colors, typography } from '../utils/theme';

export default function SalesScreen() {
  const { menuItems, platforms, sales, addSale, deleteSale } = useStore();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [platformId, setPlatformId] = useState<string>(platforms[0]?.id ?? '');
  const [qtys, setQtys] = useState<Record<string, string>>({});

  const selectedPlatform = platforms.find((p) => p.id === platformId);

  const handleSave = () => {
    if (!platformId) { Alert.alert('กรุณาเลือกแพลตฟอร์ม'); return; }
    const items = menuItems
      .map((m) => ({ menuItemId: m.id, quantity: parseInt(qtys[m.id] ?? '0') || 0 }))
      .filter((i) => i.quantity > 0);
    if (items.length === 0) { Alert.alert('กรุณากรอกจำนวนแก้วที่ขายได้'); return; }
    addSale({ date, platformId, items });
    setQtys({});
    Alert.alert('บันทึกสำเร็จ', `บันทึกยอดขายวันที่ ${formatDate(date)} เรียบร้อย`);
  };

  const todaySales = sales.filter((s) => s.date === date);

  const getMenuName = (id: string) => menuItems.find((m) => m.id === id)?.name ?? id;
  const getPlatformName = (id: string) => platforms.find((p) => p.id === id)?.name ?? id;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>บันทึกยอดขาย</Text>

        {/* Date picker row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>วันที่</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Platform selector */}
        {platforms.length === 0 ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>กรุณาตั้งค่าแพลตฟอร์มก่อน ที่แท็บ ตั้งค่า</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>แพลตฟอร์ม</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {platforms.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.platformChip, platformId === p.id && styles.platformChipActive]}
                  onPress={() => setPlatformId(p.id)}
                >
                  <Text style={[styles.platformChipText, platformId === p.id && styles.platformChipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Menu qty inputs */}
        {selectedPlatform && menuItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>จำนวนแก้วที่ขายได้</Text>
            <View style={styles.card}>
              {menuItems.map((m) => {
                const platformPrice = selectedPlatform.menuPrices.find((x) => x.menuItemId === m.id);
                return (
                  <View key={m.id} style={styles.qtyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuName}>{m.name}</Text>
                      {platformPrice && (
                        <Text style={styles.menuSub}>{platformPrice.pricePerCup} บาท/แก้ว</Text>
                      )}
                    </View>
                    <TextInput
                      style={styles.qtyInput}
                      value={qtys[m.id] ?? ''}
                      onChangeText={(v) => setQtys((prev) => ({ ...prev, [m.id]: v }))}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.cupLabel}>แก้ว</Text>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
              <Text style={styles.btnSaveText}>บันทึกยอดขาย</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's entries */}
        {todaySales.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>รายการที่บันทึกแล้ว</Text>
            {todaySales.map((sale) => (
              <SaleCard
                key={sale.id}
                sale={sale}
                getMenuName={getMenuName}
                getPlatformName={getPlatformName}
                onDelete={() =>
                  Alert.alert('ลบรายการ', 'ต้องการลบรายการนี้?', [
                    { text: 'ยกเลิก', style: 'cancel' },
                    { text: 'ลบ', style: 'destructive', onPress: () => deleteSale(sale.id) },
                  ])
                }
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SaleCard({
  sale, getMenuName, getPlatformName, onDelete,
}: {
  sale: DailySale;
  getMenuName: (id: string) => string;
  getPlatformName: (id: string) => string;
  onDelete: () => void;
}) {
  const totalQty = sale.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <View style={styles.saleCard}>
      <View style={styles.saleCardHeader}>
        <Text style={styles.saleCardPlatform}>{getPlatformName(sale.platformId)}</Text>
        <Text style={styles.saleCardTotal}>{totalQty} แก้ว</Text>
        <TouchableOpacity onPress={onDelete} style={{ marginLeft: 8 }}>
          <Text style={{ fontSize: 16 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
      {sale.items.map((item) => (
        <Text key={item.menuItemId} style={styles.saleCardItem}>
          • {getMenuName(item.menuItemId)} × {item.quantity} แก้ว
        </Text>
      ))}
    </View>
  );
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return format(d, 'd MMM yyyy', { locale: th });
  } catch {
    return dateStr;
  }
}

const styles = StyleSheet.create({
  title: { ...typography.heading, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { ...typography.label, marginBottom: 8 },
  input: { backgroundColor: colors.bgCard, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
  warningBox: { marginHorizontal: 16, backgroundColor: '#FFF3CD', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#FFEAA7' },
  warningText: { color: '#856404', fontSize: 14 },
  platformChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.bgInput, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  platformChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  platformChipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  platformChipTextActive: { color: '#fff' },
  card: { backgroundColor: colors.bgCard, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.border },
  qtyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuName: { fontSize: 14, fontWeight: '600', color: colors.text },
  menuSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  qtyInput: { width: 60, backgroundColor: colors.bgInput, borderRadius: 8, padding: 8, fontSize: 16, color: colors.text, textAlign: 'center', borderWidth: 1, borderColor: colors.border },
  cupLabel: { marginLeft: 6, fontSize: 13, color: colors.textSecondary, width: 30 },
  btnSave: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  saleCard: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  saleCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  saleCardPlatform: { fontSize: 14, fontWeight: '700', color: colors.accent, flex: 1 },
  saleCardTotal: { fontSize: 13, color: colors.textSecondary, backgroundColor: colors.bgInput, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  saleCardItem: { fontSize: 13, color: colors.textSecondary, marginBottom: 2, paddingLeft: 4 },
});

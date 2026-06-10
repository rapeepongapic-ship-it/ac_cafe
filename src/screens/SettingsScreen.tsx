import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useStore } from '../store/useStore';
import { MenuItem, Platform as PlatformType } from '../types';
import { colors, typography } from '../utils/theme';

type Tab = 'menu' | 'platform';

export default function SettingsScreen() {
  const [tab, setTab] = useState<Tab>('menu');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ตั้งค่า</Text>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'menu' && styles.tabBtnActive]}
          onPress={() => setTab('menu')}
        >
          <Text style={[styles.tabText, tab === 'menu' && styles.tabTextActive]}>
            เมนู
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'platform' && styles.tabBtnActive]}
          onPress={() => setTab('platform')}
        >
          <Text style={[styles.tabText, tab === 'platform' && styles.tabTextActive]}>
            แพลตฟอร์ม
          </Text>
        </TouchableOpacity>
      </View>
      {tab === 'menu' ? <MenuTab /> : <PlatformTab />}
    </View>
  );
}

// ─── Menu Tab ────────────────────────────────────────────────────────────────

function MenuTab() {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useStore();
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const reset = () => { setName(''); setCost(''); setEditId(null); };

  const handleSave = () => {
    if (!name.trim() || !cost.trim()) return;
    const costNum = parseFloat(cost);
    if (isNaN(costNum)) return;
    if (editId) {
      updateMenuItem(editId, { name: name.trim(), costPerCup: costNum });
    } else {
      addMenuItem({ name: name.trim(), costPerCup: costNum });
    }
    reset();
  };

  const handleEdit = (item: MenuItem) => {
    setEditId(item.id);
    setName(item.name);
    setCost(String(item.costPerCup));
  };

  const handleDelete = (id: string) => {
    Alert.alert('ลบเมนู', 'ต้องการลบเมนูนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => { deleteMenuItem(id); if (editId === id) reset(); } },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{editId ? 'แก้ไขเมนู' : 'เพิ่มเมนู'}</Text>
          <Text style={styles.inputLabel}>ชื่อเมนู</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="เช่น โกโก้โอริโอนมสด"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.inputLabel}>ต้นทุน/แก้ว (บาท)</Text>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
            placeholder="25"
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.row}>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
              <Text style={styles.btnPrimaryText}>{editId ? 'บันทึก' : 'เพิ่มเมนู'}</Text>
            </TouchableOpacity>
            {editId && (
              <TouchableOpacity style={styles.btnSecondary} onPress={reset}>
                <Text style={styles.btnSecondaryText}>ยกเลิก</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List */}
        {menuItems.length === 0 ? (
          <Text style={styles.emptyText}>ยังไม่มีเมนู กดเพิ่มเมนูด้านบน</Text>
        ) : (
          menuItems.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listItemName}>{item.name}</Text>
                <Text style={styles.listItemSub}>ต้นทุน {item.costPerCup} บาท/แก้ว</Text>
              </View>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Platform Tab ─────────────────────────────────────────────────────────────

function PlatformTab() {
  const { platforms, menuItems, addPlatform, updatePlatform, deletePlatform } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [pName, setPName] = useState('');
  const [pFee, setPFee] = useState('');
  const [pFeeLabel, setPFeeLabel] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>({});

  const resetForm = () => {
    setPName(''); setPFee(''); setPFeeLabel('');
    const init: Record<string, string> = {};
    menuItems.forEach((m) => { init[m.id] = ''; });
    setPrices(init);
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (p: PlatformType) => {
    setEditId(p.id);
    setPName(p.name);
    setPFee(String(p.feePercent));
    setPFeeLabel(p.feeLabel);
    const init: Record<string, string> = {};
    menuItems.forEach((m) => {
      const found = p.menuPrices.find((x) => x.menuItemId === m.id);
      init[m.id] = found ? String(found.pricePerCup) : '';
    });
    setPrices(init);
    setShowForm(true);
  };

  const handleAdd = () => {
    const init: Record<string, string> = {};
    menuItems.forEach((m) => { init[m.id] = ''; });
    setPrices(init);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!pName.trim() || !pFee.trim()) return;
    const feeNum = parseFloat(pFee);
    if (isNaN(feeNum)) return;
    const menuPrices = menuItems
      .map((m) => ({ menuItemId: m.id, pricePerCup: parseFloat(prices[m.id] ?? '0') || 0 }));
    const data = {
      name: pName.trim(),
      feePercent: feeNum,
      feeLabel: pFeeLabel.trim() || 'ค่าธรรมเนียม',
      menuPrices,
    };
    if (editId) {
      updatePlatform(editId, data);
    } else {
      addPlatform(data);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    Alert.alert('ลบแพลตฟอร์ม', 'ต้องการลบแพลตฟอร์มนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => deletePlatform(id) },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {!showForm ? (
          <>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleAdd}>
              <Text style={styles.btnPrimaryText}>+ เพิ่มแพลตฟอร์ม</Text>
            </TouchableOpacity>
            {platforms.length === 0 ? (
              <Text style={styles.emptyText}>ยังไม่มีแพลตฟอร์ม เช่น Line OA, Lineman</Text>
            ) : (
              platforms.map((p) => (
                <View key={p.id} style={styles.listItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemName}>{p.name}</Text>
                    <Text style={styles.listItemSub}>
                      ค่าธรรมเนียม {p.feePercent}% · {p.feeLabel}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleEdit(p)} style={styles.iconBtn}>
                    <Text style={styles.iconBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(p.id)} style={styles.iconBtn}>
                    <Text style={styles.iconBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{editId ? 'แก้ไขแพลตฟอร์ม' : 'เพิ่มแพลตฟอร์ม'}</Text>
            <Text style={styles.inputLabel}>ชื่อแพลตฟอร์ม</Text>
            <TextInput
              style={styles.input}
              value={pName}
              onChangeText={setPName}
              placeholder="เช่น Line OA"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.inputLabel}>ค่าธรรมเนียม (%)</Text>
            <TextInput
              style={styles.input}
              value={pFee}
              onChangeText={setPFee}
              keyboardType="decimal-pad"
              placeholder="30"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.inputLabel}>ชื่อคอลัมน์ค่าธรรมเนียม</Text>
            <TextInput
              style={styles.input}
              value={pFeeLabel}
              onChangeText={setPFeeLabel}
              placeholder="เช่น หักส่วนลด / GP+Ad+ส่วนลดแอพ"
              placeholderTextColor={colors.textMuted}
            />
            {menuItems.length > 0 && (
              <>
                <Text style={[styles.cardTitle, { marginTop: 12 }]}>ราคาขาย/แก้ว (บาท)</Text>
                {menuItems.map((m) => (
                  <View key={m.id} style={styles.priceRow}>
                    <Text style={styles.priceLabel} numberOfLines={1}>{m.name}</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={prices[m.id] ?? ''}
                      onChangeText={(v) => setPrices((prev) => ({ ...prev, [m.id]: v }))}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                ))}
              </>
            )}
            <View style={[styles.row, { marginTop: 16 }]}>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
                <Text style={styles.btnPrimaryText}>บันทึก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={resetForm}>
                <Text style={styles.btnSecondaryText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.heading, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 10, backgroundColor: colors.bgInput, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.bgCard, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.accent },
  tabContent: { flex: 1, paddingHorizontal: 16 },
  card: { backgroundColor: colors.bgCard, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardTitle: { ...typography.subheading, marginBottom: 10 },
  inputLabel: { ...typography.label, marginBottom: 4 },
  input: { backgroundColor: colors.bgInput, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', gap: 8 },
  btnPrimary: { flex: 1, backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: { flex: 1, backgroundColor: colors.bgInput, borderRadius: 10, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  btnSecondaryText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 32, fontSize: 14 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  listItemName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  listItemSub: { fontSize: 13, color: colors.textSecondary },
  iconBtn: { padding: 6 },
  iconBtnText: { fontSize: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  priceLabel: { flex: 1, fontSize: 14, color: colors.text },
  priceInput: { width: 80, backgroundColor: colors.bgInput, borderRadius: 8, padding: 10, fontSize: 14, color: colors.text, textAlign: 'right', borderWidth: 1, borderColor: colors.border },
});

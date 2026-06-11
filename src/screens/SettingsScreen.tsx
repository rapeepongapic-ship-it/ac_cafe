import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Animated, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../store/useStore';
import { MenuItem, Platform as PlatformType } from '../types';
import { colors, radius, shadow, space, typography } from '../utils/theme';

type Tab = 'menu' | 'platform';

export default function SettingsScreen() {
  const { menuItems, platforms } = useStore();
  const [tab, setTab] = useState<Tab>('menu');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header + stats */}
        <View style={styles.header}>
          <Text style={styles.title}>ตั้งค่า</Text>
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Ionicons name="cafe" size={12} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={styles.statPillText}>{menuItems.length} เมนู</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="storefront" size={12} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={styles.statPillText}>{platforms.length} แพลตฟอร์ม</Text>
            </View>
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          <TabButton icon="restaurant" label="เมนู"       active={tab === 'menu'}     onPress={() => setTab('menu')} />
          <TabButton icon="storefront" label="แพลตฟอร์ม" active={tab === 'platform'} onPress={() => setTab('platform')} />
        </View>

        {tab === 'menu' ? <MenuTab /> : <PlatformTab />}
      </Animated.View>
    </SafeAreaView>
  );
}

function TabButton({ icon, label, active, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={active ? icon : `${icon}-outline` as any} size={15} color={active ? colors.accent : colors.textMuted} style={{ marginRight: 5 }} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Menu Tab ─────────────────────────────────────────────────────────────────

function MenuTab() {
  const { menuItems, platforms, addMenuItem, updateMenuItem, deleteMenuItem } = useStore();
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleDelete = (id: string) => Alert.alert('ลบเมนู', 'ต้องการลบเมนูนี้?', [
    { text: 'ยกเลิก', style: 'cancel' },
    { text: 'ลบ', style: 'destructive', onPress: () => deleteMenuItem(id) },
  ]);

  if (showForm) {
    return (
      <MenuForm
        platforms={platforms}
        initialItem={editItem}
        onSave={(data) => {
          editItem ? updateMenuItem(editItem.id, data) : addMenuItem(data);
          setEditItem(null); setShowForm(false);
        }}
        onCancel={() => { setEditItem(null); setShowForm(false); }}
      />
    );
  }

  return (
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={true}>
        {platforms.length === 0 && (
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={15} color="#92400E" style={{ marginRight: 6 }} />
            <Text style={styles.hintText}>แนะนำ: เพิ่มแพลตฟอร์มก่อน เพื่อตั้งราคาขายต่อแพลตฟอร์มได้</Text>
          </View>
        )}

        <Pressable style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]} onPress={() => { setEditItem(null); setShowForm(true); }}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.btnPrimaryText}>เพิ่มเมนูใหม่</Text>
        </Pressable>

        {menuItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cafe-outline" size={38} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>ยังไม่มีเมนู</Text>
            <Text style={styles.emptySubtitle}>กดปุ่มด้านบนเพื่อเพิ่มเมนูแรก</Text>
          </View>
        ) : (
          menuItems.map((item) => (
            <MenuCard
              key={item.id} item={item} platforms={platforms}
              onEdit={() => { setEditItem(item); setShowForm(true); }}
              onDelete={() => handleDelete(item.id)}
            />
          ))
        )}
      </ScrollView>
  );
}

function MenuCard({ item, platforms, onEdit, onDelete }: {
  item: MenuItem; platforms: PlatformType[]; onEdit: () => void; onDelete: () => void;
}) {
  const pricesWithValue = item.platformPrices.filter((p) => p.pricePerCup > 0);
  const minPrice = pricesWithValue.length ? Math.min(...pricesWithValue.map((p) => p.pricePerCup)) : 0;
  const maxPrice = pricesWithValue.length ? Math.max(...pricesWithValue.map((p) => p.pricePerCup)) : 0;

  return (
    <View style={styles.menuCard}>
      <View style={styles.menuCardMain}>
        <View style={styles.menuCardIconWrap}>
          <Ionicons name="cafe" size={20} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuCardName}>{item.name}</Text>
          <View style={styles.menuCardMeta}>
            <Text style={styles.menuCardCost}>ต้นทุน {item.costPerCup} ฿</Text>
            {pricesWithValue.length > 0 && (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.menuCardPriceRange}>
                  ขาย {minPrice === maxPrice ? `${minPrice}` : `${minPrice}–${maxPrice}`} ฿
                </Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={onEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.iconBtn}>
          <Ionicons name="create-outline" size={19} color={colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={[styles.iconBtn, { marginLeft: 4 }]}>
          <Ionicons name="trash-outline" size={19} color={colors.danger} />
        </TouchableOpacity>
      </View>
      {pricesWithValue.length > 0 && (
        <View style={styles.menuCardPlatforms}>
          {pricesWithValue.map((pp) => {
            const p = platforms.find((x) => x.id === pp.platformId);
            if (!p) return null;
            return (
              <View key={pp.platformId} style={styles.platformPill}>
                <Ionicons name="storefront" size={10} color={colors.accent} style={{ marginRight: 3 }} />
                <Text style={styles.platformPillText}>{p.name} · {pp.pricePerCup} ฿</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function MenuForm({ platforms, initialItem, onSave, onCancel }: {
  platforms: PlatformType[]; initialItem: MenuItem | null;
  onSave: (data: Omit<MenuItem, 'id'>) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(initialItem?.name ?? '');
  const [cost, setCost] = useState(initialItem ? String(initialItem.costPerCup) : '');
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    platforms.forEach((p) => {
      const found = initialItem?.platformPrices.find((x) => x.platformId === p.id);
      init[p.id] = found ? String(found.pricePerCup) : '';
    });
    return init;
  });

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('กรุณากรอกชื่อเมนู'); return; }
    const costNum = parseFloat(cost);
    if (!cost || isNaN(costNum)) { Alert.alert('กรุณากรอกต้นทุน'); return; }
    const platformPrices = platforms
      .map((p) => ({ platformId: p.id, pricePerCup: parseFloat(prices[p.id] ?? '0') || 0 }))
      .filter((pp) => pp.pricePerCup > 0);
    onSave({ name: name.trim(), costPerCup: costNum, platformPrices });
  };

  return (
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={true}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{initialItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</Text>

          <Text style={styles.inputLabel}>ชื่อเมนู</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="เช่น โกโก้โอริโอนมสด" placeholderTextColor={colors.textMuted} />

          <Text style={styles.inputLabel}>ต้นทุน/แก้ว (฿)</Text>
          <TextInput style={styles.input} value={cost} onChangeText={setCost}
            keyboardType="decimal-pad" placeholder="25" placeholderTextColor={colors.textMuted} />
        </View>

        {platforms.length > 0 && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>ราคาขายต่อแพลตฟอร์ม</Text>
            <Text style={styles.formSubtitle}>กรอกราคาขายของเมนูนี้ในแต่ละ platform{'\n'}(เว้นว่างหากไม่ได้ขายใน platform นั้น)</Text>
            {platforms.map((p, i) => (
              <View key={p.id} style={[styles.priceRow, i === platforms.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="storefront-outline" size={14} color={colors.accent} style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.priceRowName}>{p.name}</Text>
                    <Text style={styles.priceRowFee}>{p.feePercent > 0 ? `หัก ${p.feePercent}%` : 'ไม่หักค่าธรรมเนียม'}</Text>
                  </View>
                </View>
                <View style={styles.priceInputWrap}>
                  <TextInput
                    style={styles.priceInput} value={prices[p.id] ?? ''}
                    onChangeText={(v) => setPrices((prev) => ({ ...prev, [p.id]: v }))}
                    keyboardType="decimal-pad" placeholder="–" placeholderTextColor={colors.textMuted}
                    textAlign="right"
                  />
                  <Text style={styles.priceSuffix}>฿</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {platforms.length === 0 && (
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={15} color="#92400E" style={{ marginRight: 6 }} />
            <Text style={styles.hintText}>เพิ่มแพลตฟอร์มในแท็บ "แพลตฟอร์ม" ก่อน เพื่อตั้งราคาขาย</Text>
          </View>
        )}

        <View style={styles.formActions}>
          <Pressable style={({ pressed }) => [styles.btnPrimary, { flex: 1 }, pressed && { opacity: 0.85 }]} onPress={handleSave}>
            <Text style={styles.btnPrimaryText}>บันทึก</Text>
          </Pressable>
          <TouchableOpacity style={styles.btnSecondary} onPress={onCancel} activeOpacity={0.8}>
            <Text style={styles.btnSecondaryText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
  );
}

// ─── Platform Tab ─────────────────────────────────────────────────────────────

function PlatformTab() {
  const { platforms, addPlatform, updatePlatform, deletePlatform, menuItems } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<PlatformType | null>(null);
  const [pName, setPName] = useState('');
  const [pFee, setPFee]   = useState('');
  const [pFeeLabel, setPFeeLabel] = useState('');

  const openAdd  = () => { setEditItem(null); setPName(''); setPFee(''); setPFeeLabel(''); setShowForm(true); };
  const openEdit = (p: PlatformType) => { setEditItem(p); setPName(p.name); setPFee(String(p.feePercent)); setPFeeLabel(p.feeLabel); setShowForm(true); };
  const close    = () => { setEditItem(null); setShowForm(false); };

  const handleSave = () => {
    if (!pName.trim()) { Alert.alert('กรุณากรอกชื่อแพลตฟอร์ม'); return; }
    const feeNum = parseFloat(pFee);
    if (!pFee || isNaN(feeNum)) { Alert.alert('กรุณากรอกค่าธรรมเนียม'); return; }
    const data = { name: pName.trim(), feePercent: feeNum, feeLabel: pFeeLabel.trim() || 'ค่าธรรมเนียม' };
    editItem ? updatePlatform(editItem.id, data) : addPlatform(data);
    close();
  };

  const handleDelete = (id: string) => Alert.alert('ลบแพลตฟอร์ม', 'ต้องการลบแพลตฟอร์มนี้?', [
    { text: 'ยกเลิก', style: 'cancel' },
    { text: 'ลบ', style: 'destructive', onPress: () => deletePlatform(id) },
  ]);

  return (
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={true}>
        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editItem ? 'แก้ไขแพลตฟอร์ม' : 'เพิ่มแพลตฟอร์ม'}</Text>

            <Text style={styles.inputLabel}>ชื่อแพลตฟอร์ม</Text>
            <TextInput style={styles.input} value={pName} onChangeText={setPName}
              placeholder="เช่น Line OA, Lineman" placeholderTextColor={colors.textMuted} />

            <Text style={styles.inputLabel}>ค่าธรรมเนียม (%)</Text>
            <TextInput style={styles.input} value={pFee} onChangeText={setPFee}
              keyboardType="decimal-pad" placeholder="30" placeholderTextColor={colors.textMuted} />

            <Text style={styles.inputLabel}>ชื่อคอลัมน์ค่าธรรมเนียมในรายงาน</Text>
            <TextInput style={styles.input} value={pFeeLabel} onChangeText={setPFeeLabel}
              placeholder="เช่น หักส่วนลด / GP+Ad+ส่วนลดแอพ" placeholderTextColor={colors.textMuted} />

            <View style={styles.formActions}>
              <Pressable style={({ pressed }) => [styles.btnPrimary, { flex: 1 }, pressed && { opacity: 0.85 }]} onPress={handleSave}>
                <Text style={styles.btnPrimaryText}>บันทึก</Text>
              </Pressable>
              <TouchableOpacity style={styles.btnSecondary} onPress={close} activeOpacity={0.8}>
                <Text style={styles.btnSecondaryText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Pressable style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]} onPress={openAdd}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.btnPrimaryText}>เพิ่มแพลตฟอร์ม</Text>
            </Pressable>

            {platforms.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="storefront-outline" size={38} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>ยังไม่มีแพลตฟอร์ม</Text>
                <Text style={styles.emptySubtitle}>เช่น Line OA, Lineman, Grab Food</Text>
              </View>
            ) : (
              platforms.map((p) => {
                const configuredMenus = menuItems.filter((m) =>
                  m.platformPrices.some((pp) => pp.platformId === p.id && pp.pricePerCup > 0)
                ).length;
                return (
                  <View key={p.id} style={styles.platformCard}>
                    <View style={styles.platformCardMain}>
                      <View style={styles.platformCardIconWrap}>
                        <Ionicons name="storefront" size={20} color={colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.platformCardName}>{p.name}</Text>
                        <View style={styles.platformCardMeta}>
                          <Text style={styles.platformCardFee}>
                            {p.feePercent > 0 ? `หัก ${p.feePercent}%` : 'ไม่หักค่าธรรมเนียม'}
                          </Text>
                          {menuItems.length > 0 && (
                            <>
                              <View style={styles.metaDot} />
                              <Text style={styles.platformCardMenus}>{configuredMenus}/{menuItems.length} เมนู</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => openEdit(p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.iconBtn}>
                        <Ionicons name="create-outline" size={19} color={colors.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(p.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={[styles.iconBtn, { marginLeft: 4 }]}>
                        <Ionicons name="trash-outline" size={19} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.platformFeeLabel}>
                      <Text style={styles.platformFeeLabelText}>{p.feeLabel}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  // Header
  header: { paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: 10 },
  title: { ...typography.heading, marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSection, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  statPillText: { fontSize: 12, fontWeight: '600', color: colors.accent },
  // Tab bar
  tabBar: { flexDirection: 'row', marginHorizontal: space.md, marginBottom: 14, borderRadius: radius.lg, backgroundColor: colors.bgInput, padding: 4, borderWidth: 1, borderColor: colors.border },
  tabBtn: { flex: 1, flexDirection: 'row', paddingVertical: 9, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: { backgroundColor: colors.bgCard, ...shadow.sm },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.accent },
  scroll: { flex: 1, paddingHorizontal: space.md },
  // Menu card
  menuCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, marginBottom: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.sm },
  menuCardMain: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  menuCardIconWrap: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.bgSection, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: colors.border },
  menuCardName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 3 },
  menuCardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  menuCardCost: { fontSize: 12, color: colors.textSecondary },
  menuCardPriceRange: { fontSize: 12, color: colors.accent, fontWeight: '600' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted, marginHorizontal: 6 },
  menuCardPlatforms: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 12 },
  platformPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSection, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  platformPillText: { fontSize: 11, fontWeight: '600', color: colors.accent },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  // Platform card
  platformCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, marginBottom: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.sm },
  platformCardMain: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  platformCardIconWrap: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.bgSection, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: colors.border },
  platformCardName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 3 },
  platformCardMeta: { flexDirection: 'row', alignItems: 'center' },
  platformCardFee: { fontSize: 12, fontWeight: '600', color: colors.accent },
  platformCardMenus: { fontSize: 12, color: colors.textMuted },
  platformFeeLabel: { paddingHorizontal: 14, paddingBottom: 10 },
  platformFeeLabelText: { fontSize: 12, color: colors.textMuted },
  // Form
  formCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: space.md, marginBottom: space.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  formTitle: { ...typography.subheading, marginBottom: 12 },
  formSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 12, lineHeight: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 5 },
  input: { backgroundColor: colors.bgInput, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
  formActions: { flexDirection: 'row', gap: space.sm, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  priceRowName: { fontSize: 14, fontWeight: '600', color: colors.text },
  priceRowFee: { fontSize: 11, color: colors.textMuted },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center' },
  priceInput: { width: 72, backgroundColor: colors.bgInput, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 9, fontSize: 15, fontWeight: '600', color: colors.text, borderWidth: 1, borderColor: colors.border },
  priceSuffix: { marginLeft: 6, fontSize: 14, color: colors.textMuted },
  // Buttons
  btnPrimary: { flexDirection: 'row', backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10, ...shadow.sm },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: { flex: 1, backgroundColor: colors.bgInput, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  btnSecondaryText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: radius.full, backgroundColor: colors.bgInput, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 5 },
  emptySubtitle: { textAlign: 'center', color: colors.textMuted, fontSize: 13 },
  // Hint
  hintBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FEF3C7', borderRadius: radius.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#FDE68A' },
  hintText: { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 18 },
});

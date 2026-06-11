import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format, startOfMonth, endOfMonth, subDays, parseISO, isWithinInterval } from 'date-fns';
import { th } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { calcPlatformSummary, MenuRowData } from '../utils/calculations';
import { colors, radius, shadow, space } from '../utils/theme';

type QuickFilter = 'today' | 'week' | 'month' | 'last_month' | 'custom';

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: 'today',      label: 'วันนี้'        },
  { key: 'week',       label: '7 วัน'        },
  { key: 'month',      label: 'เดือนนี้'     },
  { key: 'last_month', label: 'เดือนที่แล้ว' },
  { key: 'custom',     label: 'กำหนดเอง'     },
];

function getDateRange(filter: QuickFilter, customFrom: string, customTo: string) {
  const now = new Date();
  switch (filter) {
    case 'today':      return { from: new Date(format(now, 'yyyy-MM-dd')), to: new Date(format(now, 'yyyy-MM-dd') + 'T23:59:59') };
    case 'week':       return { from: subDays(now, 6), to: now };
    case 'month':      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'last_month': { const d = new Date(now.getFullYear(), now.getMonth() - 1, 1); return { from: startOfMonth(d), to: endOfMonth(d) }; }
    case 'custom': {
      try {
        return {
          from: customFrom ? parseISO(customFrom) : startOfMonth(now),
          to:   customTo   ? new Date(customTo + 'T23:59:59') : endOfMonth(now),
        };
      } catch { return { from: startOfMonth(now), to: endOfMonth(now) }; }
    }
  }
}

export default function ReportScreen() {
  const { sales, platforms, menuItems } = useStore();
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('month');
  const [customFrom, setCustomFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customTo,   setCustomTo]   = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const { from, to } = getDateRange(quickFilter, customFrom, customTo);

  const filteredSales = useMemo(() =>
    sales.filter((s) => {
      const d = parseISO(s.date);
      const inRange = isWithinInterval(d, { start: from, end: to });
      const inPlatform = platformFilter === 'all' || s.platformId === platformFilter;
      return inRange && inPlatform;
    }),
    [sales, from, to, platformFilter]
  );

  const activePlatforms = platformFilter === 'all' ? platforms : platforms.filter((p) => p.id === platformFilter);

  const summaries = useMemo(() =>
    activePlatforms
      .map((p) => calcPlatformSummary(filteredSales, p, menuItems))
      .filter((s) => s.rows.length > 0),
    [filteredSales, activePlatforms, menuItems]
  );

  // Combined rows for "all" view
  const combinedRows = useMemo(() => {
    const merged: Record<string, { menuItemId: string; name: string; qty: number; revenue: number; cost: number; fee: number; profit: number }> = {};
    summaries.forEach((s) => {
      s.rows.forEach((row) => {
        if (!merged[row.menuItemId]) {
          merged[row.menuItemId] = { menuItemId: row.menuItemId, name: row.name, qty: 0, revenue: 0, cost: 0, fee: 0, profit: 0 };
        }
        merged[row.menuItemId].qty     += row.quantity;
        merged[row.menuItemId].revenue += row.revenue;
        merged[row.menuItemId].cost    += row.costDeduct;
        merged[row.menuItemId].fee     += row.feeDeduct;
        merged[row.menuItemId].profit  += row.profit;
      });
    });
    return Object.values(merged);
  }, [summaries]);

  const grand = useMemo(() => ({
    qty:     summaries.reduce((s, p) => s + p.totalQty, 0),
    revenue: summaries.reduce((s, p) => s + p.totalRevenue, 0),
    cost:    summaries.reduce((s, p) => s + p.totalCost, 0),
    fee:     summaries.reduce((s, p) => s + p.totalFee, 0),
    profit:  summaries.reduce((s, p) => s + p.totalProfit, 0),
  }), [summaries]);

  const hasData = summaries.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>

        <View style={styles.header}>
          <Text style={styles.title}>รายงาน</Text>
        </View>

        {/* Date filters */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ช่วงเวลา</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {QUICK_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, quickFilter === f.key && styles.chipActive]}
                onPress={() => setQuickFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, quickFilter === f.key && styles.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {quickFilter === 'custom' && (
            <View style={styles.customDateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>จาก</Text>
                <TextInput style={styles.dateInput} value={customFrom} onChangeText={setCustomFrom} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
              </View>
              <Ionicons name="arrow-forward" size={16} color={colors.textMuted} style={{ marginTop: 22, marginHorizontal: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>ถึง</Text>
                <TextInput style={styles.dateInput} value={customTo} onChangeText={setCustomTo} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
          )}

          <View style={styles.dateRangeRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.dateRangeText}>
              {format(from, 'd MMM', { locale: th })} – {format(to, 'd MMM yyyy', { locale: th })}
            </Text>
          </View>
        </View>

        {/* Platform filter */}
        {platforms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>แพลตฟอร์ม</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.chip, platformFilter === 'all' && styles.chipActive]}
                onPress={() => setPlatformFilter('all')} activeOpacity={0.8}
              >
                <Text style={[styles.chipText, platformFilter === 'all' && styles.chipTextActive]}>ทั้งหมด</Text>
              </TouchableOpacity>
              {platforms.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, platformFilter === p.id && styles.chipActive]}
                  onPress={() => setPlatformFilter(p.id)} activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, platformFilter === p.id && styles.chipTextActive]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 3 top stat cards */}
        <View style={styles.statRow}>
          <StatCard icon="cash-outline"       label="รายได้รวม" value={grand.revenue} suffix="฿" />
          <StatCard icon="cafe-outline"        label="แก้วรวม"   value={grand.qty}     suffix="แก้ว" />
          <StatCard icon="trending-up-outline" label="กำไรสุทธิ" value={grand.profit}  suffix="฿" profit={grand.profit} />
        </View>

        {/* Table content */}
        {!hasData ? (
          <EmptyState />
        ) : platformFilter === 'all' ? (
          <CombinedSection rows={combinedRows} grand={grand} />
        ) : (
          summaries.map((summary) => (
            <PlatformSection key={summary.platform.id} summary={summary} />
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Combined section (ทั้งหมด) ───────────────────────────────────────────────

function CombinedSection({ rows, grand }: {
  rows: { menuItemId: string; name: string; qty: number; revenue: number; cost: number; fee: number; profit: number }[];
  grand: { qty: number; revenue: number; cost: number; fee: number; profit: number };
}) {
  const hasFee = grand.fee > 0;
  return (
    <View style={styles.platformBlock}>
      {/* Section header */}
      <View style={styles.platformHeaderRow}>
        <View style={styles.platformHeaderLeft}>
          <Ionicons name="layers" size={15} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={styles.platformTitle}>ทุก Platform</Text>
        </View>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyBadgeText}>{grand.qty} แก้ว</Text>
        </View>
      </View>

      {/* Column header */}
      <ColumnHeader hasFee={hasFee} feeLabel="ค่าธรรมเนียม" />

      {/* Menu rows */}
      {rows.map((row, i) => (
        <CombinedMenuRow key={row.menuItemId} row={row} hasFee={hasFee} isLast={i === rows.length - 1} />
      ))}

      {/* Summary row */}
      <SummaryRow
        hasFee={hasFee}
        qty={grand.qty} revenue={grand.revenue} cost={grand.cost} fee={grand.fee} profit={grand.profit}
        margin={grand.revenue > 0 ? Math.round((grand.profit / grand.revenue) * 100) : 0}
      />
    </View>
  );
}

// ─── Per-platform section ─────────────────────────────────────────────────────

function PlatformSection({ summary }: { summary: ReturnType<typeof calcPlatformSummary> }) {
  const { platform, rows, totalQty, totalRevenue, totalCost, totalFee, totalProfit } = summary;
  const hasFee = platform.feePercent > 0;
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  return (
    <View style={styles.platformBlock}>
      {/* Section header */}
      <View style={styles.platformHeaderRow}>
        <View style={styles.platformHeaderLeft}>
          <Ionicons name="storefront" size={15} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={styles.platformTitle}>{platform.name}</Text>
          {hasFee && (
            <View style={styles.feeBadge}>
              <Text style={styles.feeBadgeText}>หัก {platform.feePercent}%</Text>
            </View>
          )}
        </View>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyBadgeText}>{totalQty} แก้ว</Text>
        </View>
      </View>

      {/* Column header */}
      <ColumnHeader hasFee={hasFee} feeLabel={hasFee ? `หัก ${platform.feePercent}%` : ''} />

      {/* Menu rows */}
      {rows.map((row, i) => (
        <MenuItemRow key={row.menuItemId} row={row} hasFee={hasFee} isLast={i === rows.length - 1} />
      ))}

      {/* Summary row */}
      <SummaryRow
        hasFee={hasFee}
        qty={totalQty} revenue={totalRevenue} cost={totalCost} fee={totalFee} profit={totalProfit}
        margin={margin}
      />
    </View>
  );
}

// ─── Table sub-components ─────────────────────────────────────────────────────

function ColumnHeader({ hasFee, feeLabel }: { hasFee: boolean; feeLabel: string }) {
  return (
    <View style={[styles.tableRow, styles.colHeaderRow]}>
      <Text style={[styles.colHeader, { flex: 2.2 }]}>เมนู</Text>
      <Text style={[styles.colHeader, styles.colRight, { flex: 0.9 }]}>แก้ว</Text>
      <Text style={[styles.colHeader, styles.colRight, { flex: 1.5 }]}>รายได้</Text>
      <Text style={[styles.colHeader, styles.colRight, { flex: 1.5 }]}>หักต้นทุน</Text>
      {hasFee && <Text style={[styles.colHeader, styles.colRight, { flex: 1.5 }]}>{feeLabel}</Text>}
      <Text style={[styles.colHeader, styles.colRight, { flex: 1.5 }]}>กำไร</Text>
    </View>
  );
}

function MenuItemRow({ row, hasFee, isLast }: { row: MenuRowData; hasFee: boolean; isLast: boolean }) {
  return (
    <View style={[styles.tableRow, styles.dataRow, isLast && styles.lastDataRow]}>
      <Text style={[styles.cellName, { flex: 2.2 }]} numberOfLines={2}>{row.name}</Text>
      <Text style={[styles.cellNum, { flex: 0.9 }]}>{row.quantity}</Text>
      <Text style={[styles.cellNum, { flex: 1.5 }]}>{row.revenue.toLocaleString()}</Text>
      <Text style={[styles.cellNum, styles.cellNeg, { flex: 1.5 }]}>
        {row.costDeduct > 0 ? `-${row.costDeduct.toLocaleString()}` : '–'}
      </Text>
      {hasFee && (
        <Text style={[styles.cellNum, styles.cellNeg, { flex: 1.5 }]}>
          {row.feeDeduct > 0 ? `-${row.feeDeduct.toLocaleString()}` : '–'}
        </Text>
      )}
      <Text style={[styles.cellNum, row.profit > 0 ? styles.cellProfit : row.profit < 0 ? styles.cellNeg : null, { flex: 1.5 }]}>
        {row.profit.toLocaleString()}
      </Text>
    </View>
  );
}

function CombinedMenuRow({ row, hasFee, isLast }: {
  row: { menuItemId: string; name: string; qty: number; revenue: number; cost: number; fee: number; profit: number };
  hasFee: boolean; isLast: boolean;
}) {
  return (
    <View style={[styles.tableRow, styles.dataRow, isLast && styles.lastDataRow]}>
      <Text style={[styles.cellName, { flex: 2.2 }]} numberOfLines={2}>{row.name}</Text>
      <Text style={[styles.cellNum, { flex: 0.9 }]}>{row.qty}</Text>
      <Text style={[styles.cellNum, { flex: 1.5 }]}>{row.revenue.toLocaleString()}</Text>
      <Text style={[styles.cellNum, styles.cellNeg, { flex: 1.5 }]}>
        {row.cost > 0 ? `-${row.cost.toLocaleString()}` : '–'}
      </Text>
      {hasFee && (
        <Text style={[styles.cellNum, styles.cellNeg, { flex: 1.5 }]}>
          {row.fee > 0 ? `-${row.fee.toLocaleString()}` : '–'}
        </Text>
      )}
      <Text style={[styles.cellNum, row.profit > 0 ? styles.cellProfit : row.profit < 0 ? styles.cellNeg : null, { flex: 1.5 }]}>
        {row.profit.toLocaleString()}
      </Text>
    </View>
  );
}

function SummaryRow({ hasFee, qty, revenue, cost, fee, profit, margin }: {
  hasFee: boolean; qty: number; revenue: number; cost: number; fee: number; profit: number; margin: number;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryLeft}>
        <Text style={styles.summaryLabel}>สรุป</Text>
        <Text style={styles.summaryQty}>{qty} แก้ว</Text>
      </View>
      <View style={styles.summaryRight}>
        <SummaryPill label="รายได้" value={revenue} />
        <SummaryPill label="หักต้นทุน" value={-cost} neg />
        {hasFee && fee > 0 && <SummaryPill label="ค่าธรรมเนียม" value={-fee} neg />}
        <SummaryPill label="กำไร" value={profit} profit={profit} />
      </View>
      {revenue > 0 && (
        <View style={styles.marginRow}>
          <Text style={styles.marginText}>Margin {margin}%</Text>
        </View>
      )}
    </View>
  );
}

function SummaryPill({ label, value, neg, profit }: { label: string; value: number; neg?: boolean; profit?: number }) {
  const textColor = profit !== undefined
    ? (profit > 0 ? colors.success : profit < 0 ? colors.danger : colors.text)
    : neg ? colors.danger : colors.text;
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryPillLabel}>{label}</Text>
      <Text style={[styles.summaryPillValue, { color: textColor }]}>
        {value >= 0 ? '' : ''}{value.toLocaleString()} ฿
      </Text>
    </View>
  );
}

function StatCard({ icon, label, value, suffix, profit }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: number; suffix: string; profit?: number;
}) {
  const valueColor = profit !== undefined
    ? (profit > 0 ? colors.success : profit < 0 ? colors.danger : colors.text)
    : colors.text;
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={16} color={colors.accent} style={{ marginBottom: 4 }} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>
        {value.toLocaleString()} <Text style={styles.statSuffix}>{suffix}</Text>
      </Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="bar-chart-outline" size={40} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>ไม่มีข้อมูลการขาย</Text>
      <Text style={styles.emptySubtitle}>ในช่วงเวลาและ platform ที่เลือก</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.xs },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  section: { paddingHorizontal: space.md, marginBottom: space.md },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },

  // Filters
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.bgCard, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  customDateRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  dateInput: { backgroundColor: colors.bgCard, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border },
  dateRangeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  dateRangeText: { fontSize: 12, color: colors.textMuted },

  // Stat cards
  statRow: { flexDirection: 'row', paddingHorizontal: space.md, gap: space.sm, marginBottom: space.md },
  statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  statLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' },
  statSuffix: { fontSize: 11, fontWeight: '400', color: colors.textMuted },

  // Platform block
  platformBlock: { marginHorizontal: space.md, marginBottom: space.lg, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.sm },
  platformHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgSection },
  platformHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  platformTitle: { fontSize: 15, fontWeight: '700', color: colors.accent },
  feeBadge: { marginLeft: 8, backgroundColor: colors.bgInput, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  feeBadgeText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  qtyBadge: { backgroundColor: colors.bgCard, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  qtyBadgeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  // Table rows
  tableRow: { flexDirection: 'row', alignItems: 'center' },
  colHeaderRow: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.tableHeader, borderBottomWidth: 1, borderBottomColor: colors.border },
  colHeader: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  colRight: { textAlign: 'right' },
  dataRow: { paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  lastDataRow: { borderBottomWidth: 0 },
  cellName: { fontSize: 13, fontWeight: '600', color: colors.text, paddingRight: 6 },
  cellNum: { fontSize: 13, color: colors.text, textAlign: 'right', fontVariant: ['tabular-nums'] as any },
  cellNeg: { color: colors.danger },
  cellProfit: { color: colors.success, fontWeight: '700' },

  // Summary row
  summaryRow: { backgroundColor: colors.summaryRow, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginRight: 8 },
  summaryQty: { fontSize: 12, color: colors.textMuted },
  summaryRight: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryPill: { backgroundColor: colors.bgCard, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  summaryPillLabel: { fontSize: 10, color: colors.textMuted, marginBottom: 1 },
  summaryPillValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  marginRow: { marginTop: 8 },
  marginText: { fontSize: 11, color: colors.textMuted },

  // Empty
  emptyBox: { alignItems: 'center', paddingTop: 40 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: radius.full, backgroundColor: colors.bgInput, alignItems: 'center', justifyContent: 'center', marginBottom: space.md, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: colors.textMuted },
});

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet,
} from 'react-native';
import { format, getYear, getMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { calcPlatformSummary, MenuRowData } from '../utils/calculations';
import { colors, typography } from '../utils/theme';

const THAI_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
];

export default function ReportScreen() {
  const { sales, platforms, menuItems } = useStore();
  const now = new Date();
  const [year, setYear] = useState(getYear(now));
  const [month, setMonth] = useState(getMonth(now)); // 0-indexed

  const filteredSales = sales.filter((s) => {
    const d = new Date(s.date);
    return getYear(d) === year && getMonth(d) === month;
  });

  const summaries = platforms
    .map((p) => calcPlatformSummary(filteredSales, p, menuItems))
    .filter((s) => s.rows.length > 0);

  const grandTotalQty = summaries.reduce((s, p) => s + p.totalQty, 0);
  const grandRevenue = summaries.reduce((s, p) => s + p.totalRevenue, 0);
  const grandCost = summaries.reduce((s, p) => s + p.totalCost, 0);
  const grandFee = summaries.reduce((s, p) => s + p.totalFee, 0);
  const grandProfit = summaries.reduce((s, p) => s + p.totalProfit, 0);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title}>รายการขายเดือน</Text>
          <Text style={styles.subtitle}>{THAI_MONTHS[month]} {year + 543}</Text>
        </View>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {summaries.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>ไม่มีข้อมูลการขายในเดือนนี้</Text>
          <Text style={styles.emptySubText}>กรอกยอดขายที่แท็บ บันทึกยอดขาย</Text>
        </View>
      ) : (
        <>
          {summaries.map((summary) => (
            <PlatformTable key={summary.platform.id} summary={summary} />
          ))}

          {/* Grand total */}
          {summaries.length > 1 && (
            <View style={styles.grandCard}>
              <Text style={styles.grandTitle}>รวมทั้งหมด</Text>
              <View style={styles.grandRow}>
                <GrandStat label="แก้วรวม" value={`${grandTotalQty} แก้ว`} />
                <GrandStat label="รายได้รวม" value={`${grandRevenue.toLocaleString()} ฿`} />
              </View>
              <View style={styles.grandRow}>
                <GrandStat label="หักต้นทุนรวม" value={`-${grandCost.toLocaleString()} ฿`} neg />
                <GrandStat label="หักค่าธรรมเนียมรวม" value={`-${grandFee.toLocaleString()} ฿`} neg />
              </View>
              <View style={[styles.grandProfitRow]}>
                <Text style={styles.grandProfitLabel}>กำไรสุทธิ</Text>
                <Text style={[styles.grandProfitValue, grandProfit < 0 && { color: colors.danger }]}>
                  {grandProfit.toLocaleString()} ฿
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function GrandStat({ label, value, neg }: { label: string; value: string; neg?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.grandStatLabel}>{label}</Text>
      <Text style={[styles.grandStatValue, neg && { color: colors.danger }]}>{value}</Text>
    </View>
  );
}

function PlatformTable({ summary }: { summary: ReturnType<typeof calcPlatformSummary> }) {
  const { platform, rows, totalQty, totalRevenue, totalCost, totalFee, totalProfit } = summary;
  return (
    <View style={styles.section}>
      <Text style={styles.platformName}>{platform.name}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Table header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Cell w={120} header>เมนู</Cell>
            <Cell w={60} header>ราคา/แก้ว</Cell>
            <Cell w={60} header>ต้นทุน/แก้ว</Cell>
            <Cell w={55} header>ขายได้</Cell>
            <Cell w={75} header>จำนวนเงิน</Cell>
            <Cell w={70} header>หักต้นทุน</Cell>
            <Cell w={90} header>{platform.feeLabel}</Cell>
            <Cell w={80} header>กำไรคงเหลือ</Cell>
          </View>
          {/* Data rows */}
          {rows.map((row) => (
            <DataRow key={row.menuItemId} row={row} />
          ))}
          {/* Summary row */}
          <View style={[styles.tableRow, styles.summaryRow]}>
            <Cell w={120} bold>สรุป</Cell>
            <Cell w={60} />
            <Cell w={60} />
            <Cell w={55} bold>{totalQty}</Cell>
            <Cell w={75} bold>{totalRevenue.toLocaleString()}</Cell>
            <Cell w={70} bold neg>-{totalCost.toLocaleString()}</Cell>
            <Cell w={90} bold neg>{totalFee > 0 ? `-${totalFee.toLocaleString()}` : '-'}</Cell>
            <Cell w={80} bold profit={totalProfit}>{totalProfit.toLocaleString()}</Cell>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function DataRow({ row }: { row: MenuRowData }) {
  return (
    <View style={styles.tableRow}>
      <Cell w={120}>{row.name}</Cell>
      <Cell w={60}>{row.pricePerCup}</Cell>
      <Cell w={60}>{row.costPerCup}</Cell>
      <Cell w={55}>{row.quantity}</Cell>
      <Cell w={75}>{row.revenue.toLocaleString()}</Cell>
      <Cell w={70} neg>-{row.costDeduct.toLocaleString()}</Cell>
      <Cell w={90} neg>{row.feeDeduct > 0 ? `-${row.feeDeduct.toLocaleString()}` : '-'}</Cell>
      <Cell w={80} profit={row.profit}>{row.profit.toLocaleString()}</Cell>
    </View>
  );
}

function Cell({
  children, w, header, bold, neg, profit,
}: {
  children?: React.ReactNode;
  w: number;
  header?: boolean;
  bold?: boolean;
  neg?: boolean;
  profit?: number;
}) {
  const textStyle: any[] = [styles.cellText];
  if (header) textStyle.push(styles.cellHeader);
  if (bold) textStyle.push({ fontWeight: '700' as const });
  if (neg) textStyle.push({ color: colors.danger });
  if (profit !== undefined && profit > 0) textStyle.push({ color: colors.success });
  if (profit !== undefined && profit < 0) textStyle.push({ color: colors.danger });
  return (
    <View style={[styles.cell, { width: w }, header && styles.cellHeaderBg]}>
      <Text style={textStyle} numberOfLines={2}>{children ?? ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 16, paddingBottom: 12 },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 28, color: colors.accent, fontWeight: '300' },
  title: { ...typography.heading, textAlign: 'center', fontSize: 18 },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySubText: { fontSize: 13, color: colors.textMuted },
  section: { marginHorizontal: 16, marginBottom: 24 },
  platformName: { fontSize: 18, fontWeight: '700', color: colors.accent, marginBottom: 8 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeader: { backgroundColor: colors.tableHeader },
  summaryRow: { backgroundColor: colors.summaryRow },
  cell: { padding: 8, justifyContent: 'center', borderRightWidth: 1, borderRightColor: colors.border },
  cellHeaderBg: { backgroundColor: colors.tableHeader },
  cellText: { fontSize: 13, color: colors.text },
  cellHeader: { fontWeight: '700', fontSize: 12, color: colors.textSecondary },
  grandCard: { marginHorizontal: 16, backgroundColor: colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  grandTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  grandRow: { flexDirection: 'row', marginBottom: 10, gap: 16 },
  grandStatLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  grandStatValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  grandProfitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  grandProfitLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  grandProfitValue: { fontSize: 20, fontWeight: '800', color: colors.success },
});

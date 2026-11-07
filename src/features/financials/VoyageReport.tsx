import { Document, Line, Page, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import { ITINERARY_FIELDS, moneyFields } from '#features/charterparty/CharterPartyTerms.ts';
import { portLabel } from '#features/ports/Port.ts';
import { vesselLabel } from '#features/vessel/VesselCandidate.ts';
import type { Column, Figure, Section } from '#shared/display.ts';
import { fieldFigures } from '#shared/fields.ts';
import { figure, timestamp } from '#shared/format.ts';
import { PALETTE } from '#shared/ui/palette.ts';
import { blankWarning, deadweightAccount, ledger, LINE_COLUMNS, PASSAGE_COLUMNS, passages } from './ledger.ts';
import { headlines } from './metrics.ts';
import type { VoyageEstimate } from './VoyageEstimate.ts';
import { BAR_FILLS, waterfallGeometry, type WaterfallGeometry, type WaterfallLayout } from './waterfall.ts';

const INK = {
  navy: PALETTE.navy[900],
  gold: PALETTE.gold[500],
  goldBright: PALETTE.gold[300],
  goldDeep: PALETTE.gold[700],
  text: PALETTE.ink[300],
  faint: PALETTE.ink[500],
  white: PALETTE.ink[0],
  rule: PALETTE.paper.rule,
  label: PALETTE.paper.label,
  wash: PALETTE.paper.wash,
};

const CHART_LAYOUT: WaterfallLayout = { width: 547, plotHeight: 96, padding: 10, fontSize: 6 };

const CAPTION = { textAnchor: 'middle', fill: INK.label, style: { fontSize: CHART_LAYOUT.fontSize } } as const;

const FIGURE_COLUMNS: readonly Column<Figure>[] = [
  { label: 'Item', text: ({ label }) => label },
  { label: 'Value', text: ({ value }) => value },
];

const cell = { flexGrow: 1, flexBasis: 0 };

const styles = StyleSheet.create({
  page: { backgroundColor: 'white', padding: 22, fontFamily: 'Helvetica', fontSize: 8, color: INK.navy },
  header: { backgroundColor: INK.navy, borderRadius: 6, borderWidth: 1, borderColor: INK.gold, padding: 12, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 'bold', color: INK.white },
  subtitle: { fontSize: 9, color: INK.goldBright, marginTop: 3 },
  meta: { fontSize: 8, color: INK.text, marginTop: 6 },
  tiles: { flexDirection: 'row', gap: 6 },
  tile: { ...cell, backgroundColor: INK.navy, borderRadius: 4, borderWidth: 1, borderColor: INK.gold, padding: 8 },
  tileLabel: { fontSize: 7, color: INK.text },
  tileValue: { fontSize: 12, fontWeight: 'bold', color: INK.goldBright, marginTop: 2 },
  heading: { fontSize: 10, fontWeight: 'bold', marginTop: 8, marginBottom: 3, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: INK.gold },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 1.5, borderBottomWidth: 0.5, borderBottomColor: INK.rule },
  head: { ...cell, fontWeight: 'bold', color: INK.label },
  cell,
  label: { ...cell, color: INK.label },
  note: { fontSize: 7, color: INK.faint, marginTop: 3 },
  warning: { fontSize: 7, color: INK.goldDeep, backgroundColor: INK.wash, paddingVertical: 1, paddingHorizontal: 3 },
  columns: { flexDirection: 'row', gap: 16 },
});

function Heading({ children }: { children: string }) {
  return <Text style={styles.heading}>{children}</Text>;
}

function Row({ cells, head = false }: { cells: readonly (string | number)[]; head?: boolean }) {
  return (
    <View style={styles.row}>
      {cells.map((text, index) => (
        <Text key={index} style={head ? styles.head : index === 0 ? styles.label : styles.cell}>
          {text}
        </Text>
      ))}
    </View>
  );
}

function Table<T>({ section: { title, rows, notes = [] }, columns, header = true }: { section: Section<T>; columns: readonly Column<T>[]; header?: boolean }) {
  return (
    <View wrap={false}>
      <Heading>{title}</Heading>
      {header && <Row head cells={columns.map(({ label }) => label)} />}
      {rows.map((row, index) => (
        <Row key={index} cells={columns.map(({ text }) => text(row, index))} />
      ))}
      {notes.map((note) => (
        <Text key={note} style={styles.note}>
          {note}
        </Text>
      ))}
    </View>
  );
}

function Pairs({ section }: { section: Section<Figure> }) {
  return <Table section={section} columns={FIGURE_COLUMNS} header={false} />;
}

function Tiles({ figures }: { figures: readonly Figure[] }) {
  return (
    <View style={styles.tiles}>
      {figures.map(({ label, value }) => (
        <View key={label} style={styles.tile}>
          <Text style={styles.tileLabel}>{label}</Text>
          <Text style={styles.tileValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function Chart({ geometry: { width, height, axis, connectors, bars, captions } }: { geometry: WaterfallGeometry }) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Line {...axis} stroke={INK.rule} strokeWidth={1} />
      {connectors.map((rule) => (
        <Line key={rule.x1} {...rule} stroke={INK.rule} strokeWidth={0.6} strokeDasharray="2 2" />
      ))}
      {bars.map(({ key, tone, ...box }) => (
        <Rect key={key} {...box} fill={BAR_FILLS.paper[tone]} />
      ))}
      {captions.map(({ key, text, x, y }) => (
        <Text key={key} x={x} y={y} {...CAPTION}>
          {text}
        </Text>
      ))}
    </Svg>
  );
}

export function VoyageReport({ estimate }: { estimate: VoyageEstimate }) {
  const { vessel, charterParty, loadPort, dischargePort } = estimate.inputs;
  const name = vesselLabel(vessel);
  const groups = ledger(estimate);
  const [revenue, ...costs] = groups;
  const warning = blankWarning(estimate);

  return (
    <Document title={`Voyage Estimate, ${name}, ${charterParty.cargoName}`} author="Voyage Estimator">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.subtitle}>
            {`${charterParty.cargoName} / ${figure(charterParty.quantity)} tonnes / ${portLabel(loadPort)} to ${portLabel(dischargePort)}`}
          </Text>
          <Text style={styles.meta}>{`IMO ${vessel.imo} / ${charterParty.charterType} / Prepared ${timestamp(new Date())}`}</Text>
        </View>

        <Tiles figures={headlines(estimate)} />

        <View wrap={false}>
          <Heading>Profit Waterfall</Heading>
          <Chart geometry={waterfallGeometry(groups, CHART_LAYOUT)} />
        </View>

        <View style={styles.columns}>
          <View style={styles.cell}>
            <Pairs section={deadweightAccount(estimate)} />
          </View>
          <View style={styles.cell}>
            <Pairs
              section={{
                title: 'Commercial Terms',
                rows: [
                  { label: 'Charter Type', value: charterParty.charterType },
                  ...fieldFigures([...ITINERARY_FIELDS, ...moneyFields(charterParty.charterType)], charterParty),
                ],
              }}
            />
          </View>
        </View>

        <Table section={revenue} columns={LINE_COLUMNS} />
        <Table section={passages(estimate)} columns={PASSAGE_COLUMNS} />
        {costs.map((group) => (
          <Table key={group.id} section={group} columns={LINE_COLUMNS} />
        ))}

        {warning && <Text style={styles.warning}>{warning}</Text>}
      </Page>
    </Document>
  );
}

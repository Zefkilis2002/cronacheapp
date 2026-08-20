import React from 'react';
import { Group, Text, Rect, Line, Circle, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { COPPA_GEO } from './classificaVariants';

const G = COPPA_GEO;
const BASE = G.CONTENT_LEFT + G.ROW_INDENT; // 74: inizio contenuto riga

let measureCtx = null;
const measureWidth = (text, fontStyle, fontSize, family, letterSpacing = 0) => {
  if (typeof document === 'undefined') return text.length * fontSize * 0.55;
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = `${fontStyle} ${fontSize}px ${family}`;
  const w = measureCtx.measureText(text).width;
  return w + Math.max(0, text.length - 1) * letterSpacing;
};

const MONO = "'IBM Plex Mono', monospace";
const OSWALD = 'Oswald, sans-serif';

// Riga singola (altezza flat, nessun trattamento speciale per il #1 assoluto)
const CoppaRow = ({ row, style, top, dim, onTeamClick, onValueClick }) => {
  // crossOrigin: i loghi cercati sul web arrivano dal proxy (altra origine);
  // senza 'anonymous' il canvas si "sporca" e il download fallisce.
  const [logoImage] = useImage(row.logo || undefined, 'anonymous');
  const height = G.ROW_H;
  const center = top + height / 2;
  const statColor = dim ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.7)';
  const drColor = dim ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.85)';
  const col = G.COLS;
  const cellX = (c) => BASE + c.x;

  const stat = (key, c) => (
    <Text
      x={cellX(c)}
      y={top}
      width={c.w}
      height={height}
      text={String(row[key])}
      fontFamily={MONO}
      fontSize={15}
      fill={statColor}
      align="center"
      verticalAlign="middle"
      onClick={() => onValueClick(row.id, key)}
      onTap={() => onValueClick(row.id, key)}
    />
  );

  return (
    <Group>
      {style.gradient && (
        <Rect
          x={G.CONTENT_LEFT}
          y={top}
          width={G.CONTENT_WIDTH}
          height={height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: G.CONTENT_WIDTH, y: 0 }}
          fillLinearGradientColorStops={[
            0, `rgba(${style.gradient.rgb},${style.gradient.op})`,
            style.gradient.stop, `rgba(${style.gradient.rgb},0)`,
            1, `rgba(${style.gradient.rgb},0)`
          ]}
          listening={false}
        />
      )}

      <Rect x={G.CONTENT_LEFT} y={top} width={4} height={height} fill={style.accent} listening={false} />

      <Line
        points={[G.CONTENT_LEFT, top + height, G.CONTENT_LEFT + G.CONTENT_WIDTH, top + height]}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
        listening={false}
      />

      <Text
        x={cellX(col.POS)}
        y={top}
        width={col.POS.w}
        height={height}
        text={String(row.pos)}
        fontFamily={OSWALD}
        fontStyle="600"
        fontSize={24}
        fill={style.posColor}
        align="left"
        verticalAlign="middle"
      />

      {row.logo ? (
        logoImage && (
          <KonvaImage
            image={logoImage}
            x={cellX(col.LOGO) + (col.LOGO.w - G.LOGO_SIZE) / 2}
            y={center - G.LOGO_SIZE / 2}
            width={G.LOGO_SIZE}
            height={G.LOGO_SIZE}
            onClick={() => onTeamClick(row.id)}
            onTap={() => onTeamClick(row.id)}
          />
        )
      ) : (
        // Squadra senza stemma disponibile: cerchio vuoto (come nel mockup)
        <Circle
          x={cellX(col.LOGO) + col.LOGO.w / 2}
          y={center}
          radius={G.LOGO_SIZE / 2}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1}
          onClick={() => onTeamClick(row.id)}
          onTap={() => onTeamClick(row.id)}
        />
      )}

      <Text
        x={cellX(col.NAME)}
        y={top}
        width={col.NAME.w}
        height={height}
        text={(row.name || '').toUpperCase()}
        fontFamily={OSWALD}
        fontStyle="500"
        fontSize={22}
        fill="#ffffff"
        align="left"
        verticalAlign="middle"
        wrap="none"
        ellipsis
        onClick={() => onTeamClick(row.id)}
        onTap={() => onTeamClick(row.id)}
      />

      {stat('p', col.P)}
      {stat('w', col.W)}
      {stat('d', col.N)}
      {stat('l', col.L)}

      <Text
        x={cellX(col.GD)}
        y={top}
        width={col.GD.w}
        height={height}
        text={String(row.gd)}
        fontFamily={MONO}
        fontSize={15}
        fill={drColor}
        align="center"
        verticalAlign="middle"
        onClick={() => onValueClick(row.id, 'gd')}
        onTap={() => onValueClick(row.id, 'gd')}
      />

      <Text
        x={cellX(col.PTS)}
        y={top}
        width={col.PTS.w}
        height={height}
        text={String(row.pts)}
        fontFamily={OSWALD}
        fontStyle="600"
        fontSize={26}
        fill={style.ptColor}
        align="right"
        verticalAlign="middle"
        onClick={() => onValueClick(row.id, 'pts')}
        onTap={() => onValueClick(row.id, 'pts')}
      />
    </Group>
  );
};

const DatiClassificaCoppa = ({ variant, rows = [], onTeamClick, onValueClick }) => {
  if (!variant) return null;
  const col = G.COLS;
  const cellX = (c) => BASE + c.x;

  // Layout ancorato in ALTO (non in basso come le altre 5 varianti)
  const titleY = G.CONTENT_TOP + G.HEADER_LOGO_H + G.TITLE_MARGIN_TOP;
  const headerLabelY = titleY + G.TITLE_H;
  const sepY = headerLabelY + G.HEADER_LABEL_H;
  const rowsTop = sepY + G.SEPARATOR_H;

  const rowTops = rows.map((_, i) => rowsTop + i * G.ROW_H);
  const legendTop = rowsTop + rows.length * G.ROW_H + G.LEGEND_PAD_TOP;

  const headerLabel = (text, c, align) => (
    <Text
      key={text + c.x}
      x={cellX(c)}
      y={headerLabelY}
      width={c.w}
      height={16}
      text={text}
      fontFamily={MONO}
      fontSize={11}
      letterSpacing={1.76}
      fill="rgba(255,255,255,0.5)"
      align={align}
      verticalAlign="middle"
    />
  );

  // Legenda: quadratini colorati + etichette, poi nota V/N/P/DR
  const legendRowCenter = legendTop + 9;
  const legendNodes = [];
  let lx = G.CONTENT_LEFT;
  variant.legend.forEach((item, i) => {
    legendNodes.push(
      <Rect key={`ld${i}`} x={lx} y={legendRowCenter - 6} width={12} height={12} fill={item.color} listening={false} />
    );
    const labelText = item.label.toUpperCase();
    legendNodes.push(
      <Text
        key={`ll${i}`}
        x={lx + 22}
        y={legendRowCenter - 8}
        height={16}
        text={labelText}
        fontFamily={MONO}
        fontSize={12}
        letterSpacing={1.68}
        fill="rgba(255,255,255,0.72)"
        verticalAlign="middle"
      />
    );
    const labelW = measureWidth(labelText, '400', 12, 'IBM Plex Mono', 1.68);
    lx += 22 + labelW + 28;
  });

  const noteY = legendTop + 18 + G.LEGEND_ROW_GAP;

  return (
    <Group>
      <Text
        x={G.CONTENT_LEFT}
        y={titleY}
        height={20}
        text={(variant.title || '').toUpperCase()}
        fontFamily={MONO}
        fontSize={14}
        letterSpacing={3.92}
        fill={variant.titleColor}
        verticalAlign="middle"
      />

      {headerLabel('POS', col.POS, 'left')}
      {headerLabel('SQUADRA', col.NAME, 'left')}
      {headerLabel('PG', col.P, 'center')}
      {headerLabel('V', col.W, 'center')}
      {headerLabel('N', col.N, 'center')}
      {headerLabel('P', col.L, 'center')}
      {headerLabel('DR', col.GD, 'center')}
      {headerLabel('PT', col.PTS, 'right')}

      <Rect x={G.CONTENT_LEFT} y={sepY} width={G.CONTENT_WIDTH} height={G.SEPARATOR_H} fill="rgba(255,255,255,0.85)" listening={false} />

      {rows.map((row, i) => (
        <CoppaRow
          key={row.id ?? i}
          row={{ ...row, id: row.id ?? i }}
          style={variant.styles[i] || variant.styles[variant.styles.length - 1]}
          top={rowTops[i]}
          dim={i >= G.DIM_FROM_INDEX}
          onTeamClick={onTeamClick}
          onValueClick={onValueClick}
        />
      ))}

      {legendNodes}
      <Text
        x={G.CONTENT_LEFT}
        y={noteY}
        width={G.CONTENT_WIDTH}
        height={14}
        text={variant.note.toUpperCase()}
        fontFamily={MONO}
        fontSize={11}
        letterSpacing={1.76}
        fill="rgba(255,255,255,0.4)"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
};

export default DatiClassificaCoppa;

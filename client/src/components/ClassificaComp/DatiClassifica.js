import React from 'react';
import { Group, Text, Rect, Line, Image as KonvaImage, Circle } from 'react-konva';
import useImage from 'use-image';
import { CLASSIFICA_GEO } from './classificaVariants';

const G = CLASSIFICA_GEO;
const BASE = G.CONTENT_LEFT + G.ROW_INDENT; // 78: inizio contenuto riga

// Canvas offscreen per misurare la larghezza del nome (badge "Campione")
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

// Riga singola della tabella
const ClassificaRow = ({ row, style, top, height, isFirst, onTeamClick, onValueClick }) => {
  const [logoImage] = useImage(row.logo || undefined);
  const center = top + height / 2;
  const bottomBorder = isFirst ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.12)';
  const statColor = isFirst ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.7)';
  const drColor = isFirst ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.85)';

  const posSize = isFirst ? 40 : 34;
  const nameSize = isFirst ? 31 : 29;
  const nameWeight = isFirst ? '600' : '500';
  const ptsSize = isFirst ? 42 : 38;

  const col = G.COLS;
  const cellX = (c) => BASE + c.x;

  const stat = (key, c, color) => (
    <Text
      x={cellX(c)}
      y={top}
      width={c.w}
      height={height}
      text={String(row[key])}
      fontFamily={MONO}
      fontSize={19}
      fill={color}
      align="center"
      verticalAlign="middle"
      onClick={() => onValueClick(row.id, key)}
      onTap={() => onValueClick(row.id, key)}
    />
  );

  // Nome squadra (uppercase, con eventuale badge "Campione")
  const nameText = (row.name || '').toUpperCase();
  const nameLS = isFirst ? 0.3 : 0;
  const nameMaxW = col.NAME.w;
  let badge = null;
  let nameW = nameMaxW;
  if (style.badge) {
    const measured = measureWidth(nameText, nameWeight, nameSize, 'Oswald', nameLS);
    nameW = Math.min(measured + 2, nameMaxW - 130);
    const badgeText = style.badge.toUpperCase();
    const badgeFont = 12;
    const badgeLS = 2.16;
    const badgeTextW = measureWidth(badgeText, '400', badgeFont, 'IBM Plex Mono', badgeLS);
    const badgeW = badgeTextW + 20; // padding 10 x2
    const badgeH = 26;
    const badgeX = cellX(col.NAME) + nameW + 14;
    badge = (
      <Group>
        <Rect x={badgeX} y={center - badgeH / 2} width={badgeW} height={badgeH} fill={style.accent} />
        <Text
          x={badgeX}
          y={center - badgeH / 2}
          width={badgeW}
          height={badgeH}
          text={badgeText}
          fontFamily={MONO}
          fontSize={badgeFont}
          letterSpacing={badgeLS}
          fill="#ffffff"
          align="center"
          verticalAlign="middle"
        />
      </Group>
    );
  }

  return (
    <Group>
      {/* Gradiente di riga */}
      {style.gradient && (
        <Rect
          x={G.CONTENT_LEFT}
          y={top}
          width={G.CONTENT_RIGHT - G.CONTENT_LEFT}
          height={height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: G.CONTENT_RIGHT - G.CONTENT_LEFT, y: 0 }}
          fillLinearGradientColorStops={[
            0, `rgba(${style.gradient.rgb},${style.gradient.op})`,
            style.gradient.stop, `rgba(${style.gradient.rgb},0)`,
            1, `rgba(${style.gradient.rgb},0)`
          ]}
          listening={false}
        />
      )}

      {/* Bordo sinistro d'accento */}
      <Rect x={G.CONTENT_LEFT} y={top} width={4} height={height} fill={style.accent} listening={false} />

      {/* Bordo inferiore */}
      <Line points={[G.CONTENT_LEFT, top + height, G.CONTENT_RIGHT, top + height]} stroke={bottomBorder} strokeWidth={1} listening={false} />

      {/* Posizione */}
      <Text
        x={cellX(col.POS)}
        y={top}
        width={col.POS.w}
        height={height}
        text={String(row.pos)}
        fontFamily={OSWALD}
        fontStyle="600"
        fontSize={posSize}
        fill={style.posColor}
        align="left"
        verticalAlign="middle"
      />

      {/* Logo squadra (OFI: cerchio bianco dietro) */}
      {row.logo && row.logo.includes('ofi') && (
        <Circle x={cellX(col.LOGO) + col.LOGO.w / 2} y={center} radius={G.LOGO_SIZE / 2} fill="rgba(255,255,255,0.92)" listening={false} />
      )}
      {logoImage && (
        <KonvaImage
          image={logoImage}
          x={cellX(col.LOGO) + (col.LOGO.w - G.LOGO_SIZE) / 2}
          y={center - G.LOGO_SIZE / 2}
          width={G.LOGO_SIZE}
          height={G.LOGO_SIZE}
          onClick={() => onTeamClick(row.id)}
          onTap={() => onTeamClick(row.id)}
        />
      )}

      {/* Nome squadra */}
      <Text
        x={cellX(col.NAME)}
        y={top}
        width={nameW}
        height={height}
        text={nameText}
        fontFamily={OSWALD}
        fontStyle={nameWeight}
        fontSize={nameSize}
        letterSpacing={nameLS}
        fill="#ffffff"
        align="left"
        verticalAlign="middle"
        wrap="none"
        ellipsis
        onClick={() => onTeamClick(row.id)}
        onTap={() => onTeamClick(row.id)}
      />
      {badge}

      {/* Statistiche */}
      {stat('p', col.P, statColor)}
      {stat('w', col.W, statColor)}
      {stat('d', col.N, statColor)}
      {stat('l', col.L, statColor)}
      {stat('gd', col.GD, drColor)}

      {/* Punti */}
      <Text
        x={cellX(col.PTS)}
        y={top}
        width={col.PTS.w}
        height={height}
        text={String(row.pts)}
        fontFamily={OSWALD}
        fontStyle="600"
        fontSize={ptsSize}
        fill={style.ptColor}
        align="right"
        verticalAlign="middle"
        onClick={() => onValueClick(row.id, 'pts')}
        onTap={() => onValueClick(row.id, 'pts')}
      />
    </Group>
  );
};

const DatiClassifica = ({ variant, rows = [], onTeamClick, onValueClick }) => {
  if (!variant) return null;
  const n = rows.length;
  const col = G.COLS;

  // Layout verticale ancorato al fondo (margin-top:auto dei mockup)
  const rowsHeight = G.ROW_FIRST_H + G.ROW_H * (n - 1);
  const rowsBottom = G.CONTENT_BOTTOM - G.LEGEND_H - G.LEGEND_GAP;
  const rowsTop = rowsBottom - rowsHeight;
  const sepTop = rowsTop - G.SEPARATOR_H;
  const headerTextH = 16;
  const headerTextTop = sepTop - 12 - headerTextH;
  const hasTitle = !!variant.title;
  const titleTextH = 20;
  const titleTop = headerTextTop - 18 - titleTextH;

  // Y (top) di ogni riga
  const rowTops = [];
  let y = rowsTop;
  for (let i = 0; i < n; i++) {
    rowTops.push(y);
    y += i === 0 ? G.ROW_FIRST_H : G.ROW_H;
  }

  const cellX = (c) => BASE + c.x;

  const headerLabel = (text, c, align) => (
    <Text
      key={text + c.x}
      x={cellX(c)}
      y={headerTextTop}
      width={c.w}
      height={headerTextH}
      text={text}
      fontFamily={MONO}
      fontSize={13}
      letterSpacing={2.34}
      fill="rgba(255,255,255,0.5)"
      align={align}
      verticalAlign="middle"
    />
  );

  // Legenda
  const legendTop = rowsBottom + G.LEGEND_GAP;
  const legendCenter = legendTop + G.LEGEND_H / 2;
  const legendNodes = [];
  let lx = G.CONTENT_LEFT;
  variant.legend.forEach((item, i) => {
    legendNodes.push(
      <Rect key={`ld${i}`} x={lx} y={legendCenter - 7} width={14} height={14} fill={item.color} listening={false} />
    );
    const labelText = item.label.toUpperCase();
    legendNodes.push(
      <Text
        key={`ll${i}`}
        x={lx + 24}
        y={legendCenter - 9}
        height={18}
        text={labelText}
        fontFamily={MONO}
        fontSize={14}
        letterSpacing={1.96}
        fill="rgba(255,255,255,0.72)"
        verticalAlign="middle"
      />
    );
    const labelW = measureWidth(labelText, '400', 14, 'IBM Plex Mono', 1.96);
    lx += 24 + labelW + 34; // gap tra voci
  });

  return (
    <Group>
      {/* Titolo (Gruppo scudetto/Europa/retrocessione) */}
      {hasTitle && (
        <Text
          x={G.CONTENT_LEFT}
          y={titleTop}
          height={titleTextH}
          text={variant.title.toUpperCase()}
          fontFamily={MONO}
          fontSize={15}
          letterSpacing={4.2}
          fill={variant.titleColor}
          verticalAlign="middle"
        />
      )}

      {/* Intestazione colonne */}
      {headerLabel('POS', col.POS, 'left')}
      {headerLabel('SQUADRA', col.NAME, 'left')}
      {headerLabel('PG', col.P, 'center')}
      {headerLabel('V', col.W, 'center')}
      {headerLabel('N', col.N, 'center')}
      {headerLabel('P', col.L, 'center')}
      {headerLabel('DR', col.GD, 'center')}
      {headerLabel('PT', col.PTS, 'right')}

      {/* Separatore */}
      <Rect x={G.CONTENT_LEFT} y={sepTop} width={G.CONTENT_RIGHT - G.CONTENT_LEFT} height={G.SEPARATOR_H} fill="rgba(255,255,255,0.85)" listening={false} />

      {/* Righe */}
      {rows.map((row, i) => (
        <ClassificaRow
          key={row.id ?? i}
          row={{ ...row, id: row.id ?? i }}
          style={variant.styles[i] || variant.styles[variant.styles.length - 1]}
          top={rowTops[i]}
          height={i === 0 ? G.ROW_FIRST_H : G.ROW_H}
          isFirst={i === 0}
          onTeamClick={onTeamClick}
          onValueClick={onValueClick}
        />
      ))}

      {/* Legenda */}
      {legendNodes}
      <Text
        x={G.CONTENT_LEFT}
        y={legendCenter - 8}
        width={G.CONTENT_RIGHT - G.CONTENT_LEFT}
        height={16}
        text={variant.note.toUpperCase()}
        fontFamily={MONO}
        fontSize={13}
        letterSpacing={2.08}
        fill="rgba(255,255,255,0.4)"
        align="right"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
};

export default DatiClassifica;

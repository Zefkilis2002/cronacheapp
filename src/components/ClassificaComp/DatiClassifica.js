import React from 'react';
import { Group, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { findTeamLogo } from '../../utils/LogoConstants';

export const TEAMS_LIST = [
    'AEK Atene',
    'Olympiakos',
    'PAOK',
    'Panathinaikos',
    'Aris Salonicco',
    'Levadiakos',
    'Volos',
    'OFI Creta',
    'Atromitos',
    'Kifisia',
    'AEL Larissa',
    'Panetolikos',
    'Asteras Tripolis',
    'Panserraikos',
    'Lamia',
    'Athens Kallithea'
];



export const INITIAL_ROWS = Array(7).fill(null).map((_, i) => ({
    id: i,
    teamIndex: i % TEAMS_LIST.length,
    p: '0',
    w: '0',
    d: '0',
    l: '0',
    gd: '+0',
    pts: '0'
}));

// Helper to map scraped names to internal names
export const normalizeTeamName = (scrapedName) => {
    const map = {
        'AEK': 'AEK Atene',
        'AEK Athens FC': 'AEK Atene',
        'Olympiacos Piraeus': 'Olympiakos',
        'Olympiacos': 'Olympiakos',
        'Olympiakos': 'Olympiakos',
        'PAOK': 'PAOK',
        'Panathinaikos': 'Panathinaikos',
        'Aris': 'Aris Salonicco',
        'Aris Thessaloniki': 'Aris Salonicco',
        'Volos NFC': 'Volos',
        'Volos': 'Volos',
        'Levadiakos': 'Levadiakos',
        'OFI Crete': 'OFI Creta',
        'OFI': 'OFI Creta',
        'Atromitos': 'Atromitos',
        'Kifisia': 'Kifisia',
        'AEL Larissa': 'AEL Larissa',
        'Panetolikos': 'Panetolikos',
        'Asteras Tripolis': 'Asteras Tripolis',
        'Asteras T.': 'Asteras Tripolis',
        'Panserraikos': 'Panserraikos',
        'Lamia': 'Lamia',
        'Athens Kallithea': 'Athens Kallithea',
        'Kallithea': 'Athens Kallithea',
        'Athens Kallithea FC': 'Athens Kallithea'
    };
    return map[scrapedName] || scrapedName;
};

// Font styling
const FONT_SPECS = {
    TEAM_NAME: { family: 'Pretendard-ExtraBold', size: 70 },
    STATS: { family: 'Poppins-Medium', size: 68 },
    PTS: { family: 'Poppins-ExtraBold', size: 68 }
};

// Sub-component for individual rows to handle image hooks
const ClassificaRow = ({ row, y, onTeamClick, onValueClick, colX }) => {
    const teamName = TEAMS_LIST[row.teamIndex];
    const logoPath = findTeamLogo(teamName);
    const [logoImage] = useImage(logoPath || undefined);

    // Logo settings
    const LOGO_SIZE = 90;
    const LOGO_X = colX.TEAM_NAME - LOGO_SIZE - 45; // 20px padding
    const LOGO_OFFSET_Y = LOGO_SIZE / 2;

    return (
        <Group>
            {/* Logo */}
            {logoImage && (
                <KonvaImage
                    image={logoImage}
                    x={LOGO_X}
                    y={y}
                    width={LOGO_SIZE}
                    height={LOGO_SIZE}
                    offsetY={LOGO_OFFSET_Y}
                />
            )}

            {/* Team Name - Left Aligned */}
            <Text
                x={colX.TEAM_NAME}
                y={y}
                text={teamName}
                fontFamily={FONT_SPECS.TEAM_NAME.family}
                fontSize={FONT_SPECS.TEAM_NAME.size}
                fill="white"
                align="left"
                verticalAlign="middle"
                onClick={() => onTeamClick(row.id)}
                onTap={() => onTeamClick(row.id)}
                offsetY={FONT_SPECS.TEAM_NAME.size / 2}
            />

            {/* P (Played) */}
            <Text
                x={colX.P}
                y={y}
                text={row.p}
                fontFamily={FONT_SPECS.STATS.family}
                fontSize={FONT_SPECS.STATS.size}
                fill="white"
                align="center"
                width={200}
                offsetX={100}
                verticalAlign="middle"
                offsetY={FONT_SPECS.STATS.size / 2}
                onClick={() => onValueClick(row.id, 'p')}
                onTap={() => onValueClick(row.id, 'p')}
            />

            {/* W (Won) */}
            <Text
                x={colX.W}
                y={y}
                text={row.w}
                fontFamily={FONT_SPECS.STATS.family}
                fontSize={FONT_SPECS.STATS.size}
                fill="white"
                align="center"
                width={200}
                offsetX={100}
                verticalAlign="middle"
                offsetY={FONT_SPECS.STATS.size / 2}
                onClick={() => onValueClick(row.id, 'w')}
                onTap={() => onValueClick(row.id, 'w')}
            />

            {/* D (Drawn) */}
            <Text
                x={colX.D}
                y={y}
                text={row.d}
                fontFamily={FONT_SPECS.STATS.family}
                fontSize={FONT_SPECS.STATS.size}
                fill="white"
                align="center"
                width={200}
                offsetX={100}
                verticalAlign="middle"
                offsetY={FONT_SPECS.STATS.size / 2}
                onClick={() => onValueClick(row.id, 'd')}
                onTap={() => onValueClick(row.id, 'd')}
            />

            {/* L (Lost) */}
            <Text
                x={colX.L}
                y={y}
                text={row.l}
                fontFamily={FONT_SPECS.STATS.family}
                fontSize={FONT_SPECS.STATS.size}
                fill="white"
                align="center"
                width={200}
                offsetX={100}
                verticalAlign="middle"
                offsetY={FONT_SPECS.STATS.size / 2}
                onClick={() => onValueClick(row.id, 'l')}
                onTap={() => onValueClick(row.id, 'l')}
            />

            {/* GD (Goal Difference) */}
            <Text
                x={colX.GD}
                y={y}
                text={row.gd}
                fontFamily={FONT_SPECS.STATS.family}
                fontSize={FONT_SPECS.STATS.size}
                fill="white"
                align="center"
                width={200}
                offsetX={100}
                verticalAlign="middle"
                offsetY={FONT_SPECS.STATS.size / 2}
                onClick={() => onValueClick(row.id, 'gd')}
                onTap={() => onValueClick(row.id, 'gd')}
            />

            {/* PTS (Points) */}
            <Text
                x={colX.PTS}
                y={y}
                text={row.pts}
                fontFamily={FONT_SPECS.PTS.family}
                fontSize={FONT_SPECS.PTS.size}
                fill="white"
                align="center"
                width={200}
                offsetX={100}
                verticalAlign="middle"
                offsetY={FONT_SPECS.PTS.size / 2}
                onClick={() => onValueClick(row.id, 'pts')}
                onTap={() => onValueClick(row.id, 'pts')}
            />
        </Group>
    );
};

const DatiClassifica = ({ rows = INITIAL_ROWS, onTeamClick, onValueClick }) => {
    // Specific Y positions for each of the 7 rows
    const ROW_Y = [1460, 1605, 1741, 1886, 2026, 2165, 2310];

    // Specific X positions
    const COL_X = {
        TEAM_NAME: 476,
        P: 1090,
        W: 1220,
        D: 1334,
        L: 1458,
        GD: 1595,
        PTS: 1746
    };

    return (
        <Group>
            {rows.map((row, i) => (
                <ClassificaRow
                    key={row.id}
                    row={row}
                    y={ROW_Y[i]}
                    onTeamClick={onTeamClick}
                    onValueClick={onValueClick}
                    colX={COL_X}
                />
            ))}
        </Group>
    );
};

export default DatiClassifica;

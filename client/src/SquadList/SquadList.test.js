import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as htmlToImage from 'html-to-image';
import SquadList from './SquadList';
import { saveImage } from '../utils/saveImage';

jest.mock('../config', () => ({ API_BASE_URL: 'https://api.example.test' }));
jest.mock('../utils/usePosterScale', () => ({ usePosterScale: () => [null, 0.6] }));
jest.mock('html-to-image', () => ({ toJpeg: jest.fn(), getFontEmbedCSS: jest.fn() }));
jest.mock('../utils/saveImage', () => ({ saveImage: jest.fn() }));

const uploadSquad = async (sections) => {
    const file = new File([JSON.stringify({ sections })], 'squad.json', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText(/Importa JSON/), { target: { files: [file] } });
    await screen.findByText(/Grafica compilata dal JSON/);
};

const posterLogos = (container) => Array.from(container.querySelectorAll('.sqp-row-logo img'))
    .map(img => img.getAttribute('src'));

const readJsonBlob = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(JSON.parse(reader.result));
    reader.onerror = reject;
    reader.readAsText(blob);
});

beforeEach(() => {
    htmlToImage.toJpeg.mockReset().mockResolvedValue('data:image/jpeg;base64,export');
    htmlToImage.getFontEmbedCSS.mockReset().mockResolvedValue('/* embedded fonts */');
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } });
});

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

test('imports a separate club logo per player with legacy and alternate JSON fields', async () => {
    const { container } = render(<StrictMode><SquadList /></StrictMode>);
    const embeddedLogo = 'data:image/png;base64,aGVsbG8=';
    await uploadSquad({
        portieri: [{ name: 'Primo', logo: ' /loghi/SuperLeague/paok.png ' }],
        defenders: [{ name: 'Secondo', logo: '', teamLogo: 'https://r2.thesportsdb.com/badge?id=1' }],
        mid: [{ name: 'Terzo', logoUrl: 'https://r2.thesportsdb.com/badge?id=2' }],
        att: [
            { name: 'Quarto', teamLogoUrl: embeddedLogo },
            { name: 'Quinto', team_logo: '/loghi/SuperLeague/aek.png' },
            { name: 'Sesto', logo_url: '/loghi/SuperLeague/aris.png' },
            { name: 'Settimo', team_logo_url: '/loghi/SuperLeague/volos.png' },
            'Senza logo',
            { name: 'Logo non valido', logo: 42 },
            { name: 'Logo personalizzato', logo: 'https://custom.example.test/logo.png' }
        ]
    });

    expect(screen.getByText('Grafica compilata dal JSON (10 giocatori).')).toBeInTheDocument();
    expect(posterLogos(container)).toEqual([
        '/loghi/SuperLeague/paok.png',
        `https://api.example.test/proxy-image?url=${encodeURIComponent('https://r2.thesportsdb.com/badge?id=1')}`,
        `https://api.example.test/proxy-image?url=${encodeURIComponent('https://r2.thesportsdb.com/badge?id=2')}`,
        embeddedLogo,
        '/loghi/SuperLeague/aek.png',
        '/loghi/SuperLeague/aris.png',
        '/loghi/SuperLeague/volos.png',
        'https://custom.example.test/logo.png'
    ]);
    expect(container.querySelectorAll('.sqp-row')).toHaveLength(10);
});

test('the downloadable template includes editable logo fields and preserves logos on reimport', async () => {
    const { container } = render(<SquadList />);
    await uploadSquad({
        gk: [{ name: 'Primo', logo: '/loghi/SuperLeague/paok.png' }],
        def: ['Secondo'], mid: [], att: []
    });
    const before = posterLogos(container);
    let downloadedBlob;
    const originalCreate = URL.createObjectURL;
    URL.createObjectURL = jest.fn(blob => { downloadedBlob = blob; return 'blob:squad-template'; });
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    // Avoid leaving the download URL cleanup timer running after the test.
    const cleanupTimer = jest.spyOn(global, 'setTimeout').mockImplementation(() => 0);
    try {
        fireEvent.click(screen.getByRole('button', { name: /Scarica template/ }));
        cleanupTimer.mockRestore();
        const exported = await readJsonBlob(downloadedBlob);
        expect(exported.sections.gk[0].logo).toBe('/loghi/SuperLeague/paok.png');
        expect(exported.sections.def[0].logo).toBe('');
        await uploadSquad({ gk: [], def: [], mid: [], att: [] });
        await waitFor(() => expect(posterLogos(container)).toEqual([]));
        await uploadSquad(exported.sections);
        await waitFor(() => expect(posterLogos(container)).toEqual(before));
    } finally {
        URL.createObjectURL = originalCreate;
    }
});

test('image export keeps distinct proxy URLs for each player logo', async () => {
    render(<SquadList />);
    await uploadSquad({
        gk: [{ name: 'Primo', logo: 'https://r2.thesportsdb.com/badge?id=1' }],
        def: [{ name: 'Secondo', logo: 'https://r2.thesportsdb.com/badge?id=2' }],
        mid: [], att: []
    });
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } });
    htmlToImage.toJpeg.mockResolvedValue('data:image/jpeg;base64,export');
    fireEvent.click(screen.getAllByRole('button', { name: 'Download' })[0]);
    await waitFor(() => expect(saveImage).toHaveBeenCalled());
    expect(htmlToImage.toJpeg).toHaveBeenCalledWith(
        document.getElementById('squadExportContainer'),
        expect.objectContaining({ includeQueryParams: true, fontEmbedCSS: '/* embedded fonts */' })
    );
    expect(htmlToImage.getFontEmbedCSS).toHaveBeenCalledTimes(1);
});

test('shows preparation until the file is saved and prevents duplicate exports', async () => {
    render(<SquadList />);
    let finishSave;
    saveImage.mockImplementationOnce(() => new Promise(resolve => { finishSave = resolve; }));
    const buttons = screen.getAllByRole('button', { name: 'Download' });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(screen.getAllByRole('button', { name: 'Preparazione…' })).toHaveLength(2);
    buttons.forEach(button => expect(button).toBeDisabled());
    await waitFor(() => expect(saveImage).toHaveBeenCalledTimes(1));
    expect(htmlToImage.getFontEmbedCSS).toHaveBeenCalledTimes(1);
    expect(htmlToImage.toJpeg).toHaveBeenCalledTimes(3);
    await act(async () => finishSave());
    expect(screen.getAllByRole('button', { name: 'Download' })[0]).toBeEnabled();
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('download avviato');
});

test('reports an export failure and allows retrying the download', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    htmlToImage.toJpeg.mockRejectedValueOnce(new Error('Logo non disponibile'));
    render(<SquadList />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Download' })[0]);
    expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent('Logo non disponibile');
    expect(saveImage).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Download' })[0]);
    await waitFor(() => expect(saveImage).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('an image that cannot be exported identifies the player instead of failing silently', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    htmlToImage.toJpeg.mockImplementationOnce(async (node, options) => {
        options.onImageErrorHandler({ target: { alt: 'logo squadra di PRIMO CALCIATORE' } });
    });
    render(<SquadList />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Download' })[0]);
    expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent("Impossibile includere logo squadra di PRIMO CALCIATORE. Carica l'immagine dal computer");
    expect(saveImage).not.toHaveBeenCalled();
});

test('a stalled font load times out and unlocks the download button', async () => {
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: new Promise(() => {}) } });
    render(<SquadList />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Download' })[0]);
    await act(async () => { jest.advanceTimersByTime(30000); });
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('troppo tempo');
    expect(screen.getAllByRole('button', { name: 'Download' })[0]).toBeEnabled();
    expect(saveImage).not.toHaveBeenCalled();
});

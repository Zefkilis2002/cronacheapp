import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import FlashscoreImport from './FlashscoreImport';
import { requestJson } from '../../../utils/apiClient';

jest.mock('../../../utils/apiClient', () => ({
  ...jest.requireActual('../../../utils/apiClient'), requestJson: jest.fn(),
}));

const matches = [
  { matchId: 'AbCd1234', homeTeam: 'Roma', awayTeam: 'Lazio', homeScore: '2', awayScore: '1', homeLogo: 'https://static.flashscore.com/roma.png', awayLogo: 'https://static.flashscore.com/lazio.png' },
  { matchId: 'EfGh5678', homeTeam: 'Milan', awayTeam: 'Inter', homeScore: '0', awayScore: '0', homeLogo: 'https://static.flashscore.com/milan.png', awayLogo: 'https://static.flashscore.com/inter.png' },
];
function Harness({ onMatchSelect }) {
  const [data, setData] = useState({ matches, selectedComp: 0, selectedMatchId: null });
  return <FlashscoreImport onMatchSelect={onMatchSelect} flashscoreData={data} setFlashscoreData={setData} />;
}
test('imports feed badges immediately and discards details of an older selection', async () => {
  const callbacks = {};
  requestJson.mockImplementation(path => new Promise(resolve => { callbacks[path] = resolve; }));
  const selected = jest.fn();
  render(<Harness onMatchSelect={selected} />);
  fireEvent.click(screen.getByText('Roma'));
  expect(selected.mock.calls[0][0].homeLogo).toContain('proxy-image?url=');
  fireEvent.click(screen.getByText('Milan'));
  await act(async () => {
    callbacks['/api/get-match-details?matchId=EfGh5678']({ homeGoals: ['NEW'], awayGoals: [] });
  });
  await waitFor(() => expect(selected).toHaveBeenLastCalledWith({ homeScorers: ['NEW'], awayScorers: [] }));
  await act(async () => {
    callbacks['/api/get-match-details?matchId=AbCd1234']({ homeGoals: ['OLD'], awayGoals: [] });
  });
  expect(selected).toHaveBeenCalledTimes(3);
});

test('changing competition removes matches from the old competition', () => {
  render(<Harness onMatchSelect={jest.fn()} />);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
  expect(screen.queryByText('Roma')).not.toBeInTheDocument();
});

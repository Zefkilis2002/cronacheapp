import { act, renderHook } from '@testing-library/react';
import { useFullTimeState } from './useFullTimeState';
test('importing a new match clears previous badges if none are available', () => {
  const { result } = renderHook(() => useFullTimeState());
  act(() => result.current.setUploadedLogo1('data:image/png;base64,previous'));
  act(() => result.current.handleFlashscoreMatch({ homeLogo: null, awayLogo: null, homeScore: 1, awayScore: 0 }));
  expect([result.current.uploadedLogo1, result.current.selectedLogo1, result.current.selectedLogo2]).toEqual([null, '', '']);
});
test('late scorers do not reset manually edited scores or badges', () => {
  const { result } = renderHook(() => useFullTimeState());
  act(() => result.current.handleFlashscoreMatch({ homeScore: 2, awayScore: 1, homeLogo: '/loghi/roma.png' }));
  act(() => result.current.setScore1(3));
  act(() => result.current.handleFlashscoreMatch({ homeScorers: ['Dybala 10’'] }));
  expect([result.current.score1, result.current.score2, result.current.selectedLogo1, result.current.scorersTeam1[0]]).toEqual([3, 1, '/loghi/roma.png', 'Dybala 10’']);
});

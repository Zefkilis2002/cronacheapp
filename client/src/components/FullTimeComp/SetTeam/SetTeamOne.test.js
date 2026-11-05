import { fireEvent, render, screen } from '@testing-library/react';
import SetTeamOne from './SetTeamOne';
test('choosing a catalog logo removes the previously uploaded logo', () => {
  const setUploaded = jest.fn();
  const setSelected = jest.fn();
  render(<SetTeamOne logos={['/loghi/one.png', '/loghi/two.png']} selectedLogo1="/loghi/one.png" setSelectedLogo1={setSelected} setUploadedLogo1={setUploaded} scorersTeam1={[]} setScorersTeam1={jest.fn()} />);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '/loghi/two.png' } });
  expect(setUploaded).toHaveBeenCalledWith(null);
  expect(setSelected).toHaveBeenCalledWith('/loghi/two.png');
});

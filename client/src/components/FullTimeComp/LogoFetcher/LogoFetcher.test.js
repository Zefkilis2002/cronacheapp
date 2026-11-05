import { act, fireEvent, render, screen } from '@testing-library/react';
import LogoFetcher from './LogoFetcher';
import { searchLogos } from '../../../utils/logoSearch';
jest.mock('../../../utils/serverWarmup', () => ({ pingServer: jest.fn() }));
jest.mock('../../../utils/logoSearch', () => ({ searchLogos: jest.fn(), getCachedLogoSearch: () => null }));

beforeEach(() => { jest.useFakeTimers(); searchLogos.mockReset(); });
afterEach(() => { jest.useRealTimers(); });

test('local results appear immediately while remote typing is debounced', async () => {
  searchLogos.mockResolvedValue({ status: true, results: [] });
  render(<LogoFetcher onClose={jest.fn()} onLogoSelect={jest.fn()} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'paok' } });
  expect(screen.getByText('PAOK')).toBeInTheDocument();
  expect(searchLogos).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'roma' } });
  await act(async () => { jest.advanceTimersByTime(220); });
  expect(searchLogos).toHaveBeenCalledTimes(1);
  expect(searchLogos.mock.calls[0][0]).toBe('roma');
});
test('older search responses cannot overwrite the latest results', async () => {
  const finish = {};
  searchLogos.mockImplementation(query => new Promise(resolve => { finish[query] = resolve; }));
  render(<LogoFetcher onClose={jest.fn()} onLogoSelect={jest.fn()} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'roma' } });
  act(() => { jest.advanceTimersByTime(220); });
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'milan' } });
  act(() => { jest.advanceTimersByTime(220); });
  await act(async () => finish.milan({ status: true, results: [{ name: 'Milan', logoUrl: '/loghi/milan.png' }] }));
  await act(async () => finish.roma({ status: true, results: [{ name: 'Roma', logoUrl: '/loghi/roma.png' }] }));
  expect(screen.getByText('Milan')).toBeInTheDocument();
  expect(screen.queryByText('Roma')).not.toBeInTheDocument();
});

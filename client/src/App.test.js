import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./FullTimeEditor/FullTimeEditor', () => () => <h1>Full Time test editor</h1>);
jest.mock('./utils/serverWarmup', () => ({ startServerKeepAlive: () => () => {} }));

test('the home route opens the Full Time editor', async () => {
  render(<MemoryRouter><App /></MemoryRouter>);
  expect(await screen.findByRole('heading', { name: 'Full Time test editor' })).toBeInTheDocument();
});

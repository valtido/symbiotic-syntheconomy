// File: frontend/src/tests/RitualRetry.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RitualRetry } from '../components/RitualRetry';

describe('RitualRetry', () => {
  it('shows success after clicking retry', async () => {
    const mockRetry = jest.fn().mockResolvedValue(undefined);
    render(<RitualRetry onRetry={mockRetry} />);

    const button = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeTruthy();
    });
  });

  it('shows error on retry failure', async () => {
    const mockRetry = jest.fn().mockRejectedValue(new Error('fail'));
    render(<RitualRetry onRetry={mockRetry} />);

    const button = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeTruthy();
    });
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salvar</Button>);

    await user.click(screen.getByRole('button', { name: /salvar/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>,
    );

    const btn = screen.getByRole('button', { name: /salvar/i });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(0);
  });
});


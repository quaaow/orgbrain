import { render, screen, fireEvent } from '@testing-library/react';
import { Badge, Button, Card } from './ui';

describe('UI primitives', () => {
  it('renders a Card with its children', () => {
    render(<Card>hello card</Card>);
    expect(screen.getByText('hello card')).toBeInTheDocument();
  });

  it('renders a Button and fires onClick', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} disabled>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a Badge with its label', () => {
    render(<Badge tone="success">active</Badge>);
    expect(screen.getByText('active')).toBeInTheDocument();
  });
});

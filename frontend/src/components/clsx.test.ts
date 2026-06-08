import { clsx } from './clsx';

describe('clsx', () => {
  it('joins truthy class names with a space', () => {
    expect(clsx('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(clsx('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(clsx(false, null, undefined)).toBe('');
  });

  it('supports conditional classes', () => {
    const active = true;
    const disabled = false;
    expect(clsx('base', active && 'active', disabled && 'disabled')).toBe(
      'base active',
    );
  });
});

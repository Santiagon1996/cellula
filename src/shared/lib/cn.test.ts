import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('combines valid class names', () => {
    expect(cn('base', 'active')).toBe('base active');
  });

  it('ignores falsy class names', () => {
    expect(cn('base', false, null, undefined, 'active')).toBe('base active');
  });
});

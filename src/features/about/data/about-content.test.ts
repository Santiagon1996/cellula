import { describe, expect, it } from 'vitest';
import { aboutConcepts, aboutCopy } from './about-content';

describe('about editorial content', () => {
  it('provides three unique concepts in the order used by the initial experience', () => {
    expect(aboutConcepts.map(({ id, label, number }) => ({ id, label, number }))).toEqual([
      { id: 'crear', label: 'CREAR', number: '01' },
      { id: 'explorar', label: 'EXPLORAR', number: '02' },
      { id: 'conectar', label: 'CONECTAR', number: '03' },
    ]);
    expect(new Set(aboutConcepts.map(({ id }) => id)).size).toBe(aboutConcepts.length);
  });

  it('gives every selectable concept its own title and description', () => {
    expect(new Set(aboutConcepts.map(({ title }) => title)).size).toBe(aboutConcepts.length);
    expect(new Set(aboutConcepts.map(({ description }) => description)).size).toBe(aboutConcepts.length);
    for (const concept of aboutConcepts) {
      expect(concept.title.trim().length).toBeGreaterThan(0);
      expect(concept.description.trim().length).toBeGreaterThan(0);
    }
  });

  it('preserves the introduction and marks the proposed editorial copy for approval', () => {
    expect(aboutCopy.question).toBe('¿QUÉ ES CÉLULA?');
    expect(aboutCopy.declaration).toBe('NO SOMOS UNA SOLA COSA.');
    expect(aboutCopy.introduction).toBe('Un espacio para la creación, el arte y la experimentación.');
    expect(aboutCopy.finale).toBe('LAS IDEAS CAMBIAN CUANDO SE ENCUENTRAN.');
    expect(aboutCopy.pendingNotice).toBe('COPY PENDIENTE DE APROBACIÓN');
  });
});

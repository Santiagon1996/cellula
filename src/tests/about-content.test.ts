import { describe, expect, it } from 'vitest';
import { aboutConcepts, aboutContentProvenance, aboutCopy, aboutMaterial, aboutValues } from '@/features/about/data/about-content';

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

  it('preserves the requested web narrative without labeling it a literal brandbook quotation', () => {
    expect(aboutCopy.question).toBe('¿QUÉ ES CÈL·LULA?');
    expect(aboutCopy.declaration).toBe('NO SOMOS UNA SOLA COSA.');
    expect(aboutCopy.introduction).toBe('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');
    expect(aboutCopy.systemTitle).toBe('UN SISTEMA VIVO.');
    expect(aboutCopy.finale).toBe('LAS IDEAS CAMBIAN CUANDO SE ENCUENTRAN.');
    expect(aboutCopy.finaleLines.join(' ')).toBe(aboutCopy.finale);
    expect(aboutCopy.finaleSupport).toBe('Un espacio donde el proceso es visible, la creación se comparte y las formas permanecen abiertas.');
    expect(aboutContentProvenance.webNarrative.classification).toBe('editorial-adaptation');
    expect(aboutContentProvenance.webNarrative.approval).toBe('pending-editorial-validation');
    expect(aboutContentProvenance.finaleSupport.approval).toBe('pending-editorial-validation');
  });

  it('includes the six official values separately from the three interactive concepts', () => {
    expect(aboutValues).toEqual([
      'Experimentación', 'Transparencia', 'Evolución', 'Comunidad', 'Curaduría', 'Autenticidad',
    ]);
    expect(aboutContentProvenance.officialValues).toEqual({ classification: 'official', page: 7 });
  });

  it('associates each official value once using the explicitly proposed web grouping', () => {
    expect(aboutConcepts.map(({ id, values }) => ({ id, values }))).toEqual([
      { id: 'crear', values: ['Experimentación', 'Autenticidad'] },
      { id: 'explorar', values: ['Transparencia', 'Evolución'] },
      { id: 'conectar', values: ['Comunidad', 'Curaduría'] },
    ]);
    const grouped = aboutConcepts.flatMap<string>(concept => concept.values);
    expect(new Set(grouped).size).toBe(aboutValues.length);
    expect([...grouped].sort()).toEqual([...aboutValues].sort());
    expect(aboutContentProvenance.valueGrouping.classification).toBe('editorial-proposal');
    expect(aboutContentProvenance.valueGrouping.approval).toBe('pending-editorial-validation');
  });

  it('reserves three materiality slots without inventing original photographs or image dimensions', () => {
    expect(aboutMaterial.images).toHaveLength(3);
    expect(new Set(aboutMaterial.images.map(image => image.id)).size).toBe(3);
    expect(aboutMaterial.images.map(image => image.category)).toEqual(['bodies', 'matter', 'process']);
    for (const image of aboutMaterial.images) {
      expect(image.status).toBe('pending-original');
      expect(image.src).toBeNull();
      expect(image.alt).toBe('');
      expect(image.caption).toBeNull();
      expect(image.width).toBe(0);
      expect(image.height).toBe(0);
      expect(image.sourceReference).toBe(aboutContentProvenance.photography.source);
    }
    expect(aboutContentProvenance.photography.status).toBe('awaiting-designer-originals');
  });
});

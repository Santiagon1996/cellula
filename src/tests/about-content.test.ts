import { describe, expect, it } from 'vitest';
import { aboutConcepts, aboutContentProvenance, aboutCopy, aboutIntroductionParagraphs, aboutMaterial, aboutValues } from '@/features/about/data/about-content';

describe('about editorial content', () => {
  it('preserves the complete approved introduction as four paragraphs and an independent closing', () => {
    expect(aboutIntroductionParagraphs).toEqual([
      'Nace de la experiencia de transitar distintos ámbitos académicos/creativos- la arquitectura, el tatuaje y las artes visuales- y detectar así necesidades intrínsecas a ellos.',
      'Desde las artes visuales; la materialidad y la relación directa con el público forman parte natural del hacer.',
      'Desde la arquitectura, aparece una mirada estructural: la necesidad de pensar cómo se organizan los espacios, cómo se integran las partes y cómo una lógica clara puede sostener un sistema en el tiempo.',
      'Con el tiempo, se hace evidente que esa integración no sucede de manera aislada. Requiere una estructura que permita articular distintas prácticas sin diluirlas, y una dirección que dé coherencia al conjunto.',
      'CÈL·LULA surge como la búsqueda de ese equilibrio.',
    ]);
    expect(aboutIntroductionParagraphs.join(' ')).toBe(aboutCopy.introduction);
  });
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
    expect(aboutCopy.introduction).toMatch(/^Nace de la experiencia de transitar distintos ámbitos/);
    expect(aboutCopy.introduction.split('CÈL·LULA surge como la búsqueda de ese equilibrio.')).toHaveLength(2);
    expect(aboutCopy.introduction).not.toMatch(/Lorem ipsum/);
    expect(aboutCopy.definitionTitle).toBe('¿QUÉ ES CÈL·LULA?');
    expect(aboutCopy.decomposeDescription).toContain('la producción artística y la experimentación conviven. Un entorno vivo');
    expect(aboutCopy.connectDescription).toBe('Creemos en el valor del hacer, en la construcción colectiva y en una forma de crear que evoluciona constantemente junto a quienes la habitan.');
    expect(aboutContentProvenance.activeAboutCopy.approval).toBe('user-approved');
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

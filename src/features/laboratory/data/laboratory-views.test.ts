import { describe, expect, it } from 'vitest';
import { demoLaboratories } from './laboratories';
import { laboratoryViews } from './laboratory-views';

describe('Laboratory image views', () => {
  it('preserves the original project and image identities without inventing records', () => {
    const views = laboratoryViews(demoLaboratories);
    expect(views).toHaveLength(8);
    expect(new Set(views.map(view => view.key)).size).toBe(8);
    for (const view of views) {
      expect(demoLaboratories).toContain(view.laboratory);
      expect([view.laboratory.coverImage, ...view.laboratory.gallery]).toContain(view.image);
    }
  });
  it('does not mutate data and supports empty and cover-only collections', () => {
    const project = Object.freeze({ ...demoLaboratories[0], gallery: Object.freeze([]) });
    expect(laboratoryViews([])).toEqual([]);
    expect(laboratoryViews([project])).toEqual([{ key: `${project.id}:0`, laboratory: project, image: project.coverImage, number: 1 }]);
  });
});

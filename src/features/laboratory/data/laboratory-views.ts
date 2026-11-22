import type { Laboratory } from '../types';

export type LaboratoryView = {
  key: string;
  laboratory: Laboratory;
  image: Laboratory['coverImage'];
  number: number;
};
export type LaboratoryAxis = 'horizontal' | 'vertical';

/** Existing covers and gallery views, never invented projects or cloned DOM cards. */
export function laboratoryViews(laboratories: readonly Laboratory[]): LaboratoryView[] {
  return laboratories.flatMap(laboratory => [laboratory.coverImage, ...laboratory.gallery].map((image, index) => ({
    key: `${laboratory.id}:${index}`, laboratory, image, number: index + 1,
  })));
}

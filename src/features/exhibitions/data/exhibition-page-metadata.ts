import type { Metadata } from 'next';
import { exhibitionCopy } from './exhibition-copy';

export function getExhibitionPageMetadata(preview: boolean): Metadata {
  return {
    title: preview ? 'Exposiciones · CardSwap — CÈL·LULA' : 'Exposiciones — CÈL·LULA',
    description: exhibitionCopy.description,
    ...(preview ? { robots: { index: false, follow: false } } : {}),
  };
}

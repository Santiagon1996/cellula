export type LaboratoryImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Laboratory = {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  description: string;
  coverImage: LaboratoryImage;
  gallery: readonly LaboratoryImage[];
  year?: number;
  credits?: readonly string[];
  temporary?: boolean;
};

export type LaboratorySelection = {
  laboratory: Laboratory;
  source: HTMLElement;
  trigger: HTMLElement;
};

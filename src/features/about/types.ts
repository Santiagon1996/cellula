export type AboutConceptId = 'crear' | 'explorar' | 'conectar';

export type AboutValue =
  | 'Experimentación'
  | 'Transparencia'
  | 'Evolución'
  | 'Comunidad'
  | 'Curaduría'
  | 'Autenticidad';

export type AboutConcept = Readonly<{
  id: AboutConceptId;
  label: 'CREAR' | 'EXPLORAR' | 'CONECTAR';
  number: '01' | '02' | '03';
  title: string;
  description: string;
  /** Web editorial grouping; the brandbook does not group values by concept. */
  values: readonly AboutValue[];
}>;

export type AboutMaterialItem = Readonly<{
  id: string;
  category: 'bodies' | 'matter' | 'process';
  sourceReference: string;
} & (
  | { status: 'pending-original'; src: null; alt: ''; caption: null; width: 0; height: 0 }
  | { status: 'ready'; src: string; alt: string; caption: string | null; width: number; height: number }
)>;

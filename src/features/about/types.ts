export type AboutConceptId = 'crear' | 'explorar' | 'conectar';

export type AboutConcept = Readonly<{
  id: AboutConceptId;
  label: 'CREAR' | 'EXPLORAR' | 'CONECTAR';
  number: '01' | '02' | '03';
  title: string;
  description: string;
}>;

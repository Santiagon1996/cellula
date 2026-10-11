import { Container } from '@/shared/ui/container';

export function HomeIntro() {
  return (
    <section aria-labelledby="home-title" className="flex min-h-svh items-center py-24">
      <Container className="text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em]">Espacio creativo</p>
        <h1 id="home-title" className="text-6xl font-bold tracking-tight sm:text-8xl">CÉLULA</h1>
        <p className="mt-6 text-sm">Próximamente.</p>
      </Container>
    </section>
  );
}

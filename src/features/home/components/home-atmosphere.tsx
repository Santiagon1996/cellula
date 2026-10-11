/**
 * The provided hand is part of the original CÉLULA background composition.
 * Its layer remains static; moving translucent veils cover and reveal it.
 */
export function HomeAtmosphere() {
  return (
    <div aria-hidden="true" className="home-atmosphere">
      <div className="home-atmosphere__artwork" />
      <div className="home-atmosphere__veil home-atmosphere__veil--rose" />
      <div className="home-atmosphere__veil home-atmosphere__veil--aqua" />
      <div className="home-atmosphere__veil home-atmosphere__veil--milk" />
    </div>
  );
}

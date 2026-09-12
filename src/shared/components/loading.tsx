export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando"
    >
      <p>Carregando seu espaço…</p>
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}

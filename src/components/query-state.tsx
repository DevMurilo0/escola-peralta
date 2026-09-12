import Loading from "./loading";
export function QueryState({
  error,
  retry,
}: {
  error?: string;
  retry: () => void;
}) {
  return error ? (
    <section className="panel" role="alert">
      <h2>Não foi possível carregar</h2>
      <p>{error}</p>
      <button onClick={retry}>Tentar novamente</button>
    </section>
  ) : (
    <Loading />
  );
}

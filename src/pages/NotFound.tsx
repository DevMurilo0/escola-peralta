import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <main id="main" className="center-page">
      <h1>Página não encontrada</h1>
      <p>O endereço não existe ou você não tem acesso a este conteúdo.</p>
      <Link className="button" to="/">
        Voltar ao início
      </Link>
    </main>
  );
}

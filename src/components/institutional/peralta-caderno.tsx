import { useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { school } from "@/config/school-config";
import { Flower } from "./peralta-art";

const chapters = [
  {
    name: "Descobrir",
    title: "Descobrir é experimentar.",
    subtitle: "Mãos ocupadas. Olhos curiosos.",
    body: "Na rotina da Peralta, os momentos de descoberta ganham espaço. Um convite para observar, experimentar e aprender com o que acontece ao redor.",
    image: "/images/school/vivencia-03.webp",
    alt: "Criança da Escola Peralta explorando frutas durante uma atividade",
    detail: "/images/school/vivencia-04.webp",
    detailAlt: "Criança preparando seu lanche na Escola Peralta",
    theme: "coral",
  },
  {
    name: "Conviver",
    title: "Juntos é mais gostoso.",
    subtitle: "Histórias para guardar.",
    body: "Um encontro, uma conversa, uma brincadeira: a convivência faz parte de aprender. Fotografias reais da escola ajudam a contar essas histórias.",
    image: "/images/school/escola-cotidiano.webp",
    alt: "Estudantes da Escola Peralta participam juntas de uma atividade",
    detail: "/images/school/vivencia-02.webp",
    detailAlt: "Estudantes reunidas no espaço de convivência da escola",
    theme: "blue",
  },
  {
    name: "Brincar",
    title: "Espaço para ser criança.",
    subtitle: "A descoberta tem endereço.",
    body: "Os ambientes e as áreas de convivência também fazem parte da experiência escolar. Conhecer esses espaços de perto é um ótimo começo.",
    image: "/images/school/estrutura-patio.webp",
    alt: "Estudante no pátio da Escola Peralta, com brinquedos ao fundo",
    detail: "/images/school/estrutura-convivencia.webp",
    detailAlt: "Estudante no espaço de convivência da Escola Peralta",
    theme: "green",
  },
] as const;

export function PeraltaCaderno() {
  const [active, setActive] = useState(0);
  const chapter = chapters[active];
  const select = (next: number) =>
    setActive((next + chapters.length) % chapters.length);
  return (
    <section
      id="caderno"
      tabIndex={-1}
      className="peralta-caderno"
      aria-labelledby="peralta-caderno-heading"
    >
      <div className="section-wrap">
        <div className="caderno-heading">
          <h2 id="peralta-caderno-heading">
            Caderno <em>Vivo.</em>
          </h2>
          <p>
            Abra uma página do nosso cotidiano.
            <br />
            Cada escolha, uma nova descoberta.
          </p>
        </div>
        <div className={`caderno-spread theme-${chapter.theme}`}>
          <div className="caderno-art" data-reveal="clip-left">
            <div className="caderno-photo-page" key={active}>
              <figure className="caderno-main-photo">
                <img
                  src={chapter.image}
                  alt={chapter.alt}
                  width={1080}
                  height={1350}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <figure className="caderno-detail-photo">
                <img
                  src={chapter.detail}
                  alt={chapter.detailAlt}
                  width={1080}
                  height={1350}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </div>
            <Flower className="caderno-flower" />
            <span className="caderno-photo-note">
              Fotografias da Escola Peralta
            </span>
          </div>
          <div className="caderno-copy">
            <div
              className="caderno-controls"
              role="group"
              aria-label="Selecione um capítulo"
            >
              {chapters.map((item, index) => (
                <button
                  type="button"
                  key={item.name}
                  aria-pressed={active === index}
                  aria-controls="peralta-caderno-content"
                  onClick={() => select(index)}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div
              id="peralta-caderno-content"
              key={active}
              className="caderno-content"
              aria-live="polite"
              aria-atomic="true"
            >
              <h3>{chapter.title}</h3>
              <p className="caderno-subtitle">{chapter.subtitle}</p>
              <p>{chapter.body}</p>
              <a
                href={school.instagram}
                target="_blank"
                rel="noreferrer"
                className="site-text-link"
              >
                Mais momentos no Instagram <ArrowUpRight size={18} />
              </a>
            </div>
            <div className="caderno-bottom">
              <span
                className="caderno-pagecount"
                aria-label={`Capítulo ${active + 1} de ${chapters.length}`}
              >
                Página {active + 1} de {chapters.length}
              </span>
              <div className="caderno-arrows">
                <button
                  type="button"
                  onClick={() => select(active - 1)}
                  aria-label="Capítulo anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => select(active + 1)}
                  aria-label="Próximo capítulo"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { school, contactLink } from "@/config/school-config";

/**
 * Pequeno caderno interativo feito com registros já utilizados pela Escola Peralta.
 * Não inventa projetos, depoimentos ou datas de eventos.
 */
const chapters = [
  {
    eyebrow: "01 · CURIOSIDADE",
    title: "Descobrir também é experimentar.",
    subtitle: "Mãos ocupadas. Olhos curiosos.",
    body: "Na rotina da Peralta, os momentos de descoberta ganham espaço. Um convite para observar, experimentar e aprender com o que acontece ao redor.",
    image: "/images/school/vivencia-03.webp",
    imageAlt: "Criança da Escola Peralta explorando frutas durante uma atividade",
    detail: "/images/school/vivencia-01.webp",
    detailAlt: "Estudante da Escola Peralta com frutas durante atividade de alimentação saudável",
    label: "APRENDER NA PRÁTICA",
    theme: "coral",
  },
  {
    eyebrow: "02 · CONVIVÊNCIA",
    title: "O melhor da escola acontece junto.",
    subtitle: "Histórias para guardar.",
    body: "Um encontro, uma conversa, uma brincadeira: a convivência faz parte de aprender. Fotografias reais da escola ajudam a contar essas histórias.",
    image: "/images/school/escola-cotidiano.webp",
    imageAlt: "Estudantes da Escola Peralta participam juntas de uma atividade",
    detail: "/images/school/vivencia-02.webp",
    detailAlt: "Estudantes reunidas no espaço de convivência da escola",
    label: "VIDA NA PERALTA",
    theme: "blue",
  },
  {
    eyebrow: "03 · ESPAÇOS",
    title: "Um lugar para brincar e crescer.",
    subtitle: "A descoberta tem endereço.",
    body: "Os ambientes e as áreas de convivência também fazem parte da experiência escolar. Conhecer esses espaços de perto é um ótimo começo.",
    image: "/images/school/estrutura-patio.webp",
    imageAlt: "Pátio da Escola Peralta com brinquedos coloridos",
    detail: "/images/school/estrutura-convivencia.webp",
    detailAlt: "Espaço de convivência da Escola Peralta",
    label: "NOSSO ESPAÇO",
    theme: "green",
  },
] as const;

export function PeraltaCaderno() {
  const [active, setActive] = useState(0);
  const chapter = chapters[active];
  const select = (next: number) => setActive((next + chapters.length) % chapters.length);

  return (
    <section id="caderno" className="peralta-caderno" aria-labelledby="peralta-caderno-heading">
      <div className="peralta-caderno-top">
        <div>
          <span className="peralta-caderno-kicker">UM CADERNO DE DESCOBERTAS <span aria-hidden="true">✳</span></span>
          <h2 id="peralta-caderno-heading">Cada dia, <em>uma história.</em></h2>
        </div>
        <p>Um passeio por momentos, atividades e espaços da Escola Peralta — com fotografias do seu próprio cotidiano.</p>
      </div>

      <div className="peralta-caderno-layout">
        <div className={`peralta-caderno-art theme-${chapter.theme}`} data-reveal="up">
          <div className="peralta-caderno-art-disc" aria-hidden="true" />
          <div className="peralta-caderno-art-squiggle" aria-hidden="true">✳</div>
          <figure className="peralta-caderno-main-photo" key={`${active}-main`}>
            <img src={chapter.image} alt={chapter.imageAlt} width={900} height={1000} loading="lazy" decoding="async" />
          </figure>
          <figure className="peralta-caderno-small-photo" key={`${active}-detail`}>
            <img src={chapter.detail} alt={chapter.detailAlt} width={420} height={520} loading="lazy" decoding="async" />
          </figure>
          <div className="peralta-caderno-seal">
            <img src="/images/brand/escola-peralta-selo-transparente.webp" alt="" loading="lazy" decoding="async" />
          </div>
          <span className="peralta-caderno-photo-note">{chapter.label}</span>
        </div>

        <div className="peralta-caderno-copy">
          <div className="peralta-caderno-controls" aria-label="Selecione um capítulo">
            {chapters.map((item, i) => (
              <button
                type="button"
                key={item.eyebrow}
                aria-pressed={active === i}
                aria-controls="peralta-caderno-content"
                className={active === i ? "is-active" : ""}
                onClick={() => select(i)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span>{["Descobrir", "Conviver", "Brincar"][i]}</span>
              </button>
            ))}
          </div>
          <div id="peralta-caderno-content" key={active} className="peralta-caderno-copy-inner" aria-live="polite" aria-atomic="true">
            <span className="peralta-caderno-eyebrow">{chapter.eyebrow}</span>
            <h3>{chapter.title}</h3>
            <p className="peralta-caderno-subtitle">{chapter.subtitle}</p>
            <p>{chapter.body}</p>
            <a href={school.instagram} target="_blank" rel="noreferrer" className="peralta-caderno-cta">
              Veja mais momentos <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
          <div className="peralta-caderno-bottom">
            <div className="peralta-caderno-pagecount" aria-label={`Capítulo ${active + 1} de ${chapters.length}`}>
              <strong>{String(active + 1).padStart(2, "0")}</strong><span>/ 0{chapters.length}</span>
            </div>
            <div className="peralta-caderno-arrows">
              <button type="button" onClick={() => select(active - 1)} aria-label="Capítulo anterior"><ChevronLeft size={20} /></button>
              <button type="button" onClick={() => select(active + 1)} aria-label="Próximo capítulo"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      </div>
      <div className="peralta-caderno-footnote">
        <span>FOTOS DA ESCOLA PERALTA</span>
        <a href={contactLink} target="_blank" rel="noreferrer">Venha conhecer de perto <ArrowRight size={18} /></a>
      </div>
    </section>
  );
}

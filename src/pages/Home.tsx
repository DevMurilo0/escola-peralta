import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Instagram,
  MapPin,
  Plus,
} from "lucide-react";
import { school, contactLink } from "@/config/school-config";
import { institutional as content } from "@/config/institutional-content";
import { PublicHeader } from "@/components/public-header";
import { PhotoFrame } from "@/components/institutional/photo-frame";
import { SiteMotion } from "@/components/institutional/site-motion";
import "@/styles/institutional.css";
export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: school.name,
    url: import.meta.env.VITE_SITE_URL || window.location.origin,
    sameAs: [school.instagram],
    address: {
      "@type": "PostalAddress",
      streetAddress: school.address,
      addressLocality: "Gravatá",
      addressRegion: "PE",
      addressCountry: "BR",
    },
  };
  const photos = content.photos;
  return (
    <SiteMotion className="institutional">
      <PublicHeader />
      <main id="main">
        <section id="inicio" tabIndex={-1} className="opening-scene">
          <div className="hero-location">
            <span>
              <MapPin size={14} /> Gravatá, Pernambuco
            </span>
            <span>Infâncias cheias de possibilidades.</span>
          </div>
          <div className="opening-copy">
            <p className="site-kicker">{content.hero.eyebrow}</p>
            <h1>
              {content.hero.title}
              <br />
              <span>{content.hero.emphasis}</span>
            </h1>
            <div className="hero-introduction">
              <p>{content.hero.description}</p>
              <a className="site-button" href="#escola">
                Conheça nossa escola <ArrowDown size={17} />
              </a>
            </div>
          </div>
          <div className="hero-stage">
            <div className="hero-caption">
              <span className="editorial-cross" aria-hidden="true">
                ✳
              </span>
              <p>
                A infância acontece agora.
                <br />
                <strong>Vamos vivê-la por inteiro.</strong>
              </p>
              <a href={contactLink} target="_blank" rel="noreferrer">
                Converse com a gente <ArrowUpRight size={18} />
              </a>
            </div>
            <PhotoFrame
              photo={
                school.heroImage
                  ? { ...photos.hero, src: school.heroImage }
                  : photos.hero
              }
              title="Um mundo para descobrir."
              number="01"
              priority
              className="hero-picture"
              sizes="(max-width: 768px) 100vw, 72vw"
            />
            <div className="hero-side-label" aria-hidden="true">
              APRENDER É UMA DESCOBERTA DIÁRIA
            </div>
            <a className="hero-stamp" href="#proposta">
              <span>
                Aprender.
                <br />
                Conviver.
                <br />
                Crescer.
              </span>
              <ArrowDown size={20} />
            </a>
          </div>
          <div className="opening-footnote">
            <span>Escola Peralta — Educação Infantil e Fundamental I</span>
            <a href="#escola">
              Continue descobrindo <ArrowDown size={14} />
            </a>
          </div>
        </section>
        <section
          id="escola"
          tabIndex={-1}
          className="school-story site-section"
        >
          <div className="chapter-label" data-reveal>
            <span>01 / A ESCOLA</span>
            <span>De perto, faz sentido.</span>
          </div>
          <div className="story-layout">
            <div className="story-photo" data-reveal>
              <PhotoFrame
                photo={photos.about}
                title="É sobre estar perto."
                number="02"
              />
              <span className="photo-footnote">
                Pessoas, encontros e um lugar em Gravatá.
              </span>
            </div>
            <div className="story-copy" data-reveal data-delay="100">
              <p className="site-kicker">ESCOLA PERALTA</p>
              <h2>{content.about.title}</h2>
              <p className="site-lead">{content.about.description}</p>
              <p>{content.about.invitation}</p>
              <a
                className="site-text-link"
                href={contactLink}
                target="_blank"
                rel="noreferrer"
              >
                Conheça a escola em uma visita <ArrowUpRight size={18} />
              </a>
              <div className="story-note">
                <span aria-hidden="true">↗</span>
                <p>
                  <strong>Educar com valores.</strong>
                  <br />
                  Uma ideia presente na apresentação da Peralta.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section
          id="proposta"
          tabIndex={-1}
          className="learning-section site-section"
        >
          <div className="chapter-label" data-reveal>
            <span>02 / APRENDER & CONVIVER</span>
            <span>Uma pergunta leva a outra.</span>
          </div>
          <div className="learning-intro" data-reveal>
            <h2>{content.pedagogy.title}</h2>
            <div>
              <p>{content.pedagogy.description}</p>
              <a
                className="site-text-link"
                href={contactLink}
                target="_blank"
                rel="noreferrer"
              >
                Converse sobre a proposta pedagógica <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
          <div className="learning-concepts">
            {content.pedagogy.concepts.map((c, i) => (
              <article key={c.title} data-reveal data-delay={i * 70}>
                <span className={`concept-mark mark-${i}`} aria-hidden="true">
                  {["?", "↗", "+"][i]}
                </span>
                <span className="concept-index">0{i + 1}</span>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
          <p className="learning-note">
            Autonomia, criatividade e desenvolvimento são temas para conhecer de
            perto, em uma conversa com a equipe.
          </p>
        </section>
        <section
          id="ensino"
          tabIndex={-1}
          className="school-segments site-section"
        >
          <div className="chapter-label" data-reveal>
            <span>03 / SEGMENTOS</span>
            <span>Crescer tem muitas etapas.</span>
          </div>
          <div className="segments-heading" data-reveal>
            <h2>
              Hoje, uma descoberta.
              <br />
              Amanhã, <span>tantas outras.</span>
            </h2>
            <p>
              Da Educação Infantil ao Fundamental I,
              <br />
              um caminho para conhecer juntos.
            </p>
          </div>
          <article className="segment-infant" data-reveal>
            <PhotoFrame
              photo={
                school.segments[0].image
                  ? { ...photos.infantil, src: school.segments[0].image }
                  : photos.infantil
              }
              title="Brincar também é descobrir."
              number="03"
            />
            <div className="segment-text">
              <span className="site-kicker">{content.segments[0].title}</span>
              <h3>{content.segments[0].lead}</h3>
              <p>{content.segments[0].description}</p>
              <a
                className="site-circle-link"
                href={contactLink}
                target="_blank"
                rel="noreferrer"
                aria-label="Conhecer Educação Infantil"
              >
                <ArrowUpRight />
              </a>
              <small>{content.segments[0].detail}</small>
            </div>
          </article>
          <article className="segment-fundamental" data-reveal>
            <div className="segment-text">
              <span className="site-kicker">{content.segments[1].title}</span>
              <h3>{content.segments[1].lead}</h3>
              <p>{content.segments[1].description}</p>
              <a
                className="site-text-link"
                href={contactLink}
                target="_blank"
                rel="noreferrer"
              >
                Conheça o Fundamental I <ArrowUpRight size={18} />
              </a>
              <small>{content.segments[1].detail}</small>
            </div>
            <PhotoFrame
              photo={
                school.segments[1].image
                  ? { ...photos.fundamental, src: school.segments[1].image }
                  : photos.fundamental
              }
              title="Ideias que ganham o mundo."
              number="04"
            />
          </article>
        </section>
        <section
          id="estrutura"
          tabIndex={-1}
          className="school-spaces site-section"
        >
          <div className="chapter-label" data-reveal>
            <span>04 / NOSSO ESPAÇO</span>
            <span>Uma escola se conhece por dentro.</span>
          </div>
          <div className="spaces-heading" data-reveal>
            <h2>
              Espaço para ser.
              <br />
              <span>E para descobrir.</span>
            </h2>
            <p>
              Há detalhes que uma visita conta melhor.
              <br />
              Venha conhecer os ambientes da Peralta.
            </p>
          </div>
          <div className="spaces-mosaic">
            <figure data-reveal>
              <PhotoFrame
                photo={photos.structureMain}
                title="Onde os encontros acontecem."
                number="05"
              />
              <figcaption>
                <span>Um olhar sobre a escola</span>
                <span>01 — visão geral</span>
              </figcaption>
            </figure>
            <div className="spaces-detail">
              <figure data-reveal data-delay="100">
                <PhotoFrame
                  photo={photos.structureDetail}
                  title="De perto, cada detalhe."
                  number="06"
                />
                <figcaption>
                  <span>Ambientes para conhecer</span>
                  <span>02 — detalhes</span>
                </figcaption>
              </figure>
              <div className="visit-note" data-reveal>
                <Plus size={30} />
                <h3>
                  Seu próximo passo
                  <br />
                  pode ser uma visita.
                </h3>
                <a
                  className="site-text-link"
                  href={contactLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Vamos combinar? <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </section>
        <section id="projetos" tabIndex={-1} className="school-life">
          <div className="life-intro site-section">
            <div className="chapter-label" data-reveal>
              <span>05 / VIDA NA PERALTA</span>
              <span>Acontece aqui.</span>
            </div>
            <div className="life-heading" data-reveal>
              <h2>
                Pequenos momentos.
                <br />
                <span>Grandes histórias.</span>
              </h2>
              <p>
                Os registros oficiais da escola mostram projetos, atividades e
                encontros. Acompanhe esse cotidiano no nosso Instagram.
              </p>
            </div>
          </div>
          <div
            className="life-rail"
            role="region"
            aria-label="Espaços para registros da vida na Peralta"
            tabIndex={0}
          >
            {(school.gallery.length
              ? school.gallery
                  .slice(0, 6)
                  .map((p, i) => ({ photo: p, title: p.caption, index: i }))
              : [
                  {
                    photo: photos.lifeProject,
                    title: "Ideias em movimento",
                    index: 0,
                  },
                  {
                    photo: photos.lifePlay,
                    title: "Tempo de brincar",
                    index: 1,
                  },
                  {
                    photo: photos.lifeTogether,
                    title: "Bom estar junto",
                    index: 2,
                  },
                ]
            ).map(({ photo, title, index }) => (
              <figure key={title} data-reveal data-delay={index * 60}>
                <PhotoFrame
                  photo={photo}
                  title={title}
                  number={`0${index + 7}`}
                />
                <figcaption>
                  <span>{title}</span>
                  <ArrowUpRight size={18} />
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="instagram-invitation" data-reveal>
            <div>
              <Instagram size={22} />
              <span>{school.instagramHandle}</span>
            </div>
            <a
              className="site-text-link"
              href={school.instagram}
              target="_blank"
              rel="noreferrer"
            >
              Conheça nosso Instagram <ArrowUpRight size={18} />
            </a>
          </div>
        </section>
        <section id="matriculas" tabIndex={-1} className="school-invitation">
          <div className="invitation-orbit" aria-hidden="true" />
          <div data-reveal>
            <span className="site-kicker">
              UMA NOVA HISTÓRIA PODE COMEÇAR AQUI
            </span>
            <h2>{content.cta.title}</h2>
            <p>{content.cta.description}</p>
            <div className="invitation-actions">
              <a
                className="site-button button-sun"
                href={contactLink}
                target="_blank"
                rel="noreferrer"
              >
                Agendar uma visita <ArrowUpRight size={20} />
              </a>
              <a
                className="invitation-secondary"
                href={contactLink}
                target="_blank"
                rel="noreferrer"
              >
                {school.whatsapp ? "Falar pelo WhatsApp" : "Falar com a escola"}{" "}
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
          <span className="invitation-caption">
            Escola Peralta · Gravatá, PE
          </span>
        </section>
        <section
          id="contato"
          tabIndex={-1}
          className="school-contact site-section"
        >
          <div className="chapter-label" data-reveal>
            <span>06 / VAMOS CONVERSAR</span>
            <span>Até já, na Peralta.</span>
          </div>
          <div className="contact-layout">
            <div data-reveal>
              <h2>
                Nosso lugar
                <br />é em <span>Gravatá.</span>
              </h2>
              <p>
                {school.address}
                <br />
                {school.city}
              </p>
              <a
                className="site-text-link"
                href={school.maps}
                target="_blank"
                rel="noreferrer"
              >
                Como chegar <ArrowUpRight size={18} />
              </a>
            </div>
            <div className="contact-directory" data-reveal data-delay="100">
              <a href={contactLink} target="_blank" rel="noreferrer">
                <span>
                  <small>PRIMEIRO CONTATO</small>Converse com a equipe
                </span>
                <ArrowUpRight />
              </a>
              <a href={school.instagram} target="_blank" rel="noreferrer">
                <span>
                  <small>ACOMPANHE A ESCOLA</small>
                  {school.instagramHandle}
                </span>
                <Instagram size={22} />
              </a>
              {school.phone && (
                <a href={`tel:${school.phone}`}>
                  <span>
                    <small>TELEFONE</small>
                    {school.phone}
                  </span>
                  <ArrowUpRight />
                </a>
              )}
              {school.email && (
                <a href={`mailto:${school.email}`}>
                  <span>
                    <small>E-MAIL</small>
                    {school.email}
                  </span>
                  <ArrowUpRight />
                </a>
              )}
              <Link to="/portal/login">
                <span>
                  <small>ESPAÇO DO EDUCADOR</small>Portal do Professor
                </span>
                <ArrowUpRight />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="school-footer">
        <div className="footer-top">
          <Link
            className="brand-signature"
            to="/"
            aria-label="Escola Peralta — início"
          >
            {school.logo ? (
              <img
                decoding="async"
                src={school.logo}
                width={100}
                height={100}
                alt="Logo da Escola Peralta"
              />
            ) : (
              <>
                <span>ESCOLA</span>
                <strong>Peralta</strong>
              </>
            )}
          </Link>
          <p>
            Aprender com o mundo.
            <br />
            Crescer com o outro.
          </p>
          <a href="#inicio">
            Voltar ao início <ArrowUpRight size={18} />
          </a>
        </div>
        <nav aria-label="Rodapé">
          <a href="#escola">A Escola</a>
          <a href="#proposta">Proposta pedagógica</a>
          <a href="#ensino">Ensino</a>
          <a href="#estrutura">Estrutura</a>
          <a href="#contato">Contato</a>
        </nav>
        <div className="footer-end">
          <span>© {new Date().getFullYear()} Escola Peralta</span>
          <span>Gravatá · Pernambuco</span>
        </div>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </SiteMotion>
  );
}

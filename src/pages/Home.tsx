import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Instagram,
  MessageCircle,
  Plus,
} from "lucide-react";
import { school, contactLink } from "@/config/school-config";
import { institutional as content } from "@/config/institutional-content";
import { PublicHeader } from "@/components/public-header";
import { PhotoFrame } from "@/components/institutional/photo-frame";
import { SiteMotion } from "@/components/institutional/site-motion";
import { PeraltaCaderno } from "@/components/institutional/peralta-caderno";
import "@/styles/institutional.css";
import "@/styles/peralta-caderno.css";
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
          <div className="hero-layout">
            <div className="opening-copy">
              <p className="site-kicker hero-intro-step">
                {content.hero.eyebrow}
              </p>

              <h1 aria-label={`${content.hero.title} ${content.hero.emphasis}`}>
                <span className="hero-title-line" aria-hidden="true">
                  <span>{content.hero.title}</span>
                </span>
                <span
                  className="hero-title-line hero-title-emphasis"
                  aria-hidden="true"
                >
                  <span>{content.hero.emphasis}</span>
                </span>
              </h1>

              <p className="hero-description hero-intro-step">
                {content.hero.description}
              </p>

              <div className="hero-actions hero-intro-step">
                <a className="site-button" href="#escola">
                  Conheça a escola <ArrowRight size={17} />
                </a>
                <a
                  className="hero-secondary-action"
                  href={contactLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Fale com a equipe <ArrowUpRight size={17} />
                </a>
              </div>

              <div className="hero-facts hero-intro-step" aria-label="Informações da escola">
                <span>Educação Infantil</span>
                <span>Ensino Fundamental I</span>
                <span>Gravatá · PE</span>
              </div>
            </div>

            <div className="hero-media hero-intro-step">
              <PhotoFrame
                photo={
                  school.heroImage
                    ? { ...photos.hero, src: school.heroImage }
                    : photos.hero
                }
                title="Escola Peralta"
                number="01"
                priority
                className="hero-picture"
                sizes="(max-width: 900px) 100vw, 52vw"
                parallax={0.018}
              />

              <div className="peralta-hero-mark" aria-hidden="true">
                <svg viewBox="0 0 120 120" focusable="false">
                  <text x="60" y="26" textAnchor="middle">AQUI A GENTE</text>
                  <path className="mark-flower" d="M60 35c6-14 18-7 16 3 11-6 22 6 13 15 14 1 14 17 1 20 8 12-5 23-16 14-3 14-20 14-23 0-11 9-24-2-16-14-13-3-13-19 1-20-9-9 2-21 13-15-2-10 10-17 16-3Z"/>
                  <circle className="mark-center" cx="60" cy="61" r="14"/>
                  <text x="60" y="65" textAnchor="middle" style={{ fontSize: 18, letterSpacing: 0 }}>✦</text>
                  <text x="60" y="108" textAnchor="middle">DESCOBRE</text>
                </svg>
              </div>
              <div className="peralta-hero-mini" aria-hidden="true">
                <img src="/images/school/vivencia-01.webp" alt="" width={360} height={430} loading="eager" />
              </div>
              <a
                className="hero-media-note"
                href={contactLink}
                target="_blank"
                rel="noreferrer"
              >
                <span>VISITAS À ESCOLA</span>
                <strong>Conheça a Peralta de perto.</strong>
                <ArrowUpRight size={19} />
              </a>
            </div>
          </div>
        </section>
        <div className="peralta-ribbon" aria-label="Aprender, brincar, conviver e crescer">
          <div className="peralta-ribbon-track" aria-hidden="true">
            {[0, 1].map((i) => (
              <span key={i}>
                aprender <b>✳</b> brincar <b>✳</b> conviver <b>✳</b> crescer <b>✳</b>
              </span>
            ))}
          </div>
        </div>
        <section
          id="escola"
          tabIndex={-1}
          className="school-story site-section"
        >
          <div className="chapter-label" data-reveal="line">
            <span>01 / A ESCOLA</span>
            <span>De perto, faz sentido.</span>
          </div>
          <div className="story-layout">
            <div className="story-photo">
              <PhotoFrame
                photo={photos.about}
                title="É sobre estar perto."
                number="02"
                motion="clip-left"
                parallax={0.018}
              />
            </div>
            <div className="story-copy" data-reveal="right" data-delay="80">
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
            </div>
          </div>
        </section>
        <section
          id="proposta"
          tabIndex={-1}
          className="learning-section site-section"
        >
          <div className="chapter-label" data-reveal="line">
            <span>02 / APRENDER & CONVIVER</span>
            <span>Uma pergunta leva a outra.</span>
          </div>
          <div className="learning-intro" data-reveal="up">
            <h2>{content.pedagogy.title}</h2>
            <div>
              <p>{content.pedagogy.description}</p>
            </div>
          </div>
          <div className="learning-concepts">
            {content.pedagogy.concepts.map((c, i) => (
              <article key={c.title} data-reveal="scale" data-delay={i * 90}>
                <span className={`concept-mark mark-${i}`} aria-hidden="true">
                  {["?", "↗", "+"][i]}
                </span>
                <span className="concept-index">0{i + 1}</span>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
        </section>
        <PeraltaCaderno />
        <section
          id="ensino"
          tabIndex={-1}
          className="school-segments site-section"
        >
          <div className="chapter-label" data-reveal="line">
            <span>03 / SEGMENTOS</span>
            <span>Crescer tem muitas etapas.</span>
          </div>
          <div className="segments-heading" data-reveal="up">
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
          <article className="segment-infant">
            <PhotoFrame
              photo={
                school.segments[0].image
                  ? { ...photos.infantil, src: school.segments[0].image }
                  : photos.infantil
              }
              title="Brincar também é descobrir."
              number="03"
              motion="clip-left"
              parallax={0.016}
            />
            <div className="segment-text" data-reveal="right" data-delay="100">
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
            </div>
          </article>
          <article className="segment-fundamental">
            <div className="segment-text" data-reveal="left">
              <span className="site-kicker">{content.segments[1].title}</span>
              <h3>{content.segments[1].lead}</h3>
              <p>{content.segments[1].description}</p>
            </div>
            <PhotoFrame
              photo={
                school.segments[1].image
                  ? { ...photos.fundamental, src: school.segments[1].image }
                  : photos.fundamental
              }
              title="Ideias que ganham o mundo."
              number="04"
              motion="clip-right"
              parallax={0.016}
            />
          </article>
        </section>
        <section
          id="estrutura"
          tabIndex={-1}
          className="school-spaces site-section"
        >
          <div className="chapter-label" data-reveal="line">
            <span>04 / NOSSO ESPAÇO</span>
            <span>Uma escola se conhece por dentro.</span>
          </div>
          <div className="spaces-heading" data-reveal="up">
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
            <figure>
              <PhotoFrame
                photo={photos.structureMain}
                title="Onde os encontros acontecem."
                number="05"
                motion="clip-left"
                parallax={0.02}
              />
            </figure>
            <div className="spaces-detail">
              <figure>
                <PhotoFrame
                  photo={photos.structureDetail}
                  title="De perto, cada detalhe."
                  number="06"
                  motion="scale"
                  parallax={0.028}
                />
              </figure>
              <div className="visit-note" data-reveal="right" data-delay="180">
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
            <div className="chapter-label" data-reveal="line">
              <span>05 / VIDA NA PERALTA</span>
              <span>Acontece aqui.</span>
            </div>
            <div className="life-heading" data-reveal="up">
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
              <figure key={title} data-reveal="scale" data-delay={index * 60}>
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
          <div className="life-progress" aria-hidden="true">
            <span />
            <small>Arraste para explorar</small>
          </div>
          <div className="instagram-invitation" data-reveal="up">
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
          <div data-reveal="scale">
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
        </section>
        <section
          id="contato"
          tabIndex={-1}
          className="school-contact site-section"
        >
          <div className="chapter-label" data-reveal="line">
            <span>06 / VAMOS CONVERSAR</span>
            <span>Até já, na Peralta.</span>
          </div>
          <div className="contact-layout">
            <div className="contact-intro" data-reveal="left">
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
                Abrir no Google Maps <ArrowUpRight size={18} />
              </a>
            </div>

            <div
              className="contact-map"
              data-reveal="scale"
              data-delay="80"
            >
              <iframe
                title="Localização da Escola Peralta no Google Maps"
                src={school.mapsEmbed}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                className="contact-map-footer"
                href={school.maps}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  <small>ESCOLA PERALTA</small>
                  Rua Izaltino Poggi, 73 · Prado
                </span>
                <ArrowUpRight size={18} />
              </a>
            </div>

            <div
              className="contact-directory"
              data-reveal="right"
              data-delay="120"
            >
              {school.whatsapp && (
                <a href={contactLink} target="_blank" rel="noreferrer">
                  <span>
                    <small>WHATSAPP</small>
                    {school.whatsappLabel}
                  </span>
                  <MessageCircle size={22} />
                </a>
              )}
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
        <div className="peralta-footer-word" aria-hidden="true">
          <strong>PERALTA</strong>
          <img src="/images/brand/escola-peralta-selo-transparente.webp" alt="" loading="lazy" />
          <span className="peralta-footer-word-note">GRAVATÁ · PERNAMBUCO</span>
        </div>
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

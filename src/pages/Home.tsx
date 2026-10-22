import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Instagram,
  MapPin,
  MessageCircle,
  Navigation,
} from "lucide-react";
import { school, contactLink } from "@/config/school-config";
import { institutional as content } from "@/config/institutional-content";
import { PublicHeader } from "@/components/public-header";
import { PhotoFrame } from "@/components/institutional/photo-frame";
import { SiteMotion } from "@/components/institutional/site-motion";
import { PeraltaCaderno } from "@/components/institutional/peralta-caderno";
import {
  Doodle,
  Flower,
  PaperEdge,
  PencilLine,
  Trail,
} from "@/components/institutional/peralta-art";
import { DiscoveryHero } from "@/components/institutional/discovery-hero";
import { LifeGallery } from "@/components/institutional/life-gallery";
import "@/styles/institutional.css";
import "@/styles/peralta-caderno.css";

const logo = "/images/brand/escola-peralta-logo-refinada.webp";
export default function Home() {
  const photos = content.photos;
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
  return (
    <SiteMotion className="institutional">
      <PublicHeader />
      <main id="main">
        <DiscoveryHero />
        <section id="escola" tabIndex={-1} className="school-story">
          <Doodle kind="cloud" className="story-cloud" />
          <div className="section-wrap story-layout">
            <div className="story-photo">
              <PhotoFrame
                photo={photos.about}
                title="Encontros da Peralta"
                number="2"
                motion="clip-left"
                parallax={0.018}
              />
              <span className="photo-caption">
                O cotidiano é feito de encontros.
              </span>
              <Flower className="story-flower" />
            </div>
            <div className="story-copy">
              <Doodle kind="books" className="story-books" />
              <h2>
                Perto da infância.
                <br />
                <em>Perto de você.</em>
              </h2>
              <p className="site-lead" data-reveal="blur">
                {content.about.description}
              </p>
              <p>{content.about.invitation}</p>
              <a
                className="site-text-link"
                href={contactLink}
                target="_blank"
                rel="noreferrer"
              >
                Vamos nos conhecer? <ArrowUpRight size={20} />
              </a>
              <img
                className="story-seal"
                src={logo}
                alt=""
                width={140}
                height={140}
                loading="lazy"
              />
            </div>
          </div>
        </section>
        <section id="proposta" tabIndex={-1} className="learning-section">
          <div className="section-wrap learning-layout">
            <div className="learning-intro">
              <h2>
                A curiosidade
                <br />
                <em>abre caminhos.</em>
              </h2>
              <p>{content.pedagogy.description}</p>
              <Flower className="learning-flower" />
            </div>
            <div className="learning-concepts">
              {content.pedagogy.concepts.map((concept, index) => (
                <article key={concept.title}>
                  <Doodle
                    kind={(["pencil", "blocks", "balloon"] as const)[index]}
                  />
                  <h3>
                    {concept.title}
                    <ArrowUpRight aria-hidden="true" />
                  </h3>
                  <p>{concept.text}</p>
                </article>
              ))}
            </div>
            <Trail className="learning-trail" />
            <Doodle kind="pencil" className="learning-pencil" />
          </div>
        </section>
        <PeraltaCaderno />
        <section id="ensino" tabIndex={-1} className="school-segments">
          <PaperEdge className="segments-edge" />
          <div className="section-wrap segments-heading">
            <Doodle kind="rainbow" className="segments-rainbow" />
            <h2>
              Crescer é
              <br />
              <em>descobrir.</em>
            </h2>
            <p>
              Um caminho para crescer, da Educação Infantil ao Fundamental I.
            </p>
          </div>
          <div className="segment-fields">
            {content.segments.map((segment, index) => (
              <article
                key={segment.title}
                className={`segment-field segment-${index}`}
              >
                <PhotoFrame
                  photo={index === 0 ? photos.infantil : photos.fundamental}
                  title={segment.title}
                  number={String(index + 3)}
                  motion={index === 0 ? "clip-left" : "clip-right"}
                  parallax={0.018}
                />
                <div className="segment-text">
                  <Doodle
                    kind={index === 0 ? "blocks" : "books"}
                    className="segment-doodle"
                  />
                  <h3>{segment.title}</h3>
                  <p className="segment-lead">{segment.lead}</p>
                  <p>{segment.description}</p>
                  <a
                    className="site-text-link"
                    href={contactLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Conheça essa etapa: ${segment.title}`}
                  >
                    Conheça essa etapa <ArrowUpRight size={20} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="estrutura" tabIndex={-1} className="school-spaces">
          <Doodle kind="kite" className="spaces-kite" float />
          <div className="section-wrap">
            <div className="spaces-heading">
              <h2>
                O próximo encontro
                <br />
                <em>pode ser aqui.</em>
              </h2>
              <p>
                Há detalhes que uma visita conta melhor. Venha conhecer os
                ambientes e as áreas de convivência da Peralta.
              </p>
            </div>
            <div className="spaces-mosaic">
              <figure>
                <PhotoFrame
                  photo={photos.structureMain}
                  title="No pátio da escola"
                  number="5"
                  motion="clip-left"
                  parallax={0.02}
                />
                <figcaption>Vida que acontece no pátio.</figcaption>
              </figure>
              <div className="spaces-detail">
                <figure>
                  <PhotoFrame
                    photo={photos.structureDetail}
                    title="Convivência na Peralta"
                    number="6"
                    motion="clip-right"
                    parallax={0.02}
                  />
                  <figcaption>Um registro do nosso cotidiano.</figcaption>
                </figure>
                <a
                  className="visit-note"
                  href={contactLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Flower />
                  <span>
                    Uma visita conta
                    <br />
                    muito mais.
                  </span>
                  <ArrowUpRight size={28} />
                </a>
              </div>
            </div>
          </div>
        </section>
        <LifeGallery />
        <section id="matriculas" tabIndex={-1} className="school-invitation">
          <div className="section-wrap invitation-layout">
            <Doodle kind="balloon" className="invitation-balloon" float />
            <Flower className="invitation-flower" />
            <h2>
              Vamos começar
              <br />
              <em>uma nova história?</em>
            </h2>
            <div className="invitation-copy">
              <p>{content.cta.description}</p>
              <a
                className="site-button button-sun"
                href={contactLink}
                target="_blank"
                rel="noreferrer"
              >
                Agendar uma visita <ArrowUpRight size={21} />
              </a>
            </div>
            <Trail className="invitation-trail" />
            <Doodle kind="star" className="invitation-star" />
          </div>
        </section>
        <section id="contato" tabIndex={-1} className="school-contact">
          <PaperEdge className="contact-edge" />
          <div className="section-wrap">
            <div className="contact-heading">
              <div>
                <h2>
                  Nosso próximo
                  <br />
                  <em>encontro é aqui.</em>
                </h2>
                <PencilLine />
              </div>
              <p>
                A gente se encontra em Gravatá.
                <br />
                Venha conhecer a Escola Peralta de perto.
              </p>
              <Doodle kind="cloud" className="contact-cloud" />
            </div>
            <div className="contact-layout">
              <div className="contact-map" data-reveal="clip-right">
                <div className="map-paper-label" aria-hidden="true">
                  <Doodle kind="star" />
                  <span>Um caminho até a Peralta.</span>
                </div>
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
                    <strong>Escola Peralta</strong>Rua Izaltino Poggi, 73 ·
                    Prado · Gravatá
                  </span>
                  <ArrowUpRight size={25} />
                </a>
                <Doodle kind="pencil" className="map-pencil" />
              </div>
              <div className="contact-intro" data-reveal="paper">
                <span className="address-icon">
                  <MapPin size={30} />
                </span>
                <h3>
                  De pertinho
                  <br />é ainda melhor.
                </h3>
                <address>
                  {school.address}
                  <br />
                  {school.city}
                </address>
                <a
                  className="site-button"
                  href={school.maps}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation size={19} /> Como chegar
                </a>
                <a
                  className="site-text-link"
                  href={contactLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={19} /> Fale com a escola
                </a>
                <span className="contact-number">{school.whatsappLabel}</span>
                <Doodle kind="kite" className="contact-kite" float />
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="school-footer">
        <PaperEdge className="footer-edge" />
        <div className="section-wrap">
          <div className="footer-opening">
            <div>
              <p>
                Um mundo inteiro.
                <br />
                <em>Um começo Peralta.</em>
              </p>
              <PencilLine />
            </div>
            <a
              href={contactLink}
              className="footer-visit"
              target="_blank"
              rel="noreferrer"
            >
              <Flower />
              <span>
                Vamos marcar <br />
                uma visita?
              </span>
              <ArrowUpRight size={24} />
            </a>
          </div>
          <div className="footer-main">
            <div className="footer-brand">
              <Link to="/" aria-label="Escola Peralta — início">
                <img
                  src={logo}
                  alt="Logo da Escola Peralta"
                  width={180}
                  height={180}
                  loading="lazy"
                />
              </Link>
              <p>
                Educação Infantil e Ensino Fundamental I.
                <br />
                Gravatá · Pernambuco.
              </p>
              <div className="footer-brand-art" aria-hidden="true">
                <Doodle kind="books" />
                <Doodle kind="pencil" />
                <Doodle kind="blocks" />
              </div>
            </div>
            <nav aria-label="Rodapé">
              <h2>Explore esse mundo</h2>
              <a href="#escola">A Escola</a>
              <a href="#proposta">Proposta pedagógica</a>
              <a href="#caderno">Caderno Vivo</a>
              <a href="#ensino">Ensino</a>
              <a href="#estrutura">Estrutura</a>
              <a href="#projetos">Projetos e vivências</a>
              <a href="#contato">Contato e localização</a>
            </nav>
            <div className="footer-connect">
              <h2>Estamos por aqui</h2>
              <a href={contactLink} target="_blank" rel="noreferrer">
                <MessageCircle size={18} />
                {school.whatsappLabel}
              </a>
              <a href={school.instagram} target="_blank" rel="noreferrer">
                <Instagram size={18} />
                {school.instagramHandle}
              </a>
              <a
                href={school.maps}
                target="_blank"
                rel="noreferrer"
                className="footer-address"
              >
                {school.address}
                <br />
                {school.city}
                <ArrowUpRight size={18} />
              </a>
              <Link className="footer-portal" to="/portal/login">
                Portal do Professor <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
          <div className="footer-playground" aria-hidden="true">
            <Doodle kind="cloud" className="footer-cloud" />
            <Doodle kind="kite" className="footer-kite" float />
            <div className="footer-word">
              <span>p</span>
              <span>e</span>
              <span>r</span>
              <span>a</span>
              <span>l</span>
              <span>t</span>
              <span>a</span>
              <Flower />
            </div>
            <Trail />
            <Doodle kind="balloon" className="footer-balloon" />
          </div>
          <div className="footer-end">
            <span>© {new Date().getFullYear()} Escola Peralta</span>
            <span>
              Desenvolvido por{" "}
              <a
                href="https://murilogabriel.com.br"
                target="_blank"
                rel="noopener noreferrer"
              >
                Murilo Gabriel <ArrowUpRight size={14} />
              </a>
            </span>
            <a href="#inicio">
              Voltar ao início <ArrowRight size={16} />
            </a>
          </div>
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

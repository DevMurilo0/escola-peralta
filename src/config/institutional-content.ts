/** Public website only. Editorial copy is editable, not an official slogan.
 * Evidence and authorization status: docs/IDENTIDADE-E-FOTOGRAFIAS.md.
 * Only assign local image paths after confirming permission to publish.
 */
export type SchoolPhoto = {
  src: string;
  alt: string;
  position?: string;
  mobilePosition?: string;
};
const slot = (alt: string): SchoolPhoto => ({
  src: "",
  alt,
  position: "50% 50%",
  mobilePosition: "50% 50%",
});
export const institutional = {
  hero: {
    eyebrow: "Educação Infantil e Ensino Fundamental I",
    title: "Educação que acolhe,",
    emphasis: "valores que ficam.",
    description:
      "Em Gravatá, um lugar para aprender, criar laços e viver as descobertas da infância.",
  },
  about: {
    title: "Uma escola para aprender. Um lugar para pertencer.",
    description:
      "A Escola Peralta faz parte da vida de famílias de Gravatá, com Educação Infantil e Ensino Fundamental I. Na sua apresentação pública, uma ideia ganha destaque: educar com valores.",
    invitation:
      "Conhecer a escola é também conhecer quem estará perto da sua criança. Venha conversar com a nossa equipe.",
  },
  pedagogy: {
    title: "Descobrir o mundo começa com uma pergunta.",
    description:
      "Perguntar, experimentar e trocar ideias fazem parte da construção do conhecimento. Conheça com a equipe como a proposta pedagógica acontece em cada etapa.",
    concepts: [
      {
        title: "Descoberta",
        text: "Curiosidade para observar, perguntar e encontrar novos caminhos.",
      },
      {
        title: "Participação",
        text: "Espaço para expressar ideias e participar da aprendizagem.",
      },
      {
        title: "Convivência",
        text: "Aprender também acontece no encontro e na troca com o outro.",
      },
    ],
  },
  segments: [
    {
      title: "Educação Infantil",
      lead: "O mundo é uma descoberta.",
      description:
        "Brincar, imaginar, explorar. Conheça a proposta da Peralta para os primeiros passos da vida escolar.",
      detail: "Infância • experiências • descobertas",
    },
    {
      title: "Ensino Fundamental I",
      lead: "Cada pergunta abre um caminho.",
      description:
        "Uma nova etapa para ampliar conhecimentos e viver outras descobertas. Converse com a equipe sobre o percurso de aprendizagem.",
      detail: "Conhecimento • participação • convivência",
    },
  ],
  cta: {
    title: "Vamos conhecer a Peralta?",
    description:
      "Uma conversa, uma visita e um novo começo. Nossa equipe espera por você.",
  },
  photos: {
    hero: slot("Pátio da Escola Peralta com espaço de convivência"),
    about: slot("Equipe ou entrada da Escola Peralta"),
    infantil: slot("Atividade de Educação Infantil na Escola Peralta"),
    fundamental: slot("Produção pedagógica do Ensino Fundamental I"),
    structureMain: slot("Vista ampla dos ambientes da Escola Peralta"),
    structureDetail: slot("Detalhe de um espaço de leitura ou convivência"),
    lifeProject: slot("Projeto realizado na Escola Peralta"),
    lifePlay: slot("Momento de brincadeira na Escola Peralta"),
    lifeTogether: slot("Encontro ou evento na Escola Peralta"),
  },
};

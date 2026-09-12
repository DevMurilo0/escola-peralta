export const school = {
  name: "Escola Peralta",
  instagram: "https://www.instagram.com/escolaperaltagravata/",
  instagramHandle: "@escolaperaltagravata",
  whatsapp: "",
  phone: "",
  email: "",
  address: "Rua Izaltino Poggi, 73 • Prado",
  city: "Gravatá — Pernambuco",
  maps: "https://www.google.com/maps/search/?api=1&query=Rua+Izaltino+Poggi+73+Gravata+PE",
  logo: "",
  heroImage: "",
  segments: [
    {
      title: "Educação Infantil",
      description:
        "Descobrir o mundo começa com espaço para brincar, perguntar e experimentar.",
      image: "",
    },
    {
      title: "Ensino Fundamental I",
      description:
        "Novas descobertas, mais autonomia e conhecimento construído a cada dia.",
      image: "",
    },
  ],
  gallery: [] as { src: string; alt: string; caption: string }[],
  defaultSchoolYear: new Date().getFullYear(),
  passingGrade: 6,
  timezone: "America/Recife",
  about:
    "Na Escola Peralta, em Gravatá, a infância e a aprendizagem caminham juntas. Um espaço de educação para crianças da Educação Infantil e do Ensino Fundamental I.",
  // Redação provisória: validar história, missão, metodologia e espaços com a direção.
  mission:
    "Acolher cada criança e abrir caminhos para aprender, conviver e crescer.",
  values:
    "Respeito à infância, escuta, participação e parceria na aprendizagem.",
  pedagogy:
    "Aprender envolve explorar, trocar ideias e participar. Uma proposta inspirada na construção ativa do conhecimento.",
};
export const contactLink = school.whatsapp
  ? `https://wa.me/${school.whatsapp.replace(/\D/g, "")}`
  : school.instagram;

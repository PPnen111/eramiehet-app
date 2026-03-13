export default function Home() {
  const sections = [
    {
      title: "Tapahtumat ja toiminta",
      description: "Kokoukset, talkoot, hirvipalaverit ja muut ajankohtaiset asiat.",
    },
    {
      title: "Metsästäjille",
      description: "Säännöt, pöytäkirjat, ohjeet ja muu seuran materiaali.",
    },
    {
      title: "Maksut",
      description: "Jäsenmaksut, maksutilanne ja eräpäivät yhdessä paikassa.",
    },
    {
      title: "Eräkartano",
      description: "Mökkien ja tilojen varaukset helposti hallintaan.",
    },
    {
      title: "Jäsenet",
      description: "Jäsenrekisteri ja yhteystietojen hallinta.",
    },
    {
      title: "Hallinto",
      description: "Seuran sisäiset tiedot, päätökset ja asiakirjat.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-stone-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-green-300">
            Metsästysseuran sovellus
          </p>
          <h1 className="mb-6 text-4xl font-bold md:text-6xl">
            Kyyjärven Erämiehet
          </h1>
          <p className="mb-10 text-lg text-green-100 md:text-xl">
            Yksi selkeä paikka jäsenille, tiedotteille, maksuille, tapahtumille ja
            eräkartanon varauksille.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-green-800 bg-white/5 p-6 shadow-lg backdrop-blur-sm"
            >
              <h2 className="mb-3 text-xl font-semibold">{section.title}</h2>
              <p className="text-sm leading-6 text-green-100">
                {section.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
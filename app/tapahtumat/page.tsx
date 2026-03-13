export default function TapahtumatPage() {
  return (
    <main className="min-h-screen bg-green-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold">Tapahtumat ja toiminta</h1>
        <p className="mb-8 text-green-100">
          Tällä sivulla näkyvät tulevat kokoukset, talkoot, jahdit ja muu seuran toiminta.
        </p>

        <div className="rounded-2xl bg-green-900 p-6 shadow">
          <h2 className="mb-2 text-xl font-semibold">Esimerkkitapahtuma</h2>
          <p className="text-green-100">
            Kevätkokous lauantaina klo 18.00 Eräkartanolla.
          </p>
        </div>
      </div>
    </main>
  );
}

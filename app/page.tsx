import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-stone-950 text-white">
      <div className="mx-auto max-w-lg px-6 py-20">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-green-300">
          Metsästysseuran sovellus
        </p>
        <h1 className="mb-4 text-4xl font-bold">
          Metsästysseuran<br />sovellus
        </h1>
        <p className="mb-10 text-base text-green-100">
          Yksi paikka jäsenille, tapahtumille, maksuille ja eräkartanon varauksille.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-green-700 px-6 py-3.5 text-center text-base font-semibold text-white shadow-lg"
          >
            Kirjaudu sisään
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-green-700 px-6 py-3.5 text-center text-base font-semibold text-green-300"
          >
            Luo käyttäjä
          </Link>
        </div>
      </div>
    </main>
  )
}

import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            Liikuvuse visualiseerija
          </h1>

          <p className="mt-3 text-slate-600">
            Reaalaja liiklus- ja ühistranspordiandmete visualiseerimine
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            to="/traffic"
            className="rounded-2xl bg-white p-8 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">
              🚗
            </div>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Liiklus
            </h2>

            <p className="mt-2 text-slate-600">
              Eesti liiklusmõõtepunktide värsked DATEX andmed,
              liiklusvoog, kiirus, statistika ja võrdlus.
            </p>

            <p className="mt-5 font-medium text-blue-600">
              Ava liikluskaart →
            </p>
          </Link>

          <Link
            to="/trams"
            className="rounded-2xl bg-white p-8 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">
              🚋
            </div>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Trammid
            </h2>

            <p className="mt-2 text-slate-600">
              Tallinna Ülikooli teenindavate trammide reaalaja
              asukohad ja järgmised väljumised.
            </p>

            <p className="mt-5 font-medium text-blue-600">
              Ava trammivaade →
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
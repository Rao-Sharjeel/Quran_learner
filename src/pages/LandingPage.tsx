import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/Button'

export function LandingPage() {
  return (
    <div className="app-mesh min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5 font-bold tracking-tight text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-700 text-xs font-extrabold text-white shadow-md shadow-brand-700/25">
            Ilm
          </span>
          Ilm
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink to="/login" variant="ghost">
            Log in
          </ButtonLink>
          <ButtonLink to="/app">Enter student demo</ButtonLink>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-20">
          <div className="animate-rise">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
              Family Quran learning
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink md:text-5xl">
              One account for you and your kids — teachers, class, Ask, and reading.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              Book vetted teachers, join live sessions, track homework, and study sacred texts in
              one modern product.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/app">Open family dashboard</ButtonLink>
              <ButtonLink to="/learn" variant="secondary">
                Browse teachers
              </ButtonLink>
            </div>
          </div>

          <div className="panel animate-rise-delay-1 p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              What you can do
            </p>
            <ul className="mt-5 space-y-4">
              {[
                { t: 'Family dashboard', d: 'Sessions, homework, and progress in one view' },
                { t: 'Vetted teachers', d: 'Book 1:1 for yourself or a kid' },
                { t: 'Live classroom', d: 'Join on time with a clear learner picker' },
                { t: 'Ask Scholars', d: 'Search published answers or submit privately' },
              ].map((item) => (
                <li key={item.t} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <span>
                    <span className="block text-sm font-bold text-ink">{item.t}</span>
                    <span className="block text-sm text-muted">{item.d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/login"
              className="mt-7 block rounded-2xl bg-brand-700 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-800"
            >
              Sign in to demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

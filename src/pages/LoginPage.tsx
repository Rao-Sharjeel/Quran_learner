import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('amina@example.com')
  const [password, setPassword] = useState('demo')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.')
      return
    }
    setError('')
    navigate('/app')
  }

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="login-pattern relative flex flex-col justify-between overflow-hidden px-6 py-8 text-brand-50 sm:px-10 sm:py-10 lg:min-h-screen lg:px-14 lg:py-12">
        <div
          className="pointer-events-none absolute -right-4 top-20 select-none font-arabic text-[10rem] leading-none text-white/[0.06] sm:text-[13rem]"
          aria-hidden="true"
        >
          علم
        </div>

        <div className="relative animate-fade">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-extrabold tracking-tight text-brand-800 shadow-lg">
              Ilm
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">Ilm</p>
              <p className="text-xs font-medium text-brand-200">Family Quran learning</p>
            </div>
          </div>
        </div>

        <div className="relative mt-16 max-w-lg animate-rise lg:mt-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-200">
            Edtech for sacred study
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl">
            Book vetted teachers. Track every learner. Join class on time.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-brand-100 sm:text-lg">
            One guardian account for you and your kids — sessions, homework, Ask Scholars, and
            reading in one product.
          </p>
        </div>

        <div className="relative mt-16 flex flex-wrap gap-2 animate-rise-delay-1 lg:mt-0">
          {['Vetted teachers', 'Family dashboard', 'Live classroom'].map((t) => (
            <span
              key={t}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-50 ring-1 ring-white/15"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="app-mesh relative flex items-center px-6 py-12 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-md animate-rise-delay-1 rounded-3xl bg-canvas p-6 shadow-xl shadow-brand-800/5 outline outline-1 outline-line sm:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Sign in</h2>
          <p className="mt-1.5 text-sm text-muted">Demo mode — any email and password works.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-2xl bg-surface px-3.5 py-3 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-2xl bg-surface px-3.5 py-3 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30"
              />
            </label>

            {error ? (
              <p className="text-sm font-medium text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full !py-3">
              Continue
            </Button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/app')}
            className="mt-4 w-full rounded-2xl py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Continue as Amina Rahman
          </button>
          <button
            type="button"
            onClick={() => navigate('/teacher')}
            className="mt-2 w-full rounded-2xl py-2.5 text-sm font-semibold text-muted transition hover:bg-surface"
          >
            Continue as teacher (demo)
          </button>
        </div>
      </section>
    </div>
  )
}

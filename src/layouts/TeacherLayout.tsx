import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  listTeachers,
  setActiveTeacher,
  useActiveTeacherId,
  getTeacher,
} from '../mocks/store'

const nav = [
  { to: '/teacher', label: 'Today', end: true },
  { to: '/teacher/requests', label: 'Requests' },
]

export function TeacherLayout() {
  const teacherId = useActiveTeacherId()
  const teacher = getTeacher(teacherId)
  const teachers = listTeachers()

  return (
    <div className="app-mesh min-h-dvh">
      <header className="border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/teacher" className="text-lg font-extrabold tracking-tight text-ink">
              Ilm · Teacher
            </Link>
            <nav className="flex gap-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'rounded-xl px-3 py-1.5 text-sm font-semibold transition',
                      isActive
                        ? 'bg-brand-700 text-white'
                        : 'text-muted hover:bg-brand-50 hover:text-ink',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-xl bg-surface px-3 py-1.5 text-sm ring-1 ring-line"
              value={teacherId}
              onChange={(e) => setActiveTeacher(e.target.value)}
              aria-label="Acting as teacher"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Link
              to="/login"
              className="text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Exit
            </Link>
          </div>
        </div>
        {teacher ? (
          <p className="mx-auto max-w-[90rem] px-4 pb-2 text-xs text-muted sm:px-6">
            Demo portal as {teacher.name}
          </p>
        ) : null}
      </header>
      <main className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

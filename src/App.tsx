import { Navigate, Route, Routes } from 'react-router-dom'
import { StudentLayout } from './layouts/StudentLayout'
import { AskListPage } from './pages/AskListPage'
import { AskNewPage } from './pages/AskNewPage'
import { AskScholarRoomPage } from './pages/AskScholarRoomPage'
import { AskThreadPage } from './pages/AskThreadPage'
import { BookSessionPage } from './pages/BookSessionPage'
import { ClassroomRoomPage } from './pages/ClassroomRoomPage'
import { JoinSessionPage } from './pages/JoinSessionPage'
import { HomeworkAudioPage } from './pages/HomeworkAudioPage'
import { KidEditPage } from './pages/KidEditPage'
import { KidHubPage } from './pages/KidHubPage'
import { KidNewPage } from './pages/KidNewPage'
import { KidsPage } from './pages/KidsPage'
import { LibraryPage } from './pages/LibraryPage'
import { LibraryReaderPage } from './pages/LibraryReaderPage'
import { LoginPage } from './pages/LoginPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { SessionsPage } from './pages/SessionsPage'
import { StudentHomePage } from './pages/StudentHomePage'
import { TeacherProfilePage } from './pages/TeacherProfilePage'
import { TeachersPage } from './pages/TeachersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sessions/:id/room" element={<ClassroomRoomPage />} />
      <Route element={<StudentLayout />}>
        <Route path="/app" element={<StudentHomePage />} />
        <Route path="/kids" element={<KidsPage />} />
        <Route path="/kids/new" element={<KidNewPage />} />
        <Route path="/kids/:id" element={<KidHubPage />} />
        <Route path="/kids/:id/edit" element={<KidEditPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/teachers/:id" element={<TeacherProfilePage />} />
        <Route path="/teachers/:id/book" element={<BookSessionPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/sessions/join" element={<JoinSessionPage />} />
        <Route path="/sessions/:id" element={<SessionDetailPage />} />
        <Route path="/sessions/:id/homework/:hwId" element={<HomeworkAudioPage />} />
        <Route path="/ask" element={<AskListPage />} />
        <Route path="/ask/new" element={<AskNewPage />} />
        <Route path="/ask/:id" element={<AskThreadPage />} />
        <Route path="/ask/:id/scholar" element={<AskScholarRoomPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:id" element={<LibraryReaderPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

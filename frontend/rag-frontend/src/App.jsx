import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { StudyPage } from './pages/StudyPage'
import { FilesPage } from './pages/FilePage'
import { AboutPage } from './pages/AboutPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/study" replace />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/study" replace />} />
    </Routes>
  )
}

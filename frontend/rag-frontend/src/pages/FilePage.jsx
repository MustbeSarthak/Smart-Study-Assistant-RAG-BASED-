import { useState } from 'react'
import { FileUploader } from '../components/FileUploader'

const USER_KEY = 'smart-study-user-id'

function getUserId() {
  let id = localStorage.getItem(USER_KEY)
  if (!id) {
    id = `user-${crypto.randomUUID()}`
    localStorage.setItem(USER_KEY, id)
  }
  return id
}

export function FilesPage() {
  const [userId] = useState(getUserId)
  const [recent, setRecent] = useState(() => JSON.parse(localStorage.getItem('smart-study-recent-files') || '[]'))

  function handleUploaded(result) {
    const names = result.files || []
    const next = [...new Set([...names, ...recent])]
    setRecent(next)
    localStorage.setItem('smart-study-recent-files', JSON.stringify(next))
  }

  return (
    <div className="content-page narrow-page">
      <div className="page-heading">
        <div className="eyebrow">Study library</div>
        <h1>Your files</h1>
        <p>Keep the PDFs you want the assistant to retrieve from close at hand.</p>
      </div>
      <FileUploader userId={userId} onUploaded={handleUploaded} />
      <section className="library-list">
        <div className="section-title"><strong>Recently added</strong><span>{recent.length} file{recent.length === 1 ? '' : 's'}</span></div>
        {recent.length === 0 ? (
          <div className="library-empty">No files uploaded in this browser yet.</div>
        ) : recent.map((name) => <div className="library-item" key={name}><span className="file-badge">PDF</span><span>{name}</span><span className="indexed">Indexed</span></div>)}
      </section>
    </div>
  )
}

import { useRef, useState } from 'react'
import { uploadSyllabus } from '../services/api'

export function FileUploader({ userId, onUploaded }) {
  const inputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function chooseFiles(event) {
    const selected = Array.from(event.target.files || []).filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
    setFiles(selected)
    setError(selected.length ? '' : 'Please choose PDF files only.')
    setSuccess('')
  }

  async function handleUpload() {
    if (!files.length) return
    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const result = await uploadSyllabus(userId, files)
      setSuccess(`${result.files?.length || files.length} file(s) added to your study library.`)
      onUploaded?.(result)
      setFiles([])
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="upload-card">
      <div className="section-kicker">Your study material</div>
      <h2>Add PDFs to your RAG library</h2>
      <p className="muted">Upload a syllabus, notes, or textbook PDF. It is stored for your user and indexed for future questions.</p>

      <button className="drop-zone" onClick={() => inputRef.current?.click()} type="button">
        <span className="upload-icon">↑</span>
        <span><strong>Choose PDF files</strong><small>Multiple files supported</small></span>
      </button>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple hidden onChange={chooseFiles} />

      {files.length > 0 && (
        <div className="selected-files">
          {files.map((file) => <div className="selected-file" key={file.name}><span>PDF</span><strong>{file.name}</strong></div>)}
        </div>
      )}

      {error && <p className="feedback error">{error}</p>}
      {success && <p className="feedback success">{success}</p>}

      <button className="primary-button full" disabled={!files.length || uploading} onClick={handleUpload} type="button">
        {uploading ? 'Indexing…' : 'Add to study library'}
      </button>
    </section>
  )
}

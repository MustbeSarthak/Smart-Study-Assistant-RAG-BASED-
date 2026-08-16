import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChatMessage } from '../components/ChatMessage'
import { FileUploader } from '../components/FileUploader'
import { askQuestion } from '../services/api'

const USER_KEY = 'smart-study-user-id'

function getUserId() {
  const existing = localStorage.getItem(USER_KEY)
  if (existing) return existing
  const id = `user-${crypto.randomUUID()}`
  localStorage.setItem(USER_KEY, id)
  return id
}

export function StudyPage() {
  const userId = useMemo(getUserId, [])
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)

  async function submitQuestion(event) {
    event?.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || loading) return

    setError('')
    setQuestion('')
    setMessages((current) => [...current, { role: 'user', content: trimmed }])
    setLoading(true)

    try {
      const result = await askQuestion(trimmed, userId)
      setMessages((current) => [...current, {
        role: 'assistant',
        content: result.answer || 'I could not generate an answer.',
        sources: result.sources || [],
      }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="study-layout">
      <section className="study-main">
        <div className="hero-copy">
          <div className="eyebrow">AI-powered study companion</div>
          <h1>Ask your material.<br /><em>Understand it.</em></h1>
          <p>Upload your study PDFs and ask questions. Answers are grounded in the material you provide.</p>
        </div>

        <div className="chat-card">
          <div className="chat-header">
            <div><strong>Study chat</strong><span>Grounded RAG answers</span></div>
            <span className="live-dot">Ready</span>
          </div>

          <div className="messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <div className="empty-symbol">?</div>
                <h3>What are you studying today?</h3>
                <p>Try asking for an explanation, definition, comparison, or example from your uploaded material.</p>
                <div className="prompt-row">
                  {['Explain the main concept', 'Give me an example', 'Summarize this topic'].map((prompt) => (
                    <button key={prompt} onClick={() => setQuestion(prompt)} type="button">{prompt}</button>
                  ))}
                </div>
              </div>
            ) : messages.map((message, index) => <ChatMessage message={message} key={index} />)}
            {loading && <div className="typing"><span /><span /><span /> Searching your material…</div>}
          </div>

          {error && <div className="chat-error">{error}</div>}

          <form className="composer" onSubmit={submitQuestion}>
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask something about your study material…" rows={1} />
            <button className="send-button" disabled={!question.trim() || loading} type="submit" aria-label="Send question">↑</button>
          </form>
        </div>
      </section>

      <aside className="study-sidebar">
        <FileUploader userId={userId} onUploaded={() => setUploadOpen(false)} />
        <div className="sidebar-note">
          <span>Tip</span>
          <p>Your uploaded PDFs are kept under your user workspace and included in retrieval when you ask a question.</p>
          <Link to="/files">View your library →</Link>
        </div>
      </aside>
    </div>
  )
}

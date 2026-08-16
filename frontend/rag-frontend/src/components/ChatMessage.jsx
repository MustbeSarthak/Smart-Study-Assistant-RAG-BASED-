import ReactMarkdown from 'react-markdown'

export function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <article className={`message-row ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="avatar">{isUser ? 'You' : 'S'}</div>

      <div className="message-content">
        <div className="message-label">
          {isUser ? 'You' : 'Smart Study'}
        </div>

        <div className="message-bubble">
          <div className="markdown-content">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>

          {!isUser && message.sources?.length > 0 && (
            <div className="sources-inline">
              <span className="source-heading">Sources</span>

              <div className="source-list">
                {message.sources.map((source, index) => (
                  <span
                    className="source-chip"
                    key={`${source.file}-${source.page}-${index}`}
                  >
                    {source.file}
                    {source.page ? ` · p.${source.page}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
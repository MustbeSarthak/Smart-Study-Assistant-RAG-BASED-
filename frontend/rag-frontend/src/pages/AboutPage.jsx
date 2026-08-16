export function AboutPage() {
  return (
    <div className="content-page narrow-page">
      <div className="page-heading">
        <div className="eyebrow">About the system</div>
        <h1>Study with context.</h1>
        <p>Smart Study Assistant retrieves relevant chunks from your study material before asking the language model to answer.</p>
      </div>
      <div className="about-grid">
        <div><span>01</span><h3>Upload</h3><p>Your PDF is saved to your user workspace.</p></div>
        <div><span>02</span><h3>Index</h3><p>The document is split and added to your Chroma vector store.</p></div>
        <div><span>03</span><h3>Retrieve</h3><p>Relevant chunks from default and personal material are retrieved for each question.</p></div>
        <div><span>04</span><h3>Answer</h3><p>The model receives the retrieved context and returns a grounded response with source pages.</p></div>
      </div>
    </div>
  )
}

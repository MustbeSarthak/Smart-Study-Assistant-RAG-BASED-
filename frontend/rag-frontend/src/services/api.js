const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Something went wrong.')
  }
  return data
}

export async function uploadSyllabus(userId, files) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await fetch(
    `${API_BASE}/upload?user_id=${encodeURIComponent(userId)}`,
    {
      method: 'POST',
      body: formData,
    },
  )

  return parseResponse(response)
}

export async function askQuestion(question, userId) {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, user_id: userId }),
  })

  return parseResponse(response)
}

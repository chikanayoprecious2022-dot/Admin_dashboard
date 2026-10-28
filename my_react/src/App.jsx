import { useEffect, useState } from 'react'
import './App.css'

const emptyForm = {
  owner: '',
  status: 'Planned',
  details: '',
}

async function readJsonResponse(response) {
  const text = await response.text()

  if (!text) {
    return {} 
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    return { message: text || 'Request failed.' }
  }
}

function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items')
      if (!response.ok) {
        throw new Error('Could not load dashboard items.')
      }

      const data = await response.json()
      setItems(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault?.()

    try {
      const trimmedOwner = form.owner.trim()
      const trimmedDetails = form.details.trim()

      if (!trimmedOwner || !trimmedDetails) {
        throw new Error('Owner and details are required.')
      }

      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/items/${editingId}` : '/api/items'
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          owner: trimmedOwner,
          details: trimmedDetails,
          title: form.owner.trim() ? `${trimmedOwner} update` : 'Community update',
          location: 'Public board',
        }),
      })

      const payload = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(payload.message || 'Something went wrong while saving the item.')
      }

      resetForm()
      await fetchItems()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (item) => {
    setForm({
      owner: item.owner,
      status: item.status,
      details: item.details,
    })
    setEditingId(item.id)
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this item?')
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      const payload = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(payload.message || 'Delete failed.')
      }

      if (editingId === id) {
        resetForm()
      }

      await fetchItems()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="browser-app">
      <div className="browser-bar">
        <div className="browser-left">
          <button type="button" className="window-button small" aria-label="Back">←</button>
          <button type="button" className="window-button small" aria-label="Forward">→</button>
          <button type="button" className="window-button small" aria-label="Refresh">↻</button>
        </div>

        <div className="address-box">localhost:5173</div>

        <div className="browser-right">
          <button type="button" className="window-button icon" aria-label="Bookmark">☆</button>
          <button type="button" className="window-button icon" aria-label="Profile">◉</button>
          <button type="button" className="window-button icon" aria-label="Menu">⋮</button>
        </div>
      </div>

      <div className="browser-body">
        <aside className="form-column">
          <label>
            <span>Owner</span>
            <input name="owner" type="text" value={form.owner} onChange={handleChange} placeholder="kzkzk" />
          </label>

          <label>
            <span>Status</span>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </label>

          <label>
            <span>Details</span>
            <textarea name="details" rows="5" value={form.details} onChange={handleChange} placeholder="sjkskdk" />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="submit-btn" onClick={handleSubmit}>{editingId ? 'Update item' : 'Create item'}</button>
        </aside>

        <main className="content-column">
          {loading ? (
            <div className="empty-state"><div className="empty-message">Loading updates...</div></div>
          ) : items.length === 0 ? (
            <div className="empty-state"><div className="empty-message">No posts yet. Create the first update.</div></div>
          ) : (
            <div className="cards-grid">
              {items.map((item) => (
                <article className="item-card" key={item.id}>
                  <div className="card-head">
                    <span className={`status-pill ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>{item.status}</span>
                    <div className="card-actions">
                      <button type="button" className="mini-btn" onClick={() => handleEdit(item)}>Edit</button>
                      <button type="button" className="mini-btn danger" onClick={() => handleDelete(item.id)}>Delete</button>
                    </div>
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.details}</p>
                  <div className="card-meta">
                    <span>{item.location}</span>
                    <span>{item.owner}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      <div className="dock-bar">
        <div className="dock-badge active">1</div>
        <div className="dock-icon" aria-hidden="true">⌂</div>
        <div className="dock-icon" aria-hidden="true">🔍</div>
        <div className="dock-icon" aria-hidden="true">▣</div>
        <div className="dock-icon" aria-hidden="true">◫</div>
        <div className="dock-icon" aria-hidden="true">⌁</div>
        <div className="dock-icon" aria-hidden="true">▤</div>
      </div>
    </div>
  )
}

export default App

// useGistSync.js — sincroniza el estado de OlFit con un GitHub Gist privado
import { useCallback, useRef } from 'react'

const GIST_FILENAME = 'olfit-data.json'

export function useGistSync() {
  const syncing = useRef(false)

  // Guarda el estado en Gist
  const saveToGist = useCallback(async (token, gistId, data) => {
    if (!token || !gistId || syncing.current) return { ok: false }
    syncing.current = true
    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(data, null, 2),
            },
          },
        }),
      })
      return { ok: res.ok, status: res.status }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      syncing.current = false
    }
  }, [])

  // Carga el estado desde Gist
  const loadFromGist = useCallback(async (token, gistId) => {
    if (!token || !gistId) return null
    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `token ${token}` },
      })
      if (!res.ok) return null
      const gist = await res.json()
      const file = gist.files?.[GIST_FILENAME]
      if (!file?.content) return null
      return JSON.parse(file.content)
    } catch {
      return null
    }
  }, [])

  // Crea un Gist nuevo para OlFit (solo la primera vez)
  const createGist = useCallback(async (token, initialData) => {
    if (!token) return null
    try {
      const res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'OlFit — datos de entrenamiento',
          public: false,
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(initialData, null, 2),
            },
          },
        }),
      })
      if (!res.ok) return null
      const gist = await res.json()
      return gist.id
    } catch {
      return null
    }
  }, [])

  // Verifica que el token sea válido
  const verifyToken = useCallback(async (token) => {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` },
      })
      if (!res.ok) return null
      const user = await res.json()
      return user.login
    } catch {
      return null
    }
  }, [])

  return { saveToGist, loadFromGist, createGist, verifyToken }
}

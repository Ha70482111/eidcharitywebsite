const KEY = 'ec-admin-token'
let memToken = null

export function getToken() {
  try { return localStorage.getItem(KEY) || memToken } catch { return memToken }
}
export function setToken(t) {
  memToken = t
  try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY) } catch { /* storage blocked */ }
}

let onUnauthorized = () => {}
export const setUnauthorizedHandler = fn => { onUnauthorized = fn }

export async function api(method, url, body) {
  const token = getToken()
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}`, 'X-Auth-Token': token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let data = null
  try { data = await res.json() } catch { /* empty body */ }
  if (res.status === 401 && url.startsWith('/api/admin')) onUnauthorized()
  if (!res.ok) throw new Error(data?.error || `خطأ (${res.status})`)
  return data
}

export const get = url => api('GET', url)
export const post = (url, body = {}) => api('POST', url, body)
export const put = (url, body = {}) => api('PUT', url, body)
export const del = url => api('DELETE', url)

// Reads an image file and uploads it; returns the public URL.
export function uploadImage(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return reject(new Error('اختر صورة PNG أو JPG أو WEBP أو GIF'))
    if (file.size > 5 * 1024 * 1024) return reject(new Error('أقصى حجم للصورة 5 ميجا'))
    const reader = new FileReader()
    reader.onload = () => post('/api/admin/upload', { filename: file.name, data: reader.result }).then(r => resolve(r.url), reject)
    reader.onerror = () => reject(new Error('تعذرت قراءة الملف'))
    reader.readAsDataURL(file)
  })
}

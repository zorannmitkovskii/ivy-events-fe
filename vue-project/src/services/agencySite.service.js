import { api } from '@/services/api'

/**
 * The agency's public site: the owner's editor and the page visitors see.
 *
 * <p>No call takes an organization id — the server reads it from the token.
 * Every call answers with the `data` of the API envelope.
 */

const SITE = '/crm/agency/site'

const unwrap = (response) => response?.data ?? response ?? null

function upload(path, file, extra = {}) {
  const form = new FormData()
  form.append('file', file)
  for (const [key, value] of Object.entries(extra)) {
    if (value != null && value !== '') form.append(key, value)
  }
  return api.post(path, form).then(unwrap)
}

export const agencySiteService = {
  view() {
    return api.get(SITE).then(unwrap)
  },

  saveSettings(settings) {
    return api.put(SITE, settings).then(unwrap)
  },

  saveContent(content) {
    return api.put(`${SITE}/content`, content).then(unwrap)
  },

  setModel(model) {
    return api.put(`${SITE}/model`, { model }).then(unwrap)
  },

  publish(live) {
    return api.post(`${SITE}/publish?live=${live ? 'true' : 'false'}`, {}).then(unwrap)
  },

  setTags(slugs) {
    return api.put(`${SITE}/tags`, { slugs }).then(unwrap)
  },

  /** @returns {Promise<{key: string, url: string}>} */
  uploadImage(file) {
    return upload(`${SITE}/images`, file)
  },

  createProject(project) {
    return api.post(`${SITE}/projects`, project).then(unwrap)
  },

  updateProject(id, project) {
    return api.put(`${SITE}/projects/${encodeURIComponent(id)}`, project).then(unwrap)
  },

  deleteProject(id) {
    return api.del(`${SITE}/projects/${encodeURIComponent(id)}`)
  },

  reorderProjects(ids) {
    return api.put(`${SITE}/projects/order`, { ids }).then(unwrap)
  },

  addProjectPhoto(id, file, caption) {
    return upload(`${SITE}/projects/${encodeURIComponent(id)}/media`, file, { caption })
  },

  removeProjectPhoto(id, mediaId) {
    return api.del(`${SITE}/projects/${encodeURIComponent(id)}/media/${encodeURIComponent(mediaId)}`).then(unwrap)
  },

  /** The published site, as a visitor sees it. A draft is a 404. */
  publicSite(slug, locale) {
    return api.get(`/public/agencies/${encodeURIComponent(slug)}`, { params: { locale } }).then(unwrap)
  },

  /** Always answers `{ received: true }`, whether the request was kept or dropped as a bot's. */
  sendInquiry(slug, form) {
    return api.post(`/public/agencies/${encodeURIComponent(slug)}/inquiries`, form).then(unwrap)
  },

  /** The shared tags an agency may pick from. */
  tagCatalog(locale) {
    return api.get('/public/tags', { params: { locale } }).then(unwrap)
  },
}

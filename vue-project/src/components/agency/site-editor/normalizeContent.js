/**
 * The content document in the one shape the editor edits: every block an
 * object and every list an array, whatever the server left null.
 *
 * <p>A deep copy, so editing the draft never touches the saved view.
 */
const BLOCKS = ['hero', 'services', 'projects', 'statement', 'process', 'formats', 'contact']
const LISTS = ['keywords', 'serviceItems', 'chapters', 'steps', 'formatItems']

export function normalizeContent(content) {
  const copy = JSON.parse(JSON.stringify(content || {}))
  for (const key of BLOCKS) copy[key] = copy[key] || {}
  for (const key of LISTS) copy[key] = Array.isArray(copy[key]) ? copy[key] : []
  return copy
}

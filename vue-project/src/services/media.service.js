import axios from 'axios'

const API = '/api/events'

export default {
  upload(eventId, formData) {
    return axios.post(
      `${API}/${eventId}/media`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
  }
}

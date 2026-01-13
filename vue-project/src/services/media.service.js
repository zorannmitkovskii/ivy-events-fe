import axios from 'axios'
import { baseUrl } from './baseUrl'

const API = `${baseUrl}/v1/api/events`

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

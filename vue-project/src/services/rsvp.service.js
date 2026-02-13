import backendApi from '@/services/backendApi';

/**
 * Maps RSVP form data to the backend GuestCreateDto.
 * Handles both shared RsvpForm format (guests array) and SunsetGlass format (fullNames array).
 */
function mapFormToDto(eventId, formData) {
  const guestEntries = formData.guests
    ? formData.guests
        .filter(g => g.fullName && g.fullName.trim())
        .map(g => ({ name: g.fullName.trim(), isChild: g.isChild ?? false }))
    : (formData.fullNames || [])
        .filter(n => n && n.trim())
        .map(n => ({ name: n.trim(), isChild: false }));

  const isAccepted = formData.attendance === 'accept' || formData.attendance === 'yes';

  return {
    eventId,
    guests: guestEntries,
    note: (formData.message || '').trim() || null,
    contact: {
      email: formData.email || null,
      phone: formData.phone || null,
    },
    tableNumber: null,
    dietaryPreferences: formData.dietary ? formData.dietary.toUpperCase() : null,
    notificationType: formData.notificationType ? formData.notificationType.toUpperCase() : null,
    inviteStatus: isAccepted ? 'CONFIRMED' : 'DECLINED',
    checkInStatus: false,
  };
}

export const rsvpService = {
  async submitRsvp(eventId, formData) {
    const dto = mapFormToDto(eventId, formData);
    const res = await backendApi.post('/public/guests', dto, {
      params: { eventId }
    });
    return res.data;
  },
};

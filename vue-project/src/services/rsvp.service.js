import publicApi from '@/services/backendApi';

export const rsvpService = {
  async submitRsvp(eventId, formData) {
    // Build guest entries from RsvpForm format
    const guestEntries = formData.guests
      ? formData.guests
          .filter(g => g.fullName && g.fullName.trim())
          .map(g => ({
            name: g.fullName.trim(),
            isChild: g.isChild ?? false,
            dietary: g.dietary || null,
          }))
      : (formData.fullNames || [])
          .filter(n => n && n.trim())
          .map(n => ({ name: n.trim(), isChild: false, dietary: null }));

    const isAccepted = formData.attendance === 'accept' || formData.attendance === 'yes';

    const payload = {
      eventId,
      guests: guestEntries,
      email: formData.email || null,
      phoneNumber: formData.phone || null,
      note: (formData.message || '').trim() || null,
      tableNumber: null,
      notificationType: formData.notificationType ? formData.notificationType.toUpperCase() : null,
      inviteStatus: isAccepted ? 'CONFIRMED' : 'DECLINED',
      numOfGuests: guestEntries.length,
      rsvpDate: null,
      isVip: false,
      checkInStatus: false,
    };

    const response = await publicApi.post('/public/guests', payload);
    return response.data;
  },
};

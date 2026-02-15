import { api } from '@/services/api';

export const rsvpService = {
  async submitRsvp(eventId, formData) {
    // Build guest entries from either shared RsvpForm format or SunsetGlass format
    const guestEntries = formData.guests
      ? formData.guests
          .filter(g => g.fullName && g.fullName.trim())
          .map(g => ({ name: g.fullName.trim(), isChild: g.isChild ?? false }))
      : (formData.fullNames || [])
          .filter(n => n && n.trim())
          .map(n => ({ name: n.trim(), isChild: false }));

    const isAccepted = formData.attendance === 'accept' || formData.attendance === 'yes';

    const payload = {
      eventId,
      guests: guestEntries,
      note: (formData.message || '').trim() || null,
      email: formData.email || null,
      phone: formData.phone || null,
      dietaryPreferences: formData.dietary ? formData.dietary.toUpperCase() : null,
      notificationType: formData.notificationType ? formData.notificationType.toUpperCase() : null,
      inviteStatus: isAccepted ? 'CONFIRMED' : 'DECLINED',
    };

    return api.post('/guests', payload);
  },
};

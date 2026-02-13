export function getDemoOverview() {
  return {
    event: {
      name: "Eleanor & James Wedding",
      date: "October 14, 2024",
      rawDate: "2024-10-14T14:00:00",
      daysLeft: 45,
      status: "PLANNING"
    },
    overview: {
      totalGuests: 142,
      guestsMeta: [
        { label: "Adults", value: 128 },
        { label: "Children", value: 14 }
      ],
      tablesAssigned: 12,
      tablesTotal: 15,
      assignedGuests: 98,
      totalGuestsForTables: 142,
      budget: {
        used: 24500,
        total: 30000,
        remaining: 5500,
        currency: "EUR",
        items: [
          { name: "Venue & Catering", used: 15200, limit: 18000 },
          { name: "Decor & Florals", used: 4100, limit: 5000 }
        ]
      },
      rsvp: {
        total: 185,
        comming: 142,
        maybe: 12,
        decline: 8,
        waiting: 23
      },
      tasks: [
        {
          id: 1,
          title: "Finalize menu selection",
          note: "Confirm vegetarian options",
          due: "Due Today"
        },
        {
          id: 2,
          title: "Send seating chart",
          note: "Waiting for RSVP",
          due: "Due Tomorrow"
        }
      ],
      galleryImages: [],
      progress: 85,
      progressMessage:
        "You have completed 85% of your tasks. Next milestone is final fitting."
    }
  };
}

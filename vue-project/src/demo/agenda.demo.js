export function getDemoAgenda(eventId = "demo") {
  return {
    eventId,
    date: "2024-10-24",
    items: [
      {
        id: "a1",
        start: "14:00",
        end: "15:00",
        status: "completed",
        title: "Vendor Setup & Registration",
        location: "Grand Ballroom",
        responsible: "Mike T.",
        visibility: "everyone",
        notes: "Ensure badges, registration desk, and vendor tables are ready."
      },
      {
        id: "a2",
        start: "15:30",
        end: "16:30",
        status: "in_progress",
        title: "Welcome Reception",
        location: "Foyer",
        responsible: "Sarah J.",
        visibility: "everyone",
        notes:
          "Guests arriving, serving champagne and light hors d'oeuvres. Ensure background music is at 40% volume."
      },
      {
        id: "a3",
        start: "16:30",
        end: "17:15",
        status: "upcoming",
        title: "Opening Keynote",
        location: "Main Stage",
        responsible: "Dr. Alistair",
        visibility: "everyone",
        notes: ""
      },
      {
        id: "a4",
        start: "17:15",
        end: "17:30",
        status: "break",
        title: "Coffee Transition",
        location: "Hallway B",
        responsible: "",
        visibility: "team",
        notes: ""
      }
    ]
  };
}

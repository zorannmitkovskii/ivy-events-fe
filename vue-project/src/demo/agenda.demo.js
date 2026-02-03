export function getAgendaDemo() {
  return {
    eventName: "The Annual Gala",
    dateLabel: "Friday, October 24",
    totalDuration: "6h 30m",
    items: [
      {
        id: "a1",
        start: "14:00",
        end: "15:00",
        status: "completed",
        title: "Vendor Setup & Registration",
        description: "",
        location: "Grand Ballroom",
        responsible: "Mike T.",
        visibility: "everyone",
        tags: []
      },
      {
        id: "a2",
        start: "15:30",
        end: "16:30",
        status: "in_progress",
        title: "Welcome Reception",
        description: "Guests arriving, serving champagne and light hors d’oeuvres. Ensure background music is at 40% volume.",
        location: "Foyer",
        responsible: "Sarah J.",
        visibility: "everyone",
        tags: ["Now"]
      },
      {
        id: "a3",
        start: "16:30",
        end: "17:15",
        status: "upcoming",
        title: "Opening Keynote",
        description: "",
        location: "Main Stage",
        responsible: "Dr. Alistair",
        visibility: "everyone",
        tags: ["Overlap"]
      },
      {
        id: "a4",
        start: "17:15",
        end: "17:30",
        status: "break",
        title: "Coffee Transition",
        description: "",
        location: "Hallway B",
        responsible: "",
        visibility: "everyone",
        tags: []
      }
    ]
  };
}

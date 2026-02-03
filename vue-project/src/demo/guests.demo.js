export function getDemoGuests(eventId = "demo") {
  return {
    eventId,
    tables: [
      { id: "t1", name: "Table 1", capacity: 8, assigned: 6 },
      { id: "t2", name: "Table 2", capacity: 10, assigned: 4 },
      { id: "t3", name: "Table 3", capacity: 8, assigned: 2 }
    ],
    items: [
      { id: "g1", name: "Sarah Johnson", email: "sarah.j@email.com", status: "accepted", plus: 1, tableId: "t1", note: "Seat A3" },
      { id: "g2", name: "Michael Chen", email: "m.chen@email.com", status: "accepted", plus: 0, tableId: "t1", note: "Seat A4" },
      { id: "g3", name: "Emily Rodriguez", email: "emily.r@email.com", status: "pending", plus: 2, tableId: null, note: "" },
      { id: "g4", name: "David Thompson", email: "d.thompson@email.com", status: "declined", plus: 1, tableId: null, note: "" }
    ],
    totals: { total: 42, accepted: 30, pending: 8, declined: 4 }
  };
}

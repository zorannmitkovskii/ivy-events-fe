export function getDemoTablesSeating() {
  const tables = [
    { id: "t1", name: "Table 1", capacity: 8, assigned: 6 },
    { id: "t2", name: "Table 2", capacity: 10, assigned: 4 },
    { id: "t3", name: "Table 3", capacity: 6, assigned: 6 }
  ];

  const guests = [
    { id: "g1", name: "Sarah Mitchell", tableId: "t1", status: "confirmed" },
    { id: "g2", name: "John Davidson", tableId: "t1", status: "confirmed" },
    { id: "g3", name: "Emily Rodriguez", tableId: "t1", status: "pending" },
    { id: "g4", name: "Michael Stevens", tableId: "t1", status: "confirmed" },
    { id: "g5", name: "Jessica Chen", tableId: "t2", status: "confirmed" },
    { id: "g6", name: "David Park", tableId: "t2", status: "pending" },
    { id: "g7", name: "Amanda Wilson", tableId: "t2", status: "confirmed" },
    { id: "g8", name: "Robert Taylor", tableId: "t3", status: "confirmed" },
    { id: "g9", name: "Lisa Anderson", tableId: "t3", status: "confirmed" },
    { id: "g10", name: "Christopher Lee", tableId: "t3", status: "pending" }
  ];

  return { tables, guests };
}

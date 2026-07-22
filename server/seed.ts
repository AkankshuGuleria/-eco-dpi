import Incident from "./models/Incident.js";

const seedIncidents = [
  { incidentId: "INC-1024", category: "Water logging", sector: "Sector 35", lat: 30.7198, lng: 76.7644, reports: 41, priority: 5, status: "Active" as const, updated: "10 min ago" },
  { incidentId: "INC-1025", category: "Potholes", sector: "Sector 17", lat: 30.7398, lng: 76.7827, reports: 28, priority: 4, status: "In progress" as const, updated: "18 min ago" },
  { incidentId: "INC-1026", category: "Garbage dump", sector: "Sector 22", lat: 30.7333, lng: 76.7794, reports: 18, priority: 3, status: "Active" as const, updated: "34 min ago" },
  { incidentId: "INC-1027", category: "Broken street light", sector: "Sector 43", lat: 30.7132, lng: 76.7504, reports: 9, priority: 2, status: "Resolved" as const, updated: "1 hr ago" },
  { incidentId: "INC-1028", category: "Air quality spike", sector: "Sector 26", lat: 30.7478, lng: 76.8059, reports: 22, priority: 4, status: "Active" as const, updated: "43 min ago" },
  { incidentId: "INC-1029", category: "Sewage overflow", sector: "Sector 15", lat: 30.7489, lng: 76.7722, reports: 14, priority: 3, status: "In progress" as const, updated: "55 min ago" },
];

export async function seedDatabase() {
  const count = await Incident.countDocuments();
  if (count > 0) {
    console.log(`[seed] Database already has ${count} incidents — skipping seed.`);
    return;
  }

  await Incident.insertMany(seedIncidents);
  console.log(`[seed] Seeded ${seedIncidents.length} demo incidents.`);
}

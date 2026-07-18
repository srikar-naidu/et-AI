async function seed() {
  console.log("Seeding database...");
  const response = await fetch("http://localhost:3000/api/seed/demo-data", {
    method: "POST"
  });
  console.log("Seed Status:", response.status);
  const data = await response.json();
  console.log("Seed Response:", JSON.stringify(data, null, 2));
}

seed();

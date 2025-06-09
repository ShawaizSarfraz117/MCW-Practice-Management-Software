import { v4 as uuidv4 } from "uuid";

export async function seedTags(prisma) {
  console.log('Seeding tags...');
  
  
  const tags = [
    {
      id: uuidv4(),
      name: "Appointment Paid",
      color: "#10b981" // Green
    },
    {
      id: uuidv4(),
      name: "Appointment Unpaid",
      color: "#ef4444" // Red
    },
    {
      id: uuidv4(),
      name: "New Client",
      color: "#3b82f6" // Blue
    },
    {
      id: uuidv4(),
      name: "No Note",
      color: "#f59e0b" // Amber
    },
    {
      id: uuidv4(),
      name: "Note Added",
      color: "#22c55e" // Light Green
    }
  ];

  const createdTags = [];
  
  for (const tag of tags) {
    const created = await prisma.tag.upsert({
      where: { id: tag.id },
      update: {},
      create: tag
    });
    createdTags.push(created);
    console.log(`Created tag: ${created.name}`);
  }
  
  console.log("Successfully created all tags");
  return { tags: createdTags };
}
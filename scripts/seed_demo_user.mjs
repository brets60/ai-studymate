import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = "student@school.edu";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("User already exists:", existing.email);
    return;
  }

  const hashedPassword = await bcrypt.hash("SecureStudentPass123!", 10);

  const user = await prisma.user.create({
    data: {
      fullName: "Alex Rivera",
      email: email,
      password: hashedPassword,
      educationLevel: "College / University",
      settings: {
        create: {
          theme: "light",
          dailyStudyGoal: 60,
          notificationPreferences: JSON.stringify({ email: true, deadlines: true, reminders: true })
        }
      },
      subjects: {
        create: [
          {
            name: "Computer Science",
            description: "Algorithms, Data Structures & Web Architecture",
            color: "#2563eb"
          },
          {
            name: "Business Administration",
            description: "Financial Management & Strategic Planning",
            color: "#16a34a"
          }
        ]
      }
    },
    include: {
      subjects: true
    }
  });

  console.log("Successfully seeded demo user in Neon PostgreSQL:", user.email);
  console.log("User ID:", user.id);
  console.log("Created subjects:", user.subjects.map(s => s.name).join(", "));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

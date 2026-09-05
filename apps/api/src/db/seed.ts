import { db } from "./index.js";
import { users, contexts } from "./schema.js";

const DEV_USER_EMAIL = "dev@priori.local";
const DEFAULT_CONTEXTS = ["Learning", "Creativity", "Projects", "Physical"];

async function seed() {
  const [user] = await db
    .insert(users)
    .values({ email: DEV_USER_EMAIL })
    .onConflictDoNothing()
    .returning();

  if (!user) {
    console.log(`User ${DEV_USER_EMAIL} already exists, skipping contexts.`);
    return;
  }

  await db
    .insert(contexts)
    .values(DEFAULT_CONTEXTS.map((name, i) => ({ userId: user.id, name, slideIndex: i })))
    .onConflictDoNothing();

  console.log(`Seeded user ${DEV_USER_EMAIL} with ${DEFAULT_CONTEXTS.length} default contexts.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

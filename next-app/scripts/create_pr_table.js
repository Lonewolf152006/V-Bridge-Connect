const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS team_pull_requests (
      id SERIAL PRIMARY KEY,
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      branch TEXT NOT NULL,
      target_branch TEXT NOT NULL DEFAULT 'main',
      author_id UUID REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      author_avatar TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      comments_count INT NOT NULL DEFAULT 0,
      reviewers JSONB NOT NULL DEFAULT '[]'::jsonb,
      labels JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('team_pull_requests table created or verified successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

-- ==============================================================================
-- VBridgeConnect — Complete Supabase PostgreSQL Schema Setup Query
-- ==============================================================================
-- Compatible with Supabase SQL Editor and Prisma ORM
-- Roles: student, coordinator, industry_partner, super_admin
-- (Faculty Mentor & External Reviewer removed, responsibilities absorbed by Coordinator)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create ENUM types safely (idempotent DO blocks)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('student', 'coordinator', 'industry_partner', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "ActivityStatus" AS ENUM (
        'draft', 'awaiting_approval', 'published', 'applications_closed',
        'active', 'under_final_review', 'completed', 'cancelled', 'archived'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "ApplicationStatus" AS ENUM (
        'draft', 'submitted', 'under_review', 'shortlisted',
        'selected', 'waitlisted', 'rejected', 'withdrawn'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "MilestoneStatus" AS ENUM (
        'not_started', 'in_progress', 'blocked', 'submitted',
        'changes_requested', 'accepted', 'overdue', 'waived'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "SubmissionStatus" AS ENUM (
        'draft', 'submitted', 'under_review', 'changes_requested',
        'accepted', 'invalid', 'evaluated'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "TeamRiskStatus" AS ENUM ('on_track', 'watch', 'at_risk', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "CertificateType" AS ENUM ('platform_issued', 'self_reported');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "CertificateStatus" AS ENUM (
        'not_eligible', 'eligible', 'issued', 'revoked', 'posted', 'removed'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "ConversationType" AS ENUM ('group', 'direct');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "TeamMemberRole" AS ENUM ('lead', 'contributor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- 3. Create Tables
-- ==============================================================================

-- Colleges
CREATE TABLE IF NOT EXISTS "colleges" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE IF NOT EXISTS "departments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "collegeId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Terms / Academic Semesters
CREATE TABLE IF NOT EXISTS "terms" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMPTZ NOT NULL,
    "endDate" TIMESTAMPTZ NOT NULL,
    "departmentId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "departmentId" UUID,
    "avatarUrl" TEXT,
    "institutionalId" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Activities (Projects, Hackathons, Research, Capstones)
CREATE TABLE IF NOT EXISTS "activities" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'draft',
    "departmentId" UUID NOT NULL,
    "termId" UUID,
    "ownerId" UUID NOT NULL,
    "capacity" INTEGER NOT NULL,
    "filledSeats" INTEGER NOT NULL DEFAULT 0,
    "teamSizeMin" INTEGER NOT NULL DEFAULT 1,
    "teamSizeMax" INTEGER NOT NULL DEFAULT 5,
    "applicationDeadline" TIMESTAMPTZ,
    "startDate" TIMESTAMPTZ,
    "endDate" TIMESTAMPTZ,
    "visibility" TEXT NOT NULL DEFAULT 'department',
    "eligibility" JSONB,
    "participationMode" TEXT NOT NULL DEFAULT 'team',
    "autoActivateOnClose" BOOLEAN NOT NULL DEFAULT false,
    "certificateEligible" BOOLEAN NOT NULL DEFAULT true,
    "cancellationReason" TEXT,
    "archiveReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Applications (FR-010 to FR-015)
CREATE TABLE IF NOT EXISTS "applications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "activityId" UUID NOT NULL,
    "applicantId" UUID NOT NULL,
    "teamId" UUID,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'draft',
    "answers" JSONB,
    "statementOfPurpose" TEXT,
    "portfolioUrl" TEXT,
    "reviewerId" UUID,
    "reviewerNote" TEXT,
    "decisionNote" TEXT,
    "withdrawalReason" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Teams (FR-020 to FR-024)
CREATE TABLE IF NOT EXISTS "teams" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "activityId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "riskStatus" "TeamRiskStatus" NOT NULL DEFAULT 'on_track',
    "riskReason" TEXT,
    "lastActivityAt" TIMESTAMPTZ,
    "inactivityWindowDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Team Memberships (FR-023: Role, join & removal audit)
CREATE TABLE IF NOT EXISTS "team_memberships" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "teamId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'contributor',
    "reason" TEXT,
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMPTZ,
    "removeReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Milestones (FR-040 to FR-045)
CREATE TABLE IF NOT EXISTS "milestones" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "activityId" UUID NOT NULL,
    "teamId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stageNumber" INTEGER NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'not_started',
    "dueDate" TIMESTAMPTZ NOT NULL,
    "effectiveDueDate" TIMESTAMPTZ,
    "weightage" INTEGER NOT NULL DEFAULT 0,
    "deliverableType" TEXT NOT NULL DEFAULT 'any',
    "requiresMentorReview" BOOLEAN NOT NULL DEFAULT true,
    "blockReason" TEXT,
    "blockCategory" TEXT,
    "waiveReason" TEXT,
    "extensionReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Submissions (FR-050 to FR-055: Immutable versioning)
CREATE TABLE IF NOT EXISTS "submissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "milestoneId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "submittedById" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'draft',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSizeBytes" INTEGER,
    "checksumSha256" TEXT,
    "externalUrl" TEXT,
    "studentNote" TEXT,
    "lateSubmissionReason" TEXT,
    "reviewerId" UUID,
    "reviewerPublicFeedback" TEXT,
    "reviewerPrivateNote" TEXT,
    "reviewedAt" TIMESTAMPTZ,
    "rubricScores" JSONB,
    "totalScore" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Certificates (FR-110 to FR-117: Tamper-evident credentials)
CREATE TABLE IF NOT EXISTS "certificates" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" "CertificateType" NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'not_eligible',
    "studentId" UUID NOT NULL,
    "activityId" UUID,
    "activityTitle" TEXT NOT NULL,
    "issueDate" TIMESTAMPTZ,
    "verificationHash" TEXT,
    "issuedById" UUID,
    "externalProvider" TEXT,
    "externalFileUrl" TEXT,
    "revokedById" UUID,
    "revokedAt" TIMESTAMPTZ,
    "revocationReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Conversations (FR-120 to FR-126: Chat threads)
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" "ConversationType" NOT NULL,
    "name" TEXT,
    "activityId" UUID,
    "teamId" UUID,
    "retentionDays" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS "conversation_participants" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Messages (FR-123: Immutable audit trail)
CREATE TABLE IF NOT EXISTS "messages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "linkTo" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit Events (FR-130: Institutional compliance & accreditation audit ledger)
CREATE TABLE IF NOT EXISTS "audit_events" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "actorId" UUID,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "priorValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. Unique Constraints and Indexes
-- ==============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "colleges_code_key" ON "colleges"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "departments_code_key" ON "departments"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "applications_activityId_applicantId_key" ON "applications"("activityId", "applicantId");
CREATE UNIQUE INDEX IF NOT EXISTS "team_memberships_teamId_userId_removedAt_key" ON "team_memberships"("teamId", "userId", "removedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "submissions_milestoneId_version_key" ON "submissions"("milestoneId", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "certificates_verificationHash_key" ON "certificates"("verificationHash");
CREATE UNIQUE INDEX IF NOT EXISTS "conversation_participants_conversationId_userId_removedAt_key" ON "conversation_participants"("conversationId", "userId", "removedAt");

-- Performance indexes for foreign keys & frequent query filters
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_departmentId" ON "users"("departmentId");
CREATE INDEX IF NOT EXISTS "idx_departments_collegeId" ON "departments"("collegeId");
CREATE INDEX IF NOT EXISTS "idx_terms_departmentId" ON "terms"("departmentId");
CREATE INDEX IF NOT EXISTS "idx_activities_status" ON "activities"("status");
CREATE INDEX IF NOT EXISTS "idx_activities_departmentId" ON "activities"("departmentId");
CREATE INDEX IF NOT EXISTS "idx_activities_ownerId" ON "activities"("ownerId");
CREATE INDEX IF NOT EXISTS "idx_applications_activityId" ON "applications"("activityId");
CREATE INDEX IF NOT EXISTS "idx_applications_applicantId" ON "applications"("applicantId");
CREATE INDEX IF NOT EXISTS "idx_applications_status" ON "applications"("status");
CREATE INDEX IF NOT EXISTS "idx_teams_activityId" ON "teams"("activityId");
CREATE INDEX IF NOT EXISTS "idx_team_memberships_teamId" ON "team_memberships"("teamId");
CREATE INDEX IF NOT EXISTS "idx_team_memberships_userId" ON "team_memberships"("userId");
CREATE INDEX IF NOT EXISTS "idx_milestones_activityId" ON "milestones"("activityId");
CREATE INDEX IF NOT EXISTS "idx_milestones_teamId" ON "milestones"("teamId");
CREATE INDEX IF NOT EXISTS "idx_submissions_milestoneId" ON "submissions"("milestoneId");
CREATE INDEX IF NOT EXISTS "idx_submissions_teamId" ON "submissions"("teamId");
CREATE INDEX IF NOT EXISTS "idx_certificates_studentId" ON "certificates"("studentId");
CREATE INDEX IF NOT EXISTS "idx_conversations_activityId" ON "conversations"("activityId");
CREATE INDEX IF NOT EXISTS "idx_conversations_teamId" ON "conversations"("teamId");
CREATE INDEX IF NOT EXISTS "idx_messages_conversationId" ON "messages"("conversationId");
CREATE INDEX IF NOT EXISTS "idx_notifications_userId_isRead" ON "notifications"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "idx_audit_events_entity" ON "audit_events"("entityType", "entityId");

-- ==============================================================================
-- 5. Foreign Key Constraints (with graceful checks)
-- ==============================================================================

DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "departments" ADD CONSTRAINT "departments_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "terms" ADD CONSTRAINT "terms_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "activities" ADD CONSTRAINT "activities_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "activities" ADD CONSTRAINT "activities_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "activities" ADD CONSTRAINT "activities_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "applications" ADD CONSTRAINT "applications_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "applications" ADD CONSTRAINT "applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "applications" ADD CONSTRAINT "applications_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "applications" ADD CONSTRAINT "applications_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "teams" ADD CONSTRAINT "teams_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "milestones" ADD CONSTRAINT "milestones_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "milestones" ADD CONSTRAINT "milestones_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "submissions" ADD CONSTRAINT "submissions_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "submissions" ADD CONSTRAINT "submissions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "certificates" ADD CONSTRAINT "certificates_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "certificates" ADD CONSTRAINT "certificates_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "certificates" ADD CONSTRAINT "certificates_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

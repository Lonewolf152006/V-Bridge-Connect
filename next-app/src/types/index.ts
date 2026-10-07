// ─── Core Domain Types for VBridgeConnect ───────────────────────────────────
// These types map 1:1 with PRD entities and state machine enums (Section 9).
// Enum string values match the DB column names in the Prisma schema.

export type UserRole =
  | 'STUDENT'
  | 'COORDINATOR'
  | 'INDUSTRY_PARTNER'
  | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  institutionalId?: string; // PRN / Employee ID
  isOnline?: boolean;
}

export type ActivityStatus =
  | 'DRAFT'
  | 'OPEN_FOR_APPLICATIONS'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'ARCHIVED';

export type ActivityCategory =
  | 'CAPSTONE'
  | 'RESEARCH'
  | 'HACKATHON'
  | 'INTERNSHIP'
  | 'INDUSTRY_PROJECT';

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  status: ActivityStatus;
  department: string;
  capacity: number;
  filledSeats: number;
  teamSizeMin: number;
  teamSizeMax: number;
  applicationDeadline: string;
  prerequisites: string[];
  supervisorId: string;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'SHORTLISTED'
  | 'WAITLISTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface Application {
  id: string;
  activityId: string;
  studentId: string;
  student?: User;
  status: ApplicationStatus;
  statementOfPurpose: string;
  portfolioUrl?: string;
  gpa?: number;
  reviewerNotes?: string;
  submittedAt: string;
  updatedAt: string;
}

export type TeamRiskLevel = 'ON_TRACK' | 'NEEDS_ATTENTION' | 'AT_RISK';

export type TeamMemberRole = 'LEAD' | 'CONTRIBUTOR';

export interface TeamMember {
  userId: string;
  user: User;
  role: TeamMemberRole;
  joinedAt: string;
}

export interface Team {
  id: string;
  activityId: string;
  activity?: Activity;
  name: string;
  members: TeamMember[];
  mentorId: string;
  mentor?: User;
  riskLevel: TeamRiskLevel;
  riskReason?: string;
  projectTitle?: string;
  projectDescription?: string;
  projectDomain?: string;
  projectSource?: 'faculty_assigned' | 'industry_offered' | 'student_proposed';
  projectStatus?: 'proposed' | 'approved' | 'in_progress' | 'completed';
  industryMentorName?: string;
  createdAt: string;
}

export type MilestoneStatus =
  | 'NOT_STARTED'
  | 'OPEN'
  | 'SUBMITTED'
  | 'CHANGES_REQUESTED'
  | 'ACCEPTED'
  | 'OVERDUE'
  | 'WAIVED';

export type DeliverableType = 'PDF' | 'DOCX' | 'ZIP' | 'GITHUB_URL' | 'FIGMA_URL' | 'DEMO_URL' | 'ANY';

export interface Milestone {
  id: string;
  activityId: string;
  teamId?: string;
  title: string;
  description: string;
  stageNumber: number;
  status: MilestoneStatus;
  dueDate: string;
  weightage: number;
  deliverableType: DeliverableType;
  rubricCriteria?: RubricCriterion[];
  latestSubmission?: Submission;
  mentorFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  milestoneId: string;
  teamId: string;
  submittedById: string;
  submittedBy?: User;
  version: number;
  fileUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  checksumSha256?: string;
  externalUrl?: string;
  studentNote?: string;
  submittedAt: string;
  rubricScores?: RubricScore[];
  status?: string;
  reviewerPublicFeedback?: string;
  reviewerPrivateNote?: string;
  totalScore?: number;
  maxScore?: number;
  mentorPrivateNote?: string;
  mentorPublicFeedback?: string;
  gradedAt?: string;
  gradedById?: string;
}

export interface RubricCriterion {
  id: string;
  milestoneId: string;
  title: string;
  description: string;
  maxPoints: number;
  descriptors?: string[];
}

export interface RubricScore {
  criterionId: string;
  criterion?: RubricCriterion;
  score: number;
  evaluatorId: string;
}

export interface RubricEvaluation {
  submissionId: string;
  scores: RubricScore[];
  totalPoints: number;
  maxPoints: number;
  percentageScore: number;
  letterGrade: string;
  privateNote: string;
  publicFeedback: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REQUEST_CHANGES' | 'ACCEPTED';
}

export type CertificateType = 'PLATFORM_ISSUED' | 'SELF_REPORTED';

export interface Certificate {
  id: string;
  type: CertificateType;
  studentId: string;
  student?: User;
  activityId?: string;
  activityTitle: string;
  issueDate: string;
  verificationHash?: string;
  verificationUrl?: string;
  blockNumber?: string;
  signatories?: string[];
  qrCodeUrl?: string;
  externalProvider?: string;
  uploadReceiptUrl?: string;
  isVerifiedByFaculty?: boolean;
  disclaimer?: string;
}

export type ChannelType = 'TEAM_WORKSPACE' | 'DIRECT' | 'ANNOUNCEMENT' | 'OFFICE_HOURS';

export interface MessageChannel {
  id: string;
  type: ChannelType;
  name: string;
  teamId?: string;
  activityId?: string;
  participantIds: string[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  sender?: User;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  sentAt: string;
  isAuditTrailPinned?: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actor?: User;
  entityType: 'ACTIVITY' | 'APPLICATION' | 'MILESTONE' | 'SUBMISSION' | 'CERTIFICATE' | 'USER';
  entityId: string;
  action: string;
  prevState?: string;
  newState?: string;
  reason?: string;
  ipAddress?: string;
  timestampUtc: string;
}

export type NotificationSeverity = 'INFO' | 'WARNING' | 'URGENT';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  isRead: boolean;
  linkTo?: string;
  createdAt: string;
}

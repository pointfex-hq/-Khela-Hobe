-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED', 'DELETED', 'VERIFYING_EMAIL', 'VERIFYING_PHONE', 'PENDING_ROLE_ASSIGNMENT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'ORGANIZER', 'GUARDIAN', 'ADMIN');

-- CreateEnum
CREATE TYPE "PlayerSkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('PENDING', 'PENDING_CONSENT', 'VERIFIED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CareType" AS ENUM ('FULL_TIME', 'PARTIAL_TIME', 'OCCASIONAL');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('QUICK_MATCH', 'ORGANIZED_MATCH');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PROPOSED', 'OPEN', 'FULL', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'ORGANIZER_ONLY');

-- CreateEnum
CREATE TYPE "JoinMode" AS ENUM ('INSTANT_JOIN', 'APPROVAL_REQUIRED', 'WAITLIST');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'WAITLISTED', 'LEFT');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MATCH_JOIN_CONFIRMED', 'MATCH_APPLICATION_RECEIVED', 'MATCH_UPDATED', 'MATCH_CANCELLED', 'SAFETY_ALERT', 'GUARDIAN_LINK_REQUEST', 'GAME_REMINDER', 'GENERAL');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('USER', 'MATCH', 'VENUE', 'COMMENT');

-- CreateEnum
CREATE TYPE "ReportTopic" AS ENUM ('INCORRECT_LOCATION', 'INAPPROPRIATE_CONTENT', 'HATE_SPEECH', 'SPAM', 'HARASSMENT', 'MISCELLANEOUS');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "passwordHash" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "skillLevel" "PlayerSkillLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSport" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "skillLevel" "PlayerSkillLevel" NOT NULL,
    "positions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerSport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerPreference" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "preferredSports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notificationEmail" BOOLEAN NOT NULL DEFAULT true,
    "notificationPush" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyProfile" (
    "id" TEXT NOT NULL,
    "playerProfileId" TEXT NOT NULL,
    "safetyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guardianType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianLinkRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'PENDING',
    "guardianConsent" BOOLEAN NOT NULL DEFAULT false,
    "childConsent" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "linkedProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianLinkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianRelationship" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "permissions" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerGuardianLink" (
    "id" TEXT NOT NULL,
    "playerProfileId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerGuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DependentGuardianLink" (
    "id" TEXT NOT NULL,
    "dependentProfileId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DependentGuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DependentProfile" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "careType" "CareType" NOT NULL DEFAULT 'FULL_TIME',
    "safetyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DependentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "positions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isTurf" BOOLEAN NOT NULL DEFAULT false,
    "coverImageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueImage" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "matchType" "MatchType" NOT NULL,
    "sportId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "venueId" TEXT,
    "location" geography(Point, 4326),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "minimumPlayers" INTEGER NOT NULL,
    "skillLevel" "PlayerSkillLevel" DEFAULT 'INTERMEDIATE',
    "joinMode" "JoinMode" NOT NULL DEFAULT 'INSTANT_JOIN',
    "status" "MatchStatus" NOT NULL DEFAULT 'PROPOSED',
    "visibility" "MatchVisibility" NOT NULL DEFAULT 'PUBLIC',
    "coverImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchImage" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchStatusHistory" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "previousStatus" "MatchStatus" NOT NULL,
    "newStatus" "MatchStatus" NOT NULL,
    "changedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchParticipant" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'CONFIRMED',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchApplication" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "MatchApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentRequirement" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "requiredQuantity" INTEGER NOT NULL,
    "committedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentContribution" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailMatchJoin" BOOLEAN NOT NULL DEFAULT true,
    "emailApplication" BOOLEAN NOT NULL DEFAULT true,
    "emailMatchUpdate" BOOLEAN NOT NULL DEFAULT true,
    "emailSafety" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "topic" "ReportTopic" NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_userId_idx" ON "UserRoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_role_idx" ON "UserRoleAssignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleAssignment_userId_role_key" ON "UserRoleAssignment"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_active_idx" ON "Session"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "player_profiles_userId_key" ON "player_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "player_profiles_city_area_userId_key" ON "player_profiles"("city", "area", "userId");

-- CreateIndex
CREATE INDEX "PlayerSport_playerId_sportId_idx" ON "PlayerSport"("playerId", "sportId");

-- CreateIndex
CREATE INDEX "PlayerSport_playerId_idx" ON "PlayerSport"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSport_playerId_sportId_key" ON "PlayerSport"("playerId", "sportId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPreference_playerId_key" ON "PlayerPreference"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyProfile_playerProfileId_key" ON "SafetyProfile"("playerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyProfile_safetyId_key" ON "SafetyProfile"("safetyId");

-- CreateIndex
CREATE INDEX "SafetyProfile_safetyId_idx" ON "SafetyProfile"("safetyId");

-- CreateIndex
CREATE INDEX "GuardianLinkRequest_guardianId_status_idx" ON "GuardianLinkRequest"("guardianId", "status");

-- CreateIndex
CREATE INDEX "GuardianLinkRequest_childId_status_idx" ON "GuardianLinkRequest"("childId", "status");

-- CreateIndex
CREATE INDEX "GuardianRelationship_guardianId_idx" ON "GuardianRelationship"("guardianId");

-- CreateIndex
CREATE INDEX "GuardianRelationship_childId_idx" ON "GuardianRelationship"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianRelationship_guardianId_childId_active_key" ON "GuardianRelationship"("guardianId", "childId", "active");

-- CreateIndex
CREATE INDEX "PlayerGuardianLink_playerProfileId_idx" ON "PlayerGuardianLink"("playerProfileId");

-- CreateIndex
CREATE INDEX "PlayerGuardianLink_guardianId_idx" ON "PlayerGuardianLink"("guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGuardianLink_playerProfileId_guardianId_key" ON "PlayerGuardianLink"("playerProfileId", "guardianId");

-- CreateIndex
CREATE INDEX "DependentGuardianLink_dependentProfileId_idx" ON "DependentGuardianLink"("dependentProfileId");

-- CreateIndex
CREATE INDEX "DependentGuardianLink_guardianId_idx" ON "DependentGuardianLink"("guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "DependentGuardianLink_dependentProfileId_guardianId_key" ON "DependentGuardianLink"("dependentProfileId", "guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "DependentProfile_safetyId_key" ON "DependentProfile"("safetyId");

-- CreateIndex
CREATE INDEX "DependentProfile_guardianId_idx" ON "DependentProfile"("guardianId");

-- CreateIndex
CREATE INDEX "DependentProfile_safetyId_idx" ON "DependentProfile"("safetyId");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_name_key" ON "Sport"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_slug_key" ON "Sport"("slug");

-- CreateIndex
CREATE INDEX "Sport_active_idx" ON "Sport"("active");

-- CreateIndex
CREATE INDEX "Venue_city_idx" ON "Venue"("city");

-- CreateIndex
CREATE INDEX "VenueImage_venueId_idx" ON "VenueImage"("venueId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_organizerId_idx" ON "Match"("organizerId");

-- CreateIndex
CREATE INDEX "Match_sportId_city_idx" ON "Match"("sportId", "city");

-- CreateIndex
CREATE INDEX "Match_startTime_idx" ON "Match"("startTime");

-- CreateIndex
CREATE INDEX "Match_latitude_longitude_idx" ON "Match"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "MatchImage_matchId_idx" ON "MatchImage"("matchId");

-- CreateIndex
CREATE INDEX "MatchStatusHistory_matchId_idx" ON "MatchStatusHistory"("matchId");

-- CreateIndex
CREATE INDEX "MatchStatusHistory_createdAt_idx" ON "MatchStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "MatchParticipant_matchId_status_idx" ON "MatchParticipant"("matchId", "status");

-- CreateIndex
CREATE INDEX "MatchParticipant_userId_idx" ON "MatchParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchParticipant_matchId_userId_leftAt_key" ON "MatchParticipant"("matchId", "userId", "leftAt");

-- CreateIndex
CREATE INDEX "MatchApplication_matchId_status_idx" ON "MatchApplication"("matchId", "status");

-- CreateIndex
CREATE INDEX "MatchApplication_userId_idx" ON "MatchApplication"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchApplication_matchId_userId_key" ON "MatchApplication"("matchId", "userId");

-- CreateIndex
CREATE INDEX "EquipmentRequirement_matchId_idx" ON "EquipmentRequirement"("matchId");

-- CreateIndex
CREATE INDEX "EquipmentContribution_requirementId_idx" ON "EquipmentContribution"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentContribution_requirementId_userId_key" ON "EquipmentContribution"("requirementId", "userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "Report_targetType_targetId_status_idx" ON "Report"("targetType", "targetId", "status");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGuardianLink" ADD CONSTRAINT "PlayerGuardianLink_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "player_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGuardianLink" ADD CONSTRAINT "PlayerGuardianLink_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DependentGuardianLink" ADD CONSTRAINT "DependentGuardianLink_dependentProfileId_fkey" FOREIGN KEY ("dependentProfileId") REFERENCES "DependentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DependentGuardianLink" ADD CONSTRAINT "DependentGuardianLink_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

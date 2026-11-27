import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_USER_IDS = [
  'seed_user_admin',
  'seed_user_organizer',
  'seed_user_guardian',
  'seed_user_player1',
  'seed_user_player2',
];

const SEED_VENUE_IDS = [
  'seed_venue_banani',
  'seed_venue_dhanmondi',
  'seed_venue_uttara',
];

const SEED_MATCH_IDS = [
  'seed_match_futsal',
  'seed_match_badminton',
  'seed_match_cricket',
  'seed_match_basketball',
];

const DEFAULT_SPORTS = [
  {
    name: 'Football & Futsal',
    slug: 'football-futsal',
    iconUrl: '⚽',
    description: '5v5, 7v7, and 11v11 turf & grass football games.',
    playerCountMin: 10,
    playerCountMax: 22,
    active: true,
  },
  {
    name: 'Badminton',
    slug: 'badminton',
    iconUrl: '🏸',
    description: 'Singles and doubles indoor & outdoor court sessions.',
    playerCountMin: 2,
    playerCountMax: 4,
    active: true,
  },
  {
    name: 'Cricket',
    slug: 'cricket',
    iconUrl: '🏏',
    description: 'Tape ball, box cricket, and turf T10/T20 matches.',
    playerCountMin: 12,
    playerCountMax: 22,
    active: true,
  },
  {
    name: 'Basketball',
    slug: 'basketball',
    iconUrl: '🏀',
    description: 'Half-court 3v3 and full-court 5v5 pickup runs.',
    playerCountMin: 6,
    playerCountMax: 10,
    active: true,
  },
  {
    name: 'Table Tennis',
    slug: 'table-tennis',
    iconUrl: '🏓',
    description: 'Competitive singles and doubles indoor table tennis.',
    playerCountMin: 2,
    playerCountMax: 4,
    active: true,
  },
];

async function clearSeedData() {
  await prisma.notification.deleteMany({
    where: { OR: [{ id: { startsWith: 'seed_' } }, { userId: { in: SEED_USER_IDS } }] },
  });
  await prisma.report.deleteMany({
    where: { OR: [{ id: { startsWith: 'seed_' } }, { reporterId: { in: SEED_USER_IDS } }] },
  });
  await prisma.safetyAlert.deleteMany({
    where: { OR: [{ id: { startsWith: 'seed_' } }, { guardianId: { in: SEED_USER_IDS } }] },
  });
  await prisma.childSafetySettings.deleteMany({
    where: { OR: [{ guardianId: { in: SEED_USER_IDS } }, { childId: { in: SEED_USER_IDS } }] },
  });
  await prisma.guardianRelationship.deleteMany({
    where: { OR: [{ guardianId: { in: SEED_USER_IDS } }, { childId: { in: SEED_USER_IDS } }] },
  });
  await prisma.guardianLinkRequest.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'seed_' } },
        { guardianId: { in: SEED_USER_IDS } },
        { childId: { in: SEED_USER_IDS } },
      ],
    },
  });
  await prisma.equipmentContribution.deleteMany({
    where: { userId: { in: SEED_USER_IDS } },
  });
  await prisma.equipmentRequirement.deleteMany({
    where: { OR: [{ id: { startsWith: 'seed_' } }, { matchId: { in: SEED_MATCH_IDS } }] },
  });
  await prisma.matchStatusHistory.deleteMany({
    where: { matchId: { in: SEED_MATCH_IDS } },
  });
  await prisma.matchApplication.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'seed_' } },
        { matchId: { in: SEED_MATCH_IDS } },
        { userId: { in: SEED_USER_IDS } },
      ],
    },
  });
  await prisma.matchParticipant.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'seed_' } },
        { matchId: { in: SEED_MATCH_IDS } },
        { userId: { in: SEED_USER_IDS } },
      ],
    },
  });
  await prisma.equipmentItem.deleteMany({
    where: { OR: [{ id: { startsWith: 'seed_' } }, { ownerId: { in: SEED_USER_IDS } }] },
  });
  await prisma.paymentTransaction.deleteMany({
    where: { OR: [{ referenceId: { in: SEED_MATCH_IDS } }, { userId: { in: SEED_USER_IDS } }] },
  });
  await prisma.match.deleteMany({
    where: { OR: [{ id: { in: SEED_MATCH_IDS } }, { organizerId: { in: SEED_USER_IDS } }] },
  });
  await prisma.venue.deleteMany({
    where: { OR: [{ id: { in: SEED_VENUE_IDS } }, { ownerId: { in: SEED_USER_IDS } }] },
  });
  await prisma.user.deleteMany({
    where: { id: { in: SEED_USER_IDS } },
  });
}

async function seedDemoData() {
  await clearSeedData();

  // 1. Ensure real sports catalog exists
  for (const sport of DEFAULT_SPORTS) {
    await prisma.sport.upsert({
      where: { slug: sport.slug },
      update: { active: true },
      create: sport,
    });
  }

  const sports = await prisma.sport.findMany();
  const bySlug = new Map(sports.map((s) => [s.slug, s]));
  const football = bySlug.get('football-futsal') || sports[0];
  const badminton = bySlug.get('badminton') || sports[0];
  const cricket = bySlug.get('cricket') || sports[0];
  const basketball = bySlug.get('basketball') || sports[0];

  const passwordHash = await bcrypt.hash('Test@1234', 12);

  // 2. Role-based test users (including ADMIN)
  const usersSpec = [
    {
      id: 'seed_user_admin',
      fullName: 'Test Admin',
      email: 'admin@khelahobe.test',
      phoneNumber: '+8801700000100',
      city: 'Dhaka',
      area: 'Gulshan',
      bio: 'Platform administration test account.',
      skillLevel: 'INTERMEDIATE',
      roles: ['ADMIN', 'PLAYER'],
      safetyId: 'KH-ADMIN01',
    },
    {
      id: 'seed_user_organizer',
      fullName: 'Test Organizer',
      email: 'organizer@khelahobe.test',
      phoneNumber: '+8801700000101',
      city: 'Dhaka',
      area: 'Banani',
      bio: 'Local turf & indoor court match organizer.',
      skillLevel: 'ADVANCED',
      roles: ['ORGANIZER', 'PLAYER'],
      safetyId: 'KH-ORGNZ01',
    },
    {
      id: 'seed_user_guardian',
      fullName: 'Test Guardian',
      email: 'guardian@khelahobe.test',
      phoneNumber: '+8801700000102',
      city: 'Dhaka',
      area: 'Dhanmondi',
      bio: 'Guardian test account monitoring linked youth athlete.',
      skillLevel: 'INTERMEDIATE',
      roles: ['GUARDIAN', 'PLAYER'],
      safetyId: 'KH-GUARD01',
    },
    {
      id: 'seed_user_player1',
      fullName: 'Test Player',
      email: 'player@khelahobe.test',
      phoneNumber: '+8801700000103',
      city: 'Dhaka',
      area: 'Banani',
      bio: 'Regular futsal & badminton player.',
      skillLevel: 'INTERMEDIATE',
      roles: ['PLAYER'],
      safetyId: 'KH-PLAYR01',
    },
    {
      id: 'seed_user_player2',
      fullName: 'Junior Athlete',
      email: 'junior@khelahobe.test',
      phoneNumber: '+8801700000104',
      city: 'Dhaka',
      area: 'Dhanmondi',
      bio: 'Youth player linked to Test Guardian.',
      skillLevel: 'BEGINNER',
      roles: ['PLAYER'],
      safetyId: 'KH-JUNIOR1',
    },
  ];

  for (const spec of usersSpec) {
    await prisma.user.create({
      data: {
        id: spec.id,
        fullName: spec.fullName,
        email: spec.email,
        phoneNumber: spec.phoneNumber,
        passwordHash,
        city: spec.city,
        area: spec.area,
        bio: spec.bio,
        primarySkillLevel: spec.skillLevel,
        status: 'ACTIVE',
        emailVerified: true,
        roles: {
          create: spec.roles.map((role) => ({ role })),
        },
        playerProfile: {
          create: {
            displayName: spec.fullName,
            bio: spec.bio,
            city: spec.city,
            area: spec.area,
            skillLevel: spec.skillLevel,
            safetyProfile: {
              create: {
                safetyId: spec.safetyId,
              },
            },
          },
        },
      },
    });
  }

  // 3. Venues
  await prisma.venue.createMany({
    data: [
      {
        id: 'seed_venue_banani',
        ownerId: 'seed_user_organizer',
        name: 'Banani Rooftop Futsal Arena',
        description: 'FIFA-grade 7v7 artificial turf with floodlights.',
        address: 'Road 11, Block F, Banani, Dhaka',
        city: 'Dhaka',
        area: 'Banani',
        latitude: 23.7937,
        longitude: 90.4066,
        isTurf: true,
        active: true,
      },
      {
        id: 'seed_venue_dhanmondi',
        ownerId: 'seed_user_organizer',
        name: 'Dhanmondi Indoor Badminton Court',
        description: 'Wooden floor dual courts with high-bay LED lighting.',
        address: 'Satmasjid Road, Dhanmondi 27, Dhaka',
        city: 'Dhaka',
        area: 'Dhanmondi',
        latitude: 23.7465,
        longitude: 90.376,
        isTurf: false,
        active: true,
      },
      {
        id: 'seed_venue_uttara',
        ownerId: 'seed_user_player1',
        name: 'Uttara Sector 11 Turf Field',
        description: 'Open cricket and football artificial grass pitch.',
        address: 'Sector 11, Garib-E-Newaz Ave, Uttara, Dhaka',
        city: 'Dhaka',
        area: 'Uttara',
        latitude: 23.8759,
        longitude: 90.3795,
        isTurf: true,
        active: true,
      },
    ],
  });

  // 4. Matches (scheduled in the upcoming days)
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const baseDate = new Date(Date.now() + dayMs);
  baseDate.setHours(19, 0, 0, 0);

  await prisma.match.createMany({
    data: [
      {
        id: 'seed_match_futsal',
        title: 'Banani 7v7 Floodlit Futsal',
        description:
          'Friendly evening 7v7 futsal session on rooftop turf. Turf boots or flat soles only; bibs provided.',
        matchType: 'QUICK_MATCH',
        sportId: football.id,
        organizerId: 'seed_user_organizer',
        venueId: 'seed_venue_banani',
        latitude: 23.7937,
        longitude: 90.4066,
        locationName: 'Banani Rooftop Futsal Arena',
        locationAddress: 'Road 11, Banani, Dhaka',
        city: 'Dhaka',
        area: 'Banani',
        startTime: new Date(baseDate.getTime()),
        endTime: new Date(baseDate.getTime() + 1.5 * hourMs),
        capacity: 14,
        minimumPlayers: 10,
        skillLevel: 'INTERMEDIATE',
        joinMode: 'INSTANT_JOIN',
        status: 'OPEN',
        feeAmount: 250,
        rules: 'Arrive 15 minutes before kickoff. No metal studs.',
        guardianRequired: false,
      },
      {
        id: 'seed_match_badminton',
        title: 'Dhanmondi Evening Badminton Doubles',
        description:
          'Rotating doubles sets on Court 2. Feather shuttlecocks included in court split.',
        matchType: 'QUICK_MATCH',
        sportId: badminton.id,
        organizerId: 'seed_user_organizer',
        venueId: 'seed_venue_dhanmondi',
        latitude: 23.7465,
        longitude: 90.376,
        locationName: 'Dhanmondi Indoor Badminton Court',
        locationAddress: 'Dhanmondi 27, Dhaka',
        city: 'Dhaka',
        area: 'Dhanmondi',
        startTime: new Date(baseDate.getTime() + dayMs),
        endTime: new Date(baseDate.getTime() + dayMs + 1.5 * hourMs),
        capacity: 4,
        minimumPlayers: 2,
        skillLevel: 'INTERMEDIATE',
        joinMode: 'APPLICATION_REQUIRED',
        status: 'OPEN',
        feeAmount: 150,
        rules: 'Non-marking indoor court shoes mandatory.',
        guardianRequired: true,
      },
      {
        id: 'seed_match_cricket',
        title: 'Uttara Weekend Tape-Ball Cricket',
        description: 'Open 8-over-a-side community tape-ball friendly match.',
        matchType: 'QUICK_MATCH',
        sportId: cricket.id,
        organizerId: 'seed_user_player1',
        venueId: 'seed_venue_uttara',
        latitude: 23.8759,
        longitude: 90.3795,
        locationName: 'Uttara Sector 11 Turf Field',
        locationAddress: 'Sector 11, Uttara, Dhaka',
        city: 'Dhaka',
        area: 'Uttara',
        startTime: new Date(baseDate.getTime() + 2 * dayMs),
        endTime: new Date(baseDate.getTime() + 2 * dayMs + 2 * hourMs),
        capacity: 16,
        minimumPlayers: 12,
        skillLevel: 'BEGINNER',
        joinMode: 'INSTANT_JOIN',
        status: 'OPEN',
        feeAmount: 0,
        rules: 'Bring your own bat if possible; spare tennis balls provided.',
        guardianRequired: false,
      },
      {
        id: 'seed_match_basketball',
        title: 'Gulshan 3v3 Half-Court Run',
        description: 'Fast-paced 3v3 pickup basketball games to 15.',
        matchType: 'QUICK_MATCH',
        sportId: basketball.id,
        organizerId: 'seed_user_organizer',
        venueId: 'seed_venue_banani',
        latitude: 23.7925,
        longitude: 90.4152,
        locationName: 'Gulshan Youth Court',
        locationAddress: 'Gulshan 2, Dhaka',
        city: 'Dhaka',
        area: 'Gulshan',
        startTime: new Date(baseDate.getTime() + 3 * dayMs),
        endTime: new Date(baseDate.getTime() + 3 * dayMs + hourMs),
        capacity: 6,
        minimumPlayers: 4,
        skillLevel: 'ADVANCED',
        joinMode: 'INSTANT_JOIN',
        status: 'OPEN',
        feeAmount: 200,
        rules: 'Call own fouls fairly.',
        guardianRequired: false,
      },
    ],
  });

  // 5. Participants, Applications, Equipment Requirements
  await prisma.matchParticipant.createMany({
    data: [
      {
        id: 'seed_part_1',
        matchId: 'seed_match_futsal',
        userId: 'seed_user_player1',
        status: 'CONFIRMED',
      },
      {
        id: 'seed_part_2',
        matchId: 'seed_match_futsal',
        userId: 'seed_user_player2',
        status: 'CONFIRMED',
      },
      {
        id: 'seed_part_3',
        matchId: 'seed_match_badminton',
        userId: 'seed_user_player2',
        status: 'CONFIRMED',
      },
    ],
  });

  await prisma.matchApplication.create({
    data: {
      id: 'seed_app_1',
      matchId: 'seed_match_badminton',
      userId: 'seed_user_player1',
      message: 'Intermediate doubles regular, bringing extra Yonex feather shuttles.',
      status: 'PENDING',
    },
  });

  await prisma.equipmentRequirement.createMany({
    data: [
      {
        id: 'seed_eqreq_1',
        matchId: 'seed_match_futsal',
        equipmentName: 'Size 5 Match Football',
        requiredQuantity: 2,
        committedQuantity: 1,
      },
      {
        id: 'seed_eqreq_2',
        matchId: 'seed_match_futsal',
        equipmentName: 'Training Bibs (Set of 7)',
        requiredQuantity: 2,
        committedQuantity: 2,
      },
    ],
  });

  await prisma.equipmentItem.createMany({
    data: [
      {
        id: 'seed_equip_1',
        name: 'Size 5 Match Football',
        category: 'Ball',
        quantity: 2,
        ownerId: 'seed_user_organizer',
        sportId: football.id,
      },
      {
        id: 'seed_equip_2',
        name: 'Feather Shuttlecock Tube',
        category: 'Court',
        quantity: 3,
        ownerId: 'seed_user_player1',
        sportId: badminton.id,
      },
    ],
  });

  // 6. Guardian Links, Safety Settings & Alerts
  await prisma.guardianLinkRequest.create({
    data: {
      id: 'seed_glink_1',
      requestId: 'LNK-SEED-001',
      guardianId: 'seed_user_guardian',
      childId: 'seed_user_player2',
      status: 'VERIFIED',
      guardianConsent: true,
      childConsent: true,
      verifiedAt: new Date(),
    },
  });

  await prisma.guardianRelationship.create({
    data: {
      id: 'seed_grel_1',
      guardianId: 'seed_user_guardian',
      childId: 'seed_user_player2',
      relationship: 'Parent',
      permissions: ['VIEW_ACTIVITY', 'SAFETY_SETTINGS'],
      active: true,
    },
  });

  await prisma.childSafetySettings.create({
    data: {
      id: 'seed_gset_1',
      guardianId: 'seed_user_guardian',
      childId: 'seed_user_player2',
      allowMatchParticipation: true,
      requireGuardianApproval: true,
      allowLocationSharing: false,
    },
  });

  await prisma.safetyAlert.createMany({
    data: [
      {
        id: 'seed_alert_1',
        guardianId: 'seed_user_guardian',
        childId: 'seed_user_player2',
        childName: 'Junior Athlete',
        type: 'MATCH_JOIN',
        title: 'Match Spot Confirmed',
        message: 'Junior Athlete joined "Banani 7v7 Floodlit Futsal".',
        read: false,
      },
      {
        id: 'seed_alert_2',
        guardianId: 'seed_user_guardian',
        childId: 'seed_user_player2',
        childName: 'Junior Athlete',
        type: 'LINK_VERIFIED',
        title: 'Safety Link Verified',
        message: 'Guardian relationship with KH-JUNIOR1 is active.',
        read: true,
      },
    ],
  });

  // 7. Notifications & Sample Report for Admin Moderation
  await prisma.notification.createMany({
    data: [
      {
        id: 'seed_notif_1',
        userId: 'seed_user_player1',
        type: 'MATCH_JOIN_CONFIRMED',
        title: 'Match Joined',
        message: 'You have confirmed your spot in "Banani 7v7 Floodlit Futsal".',
        link: '/matches/seed_match_futsal',
        read: false,
      },
      {
        id: 'seed_notif_2',
        userId: 'seed_user_organizer',
        type: 'MATCH_APPLICATION_RECEIVED',
        title: 'New Match Application',
        message: 'Test Player applied to join "Dhanmondi Evening Badminton Doubles".',
        link: '/organizer/matches/seed_match_badminton/applications',
        read: false,
      },
    ],
  });

  await prisma.report.create({
    data: {
      id: 'seed_report_1',
      reporterId: 'seed_user_player1',
      targetType: 'MATCH',
      targetId: 'seed_match_cricket',
      targetName: 'Uttara Weekend Tape-Ball Cricket',
      topic: 'INCORRECT_LOCATION',
      reason: 'Sample report for testing admin moderation queue',
      description: 'Pin marker needs slight adjustment to Gate 2 entrance.',
      status: 'PENDING',
    },
  });
}

async function main() {
  const isClear = process.argv.includes('--clear');
  if (isClear) {
    await clearSeedData();
    console.log('Cleared all seeded test users and demo data (real user data preserved).');
    return;
  }

  await seedDemoData();
  console.log('Seeded test users and demo data into Supabase PostgreSQL.');
  console.log('Test password for all accounts: Test@1234');
  console.log('- ADMIN:     admin@khelahobe.test');
  console.log('- ORGANIZER: organizer@khelahobe.test');
  console.log('- GUARDIAN:  guardian@khelahobe.test');
  console.log('- PLAYER:    player@khelahobe.test (Safety ID: KH-PLAYR01)');
  console.log('- CHILD:     junior@khelahobe.test (Safety ID: KH-JUNIOR1)');
}

main()
  .catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

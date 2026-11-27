import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fail, handleRouteError, ok, toEpoch } from '@/lib/http';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return fail('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!session.roles.includes('ADMIN')) {
      return fail('ACCESS_DENIED', 'Admin privileges required', 403);
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      recentUsers,
      totalMatches,
      activeMatches,
      pendingReports,
      roleGroups,
      recentActions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.match.count(),
      prisma.match.count({ where: { status: { in: ['OPEN', 'FULL', 'IN_PROGRESS'] } } }),
      prisma.report.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      prisma.userRoleAssignment.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.moderationAction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const baseUsers = Math.max(1, totalUsers - recentUsers);
    const weeklyGrowthRate = totalUsers === 0 ? 0 : Number(((recentUsers / baseUsers) * 100).toFixed(1));

    const countsByRole = new Map(roleGroups.map((g) => [g.role, g._count.role]));

    return ok({
      totalUsers,
      activeUsers,
      totalPlayers: countsByRole.get('PLAYER') ?? 0,
      totalOrganizers: countsByRole.get('ORGANIZER') ?? 0,
      totalGuardians: countsByRole.get('GUARDIAN') ?? 0,
      totalMatches,
      activeMatches,
      pendingReports,
      reportedMatches: pendingReports,
      weeklyGrowthRate,
      roleDistribution: roleGroups.map((g) => ({
        role: g.role,
        count: g._count.role,
      })),
      recentModerationActions: recentActions.map((a) => ({
        id: a.id,
        action: a.action,
        reason: a.reason,
        targetId: a.targetId,
        createdAt: toEpoch(a.createdAt),
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

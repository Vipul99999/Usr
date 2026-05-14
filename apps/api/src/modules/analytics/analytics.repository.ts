import type { FastifyInstance } from 'fastify'
import { Prisma } from '@repo/db'

export class AnalyticsRepository {
  constructor(private app: FastifyInstance) {}

  findMembership(workspaceId: string, userId: string) {
    return this.app.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId
      },
      select: { id: true }
    })
  }

  listWorkspaceLinks(workspaceId: string) {
    return this.app.prisma.link.findMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        totalClicks: true,
        uniqueClicks: true,
        createdAt: true
      }
    })
  }

  findLinkSummary(workspaceId: string, linkId: string) {
    return this.app.prisma.link.findFirst({
      where: {
        id: linkId,
        workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        slug: true,
        destinationUrl: true,
        totalClicks: true,
        uniqueClicks: true,
        createdAt: true,
        lastClickedAt: true
      }
    })
  }

  listDailyStats(linkId: string) {
    return this.app.prisma.linkDailyStat.findMany({
      where: { linkId },
      orderBy: { date: 'asc' }
    })
  }

  getWorkspaceSummary(workspaceId: string) {
    return this.app.prisma.link.aggregate({
      where: {
        workspaceId,
        deletedAt: null
      },
      _count: {
        id: true
      },
      _sum: {
        totalClicks: true,
        uniqueClicks: true
      }
    })
  }

  listTopLinks(workspaceId: string, limit = 5) {
    return this.app.prisma.link.findMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      orderBy: [
        { totalClicks: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        domain: true,
        totalClicks: true,
        uniqueClicks: true
      }
    })
  }

  listRecentClicks(workspaceId: string, limit = 20) {
    return this.app.prisma.linkClickEvent.findMany({
      where: {
        link: {
          workspaceId,
          deletedAt: null
        }
      },
      orderBy: {
        clickedAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        clickedAt: true,
        country: true,
        city: true,
        referrerHost: true,
        deviceType: true,
        browser: true,
        os: true,
        isBot: true,
        link: {
          select: {
            id: true,
            title: true,
            slug: true,
            domain: true
          }
        }
      }
    })
  }

  groupReferrers(workspaceId: string) {
    return this.app.prisma.linkClickEvent.groupBy({
      by: ['referrerHost'],
      where: {
        referrerHost: {
          not: null
        },
        link: {
          workspaceId,
          deletedAt: null
        }
      },
      _count: {
        referrerHost: true
      },
      orderBy: {
        _count: {
          referrerHost: 'desc'
        }
      },
      take: 5
    })
  }

  groupDevices(workspaceId: string) {
    return this.app.prisma.linkClickEvent.groupBy({
      by: ['deviceType'],
      where: {
        deviceType: {
          not: null
        },
        link: {
          workspaceId,
          deletedAt: null
        }
      },
      _count: {
        deviceType: true
      },
      orderBy: {
        _count: {
          deviceType: 'desc'
        }
      }
    })
  }

  groupCountries(workspaceId: string) {
    return this.app.prisma.linkClickEvent.groupBy({
      by: ['country'],
      where: {
        country: {
          not: null
        },
        link: {
          workspaceId,
          deletedAt: null
        }
      },
      _count: {
        country: true
      },
      orderBy: {
        _count: {
          country: 'desc'
        }
      },
      take: 5
    })
  }

  listCampaignSummaries(workspaceId: string) {
    return this.app.prisma.link.groupBy({
      by: ['campaign'],
      where: {
        workspaceId,
        deletedAt: null,
        campaign: {
          not: null
        }
      },
      _count: {
        id: true
      },
      _sum: {
        totalClicks: true,
        uniqueClicks: true
      },
      _max: {
        lastClickedAt: true,
        createdAt: true
      },
      orderBy: {
        _sum: {
          totalClicks: 'desc'
        }
      }
    })
  }

  findCampaignSummary(workspaceId: string, campaign: string) {
    return this.app.prisma.link.aggregate({
      where: {
        workspaceId,
        deletedAt: null,
        campaign
      },
      _count: {
        id: true
      },
      _sum: {
        totalClicks: true,
        uniqueClicks: true
      },
      _max: {
        lastClickedAt: true,
        createdAt: true
      }
    })
  }

  listCampaignLinks(workspaceId: string, campaign: string) {
    return this.app.prisma.link.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        campaign
      },
      orderBy: [
        { totalClicks: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        domain: true,
        destinationUrl: true,
        campaign: true,
        status: true,
        totalClicks: true,
        uniqueClicks: true,
        createdAt: true,
        lastClickedAt: true
      }
    })
  }

  listCampaignTopLinks(workspaceId: string, campaign: string, limit = 5) {
    return this.app.prisma.link.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        campaign
      },
      orderBy: [
        { totalClicks: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        domain: true,
        totalClicks: true,
        uniqueClicks: true
      }
    })
  }

  listCampaignRecentClicks(workspaceId: string, campaign: string, limit = 20) {
    return this.app.prisma.linkClickEvent.findMany({
      where: {
        link: {
          workspaceId,
          deletedAt: null,
          campaign
        }
      },
      orderBy: {
        clickedAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        clickedAt: true,
        country: true,
        city: true,
        referrerHost: true,
        deviceType: true,
        browser: true,
        os: true,
        isBot: true,
        link: {
          select: {
            id: true,
            title: true,
            slug: true,
            domain: true
          }
        }
      }
    })
  }

  groupCampaignReferrers(workspaceId: string, campaign: string) {
    return this.app.prisma.linkClickEvent.groupBy({
      by: ['referrerHost'],
      where: {
        referrerHost: {
          not: null
        },
        link: {
          workspaceId,
          deletedAt: null,
          campaign
        }
      },
      _count: {
        referrerHost: true
      },
      orderBy: {
        _count: {
          referrerHost: 'desc'
        }
      },
      take: 5
    })
  }

  groupCampaignDevices(workspaceId: string, campaign: string) {
    return this.app.prisma.linkClickEvent.groupBy({
      by: ['deviceType'],
      where: {
        deviceType: {
          not: null
        },
        link: {
          workspaceId,
          deletedAt: null,
          campaign
        }
      },
      _count: {
        deviceType: true
      },
      orderBy: {
        _count: {
          deviceType: 'desc'
        }
      }
    })
  }

  groupCampaignCountries(workspaceId: string, campaign: string) {
    return this.app.prisma.linkClickEvent.groupBy({
      by: ['country'],
      where: {
        country: {
          not: null
        },
        link: {
          workspaceId,
          deletedAt: null,
          campaign
        }
      },
      _count: {
        country: true
      },
      orderBy: {
        _count: {
          country: 'desc'
        }
      },
      take: 5
    })
  }

  listCampaignDailyStats(workspaceId: string, campaign: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return this.app.prisma.$queryRaw<Array<{
      date: Date
      clicks: bigint
      uniqueClicks: bigint
    }>>(Prisma.sql`
      SELECT
        s."date" as "date",
        SUM(s."clicks") as "clicks",
        SUM(s."uniqueClicks") as "uniqueClicks"
      FROM "link_daily_stats" s
      INNER JOIN "links" l ON l."id" = s."linkId"
      WHERE l."workspaceId" = ${workspaceId}::uuid
        AND l."deletedAt" IS NULL
        AND l."campaign" = ${campaign}
        AND s."date" >= ${since}::date
      GROUP BY s."date"
      ORDER BY s."date" ASC
    `)
  }
}

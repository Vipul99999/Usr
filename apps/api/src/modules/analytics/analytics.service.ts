import type { FastifyInstance } from 'fastify'
import { AnalyticsRepository } from './analytics.repository.js'

export class AnalyticsService {
  private repo: AnalyticsRepository

  constructor(private app: FastifyInstance) {
    this.repo = new AnalyticsRepository(app)
  }

  async getWorkspaceSummary(workspaceId: string, userId: string) {
    await this.ensureMembership(workspaceId, userId)

    const summary = await this.repo.getWorkspaceSummary(workspaceId)

    return {
      totalLinks: summary._count.id,
      totalClicks: Number(summary._sum.totalClicks || 0),
      uniqueClicks: Number(summary._sum.uniqueClicks || 0)
    }
  }

  async getWorkspaceOverview(workspaceId: string, userId: string) {
    await this.ensureMembership(workspaceId, userId)

    const [summary, topLinks, topReferrers, deviceBreakdown, countryBreakdown, recentClicks] = await Promise.all([
      this.getWorkspaceSummary(workspaceId, userId),
      this.repo.listTopLinks(workspaceId),
      this.repo.groupReferrers(workspaceId),
      this.repo.groupDevices(workspaceId),
      this.repo.groupCountries(workspaceId),
      this.repo.listRecentClicks(workspaceId)
    ])

    return {
      ...summary,
      topLinks: topLinks.map((link) => ({
        ...link,
        totalClicks: Number(link.totalClicks),
        uniqueClicks: Number(link.uniqueClicks)
      })),
      topReferrers: topReferrers.map((item) => ({
        referrerHost: item.referrerHost ?? 'Direct / Unknown',
        clicks: item._count.referrerHost
      })),
      deviceBreakdown: deviceBreakdown.map((item) => ({
        deviceType: item.deviceType ?? 'unknown',
        clicks: item._count.deviceType
      })),
      countryBreakdown: countryBreakdown.map((item) => ({
        country: item.country ?? 'Unknown',
        clicks: item._count.country
      })),
      recentClicks: recentClicks.map((event) => ({
        id: event.id,
        clickedAt: event.clickedAt,
        country: event.country,
        city: event.city,
        referrerHost: event.referrerHost,
        deviceType: event.deviceType,
        browser: event.browser,
        os: event.os,
        isBot: event.isBot,
        link: event.link
      }))
    }
  }

  async getLinkSummary(workspaceId: string, linkId: string, userId: string) {
    await this.ensureMembership(workspaceId, userId)

    const link = await this.repo.findLinkSummary(workspaceId, linkId)
    if (!link) {
      throw this.app.httpErrors.notFound('Link not found')
    }

    return {
      ...link,
      totalClicks: Number(link.totalClicks),
      uniqueClicks: Number(link.uniqueClicks)
    }
  }

  async getLinkDaily(workspaceId: string, linkId: string, userId: string) {
    await this.ensureMembership(workspaceId, userId)

    const link = await this.repo.findLinkSummary(workspaceId, linkId)
    if (!link) {
      throw this.app.httpErrors.notFound('Link not found')
    }

    const stats = await this.repo.listDailyStats(linkId)

    return stats.map((item) => ({
      date: item.date,
      clicks: Number(item.clicks),
      uniqueClicks: Number(item.uniqueClicks)
    }))
  }

  async listCampaigns(workspaceId: string, userId: string) {
    await this.ensureMembership(workspaceId, userId)

    const campaigns = await this.repo.listCampaignSummaries(workspaceId)

    return campaigns.map((item) => ({
      campaign: item.campaign || 'Uncategorized',
      totalLinks: item._count.id,
      totalClicks: Number(item._sum.totalClicks || 0),
      uniqueClicks: Number(item._sum.uniqueClicks || 0),
      lastClickedAt: item._max.lastClickedAt,
      createdAt: item._max.createdAt
    }))
  }

  async getCampaignOverview(workspaceId: string, campaign: string, userId: string) {
    await this.ensureMembership(workspaceId, userId)

    const [summary, topLinks, topReferrers, deviceBreakdown, countryBreakdown, recentClicks, daily] =
      await Promise.all([
        this.repo.findCampaignSummary(workspaceId, campaign),
        this.repo.listCampaignTopLinks(workspaceId, campaign),
        this.repo.groupCampaignReferrers(workspaceId, campaign),
        this.repo.groupCampaignDevices(workspaceId, campaign),
        this.repo.groupCampaignCountries(workspaceId, campaign),
        this.repo.listCampaignRecentClicks(workspaceId, campaign),
        this.repo.listCampaignDailyStats(workspaceId, campaign, 30)
      ])

    if (summary._count.id === 0) {
      throw this.app.httpErrors.notFound('Campaign not found')
    }

    return {
      campaign,
      totalLinks: summary._count.id,
      totalClicks: Number(summary._sum.totalClicks || 0),
      uniqueClicks: Number(summary._sum.uniqueClicks || 0),
      lastClickedAt: summary._max.lastClickedAt,
      topLinks: topLinks.map((link) => ({
        ...link,
        totalClicks: Number(link.totalClicks),
        uniqueClicks: Number(link.uniqueClicks)
      })),
      topReferrers: topReferrers.map((item) => ({
        referrerHost: item.referrerHost ?? 'Direct / Unknown',
        clicks: item._count.referrerHost
      })),
      deviceBreakdown: deviceBreakdown.map((item) => ({
        deviceType: item.deviceType ?? 'unknown',
        clicks: item._count.deviceType
      })),
      countryBreakdown: countryBreakdown.map((item) => ({
        country: item.country ?? 'Unknown',
        clicks: item._count.country
      })),
      recentClicks: recentClicks.map((event) => ({
        id: event.id,
        clickedAt: event.clickedAt,
        country: event.country,
        city: event.city,
        referrerHost: event.referrerHost,
        deviceType: event.deviceType,
        browser: event.browser,
        os: event.os,
        isBot: event.isBot,
        link: event.link
      })),
      daily: daily.map((item) => ({
        date: item.date,
        clicks: Number(item.clicks),
        uniqueClicks: Number(item.uniqueClicks)
      })),
      insights: await this.getCampaignWeeklySummary(workspaceId, campaign, userId)
    }
  }

  async getCampaignWeeklySummary(workspaceId: string, campaign: string, userId: string) {
    await this.ensureMembership(workspaceId, userId)

    const [summary, daily, topLinks, topReferrers, countries] = await Promise.all([
      this.repo.findCampaignSummary(workspaceId, campaign),
      this.repo.listCampaignDailyStats(workspaceId, campaign, 21),
      this.repo.listCampaignTopLinks(workspaceId, campaign, 1),
      this.repo.groupCampaignReferrers(workspaceId, campaign),
      this.repo.groupCampaignCountries(workspaceId, campaign)
    ])

    if (summary._count.id === 0) {
      throw this.app.httpErrors.notFound('Campaign not found')
    }

    const days = new Map(
      daily.map((item) => [
        new Date(item.date).toISOString().slice(0, 10),
        {
          clicks: Number(item.clicks),
          uniqueClicks: Number(item.uniqueClicks)
        }
      ])
    )

    const currentDates = this.lastNDates(7)
    const previousDates = this.lastNDates(14).slice(0, 7)
    const current = currentDates.reduce(
      (acc, date) => {
        const key = date.toISOString().slice(0, 10)
        const item = days.get(key)
        acc.clicks += item?.clicks || 0
        acc.uniqueClicks += item?.uniqueClicks || 0
        return acc
      },
      { clicks: 0, uniqueClicks: 0 }
    )
    const previous = previousDates.reduce(
      (acc, date) => {
        const key = date.toISOString().slice(0, 10)
        const item = days.get(key)
        acc.clicks += item?.clicks || 0
        acc.uniqueClicks += item?.uniqueClicks || 0
        return acc
      },
      { clicks: 0, uniqueClicks: 0 }
    )

    const clickDelta = current.clicks - previous.clicks
    const uniqueDelta = current.uniqueClicks - previous.uniqueClicks
    const clickDeltaPct =
      previous.clicks > 0 ? Math.round((clickDelta / previous.clicks) * 100) : current.clicks > 0 ? 100 : 0
    const uniqueDeltaPct =
      previous.uniqueClicks > 0
        ? Math.round((uniqueDelta / previous.uniqueClicks) * 100)
        : current.uniqueClicks > 0
          ? 100
          : 0

    const narrative: string[] = []
    if (clickDelta > 0) {
      narrative.push(`Clicks are up ${clickDeltaPct}% versus the previous week.`)
    } else if (clickDelta < 0) {
      narrative.push(`Clicks are down ${Math.abs(clickDeltaPct)}% versus the previous week.`)
    } else {
      narrative.push('Clicks were flat compared with the previous week.')
    }

    if (uniqueDelta > 0) {
      narrative.push(`Unique traffic improved by ${uniqueDeltaPct}% week over week.`)
    } else if (uniqueDelta < 0) {
      narrative.push(`Unique traffic softened by ${Math.abs(uniqueDeltaPct)}% week over week.`)
    }

    if (topLinks[0]) {
      narrative.push(`The strongest link right now is ${(topLinks[0].title || topLinks[0].slug)}.`)
    }

    if (topReferrers[0]) {
      narrative.push(`Your top source is ${topReferrers[0].referrerHost ?? 'Direct / Unknown'}.`)
    }

    if (countries[0]?.country) {
      narrative.push(`Most campaign traffic is currently coming from ${countries[0].country}.`)
    }

    return {
      campaign,
      period: {
        currentStart: currentDates[0],
        currentEnd: currentDates[currentDates.length - 1],
        previousStart: previousDates[0],
        previousEnd: previousDates[previousDates.length - 1]
      },
      current,
      previous,
      delta: {
        clicks: clickDelta,
        clicksPct: clickDeltaPct,
        uniqueClicks: uniqueDelta,
        uniqueClicksPct: uniqueDeltaPct
      },
      highlights: {
        topLink: topLinks[0]
          ? {
              id: topLinks[0].id,
              title: topLinks[0].title,
              slug: topLinks[0].slug,
              domain: topLinks[0].domain,
              totalClicks: Number(topLinks[0].totalClicks)
            }
          : null,
        topReferrer: topReferrers[0]
          ? {
              referrerHost: topReferrers[0].referrerHost ?? 'Direct / Unknown',
              clicks: topReferrers[0]._count.referrerHost
            }
          : null,
        topCountry: countries[0]
          ? {
              country: countries[0].country ?? 'Unknown',
              clicks: countries[0]._count.country
            }
          : null
      },
      narrative
    }
  }

  private lastNDates(days: number) {
    const result: Date[] = []
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const value = new Date()
      value.setUTCHours(0, 0, 0, 0)
      value.setUTCDate(value.getUTCDate() - offset)
      result.push(value)
    }
    return result
  }

  private async ensureMembership(workspaceId: string, userId: string) {
    const membership = await this.repo.findMembership(workspaceId, userId)
    if (!membership) {
      throw this.app.httpErrors.forbidden('Access denied')
    }
  }
}

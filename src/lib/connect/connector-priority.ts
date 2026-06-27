import type { ConnectorConfig, ConnectorType } from './connector-types'
import { CONNECTOR_PRIORITY } from './connector-types'

export interface PriorityGroup {
  type: ConnectorType
  connectors: ConnectorConfig[]
}

export function groupByPriority(connectors: ConnectorConfig[]): PriorityGroup[] {
  const groups: PriorityGroup[] = []

  for (const type of CONNECTOR_PRIORITY) {
    const matching = connectors
      .filter(c => c.type === type && c.enabled)
      .sort((a, b) => {
        if (a.timeout !== b.timeout) return a.timeout - b.timeout
        return a.providerId.localeCompare(b.providerId)
      })

    if (matching.length > 0) {
      groups.push({ type, connectors: matching })
    }
  }

  return groups
}

export function getNextGroup(
  groups: PriorityGroup[],
  completedTypes: Set<ConnectorType>
): PriorityGroup | null {
  for (const group of groups) {
    if (!completedTypes.has(group.type)) return group
  }
  return null
}

export function shouldStopSearch(bestScore: number, threshold: number): boolean {
  return bestScore >= threshold
}

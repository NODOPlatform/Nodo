import { getConfig } from './admin-config'

export interface EmergencyContact {
  name: string
  icon: string
  phone: string
  description: string
}

export interface ExternalSearchLink {
  name: string
  url: string
  description: string
}

export function getEmergencyContacts(): EmergencyContact[] {
  return getConfig().emergencyContacts
}

export function getExternalSearchLinks(): ExternalSearchLink[] {
  return getConfig().externalLinks
}

import type { IncomingMessage, HandlerResult, HandlerContext } from './types'
import { classifyIntent } from './ai/intentClassifier'
import { greeting, helpMenu, notUnderstood } from './ai/responseBuilder'
import { handleSearchPerson } from './handlers/searchPerson'
import { handleSearchShelter } from './handlers/searchShelter'
import { handleSearchHospital } from './handlers/searchHospital'
import { handleSearchCollectionCenter } from './handlers/searchCollectionCenter'
import { handleSearchCampaign } from './handlers/searchCampaign'
import { handleSearchHealthRequest } from './handlers/searchHealthRequest'
import { handleSearchVerifiedInfo } from './handlers/searchVerifiedInfo'
import { handleCreateHelpRequest } from './handlers/createHelpRequest'
import { handleCreateOffer } from './handlers/createOffer'
import { handleReportIncident } from './handlers/reportIncident'
import { handleReportFoundPerson } from './handlers/reportFoundPerson'

const HANDLER_MAP: Record<string, (ctx: HandlerContext) => Promise<HandlerResult>> = {
  search_person: handleSearchPerson,
  search_shelter: handleSearchShelter,
  search_hospital: handleSearchHospital,
  search_collection_center: handleSearchCollectionCenter,
  search_campaign: handleSearchCampaign,
  search_health_request: handleSearchHealthRequest,
  search_verified_info: handleSearchVerifiedInfo,
  create_help_request: handleCreateHelpRequest,
  create_offer: handleCreateOffer,
  report_incident: handleReportIncident,
  report_found_person: handleReportFoundPerson,
}

export async function handleMessage(message: IncomingMessage): Promise<HandlerResult> {
  if (!message.text || message.text.trim().length === 0) {
    return { messages: [notUnderstood(message.channel, message.senderId)] }
  }

  const classified = classifyIntent(message.text)

  if (classified.intent === 'greeting') {
    return { messages: [greeting(message.channel, message.senderId)] }
  }

  if (classified.intent === 'help') {
    return { messages: [helpMenu(message.channel, message.senderId)] }
  }

  if (classified.intent === 'unknown' || classified.confidence < 0.15) {
    return { messages: [notUnderstood(message.channel, message.senderId)] }
  }

  const handler = HANDLER_MAP[classified.intent]
  if (!handler) {
    return { messages: [notUnderstood(message.channel, message.senderId)] }
  }

  return handler({ message, classified })
}

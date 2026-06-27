export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical'

export type RequestStatus = 'pending' | 'in_process' | 'attended' | 'closed'

export type HelpType =
  | 'water' | 'food' | 'medicine' | 'shelter' | 'rescue'
  | 'electricity' | 'communication' | 'transport' | 'other'

export type OfferType =
  | 'food' | 'water' | 'kitchen' | 'gas' | 'vehicle' | 'fuel'
  | 'tools' | 'internet' | 'starlink' | 'electricity' | 'generator'
  | 'doctor' | 'nurse' | 'psychologist' | 'rescuers' | 'volunteers'
  | 'shelter_space' | 'medicine' | 'clothing' | 'machinery'

export type PersonStatus =
  | 'unknown' | 'ok' | 'injured' | 'medical_attention'
  | 'transferred' | 'with_family'

export type ShelterStatus = 'active' | 'full' | 'closed'

export type InfoCategory =
  | 'hospital' | 'road' | 'shelter' | 'distribution'
  | 'alert' | 'general' | 'services' | 'weather'
  | 'official' | 'transport'

export type PoiType =
  | 'shelter' | 'hospital' | 'medical_center' | 'community_kitchen'
  | 'collection_center' | 'danger_zone' | 'blocked_road'
  | 'incident' | 'protection' | 'health_request'

export type HealthRequestType =
  | 'blood_donors' | 'platelet_donors' | 'medication' | 'oxygen'
  | 'medical_supplies' | 'medical_equipment' | 'infant_formula'
  | 'breast_milk' | 'other'

export type HealthPriority = 'critical' | 'high' | 'medium' | 'low'

export type CommunityKitchenNeedType =
  | 'cooks' | 'food_supplies' | 'utensils' | 'gas' | 'firewood' | 'volunteers' | 'other'

export type CampaignType =
  | 'blood_donation' | 'medical_day' | 'vaccination' | 'food_collection'
  | 'water_distribution' | 'medicine_delivery' | 'rescue' | 'community_kitchen'
  | 'government' | 'ngo' | 'general'

export type VerificationLevel = 'unverified' | 'community' | 'nodo' | 'official'

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled'

export interface CampaignLocation {
  name: string
  address?: string
  lat?: number
  lng?: number
  city?: string
}

export interface OfficialCampaign {
  id: string
  emergency_id: string
  title: string
  description: string | null
  campaign_type: CampaignType
  organization: string | null
  start_date: string | null
  end_date: string | null
  opening_hours: string | null
  image_url: string | null
  source_url: string | null
  verification_level: VerificationLevel
  status: CampaignStatus
  locations: CampaignLocation[]
  requirements: string[] | null
  contact_phone: string | null
  whatsapp: string | null
  website: string | null
  metadata: Record<string, unknown>
  device_id: string | null
  created_at: string
  updated_at: string
}

export type BloodType =
  | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'not_applicable'

export type CollaboratorCapability =
  | 'vehicle' | 'shelter_space' | 'cooking' | 'community_kitchen_cooking'
  | 'donate_food' | 'donate_water' | 'donate_clothing' | 'mattresses'
  | 'share_internet' | 'generator' | 'chargers' | 'transport_donations'
  | 'donate_blood' | 'donate_medicine' | 'doctor' | 'nurse' | 'paramedic'
  | 'veterinarian' | 'psychologist' | 'rescue_experience' | 'tools'
  | 'debris_cleanup' | 'construction' | 'radio_equipment'
  | 'coordinate_kitchen' | 'donate_kitchen_food' | 'hygiene_products'
  | 'help_babies' | 'help_pets' | 'other'

export type IncidentType =
  | 'bridge_down' | 'landslide' | 'flood' | 'fire'
  | 'fallen_tree' | 'electric_cable' | 'gas_leak'
  | 'collapsed_building' | 'blocked_street' | 'no_electricity'
  | 'no_water' | 'other'

export type ProtectionType =
  | 'child_at_risk' | 'elderly_at_risk' | 'disabled_at_risk'
  | 'disoriented_person' | 'vulnerable_immediate'
  | 'lost_pet' | 'found_pet' | 'animal_at_risk'

export type ObservedState =
  | 'alone' | 'injured' | 'needs_help' | 'disoriented'
  | 'accompanied' | 'unknown'

export interface Emergency {
  id: string
  name: string
  description: string | null
  country: string
  region: string | null
  center_lat: number
  center_lng: number
  default_zoom: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HelpRequest {
  id: string
  emergency_id: string
  latitude: number
  longitude: number
  address_text: string | null
  city: string | null
  sector: string | null
  people_count: number
  help_types: HelpType[]
  urgency: UrgencyLevel
  status: RequestStatus
  description: string | null
  photo_url: string | null
  metadata: Record<string, unknown> | null
  device_id: string | null
  offline_id: string | null
  created_at: string
  updated_at: string
}

export interface HelpOffer {
  id: string
  emergency_id: string
  latitude: number
  longitude: number
  address_text: string | null
  city: string | null
  sector: string | null
  offer_types: OfferType[]
  description: string | null
  available_hours: string | null
  contact_name: string | null
  status: string
  metadata: Record<string, unknown> | null
  device_id: string | null
  offline_id: string | null
  created_at: string
  updated_at: string
}

export interface Person {
  id: string
  emergency_id: string
  first_name: string
  last_name: string
  approximate_age: number | null
  description: string | null
  photo_url: string | null
  current_status: PersonStatus
  last_known_lat: number | null
  last_known_lng: number | null
  last_known_address: string | null
  city: string | null
  sector: string | null
  is_found: boolean
  found_at: string | null
  metadata: Record<string, unknown> | null
  device_id: string | null
  offline_id: string | null
  created_at: string
  updated_at: string
}

export interface PersonStatusHistory {
  id: string
  person_id: string
  status: PersonStatus
  latitude: number | null
  longitude: number | null
  address_text: string | null
  notes: string | null
  reported_by_device: string | null
  created_at: string
}

export interface Shelter {
  id: string
  emergency_id: string
  name: string
  latitude: number
  longitude: number
  address_text: string | null
  city: string | null
  sector: string | null
  state_name: string | null
  capacity: number | null
  current_occupancy: number
  status: ShelterStatus
  phone: string | null
  responsible: string | null
  accepts_pets: boolean
  accepts_children: boolean
  accepts_elderly: boolean
  accepts_disabled: boolean
  has_water: boolean
  has_food: boolean
  has_electricity: boolean
  has_bathrooms: boolean
  has_internet: boolean
  has_medical: boolean
  has_sleeping_space: boolean
  notes: string | null
  metadata: Record<string, unknown> | null
  device_id: string | null
  offline_id: string | null
  created_at: string
  updated_at: string
}

export interface VerifiedInfo {
  id: string
  emergency_id: string
  category: InfoCategory
  title: string
  content: string
  source: string | null
  is_pinned: boolean
  is_active: boolean
  expires_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface PointOfInterest {
  id: string
  emergency_id: string
  poi_type: PoiType
  name: string
  latitude: number
  longitude: number
  address_text: string | null
  city: string | null
  sector: string | null
  description: string | null
  is_active: boolean
  verified: boolean
  metadata: Record<string, unknown>
  device_id: string | null
  offline_id: string | null
  created_at: string
  updated_at: string
}

export interface MapMarkerData {
  id: string
  type: 'help_request' | 'help_offer' | 'person' | 'shelter' | 'poi' | 'incident' | 'protection' | 'health_request'
  latitude: number
  longitude: number
  title: string
  subtitle: string | null
  description: string | null
  status: string
  urgency?: UrgencyLevel
  poi_type?: PoiType
  incident_type?: IncidentType
  protection_type?: ProtectionType
  phone?: string | null
  contact_method?: string | null
  contact_value?: string | null
  created_at?: string
  table_name?: string
  reporter_name?: string | null
  help_types?: string[]
  observed_state?: string | null
  subject_count?: number | null
  updates?: Array<{ text: string; timestamp: string; device_id?: string }> | null
  health_type?: HealthRequestType
  blood_type?: BloodType
  hospital_name?: string | null
  contact_whatsapp?: string | null
  donor_count?: number | null
  donors_confirmed?: number | null
  request_date?: string | null
  request_time?: string | null
  priority?: HealthPriority
  cover_image?: string | null
}

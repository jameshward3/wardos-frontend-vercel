export type WardName = "North" | "South" | "East" | "West" | "Unknown";

export type BallotMethod = "Machine" | "Mail" | "Provisional" | "Early" | "Rejected" | "Unknown";

export type PartyCode = "DEM" | "REP" | "UNA" | "OTHER" | "UNKNOWN";

export type GenderCode = "Male" | "Female" | "Unknown";

export type AgeBand = "18-29" | "30-44" | "45-64" | "65+" | "Unknown";

export interface ElectionRecord {
  source_record_id: string;
  voter_id?: string;
  election: string;
  ballot_method: BallotMethod;
  party_voted_in: PartyCode;
  voted: boolean;
  ward: WardName;
  district: string;
  street_name?: string;
  zip?: string;
  voting_location?: string;
}

export interface RegisteredVoterRecord {
  source_record_id: string;
  voter_id?: string;
  party: PartyCode;
  ward: WardName;
  district: string;
  street_name?: string;
  age?: number;
  age_band: AgeBand;
  gender: GenderCode;
  status?: string;
}

export interface CanonicalVoterRecord {
  master_voter_id: string;
  voter_id_hash?: string;
  party: PartyCode;
  ward: WardName;
  district: string;
  street_name?: string;
  age?: number;
  age_band: AgeBand;
  gender: GenderCode;
  voted: boolean;
  ballot_method: BallotMethod;
  election_count: number;
  match_confidence: number;
  needs_manual_review: boolean;
}

export interface DuplicateReport {
  exact_voter_id_duplicates: number;
  high_confidence_duplicates: number;
  manual_review_count: number;
}

export interface DataQualityReport {
  registered_voter_count: number;
  election_voter_count: number;
  matched_voters: number;
  unmatched_voters: number;
  duplicate_records: number;
  missing_districts: number;
  missing_wards: number;
  missing_party_data: number;
  missing_address_data: number;
  data_quality_score: number;
}

export interface GeographyMetric {
  id: string;
  label: string;
  ward: WardName;
  district?: string;
  registered: number;
  voted: number;
  did_not_vote: number;
  turnout_rate: number;
  democrats: number;
  republicans: number;
  unaffiliated: number;
  other_parties: number;
  male: number;
  female: number;
  unknown_gender: number;
  average_age: number;
  mail: number;
  machine: number;
  provisional: number;
  rejected: number;
  density_score: number;
}

export interface PlatformAnalytics {
  election_name: string;
  total_registered: number;
  total_voted: number;
  turnout_rate: number;
  democrats: number;
  republicans: number;
  unaffiliated: number;
  other_parties: number;
  average_age: number;
  most_active_district: string;
  least_active_district: string;
  wards: GeographyMetric[];
  districts: GeographyMetric[];
  streets: GeographyMetric[];
  ballot_methods: Record<BallotMethod, number>;
  age_bands: Record<AgeBand, number>;
  gender: Record<GenderCode, number>;
  quality: DataQualityReport;
  duplicates: DuplicateReport;
}

export type DatasetKind = "election-history" | "registered-voters" | "ward-geojson" | "district-geojson";

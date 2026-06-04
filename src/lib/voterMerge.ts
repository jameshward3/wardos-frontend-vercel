import type { CanonicalVoterRecord, ElectionRecord, RegisteredVoterRecord } from "../types/voter";
import { deduplicateVoters } from "./deduplicate";

function hashIdentifier(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `mv-${Math.abs(hash).toString(36)}`;
}

export function mergeVoterDatasets(elections: ElectionRecord[], registered: RegisteredVoterRecord[] = []) {
  const registrationById = new Map(registered.filter((record) => record.voter_id).map((record) => [record.voter_id, record]));

  const merged: CanonicalVoterRecord[] = elections.map((election, index) => {
    const registration = election.voter_id ? registrationById.get(election.voter_id) : undefined;
    const confidence = registration ? 1 : election.street_name && election.ward !== "Unknown" ? 0.74 : 0.42;
    return {
      master_voter_id: hashIdentifier(election.voter_id || `${election.ward}-${election.district}-${election.street_name}-${index}`),
      voter_id_hash: election.voter_id ? hashIdentifier(election.voter_id) : undefined,
      party: registration?.party || election.party_voted_in,
      ward: registration?.ward || election.ward,
      district: registration?.district || election.district,
      street_number: registration?.street_number || election.street_number,
      street_name: registration?.street_name || election.street_name,
      city: registration?.city || election.city,
      state: registration?.state || election.state,
      zip: registration?.zip || election.zip,
      age: registration?.age,
      age_band: registration?.age_band || "Unknown",
      gender: registration?.gender || "Unknown",
      voted: election.voted,
      ballot_method: election.ballot_method,
      election_count: election.voted ? 1 : 0,
      match_confidence: confidence,
      needs_manual_review: confidence < 0.8,
    };
  });

  return deduplicateVoters(merged);
}

import type { CanonicalVoterRecord, DuplicateReport } from "../types/voter";

export function deduplicateVoters(records: CanonicalVoterRecord[]): {
  records: CanonicalVoterRecord[];
  report: DuplicateReport;
} {
  const exact = new Map<string, CanonicalVoterRecord>();
  let exactDuplicates = 0;
  let highConfidenceDuplicates = 0;
  let manualReviewCount = 0;

  for (const record of records) {
    const exactKey = record.voter_id_hash || record.master_voter_id;
    const existing = exact.get(exactKey);
    if (existing) {
      exactDuplicates += 1;
      existing.voted = existing.voted || record.voted;
      existing.election_count = Math.max(existing.election_count, record.election_count);
      continue;
    }

    const fuzzyMatch = [...exact.values()].find(
      (candidate) =>
        candidate.street_name &&
        record.street_name &&
        candidate.street_name === record.street_name &&
        candidate.ward === record.ward &&
        candidate.district === record.district &&
        candidate.party === record.party,
    );

    if (fuzzyMatch && record.match_confidence >= 0.86) {
      highConfidenceDuplicates += 1;
      fuzzyMatch.voted = fuzzyMatch.voted || record.voted;
    } else {
      if (record.needs_manual_review) manualReviewCount += 1;
      exact.set(exactKey, record);
    }
  }

  return {
    records: [...exact.values()],
    report: {
      exact_voter_id_duplicates: exactDuplicates,
      high_confidence_duplicates: highConfidenceDuplicates,
      manual_review_count: manualReviewCount,
    },
  };
}

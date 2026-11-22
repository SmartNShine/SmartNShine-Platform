/** Campus lifecycle: admin-provisioned only — active or suspended */

export function normalizeInstitutionStatus(status) {
  if (!status || status === "verified" || status === "pending") return "active";
  if (status === "rejected") return "suspended";
  if (status === "active" || status === "suspended") return status;
  return "active";
}

export function isInstitutionAccessBlocked(status) {
  return normalizeInstitutionStatus(status) === "suspended";
}

export function normalizeCampusStatus(status) {
  if (!status || status === "verified" || status === "pending") return "active";
  if (status === "rejected") return "suspended";
  if (status === "active" || status === "suspended") return status;
  return "active";
}

export function isCampusSuspended(status) {
  return normalizeCampusStatus(status) === "suspended";
}

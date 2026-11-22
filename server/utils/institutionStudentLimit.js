import Institution from "../models/Institution.model.js";
import StudentInstitution from "../models/StudentInstitution.model.js";

const SEAT_STATUSES = ["pending", "active"];

export function getEffectiveStudentLimit(institution) {
  if (!institution) return null;
  const limit = institution.studentLimit;
  if (limit === undefined || limit === null) return null;
  const n = Number(limit);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

export async function countInstitutionStudentSeats(institutionId) {
  return StudentInstitution.countDocuments({
    institutionId,
    status: { $in: SEAT_STATUSES },
  });
}

/**
 * @returns {{ ok: boolean, status?: number, message?: string, used?: number, limit?: number|null }}
 */
export async function checkInstitutionStudentCapacity(
  institutionId,
  slotsNeeded = 1,
) {
  const institution = await Institution.findById(institutionId).select(
    "studentLimit name",
  );
  if (!institution) {
    return { ok: false, status: 404, message: "Institution not found." };
  }

  const limit = getEffectiveStudentLimit(institution);
  const used = await countInstitutionStudentSeats(institutionId);

  if (limit === null) {
    return { ok: true, used, limit: null };
  }

  if (used + slotsNeeded > limit) {
    return {
      ok: false,
      status: 403,
      message: `Student seat limit reached (${used} of ${limit} in use). Contact SmartNShine to increase capacity.`,
      used,
      limit,
    };
  }

  return { ok: true, used, limit };
}

import { Sparkles, Plus, Trash2 } from "lucide-react";

export default function CertificationsSection({ profile, setProfile, onOpenAIModal }) {
  const addCertification = () => {
    const updated = profile.certifications || [];
    setProfile({
      ...profile,
      certifications: [
        ...updated,
        {
          name: "",
          issuingOrganization: "",
          issueDate: "",
          expiryDate: "",
          credentialId: "",
          credentialUrl: "",
          description: "",
        },
      ],
    });
  };

  const removeCertification = (idx) => {
    const updated = profile.certifications.filter((_, i) => i !== idx);
    setProfile({ ...profile, certifications: updated });
  };

  const updateCertification = (idx, field, val) => {
    const copy = [...(profile.certifications || [])];
    copy[idx][field] = val;
    setProfile({ ...profile, certifications: copy });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.08]">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Certifications & Licenses
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            AWS, Google Cloud, Meta, or industry verified credentials.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenAIModal("certifications")}
            className="text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paste & Structure</span>
          </button>
          <button
            onClick={addCertification}
            className="text-xs flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Certification</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {(profile.certifications || []).map((cert, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-gray-50/70 dark:bg-zinc-900/40 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Certification #{idx + 1}
              </span>
              <button
                onClick={() => removeCertification(idx)}
                className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Delete certification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Certification Name *
                </label>
                <input
                  type="text"
                  value={cert.name || ""}
                  onChange={(e) => updateCertification(idx, "name", e.target.value)}
                  placeholder="e.g. AWS Solutions Architect Associate"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Issuing Organization *
                </label>
                <input
                  type="text"
                  value={cert.issuingOrganization || ""}
                  onChange={(e) => updateCertification(idx, "issuingOrganization", e.target.value)}
                  placeholder="e.g. Amazon Web Services"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Credential URL / ID
                </label>
                <input
                  type="text"
                  value={cert.credentialUrl || cert.credentialId || ""}
                  onChange={(e) => updateCertification(idx, "credentialUrl", e.target.value)}
                  placeholder="https://credly.com/..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Issue Date
                </label>
                <input
                  type="text"
                  value={cert.issueDate || ""}
                  onChange={(e) => updateCertification(idx, "issueDate", e.target.value)}
                  placeholder="e.g. Jan 2024"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}

        {(!profile.certifications || profile.certifications.length === 0) && (
          <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
            No certifications added yet.
          </div>
        )}
      </div>
    </div>
  );
}

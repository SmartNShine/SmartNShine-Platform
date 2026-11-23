import { Plus, Trash2, Award } from "lucide-react";
import PortfolioPanel from "../PortfolioPanel";

const blankCertification = {
  name: "",
  issuer: "",
  date: "",
  credentialId: "",
  link: "",
};

export default function CertificationsPanel({
  certifications = [],
  onAdd,
  onUpdate,
  onRemove,
  forceState,
  forceVersion,
}) {
  return (
    <PortfolioPanel
      id="section-certifications"
      title="Certifications"
      description="Licenses, course certificates, and credentials."
      icon={Award}
      badge={`${certifications.length} items`}
      defaultOpen={true}
      forceState={forceState}
      forceVersion={forceVersion}
      actions={
        <button
          type="button"
          onClick={() => onAdd({ ...blankCertification })}
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cert</span>
        </button>
      }
    >
      <div className="space-y-3 sm:space-y-4">
        {certifications.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 py-2">
            No certifications yet. Add course certs, cloud badges, or licenses.
          </p>
        ) : (
          certifications.map((item, index) => (
            <div
              key={`cert-${index}`}
              className="rounded-2xl border border-gray-200/90 dark:border-white/[0.1] p-3.5 sm:p-5 bg-white dark:bg-zinc-950 space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Certificate name
                  </label>
                  <input
                    value={item.name || ""}
                    onChange={(e) => onUpdate(index, { name: e.target.value })}
                    placeholder="e.g. AWS Solutions Architect"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Issuer
                  </label>
                  <input
                    value={item.issuer || ""}
                    onChange={(e) => onUpdate(index, { issuer: e.target.value })}
                    placeholder="e.g. Amazon Web Services"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Date
                  </label>
                  <input
                    value={item.date || ""}
                    onChange={(e) => onUpdate(index, { date: e.target.value })}
                    placeholder="e.g. Mar 2025"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Credential ID
                  </label>
                  <input
                    value={item.credentialId || ""}
                    onChange={(e) =>
                      onUpdate(index, { credentialId: e.target.value })
                    }
                    placeholder="Optional ID"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Credential URL
                  </label>
                  <input
                    value={item.link || ""}
                    onChange={(e) => onUpdate(index, { link: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm font-medium"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove certification</span>
              </button>
            </div>
          ))
        )}
      </div>
    </PortfolioPanel>
  );
}

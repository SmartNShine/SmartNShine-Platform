import { FileText, CheckCircle2, WandSparkles } from "lucide-react";

const SAMPLE_JOB_DESCRIPTIONS = [
  {
    role: "Full Stack Engineer",
    text: `Job Title: Senior Full Stack Engineer\nCompany: TechCorp Innovations\n\nRequirements:\n- 3+ years experience with React.js, Node.js, Express, and MongoDB or PostgreSQL\n- Strong proficiency in JavaScript (ES6+), TypeScript, HTML5, and Tailwind CSS\n- Experience building and deploying scalable RESTful APIs and microservices\n- Familiarity with Git, Docker, CI/CD pipelines, and AWS cloud deployment\n- Excellent problem-solving, debugging, and cross-functional team communication skills`,
  },
  {
    role: "Frontend Developer",
    text: `Job Title: Frontend React Developer\nCompany: PixelCraft Studio\n\nRequirements:\n- Strong knowledge of React.js, Next.js, Redux Toolkit, and modern CSS architectures\n- Experience converting Figma designs into responsive, accessible, pixel-perfect user interfaces\n- Deep understanding of Web Vitals, performance optimization, and browser compatibility\n- Experience with unit testing (Jest, React Testing Library) and Git workflows`,
  },
  {
    role: "Backend Developer",
    text: `Job Title: Backend Node.js / Python Developer\nCompany: CloudSphere Solutions\n\nRequirements:\n- Proficient in Node.js, Python/FastAPI, Express.js, and SQL/NoSQL databases\n- Experience designing secure authentication systems (OAuth2, JWT), database indexing, and caching with Redis\n- Knowledge of message brokers (Kafka/RabbitMQ) and containerization with Docker & Kubernetes\n- Understanding of automated testing, monitoring, and cloud infrastructure`,
  },
];

export default function ATSJobDescriptionInput({
  jobDescription,
  setJobDescription,
}) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 sm:p-7 border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <FileText className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Job description
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
              Paste the role you're applying for
            </p>
          </div>
        </div>

        {/* Quick sample chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1 inline-flex items-center gap-1.5">
            <WandSparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" /> Try a sample:
          </span>
          {SAMPLE_JOB_DESCRIPTIONS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setJobDescription(sample.text)}
              className="text-xs font-medium px-2.5 py-1 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              {sample.role}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the complete job description here...&#10;&#10;Include:&#10;• Required skills and technologies&#10;• Qualifications and years of experience&#10;• Core job responsibilities&#10;• Preferred / nice-to-have tools"
          rows={9}
          className="w-full p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-y text-sm sm:text-base font-normal leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-zinc-400">
        <span>{jobDescription.length.toLocaleString()} characters</span>
        {jobDescription.length > 100 && (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Good length
          </span>
        )}
      </div>
    </div>
  );
}

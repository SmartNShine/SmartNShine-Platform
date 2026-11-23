/**
 * Interview Syllabus & Role Competency Service
 * Provides rich technical ontologies, structured 5-phase interview agendas,
 * and tracks candidate competency coverage across rounds.
 */

// Comprehensive role competency matrices
export const ROLE_ONTOLOGIES = {
  frontend: {
    title: "Frontend Engineer",
    coreCategories: [
      "JavaScript / TypeScript Core & Event Loop",
      "Modern React / Framework Mechanics & State",
      "DOM & Web Performance Optimization",
      "CSS Architecture, Layout & Responsive Systems",
      "Browser APIs, Storage & Networking",
      "Frontend Security (XSS, CSRF, CSP)",
      "Testing (Unit, Integration, E2E)",
      "Accessibility (WCAG, ARIA, Semantics)",
    ],
    technicalKeywords: [
      "Event Loop", "Microtasks", "Closure", "Prototype Chain", "Virtual DOM", "Reconciliation",
      "Server Components (RSC)", "SSR vs CSR vs SSG", "Hydration", "Custom Hooks", "Redux Toolkit",
      "Zustand", "Context API", "Web Vitals (LCP, CLS, INP)", "Code Splitting", "Tree Shaking",
      "Service Workers", "IndexedDB", "WebSockets", "CORS", "Content Security Policy", "ARIA Roles"
    ],
  },
  backend: {
    title: "Backend Engineer",
    coreCategories: [
      "API Architecture & Protocol Design (REST, gRPC, GraphQL)",
      "Database Modeling & Query Optimization (SQL & NoSQL)",
      "Concurrency, Asynchronous Processing & Threading",
      "Distributed Caching & In-Memory Stores",
      "Message Queues & Event-Driven Architecture",
      "Authentication, Authorization & Security (OAuth, JWT)",
      "Observability, Logging, Metrics & Tracing",
      "Resilience Patterns (Circuit Breakers, Retries, Idempotency)",
    ],
    technicalKeywords: [
      "ACID Transactions", "Isolation Levels", "Database Indexing (B-Tree, LSM)", "Connection Pooling",
      "Redis Caching Strategies (Cache-Aside, Write-Through)", "Kafka / RabbitMQ", "Partitioning",
      "Consumer Lag", "gRPC / Protobuf", "OAuth2 / PKCE", "JWT Expiration & Revocation", "Rate Limiting",
      "Idempotency Keys", "Circuit Breaker", "Dead Letter Queues", "OpenTelemetry", "Distributed Tracing"
    ],
  },
  fullstack: {
    title: "Full Stack Engineer",
    coreCategories: [
      "Client-Server State Sync & Data Hydration",
      "End-to-End API Design & Contract Enforcement",
      "Database Schema Design & Migration Strategies",
      "Frontend & Backend Performance Profiling",
      "Authentication & Session Management Across Stacks",
      "CI/CD Pipelines & Containerized Deployment",
      "Microservices vs Modular Monolith Trade-offs",
      "System Scalability & Edge-Case Handling",
    ],
    technicalKeywords: [
      "Full-stack React/Next.js", "Node.js Event Loop", "PostgreSQL / MongoDB", "Prisma / Mongoose",
      "Redis", "REST vs GraphQL", "JWT & HTTP-Only Cookies", "Docker & Containerization",
      "CI/CD Workflows", "Horizontal Scaling", "Load Balancing", "CORS & CSRF Protection",
      "Optimistic UI Updates", "End-to-End Type Safety"
    ],
  },
  devops: {
    title: "DevOps / SRE Engineer",
    coreCategories: [
      "Container Orchestration & Kubernetes Architecture",
      "Infrastructure as Code (Terraform, CloudFormation)",
      "CI/CD Pipeline Security & Automation",
      "Cloud Networking (VPC, Subnets, Ingress, DNS)",
      "SRE Principles (SLOs, SLIs, Error Budgets)",
      "Incident Management & Post-Mortem Analysis",
      "Cloud Security & Identity (IAM, Secrets Management)",
      "Telemetry & Continuous Observability",
    ],
    technicalKeywords: [
      "Kubernetes Pod Lifecycle", "Ingress Controllers", "DaemonSets", "Helm Charts", "Terraform State",
      "GitOps (ArgoCD)", "GitHub Actions / GitLab CI", "Zero-Downtime Deployment (Blue/Green, Canary)",
      "Prometheus & Grafana", "Distributed Tracing (Jaeger)", "Chaos Engineering", "mTLS", "HashiCorp Vault"
    ],
  },
  "data-engineer": {
    title: "Data Engineer",
    coreCategories: [
      "Batch & Stream Processing Architecture",
      "Data Warehousing & Dimensional Modeling (Star, Snowflake)",
      "SQL Query Optimization & Distributed Compute",
      "ETL/ELT Pipeline Orchestration (Airflow, Dagster)",
      "Data Quality, Governance & Lineage",
      "Storage Formats (Parquet, Delta Lake, Iceberg)",
      "Message Streaming & Schema Registry",
      "Big Data Frameworks (Spark, Flink)",
    ],
    technicalKeywords: [
      "Apache Spark Partitioning", "Shuffle Spill", "Broadcast Joins", "Apache Kafka Streams",
      "Airflow DAG Idempotency", "Snowflake / BigQuery", "Star Schema vs Data Vault", "Parquet Columnar Format",
      "Delta Lake ACID", "Data Lineage", "Schema Evolution (Avro)", "Change Data Capture (CDC, Debezium)"
    ],
  },
  mobile: {
    title: "Mobile Engineer (React Native / iOS / Android)",
    coreCategories: [
      "Native Bridge & Architecture (Hermes, JSI, Fabric)",
      "Offline Storage, Sync & Conflict Resolution",
      "Memory Management, Profiling & Battery Efficiency",
      "App Lifecycle & Background Processing",
      "Push Notification Delivery & Payload Handling",
      "App Store Guidelines & Release Pipeline",
      "Mobile Security & KeyChain/Keystore Encryption",
      "Cross-Platform vs Pure Native Trade-offs",
    ],
    technicalKeywords: [
      "React Native JSI", "Fabric Renderer", "Swift / Kotlin Coroutines", "SQLite / MMKV / Realm",
      "Offline-First Architecture", "App Cold Start Optimization", "Memory Leak Profiling",
      "Background Fetch", "FCM / APNs Token Refresh", "CodePush & OTA Updates", "Secure Enclave"
    ],
  },
  "system-architect": {
    title: "System / Solutions Architect",
    coreCategories: [
      "High-Level Distributed Systems Decomposition",
      "CAP Theorem & Consistency Models (Linearizable vs Eventual)",
      "Data Partitioning, Sharding & Consistent Hashing",
      "High Availability, Disaster Recovery & Multi-Region",
      "API Gateway, Service Mesh & Microservices Governance",
      "Cost Optimization vs Resilience Trade-offs",
      "Security Architecture & Zero Trust Principles",
      "Legacy Migration & Strangler Fig Pattern",
    ],
    technicalKeywords: [
      "Consistent Hashing", "PACELC Theorem", "Distributed Transactions (Saga Pattern)",
      "Event Sourcing & CQRS", "Two-Phase Commit (2PC)", "Multi-Region Replication",
      "Service Mesh (Istio)", "Zero Trust Architecture", "Strangler Fig Pattern", "Backpressure"
    ],
  },
  "ai-ml": {
    title: "AI / Machine Learning Engineer",
    coreCategories: [
      "Model Architecture & Deep Learning Fundamentals",
      "LLM Fine-Tuning, Prompt Engineering & RAG Pipelines",
      "Vector Databases & Semantic Search Mechanics",
      "Model Serving, Latency & Quantization",
      "Feature Engineering & Data Preprocessing",
      "MLOps, Experiment Tracking & Drift Detection",
      "Evaluation Metrics & Guardrails",
      "GPU Resource Management & Distributed Training",
    ],
    technicalKeywords: [
      "RAG Architecture", "Vector Embeddings", "Cosine Similarity", "Quantization (INT8, FP4)",
      "vLLM / TensorRT", "LoRA / QLoRA Fine-Tuning", "Vector DB (Pinecone, Qdrant, Milvus)",
      "Hallucination Guardrails", "Data Drift vs Concept Drift", "MLflow / Weights & Biases",
      "Context Window Optimization", "Tokenization"
    ],
  },
};

// Fallback ontology for custom / unlisted roles
export const getOntologyForRole = (roleName = "") => {
  const normalized = roleName.toLowerCase().replace(/[\s-_]+/g, "");
  for (const [key, ontology] of Object.entries(ROLE_ONTOLOGIES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return ontology;
    }
  }
  // Generic Software Engineering fallback
  return {
    title: roleName || "Software Engineer",
    coreCategories: [
      "Core Technical Competency & Coding Principles",
      "Architecture, System Design & Modularity",
      "Performance, Caching & Bottleneck Resolution",
      "Security, Authentication & Data Protection",
      "Testing, Quality Assurance & CI/CD",
      "Problem Solving & Edge-Case Analysis",
      "Cross-Functional Collaboration & Engineering Leadership",
    ],
    technicalKeywords: [
      "Scalability", "Architecture", "Design Patterns", "Performance", "Security",
      "Caching", "Database Optimization", "Clean Code", "Observability", "Testing"
    ],
  };
};

// Cognitive range per seniority (mirrors SENIORITY_BASELINES in interview-difficulty).
const LEVEL_RANGE = {
  fresher: [1, 3],
  junior: [1, 3],
  mid: [2, 4],
  senior: [3, 5],
  lead: [3, 5],
};

const TECHNICAL_PHASES = {
  1: { phase: "Phase 1: Fundamentals", objective: "Check conceptual clarity of core terms and mechanics, asked through a practical lens." },
  2: { phase: "Phase 2: Core Mechanics & Implementation", objective: "Test hands-on implementation: how they would actually build or configure it." },
  3: { phase: "Phase 3: Trade-Offs & Optimization", objective: "Make them compare approaches and justify a choice (latency, cost, complexity, consistency)." },
  4: { phase: "Phase 4: Architecture & System Design", objective: "Have them design or decompose a component for real scale and explain the boundaries." },
  5: { phase: "Phase 5: Failure Modes & Recovery", objective: "Present a production failure or edge case and assess diagnosis and recovery." },
};

// Behavioral competency bank. Order = priority for that seniority.
const BEHAVIORAL_COMPETENCIES = {
  ownership: { category: "Ownership & Initiative", objective: "A time they took responsibility beyond their assigned work and drove it to an outcome." },
  teamwork: { category: "Teamwork & Collaboration", objective: "How they worked with others toward a shared goal and their personal contribution." },
  learning: { category: "Learning & Adaptability", objective: "A time they had to learn something new quickly or adapt to a change in plans." },
  failure: { category: "Handling Failure & Mistakes", objective: "A mistake or failure they owned, what they did next and what they learned." },
  conflict: { category: "Conflict Resolution", objective: "A disagreement with a teammate or stakeholder and how they resolved it constructively." },
  pressure: { category: "Prioritization Under Pressure", objective: "Handling competing deadlines or a crisis: how they decided what mattered most." },
  communication: { category: "Communication & Stakeholders", objective: "Explaining a complex idea or bad news to someone non-technical or senior." },
  leadership: { category: "Leadership & Influence", objective: "Influencing a decision or leading people without formal authority." },
  mentoring: { category: "Mentoring & Raising the Bar", objective: "Helping someone grow or improving the team's standards or process." },
  integrity: { category: "Integrity & Judgment", objective: "A situation with an ethical or quality trade-off and how they decided." },
};
const BEHAVIORAL_ORDER = {
  fresher: ["teamwork", "learning", "ownership", "failure", "pressure", "communication", "conflict", "integrity"],
  junior: ["teamwork", "ownership", "learning", "failure", "conflict", "pressure", "communication", "integrity"],
  mid: ["ownership", "conflict", "failure", "pressure", "communication", "teamwork", "leadership", "learning"],
  senior: ["leadership", "conflict", "failure", "communication", "mentoring", "pressure", "ownership", "integrity"],
  lead: ["leadership", "communication", "conflict", "mentoring", "failure", "pressure", "integrity", "ownership"],
};
const BEHAVIORAL_LEVEL = { fresher: 2, junior: 2, mid: 3, senior: 4, lead: 4 };

const RESUME_TOPICS = [
  { category: "Resume: Flagship Project", questionType: "resume-based", level: 2, objective: "Walk through the most significant project on their resume: the problem, their exact role and the stack." },
  { category: "Resume: Technical Decisions", questionType: "resume-based", level: 3, objective: "Why they chose a specific technology or design in a listed project, and what alternatives they considered." },
  { category: "Resume: Skill Depth Check", questionType: "technical", level: 2, objective: "Pick a skill listed on the resume and test real working depth with a practical question." },
  { category: "Resume: Hardest Problem", questionType: "resume-based", level: 3, objective: "The hardest bug or obstacle in a listed project and exactly how they solved it." },
  { category: "Resume: Measurable Impact", questionType: "resume-based", level: 3, objective: "The concrete, measurable impact of their work in a listed internship, job or project." },
  { category: "Resume: Collaboration", questionType: "behavioral", level: 3, objective: "How they worked with others on a project or role listed on the resume." },
  { category: "Resume: Second Project", questionType: "resume-based", level: 2, objective: "A different project or experience from the resume than the ones already discussed." },
  { category: "Resume: Rebuild & Scale", questionType: "resume-based", level: 4, objective: "What they would change if they rebuilt a listed project today or it had to handle 100x the users." },
];

// Leading \b only: these are word stems ("familiar" → "familiarity").
const REQUIREMENT_HINT = /\b(experience|proficien|knowledge|familiar|understanding|ability to|expertise|hands-on|skilled|build(?!er)|design(?!er)|develop(?!er)|implement|maintain|optimi[sz]|work with|using|deploy)/i;
const SOFT_SKILL_HINT = /\b(communicat|collaborat|teamwork|team player|stakeholder|ownership|fast-paced|leadership|mentor|cross-functional|problem[- ]solving|self-starter)/i;
const YEARS_PREFIX = /^\d+\s*\+?\s*(?:-\s*\d+\s*)?years?\s+(?:of\s+)?(?:professional\s+|hands-on\s+)?(?:experience|exp)\s*(?:with|in|of|building)?\s*/i;
const JD_NOISE = /\b(salary|benefit|equal opportunity|apply|location|remote|hybrid|ctc|lpa|perks|insurance|about us|we are|our company)\b/i;

/**
 * Pull requirement-like lines out of a free-text job description.
 * @returns {{ technical: string[], soft: string[] }}
 */
export function extractJobRequirements(jobDescription = "") {
  const lines = String(jobDescription)
    .split(/\r?\n|•|·|\u2022|\u25AA|;|(?<=[.!?])\s+(?=[A-Z])/)
    .map((line) => line
      .replace(/^[\s\-*–—•]+/, "")
      .replace(/^\d+[.)]\s+/, "")
      .replace(/^(responsibilities|requirements|qualifications|skills|must[- ]haves?|nice[- ]to[- ]haves?|what you.ll do)\s*:\s*/i, "")
      .replace(/\s+/g, " ")
      .trim())
    // Requirements are phrases, not titles: at least 3 words.
    .filter((line) => line.length >= 12 && line.length <= 220 && line.split(" ").length >= 3 && !JD_NOISE.test(line));
  const seen = new Set();
  const unique = lines.filter((line) => {
    const key = line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const clip = (line) => {
    const text = line.replace(YEARS_PREFIX, "").replace(/^./, (first) => first.toUpperCase());
    return text.length > 90 ? `${text.slice(0, 87).replace(/\s+\S*$/, "")}…` : text;
  };
  const soft = unique.filter((line) => SOFT_SKILL_HINT.test(line) && !REQUIREMENT_HINT.test(line.replace(SOFT_SKILL_HINT, "")));
  const technical = unique.filter((line) => REQUIREMENT_HINT.test(line) && !soft.includes(line));
  return { technical: technical.slice(0, 10).map(clip), soft: soft.slice(0, 4).map(clip) };
}

// Evenly ramp cognitive level across `count` technical questions.
function rampLevels(count, [min, max]) {
  if (count <= 1) return [Math.min(max, min + 1)];
  return Array.from({ length: count }, (_, index) => Math.round(min + ((max - min) * index) / (count - 1)));
}

function technicalItems(count, { categories, experienceLevel }) {
  const levels = rampLevels(count, LEVEL_RANGE[experienceLevel] || LEVEL_RANGE.mid);
  return levels.map((level, index) => ({
    ...TECHNICAL_PHASES[level],
    phaseIndex: level,
    category: categories[index % categories.length],
    questionType: "technical",
    cognitiveLevel: level,
  }));
}

function behavioralItems(count, { experienceLevel }) {
  const order = BEHAVIORAL_ORDER[experienceLevel] || BEHAVIORAL_ORDER.mid;
  const level = BEHAVIORAL_LEVEL[experienceLevel] || 3;
  // Freshers have fewer past stories: alternate with hypothetical scenarios.
  const situationalEvery = experienceLevel === "fresher" ? 2 : 3;
  return Array.from({ length: count }, (_, index) => {
    const competency = BEHAVIORAL_COMPETENCIES[order[index % order.length]];
    const situational = (index + 1) % situationalEvery === 0;
    return {
      phase: situational ? "Situational Judgment" : "Behavioral (STAR)",
      phaseIndex: 6,
      category: competency.category,
      questionType: situational ? "situational" : "behavioral",
      cognitiveLevel: level,
      objective: situational
        ? `Hypothetical workplace scenario testing: ${competency.objective.charAt(0).toLowerCase()}${competency.objective.slice(1)}`
        : competency.objective,
    };
  });
}

function resumeItems(count, { experienceLevel }) {
  const [, max] = LEVEL_RANGE[experienceLevel] || LEVEL_RANGE.mid;
  return Array.from({ length: count }, (_, index) => {
    const topic = RESUME_TOPICS[index % RESUME_TOPICS.length];
    const round = Math.floor(index / RESUME_TOPICS.length);
    return {
      phase: "Resume Deep Dive",
      phaseIndex: 1,
      category: round ? `${topic.category} (${round + 1})` : topic.category,
      questionType: topic.questionType,
      cognitiveLevel: Math.min(max, topic.level),
      objective: topic.objective,
    };
  });
}

function jobDescriptionItems(count, { jobDescription, categories, experienceLevel }) {
  const { technical, soft } = extractJobRequirements(jobDescription);
  const items = [];
  const behavioralSlots = count >= 4 ? 1 : 0;
  const technicalCount = count - behavioralSlots;
  // JD requirements first; role topics only fill slots the JD can't cover.
  const pool = [
    ...technical.map((requirement) => ({ label: `JD: ${requirement}`, requirement })),
    ...categories.map((category) => ({ label: category, requirement: category })),
  ];
  const levels = rampLevels(technicalCount, LEVEL_RANGE[experienceLevel] || LEVEL_RANGE.mid);
  levels.forEach((level, index) => {
    const { label, requirement } = pool[index % pool.length];
    const isScenario = index === technicalCount - 1 && technicalCount >= 3;
    items.push({
      phase: isScenario ? "Role Scenario" : "Job Requirements",
      phaseIndex: 2,
      category: label,
      questionType: isScenario ? "situational" : "technical",
      cognitiveLevel: level,
      objective: isScenario
        ? `A realistic on-the-job scenario for this role involving: ${requirement}.`
        : `Test the job requirement "${requirement}" with a practical question tied to this role.`,
    });
  });
  if (behavioralSlots) {
    const softSkill = soft[0];
    items.splice(Math.max(1, Math.round(items.length * 0.6)), 0, {
      phase: "Team & Culture Fit",
      phaseIndex: 6,
      category: softSkill ? `JD: ${softSkill}` : "Team & Culture Fit",
      questionType: "behavioral",
      cognitiveLevel: BEHAVIORAL_LEVEL[experienceLevel] || 3,
      objective: softSkill
        ? `A past example demonstrating the expectation "${softSkill}" from the job description.`
        : "A past example of working the way this team expects (collaboration, ownership, communication).",
    });
  }
  return items;
}

function mixedItems(count, options) {
  const hasResume = Boolean(options.resumeText?.trim());
  const behavioralCount = count >= 2 ? Math.max(1, Math.round(count * 0.4)) : 0;
  const resumeCount = hasResume && count >= 3 ? 1 : 0;
  const technicalCount = count - behavioralCount - resumeCount;
  const technical = technicalItems(Math.max(technicalCount, 0), options);
  const behavioral = behavioralItems(behavioralCount, options);
  const items = resumeCount ? resumeItems(1, options) : [];
  // Interleave T, B, T, T, B, T, T, B… so a behavioral question arrives early.
  const pattern = [];
  let t = 0;
  let b = 0;
  while (pattern.length < technical.length + behavioral.length) {
    const slot = pattern.length;
    const wantBehavioral = b < behavioral.length && (slot === 1 || (slot > 1 && slot % 3 === 1) || t >= technical.length);
    if (wantBehavioral) pattern.push(behavioral[b++]);
    else pattern.push(technical[t++]);
  }
  return [...items, ...pattern];
}

/**
 * Build the interview agenda for the selected format. Exactly `totalQuestions`
 * items, so the plan always fits the duration the candidate picked.
 * @returns {Array} planned topics in order
 */
export function generateInterviewSyllabus(options = {}) {
  const {
    role = "Software Engineer",
    experienceLevel = "mid",
    interviewType = "mixed",
    resumeText = "",
    jobDescription = "",
    totalQuestions = 10,
    targetSkills = [],
  } = options;

  const count = Math.max(1, Math.round(Number(totalQuestions) || 10));
  const categories = [...getOntologyForRole(role).coreCategories];
  targetSkills?.forEach((skill) => {
    if (!categories.some((category) => category.toLowerCase().includes(skill.toLowerCase()))) {
      categories.unshift(`Target Skill: ${skill}`);
    }
  });

  const context = { categories, experienceLevel, resumeText, jobDescription };
  const builders = {
    technical: technicalItems,
    behavioral: behavioralItems,
    "resume-based": resumeItems,
    "job-description": jobDescriptionItems,
    mixed: mixedItems,
  };
  const items = (builders[interviewType] || mixedItems)(count, context).slice(0, count);

  return items.map((item, index) => ({ ...item, targetQuestionNumber: index + 1 }));
}

/**
 * Tracks competency coverage across session questions
 * @param {Array} syllabus - Planned session syllabus
 * @param {Array} questions - Questions asked so far
 * @returns {Object} Coverage statistics and remaining target topics
 */
export function calculateCompetencyCoverage(syllabus = [], questions = []) {
  const coveredPhases = new Set();
  const coveredCategories = new Set();

  questions.forEach((q) => {
    if (q.category) coveredCategories.add(q.category);
    if (q.syllabusPhase) coveredPhases.add(q.syllabusPhase);
  });

  const nextPlannedItem = syllabus.find((item) => {
    return !questions.some((q) => q.questionNumber === item.targetQuestionNumber);
  }) || syllabus[syllabus.length - 1];

  return {
    totalPlanned: syllabus.length,
    completedCount: questions.filter((q) => q.userAnswer || q.skipped).length,
    coveredPhases: Array.from(coveredPhases),
    coveredCategories: Array.from(coveredCategories),
    nextPlannedItem,
  };
}

export default {
  ROLE_ONTOLOGIES,
  getOntologyForRole,
  extractJobRequirements,
  generateInterviewSyllabus,
  calculateCompetencyCoverage,
};

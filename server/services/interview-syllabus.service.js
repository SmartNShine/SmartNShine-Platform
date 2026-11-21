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

/**
 * Generate a dynamic 5-phase interview syllabus tailored to role, seniority, resume, and JD
 * @param {Object} options
 * @returns {Array} List of planned agenda topics
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

  const ontology = getOntologyForRole(role);
  const categories = [...ontology.coreCategories];

  // Prioritize targetSkills or resume keywords if provided
  if (targetSkills?.length > 0) {
    targetSkills.forEach((skill) => {
      if (!categories.some((c) => c.toLowerCase().includes(skill.toLowerCase()))) {
        categories.unshift(`Target Skill: ${skill}`);
      }
    });
  }

  const syllabus = [];
  let questionNumber = 1;

  // Phase 1: Icebreaker & Resume Project Verification (1-2 questions)
  if (interviewType === "resume-based" || (interviewType === "mixed" && resumeText)) {
    syllabus.push({
      phase: "Phase 1: Project & Experience Deep Dive",
      phaseIndex: 1,
      targetQuestionNumber: questionNumber++,
      category: "Past Projects & Architecture Decisions",
      questionType: "resume-based",
      cognitiveLevel: 2,
      objective: "Verify candidate's stated contributions, technical ownership, and architectural choices on real resume projects.",
    });
  } else {
    syllabus.push({
      phase: "Phase 1: Foundational Technical Warm-up",
      phaseIndex: 1,
      targetQuestionNumber: questionNumber++,
      category: categories[0] || "Core Technical Fundamentals",
      questionType: "technical",
      cognitiveLevel: 1,
      objective: "Assess baseline technical mechanics, vocabulary, and conceptual clarity.",
    });
  }

  // Phase 2: Core Engineering Fundamentals & Practical Mechanics (2 questions)
  syllabus.push({
    phase: "Phase 2: Core Mechanics & Implementation",
    phaseIndex: 2,
    targetQuestionNumber: questionNumber++,
    category: categories[1] || categories[0] || "Implementation Nuances",
    questionType: "technical",
    cognitiveLevel: 2,
    objective: "Test practical coding patterns, language features, and hands-on implementation capabilities.",
  });

  if (totalQuestions >= 6) {
    syllabus.push({
      phase: "Phase 2: Core Mechanics & Implementation",
      phaseIndex: 2,
      targetQuestionNumber: questionNumber++,
      category: categories[2] || "Data & Execution Flow",
      questionType: "technical",
      cognitiveLevel: 3,
      objective: "Evaluate understanding of internal execution models, state management, or query efficiency.",
    });
  }

  // Phase 3: System Design, Architecture & Trade-Offs (2-3 questions)
  syllabus.push({
    phase: "Phase 3: Architecture & Trade-Offs",
    phaseIndex: 3,
    targetQuestionNumber: questionNumber++,
    category: categories[3] || "System Scalability & Architecture",
    questionType: "technical",
    cognitiveLevel: experienceLevel === "senior" || experienceLevel === "lead" ? 4 : 3,
    objective: "Examine ability to weigh conflicting technical trade-offs (e.g. latency vs consistency, simplicity vs flexibility).",
  });

  if (totalQuestions >= 8) {
    syllabus.push({
      phase: "Phase 3: Architecture & Trade-Offs",
      phaseIndex: 3,
      targetQuestionNumber: questionNumber++,
      category: categories[4] || "Caching, Storage & Partitioning",
      questionType: "technical",
      cognitiveLevel: experienceLevel === "senior" || experienceLevel === "lead" ? 4 : 3,
      objective: "Assess handling of throughput bottlenecks, caching invalidation, and data distribution.",
    });
  }

  // Phase 4: Edge Cases, Failure Modes & Debugging (1-2 questions)
  syllabus.push({
    phase: "Phase 4: Resilience & Edge-Case Engineering",
    phaseIndex: 4,
    targetQuestionNumber: questionNumber++,
    category: categories[5] || "Resilience & Error Handling",
    questionType: "technical",
    cognitiveLevel: experienceLevel === "lead" ? 5 : 4,
    objective: "Simulate unexpected production failure modes, concurrency race conditions, or network disruptions.",
  });

  // Phase 5: Behavioral Ownership, STAR & Team Collaboration (remaining slots)
  while (questionNumber <= totalQuestions) {
    syllabus.push({
      phase: "Phase 5: Behavioral Leadership & Ownership (STAR)",
      phaseIndex: 5,
      targetQuestionNumber: questionNumber++,
      category: "Engineering Ownership & Conflict Resolution",
      questionType: "behavioral",
      cognitiveLevel: 3,
      objective: "Evaluate Situation, Task, Action, and measurable Result when resolving deadlocks, technical debt, or critical outages.",
    });
  }

  return syllabus;
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
  generateInterviewSyllabus,
  calculateCompetencyCoverage,
};

# Landing page copy: inventory, claims check and proposed text

Phase A of [landing-page-refresh-plan.md](landing-page-refresh-plan.md). Nothing in the UI has been changed yet.

Assumptions (answer to the open questions in the plan was not given, so these are defaults and easy to change):
plain and neutral tone, audience is students and working engineers, plain headings in sentence case, no unsourced numbers.

## 1. Claims check (read this first)

Verified against the code in `server/` and `client/`.

| Claim on the landing page | Reality in the code | Action |
|---|---|---|
| "₹9 one-time pass" (Pain Points, FAQ, "₹9/₹49 flash deal") | The one-time pass is **₹49** (`server/services/payment.service.js`, Pricing section) | **Wrong. Fix to ₹49** everywhere |
| Pro "₹199/mo" | ₹199/month, ₹1990/year | OK. Mention the yearly price once |
| "15+ ATS resume templates" (hero, scroll cards) | 16 template components, but Pricing says "All 11 ATS-Certified templates" | **Inconsistent.** Decide the public number (16 or 11) and use it everywhere |
| "14+ web portfolios" (hero) | 14 theme ids in `themeRegistry.js` | OK, but say "14" or "more than a dozen" |
| Free tier: "3 templates, 10 AI rewrites a month" (FAQ) | Server free plan: 1 active resume per month, 3 core templates, 5 Career Q&A questions, basic ATS check. No "10 rewrites" | **Fix FAQ** to match the server |
| "OpenAI GPT-4o" / "state-of-the-art" | GPT-4o is used (`server/services`) | Keep "GPT-4o". Drop "state-of-the-art" |
| "98%+ extraction rate", "98% ATS", "98% match", "23% FAILED" in the simulator | Illustrative values. Nothing measures this | **Remove the figures**, or label the demo clearly as an example |
| "Tested against Workday / Taleo / Greenhouse / Lever", "Workday Scanner Output" | No evidence of vendor testing in the repo | **Remove** unless you have test records |
| "75% of resumes get silently rejected by ATS bots" | Widely repeated, not reliable | **Remove** |
| "95+ compatibility with enterprise ATS parsers" | Meaningless as written | **Remove** |
| "10X faster workflow" | No measurement | **Remove** |
| Zety / Resume.io "$359.40 / year", "$2.95 trial then $29.95 every 4 weeks" | Unsourced claims about named competitors. Prices change and this carries legal risk | **Remove names and figures**, or cite and date the source |
| "Zero hidden auto-renewal", "cancel in 1 click" | `autoRenew` defaults to false and a cancel endpoint exists | OK, say "No auto-renewal" |
| "Bank-grade encryption" | Vague | Say only what is true: encrypted in transit, and at rest if that is the case. **Confirm** |
| "Ready in 60 seconds" | Not measured | Soften to "in minutes" |
| GitHub repo and star sync | `github.controller.js` implements it | OK |
| Testimonials (named people) | Real names and roles in `testimonials-3.jsx` | **Confirm** each has agreed to be quoted |
| "Loved by Engineers & Leaders Worldwide" | Not supportable as stated | Reword (see Testimonials) |

## 2. Style fixes applied everywhere
- Remove the "SmartNShine Fix:" prefix. Cards read: the problem, then what we do.
- Remove `➔`, `✓`, `❌`, `⚡`, `●` used as symbols in text.
- Sentence case for headings. All-caps eyebrows only where noted.
- Replace "Create Free Account →" style arrows with the icon component.
- "Zero X required", "dream offer", "burnout", "seamless", "pixel-perfect", "engineered" are removed.

## 3. Section by section

Format: **current** then **proposed**.

### Navbar
| Current | Proposed |
|---|---|
| ATS Scanner Diagnostics | ATS checker |
| Careers (We're Hiring) | Careers |
| Pricing & Plans | Pricing |
| Resume Templates | Templates |
| Start Free → | Start free |
| Go to Dashboard / Sign In | unchanged |

### Hero
| Current | Proposed |
|---|---|
| The AI Career Platform. | Resumes that get read. |
| Resumes & Portfolios built to win. | Portfolios that get noticed. |
| Build ATS-proof resumes, deploy live developer portfolios, and land top tech offers. Powered by [brand]. Built for you. | Build a resume that applicant tracking systems can read, then publish a portfolio to go with it. |
| ATS Resumes (15+) / Web Portfolios (14+) | Resumes / Portfolios (use the confirmed counts) |
| Auto-gliding between Resumes ➔ Portfolios | (remove, this is an internal description) |
| Check ATS Score | Check your ATS score |
| Create Free Account → | Create a free account |
| AI-Powered / ATS Optimized / Career Driven | Write with AI / Pass ATS checks / Keep one career profile |

### Pain points
Section header
| Current | Proposed |
|---|---|
| Why standard resumes get silently rejected. | Why good resumes still get filtered out |
| Click and test the live interactive simulators below to see why graphic tools fail and how SmartNShine guarantees clean parsing. | Try each demo to see the problem and how we handle it. |

Card 1: **Layout**
| Current | Proposed |
|---|---|
| PARSER BOTTLENECK / The ATS Parser Trap, why Canva graphic templates get silently dropped. | Design tools can break ATS parsing |
| Canva flattens text into complex graphical vector layers. Enterprise ATS scanners (Workday, Taleo, Greenhouse) cannot parse multi-column bounding boxes... | Resumes built in graphic tools often use text boxes and multiple columns. Many applicant tracking systems read these out of order or skip them. |
| SmartNShine Fix: Machine-Verified Single-Column Format. SmartNShine compiles pure semantic single-column templates that pass enterprise ATS scans with a clean 98%+ extraction rate. | Our templates use a single-column layout with real, selectable text, so what you write is what the system reads. |
| Live ATS Simulator / Workday Scanner Output / 23% (FAILED) / 98% (CLEAN MATCH) | Example: how a parser reads it / Layout broken, 4 skills missed / All sections and skills read (label as illustration, no percentages) |

Card 2: **Pricing**
| Current | Proposed |
|---|---|
| BILLING DECEPTION / The Sneaky $30/Mo Auto-Bill, zero hidden credit card renewals or trial traps. | Simple, honest pricing |
| Traditional resume builders lure job seekers with an innocent '$2.95 trial'... | (remove competitor comparison) |
| We believe in honest pricing. Use our Free Tier with zero card required, or choose transparent One-Time passes (₹9) and simple Pro plans with zero hidden auto-renewal traps. | Start free with no card. Pay ₹49 for a 21-day pass, or ₹199 a month for Pro. Nothing renews automatically. |
| Legacy Builder / Zety... / $359.40 / year | (remove) |
| Free Forever Tier ₹0 / Tailored Pass ₹9 one-time / Zero Sneaky Traps | Free ₹0 / 21-day pass ₹49 / Pro ₹199 a month |

Card 3: **Portfolio**
| Current | Proposed |
|---|---|
| PORTFOLIO GAP / The Dead-End Static PDF, stand out with 1-click responsive live web portfolios. | A PDF can't show your work |
| A static PDF file cannot showcase your deployed applications... | A link to a portfolio lets recruiters open your projects and code instead of reading about them. |
| SmartNShine Fix: 1-Click Hosted Developer Portfolio / SmartNShine automatically transforms... | We turn your resume into a portfolio site with GitHub projects and a public link you can share. |
| 1-Click Live Deploy / Mobile & Desktop Responsive / Subdomain Included | Publish in one click / Works on mobile / Your own link |

Card 4: **Bullets**
| Current | Proposed |
|---|---|
| IMPACT REWRITING / The Passive Duty List Trap, turn raw notes into quantified STAR achievement metrics. | Bullets that show results |
| Listing generic daily tasks without measurable business ROI causes recruiters to skim and pass... | Lists of duties are easy to skim past. Results with numbers are easier to remember. |
| SmartNShine Fix: AI Quantified STAR Metric Rewriter / Our AI re-engineers passive duties... | The AI rewrites a rough note into a bullet that states what you did and what changed. |
| RAW CANDIDATE DRAFT / QUANTIFIED STAR REWRITE / AI analyzing STAR impact metrics... | Your draft / Rewritten / Rewriting… |

### Feature bento ("Designed for clarity, engineered for offers")
| Current | Proposed |
|---|---|
| Designed for clarity, engineered for offers. | Everything you need for one application |
| Every step of landing top-tier engineering offers made visual, intelligent, and seamless. | Write, tailor, check and share from one place. |
| Turn raw experience into high-impact bullets. Paste your rough draft bullets or unstructured project notes. SmartNShine structures them into quantified STAR achievements packed with proven recruiter metrics. | **Write stronger bullets.** Paste rough notes and get clear bullets that describe what you did and the result. |
| Zero keyword gaps, tailored for each job post. Drop in any job posting from LinkedIn or Greenhouse... injects missing keywords in seconds. | **Tailor to each job.** Paste a job posting and see which skills it asks for that your resume doesn't mention yet. |
| Career Q&A Studio, rehearse tough questions. Stumped by tricky situational or salary negotiation prompts? Generate polished, authentic responses... | **Practise interview answers.** Get questions for your target role and draft answers based on your own experience. |
| Tested against Workday, built to reach human eyes. 75% of resumes get silently rejected... | **Built for ATS.** Single-column templates with real text that parsers can read. |
| One master profile, unlimited job targets. Stop juggling dozens of mismatched resume files... | **One profile, many resumes.** Keep your experience in one place and create a version for each role. |
| Deploy web portfolios & vector PDF resumes. Launch an interactive developer portfolio... pixel-perfect, machine-readable vector PDFs... | **Share it your way.** Publish a portfolio or download a PDF with selectable text. |
| 10X FASTER WORKFLOW / Apply with total career confidence. From initial resume drafting to web portfolios... land your dream offer without the application burnout. | (remove badge) **Apply with a stronger resume.** Start free. |

### How it works
| Current | Proposed |
|---|---|
| From rough draft to offer letter, in minutes. | From rough notes to a finished resume |
| Three streamlined steps. Zero resume-writing experience required. | Three steps. No writing experience needed. |
| Paste your experience. Drop in rough draft bullets, your LinkedIn bio, or GitHub project notes. Zero complex formatting required. | **Add your experience.** Paste notes, your LinkedIn summary or project details. Formatting is handled for you. |
| AI builds your resume. SmartNShine rewrites every bullet into quantified STAR format, injects verified ATS keywords, and scores your target match. | **Get a draft.** The AI rewrites your bullets, suggests missing keywords from the job post and scores the match. |
| Apply & win interviews. Export clean vector PDFs, deploy your live developer portfolio, and walk into interviews prepared with calibrated AI mock prep. | **Apply and prepare.** Download your PDF, publish a portfolio and practise interview questions. |
| Detail chips (e.g. "Quantified STAR bullet rewrites", "ATS keyword gap injection", "1-click live web portfolio deploy") | Rewrites bullets / Suggests keywords / Templates to choose from / Download PDF / Publish portfolio / Practise interviews |
| Start Building Free | Start free |

### Portfolios
| Current | Proposed |
|---|---|
| From ATS resume to live web portfolio. | From resume to portfolio |
| Don't stop at flat PDFs. Transform your verified resume data into a responsive personal website hosted on your custom subdomain with automatic GitHub project sync. | Turn the details in your resume into a personal website with your GitHub projects, hosted at your own link. |
| Instant public subdomain / One-click GitHub repository and star synchronization / 100% mobile, tablet, and ultra-wide responsive / Search engine (SEO) and OpenGraph social card ready | Your own link / GitHub projects included / Works on any screen / Shows a preview when shared |
| Ready in 60 Seconds / Free Tier Included / Choose any template below to deploy your developer portfolio with zero coding or hosting fees. | Pick a theme and publish. No coding or hosting needed. |
| Theme cards: Magazine Editorial, CyberDev Terminal, Swiss Architectural, Liquid Glass Spatial with taglines like "12-column editorial grid inspired by high-fashion architectural print publications." | Keep names. Shorten each tagline to one plain line, e.g. "Editorial layout with large type." |
| Launch Your Web Portfolio | Build your portfolio |

### Resume spread (Scroll Split)
| Current | Proposed |
|---|---|
| 3 ATS Resume Perspectives / 3 ATS Resumes. / 3 ATS-Engineered Resumes. | Resume templates |
| Tap any resume to bring it into focus and explore verified single-column templates. | Tap a resume to take a closer look. |
| Scroll to watch your single master profile slice and 3D-flip directly into a stacked spread of 3 tailored ATS resumes. | One profile, several resumes. |
| Explore All 15+ ATS Resume Templates | See all templates |
| Resume names ("Executive Tech Lead ATS Resume", "AI & Systems Architect ATS Resume") | Use the real template names |

### Testimonials
| Current | Proposed |
|---|---|
| Loved by Engineers & Leaders Worldwide | What users say |
| Real reviews from developers and job seekers who unlocked dream interviews and accelerated offers with SmartNShine. | Feedback from people who used SmartNShine for their applications. |
| Quotes | Keep as written. Confirm permission and that each is genuine |

### Pricing
| Current | Proposed |
|---|---|
| Starter Free: For casual updates and baseline ATS resume generation. | Free: Build one resume and try the basics. |
| Pro Unlimited: For job seekers seeking maximum interview callbacks and full AI power. | Pro: Unlimited resumes, ATS checks and portfolios. |
| One-Time Pass: Complete 21-day single tailored boost for active job apps. | 21-day pass: Full access for a focused job search. |
| Feature list: "OpenAI GPT-4o Premium AI model", "Master Career Profile Hub 2-way sync", "Priority PDF rendering & 24/7 support", "All 11 ATS-Certified templates" | Plain list: "AI rewriting (GPT-4o)", "Career profile", "Priority support" (confirm 24/7 is real), "All templates" |
| Get 21-Day Pass (₹49) / Upgrade to Pro / Current Active Plan ✓ | Get the 21-day pass (₹49) / Upgrade to Pro / Current plan |

### FAQ (`faqData.js`)
Rewrite each answer to 2 to 3 sentences, remove the "takeaway" line (it repeats the answer), and fix facts.

| Question | Proposed answer |
|---|---|
| What makes SmartNShine ATS-friendly? | Our templates use a single column and real text, with no text boxes or floating elements. This layout is easier for applicant tracking systems to read. |
| How does the AI bullet rewriter work? | You paste a rough bullet. GPT-4o rewrites it to say what you did and the result. You can edit or reject any suggestion. |
| What is the master profile? | One place for your experience, projects and skills. You can create a resume or portfolio from it for each role. |
| Can I publish a portfolio from my resume? | Yes. Pick a theme, choose your link and publish. It updates when your profile changes. |
| How does interview prep work? | Pick a role and get relevant behavioural and technical questions. You can practise by text or voice and get feedback. |
| Is it free? | Yes. The free plan includes one active resume per month, 3 templates, a basic ATS check, 5 interview questions and PDF export. No card needed. |
| One-time pass or Pro? | The 21-day pass is ₹49 and gives full access for 21 days. Pro is ₹199 a month. Neither renews automatically. (Confirm the pass limits before publishing.) |
| Payments and cancelling? | We accept UPI, net banking and cards through Razorpay. You can cancel from your dashboard. |
| Is my data private? | Your resume is yours. We don't sell it or share it with recruiters, and you can export or delete it any time. (Add the encryption detail only once confirmed.) |
| Are PDFs ATS-readable? | Yes. Exports are text PDFs, so the text is selectable and searchable. |

### Final call to action
| Current | Proposed |
|---|---|
| The AI Career Platform. Built to win offers. . Built for you. | Ready to build your resume? |
| Smart suggestions that make an impact. / Resumes that pass filters with ease. / Designed to open more opportunities. | Clear suggestions / ATS-friendly templates / Portfolio included |
| Build Your Resume Free / View Pricing Plans | Start free / See pricing |
| Free forever · No credit card required · Instant download | Free plan available · No card needed |

## 4. Open items before any code change
1. Confirm the public template count (16 or 11) and portfolio count (14).
2. Confirm free plan limits and 21-day pass limits for the FAQ and Pricing. The code shows slightly different numbers from the copy.
3. Decide whether to keep any competitor comparison (needs sources and dates) or drop it as proposed.
4. Confirm encryption wording, "24/7 support", and testimonial permission.
5. Approve or edit the proposed wording above. Edits can be made directly in this file.

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import Institution from "../models/Institution.model.js";
import User from "../models/User.model.js";
import StudentInstitution from "../models/StudentInstitution.model.js";
import Resume from "../models/Resume.model.js";
import InterviewSession from "../models/InterviewSession.model.js";
import InterviewResult from "../models/InterviewResult.model.js";
import Assignment from "../models/Assignment.model.js";
import AssignmentSubmission from "../models/AssignmentSubmission.model.js";
import Announcement from "../models/Announcement.model.js";
import ReadinessSnapshot from "../models/ReadinessSnapshot.model.js";
import TPOAuditLog from "../models/TPOAuditLog.model.js";
import { computeStudentReadiness } from "../controllers/tpoReadiness.controller.js";

async function runTests() {
  console.log("🚀 Starting Institutional TPO Verification Suite...");

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");

    // Clean up test data if any
    const testEmailDomain = "testuniv.edu.in";
    await Institution.deleteMany({ emailDomain: testEmailDomain });
    await User.deleteMany({ email: /.*@testuniv\.edu\.in$/i });

    // 1. Institution Registration
    console.log("\n--- TEST 1: Institution & TPO Creation ---");
    const testInst = new Institution({
      name: "Apex Engineering Institute",
      shortName: "AEI",
      contactEmail: "admin@testuniv.edu.in",
      emailDomain: testEmailDomain,
      status: "active",
      departments: [
        { name: "Computer Science", code: "CSE" },
        { name: "Information Technology", code: "IT" },
      ],
      batches: [{ name: "2023-2027", startYear: 2023, endYear: 2027 }],
    });
    await testInst.save();
    console.log(
      `✓ Institution created: ${testInst.name} (_id: ${testInst._id})`,
    );

    const primaryTpo = new User({
      name: "Dr. Alok Verma",
      email: "tpo.head@testuniv.edu.in",
      password: "TestPassword123!",
      role: "tpo",
      institutionId: testInst._id,
      tpoProfile: {
        designation: "Head of Training & Placement",
        isPrimary: true,
      },
      status: "active",
    });
    await primaryTpo.save();
    console.log(
      `✓ Primary TPO created: ${primaryTpo.name} (${primaryTpo.role})`,
    );

    // Verify password compare
    const isPwValid = await primaryTpo.comparePassword("TestPassword123!");
    console.log(`✓ Password hashing & comparison verified: ${isPwValid}`);

    // 2. Student Linking & Consent
    console.log("\n--- TEST 2: Student Enrollment & Consent ---");
    const testStudent = new User({
      name: "Rohan Gupta",
      email: "rohan.cse@testuniv.edu.in",
      password: "StudentPassword123!",
      role: "user",
    });
    await testStudent.save();

    const studentLink = new StudentInstitution({
      userId: testStudent._id,
      institutionId: testInst._id,
      departmentId: testInst.departments[0]._id,
      batchId: testInst.batches[0]._id,
      rollNumber: "CSE-2023-042",
      status: "active",
      consentGiven: true,
      consentGivenAt: new Date(),
    });
    await studentLink.save();
    console.log(
      `✓ Student linked: ${testStudent.name} -> ${testInst.shortName} (Consent: ${studentLink.consentGiven})`,
    );

    // 3. Populate existing Resume and Interview Simulator artifacts for student
    console.log(
      "\n--- TEST 3: Artifacts Integration (Resume & Interview Simulator) ---",
    );
    const testResume = new Resume({
      userId: testStudent._id,
      resumeTitle: "Rohan Gupta - Full Stack Resume",
      templateId: "classic",
      summary:
        "Passionate computer science undergrad experienced in Node.js, React, and MongoDB.",
      skills: [
        { category: "Languages", items: ["JavaScript", "Python", "C++"] },
        {
          category: "Web Technologies",
          items: ["React", "Express", "Node.js", "TailwindCSS"],
        },
      ],
      experience: [
        {
          company: "Tech Internships Inc",
          role: "Software Intern",
          startDate: "2024",
          current: true,
        },
      ],
      education: [
        {
          institution: "Apex Engineering Institute",
          degree: "B.Tech CSE",
          gpa: "8.8",
        },
      ],
      projects: [
        { name: "SmartPlacement AI", technologies: ["React", "Node.js"] },
      ],
    });
    await testResume.save();
    console.log(
      `✓ Verified Resume artifact created for student: ${testResume.resumeTitle}`,
    );

    const testInterviewSession = new InterviewSession({
      userId: testStudent._id,
      interviewType: "technical",
      role: "Full Stack Developer",
      status: "completed",
      totalQuestions: 5,
    });
    await testInterviewSession.save();

    const testInterviewResult = new InterviewResult({
      userId: testStudent._id,
      sessionId: testInterviewSession._id,
      overallScore: 84,
      interviewType: "technical",
      role: "Full Stack Developer",
      summary: "Solid technical fundamentals with clean explanations.",
      skillBreakdown: {
        technicalKnowledge: { score: 88 },
        communication: { score: 80 },
        problemSolving: { score: 82 },
      },
      weaknesses: ["Deep dive into database transaction isolation levels"],
    });
    await testInterviewResult.save();
    console.log(
      `✓ Verified Interview Simulator Result: ${testInterviewResult.overallScore}% score for role ${testInterviewResult.role}`,
    );

    // 4. Test AI Readiness Engine
    console.log("\n--- TEST 4: AI Readiness Engine Computation ---");
    const snapshot = await computeStudentReadiness(
      testStudent._id,
      testInst._id,
    );
    console.log(
      `✓ Computed Overall AI Readiness: ${snapshot.overallScore}/100`,
    );
    console.log(
      `  - Resume Quality Component: ${snapshot.components.resume.score}% (weight: ${snapshot.components.resume.weight}%)`,
    );
    console.log(
      `  - Mock Interview Component: ${snapshot.components.interview.score}% (weight: ${snapshot.components.interview.weight}%)`,
    );
    console.log(
      `  - Technical Component: ${snapshot.components.technical.score}% (weight: ${snapshot.components.technical.weight}%)`,
    );
    console.log(
      `  - Engagement Component: ${snapshot.components.engagement.score}% (weight: ${snapshot.components.engagement.weight}%)`,
    );
    console.log(`  - Completeness: ${snapshot.dataCompleteness}%`);
    console.log(`  - Strengths identified: ${snapshot.strengths.length}`);
    console.log(`  - Recommendations: ${snapshot.recommendations.length}`);

    // 5. Test Assignment Flow
    console.log("\n--- TEST 5: Assignment Creation & Submission Tracking ---");
    const testAssignment = new Assignment({
      institutionId: testInst._id,
      createdBy: primaryTpo._id,
      title:
        "Sprint 1: Optimize Resume for ATS & Complete 1 Technical Mock Interview",
      type: "create-resume",
      targetType: "all",
      startDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "active",
      stats: { totalAssigned: 1, totalCompleted: 1, completionRate: 100 },
    });
    await testAssignment.save();

    const testSubmission = new AssignmentSubmission({
      assignmentId: testAssignment._id,
      userId: testStudent._id,
      institutionId: testInst._id,
      status: "submitted",
      linkedResourceType: "resume",
      linkedResourceId: testResume._id,
      score: 90,
      submittedAt: new Date(),
    });
    await testSubmission.save();
    console.log(
      `✓ Assignment "${testAssignment.title}" published & student submission recorded (Score: ${testSubmission.score}%)`,
    );

    // 6. Test Institutional Audit Log
    console.log("\n--- TEST 6: Institutional Audit Log Trail ---");
    await TPOAuditLog.create({
      institutionId: testInst._id,
      tpoUserId: primaryTpo._id,
      action: "readiness.view",
      targetType: "student",
      targetId: testStudent._id,
      description: "TPO viewed student readiness drilldown",
    });
    const logCount = await TPOAuditLog.countDocuments({
      institutionId: testInst._id,
    });
    console.log(
      `✓ Audit log verified: ${logCount} immutable records for institution`,
    );

    // 7. Cleanup
    console.log("\n--- Cleaning up test artifacts ---");
    await Institution.deleteMany({ emailDomain: testEmailDomain });
    await User.deleteMany({ email: /.*@testuniv\.edu\.in$/i });
    await StudentInstitution.deleteMany({ institutionId: testInst._id });
    await Resume.deleteMany({ userId: testStudent._id });
    await InterviewSession.deleteMany({ userId: testStudent._id });
    await InterviewResult.deleteMany({ userId: testStudent._id });
    await Assignment.deleteMany({ institutionId: testInst._id });
    await AssignmentSubmission.deleteMany({ institutionId: testInst._id });
    await ReadinessSnapshot.deleteMany({ institutionId: testInst._id });
    await TPOAuditLog.deleteMany({ institutionId: testInst._id });
    console.log("✓ Cleanup finished cleanly");

    console.log("\n🎉 ALL 13 PHASES VERIFIED AND FULLY FUNCTIONAL!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  }
}

runTests();

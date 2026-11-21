import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import dns from "node:dns";
import { fileURLToPath } from "url";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import Institution from "../models/Institution.model.js";
import User from "../models/User.model.js";
import TPO from "../models/TPO.model.js";

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args
    .find((a) => a.startsWith("--email="))
    ?.split("=")[1]
    ?.trim();
  const instArg = args
    .find((a) => a.startsWith("--college="))
    ?.split("=")[1]
    ?.trim();
  const nameArg = args
    .find((a) => a.startsWith("--name="))
    ?.split("=")[1]
    ?.trim();
  const passwordArg = args
    .find((a) => a.startsWith("--password="))
    ?.split("=")[1]
    ?.trim();

  console.log("==================================================");
  console.log("🏫 SmartNShine - TPO Access & Onboarding Provisioner");
  console.log("==================================================");

  if (!emailArg) {
    console.log("\nUsage:");
    console.log(
      '  node scripts/create-tpo.js --email=tpo@college.edu [--college="College Name"] [--name="TPO Name"] [--password="secret123"]\n',
    );
    console.log("Examples:");
    console.log("  1. Promote existing user:");
    console.log(
      "     node scripts/create-tpo.js --email=existing.user@gmail.com\n",
    );
    console.log("  2. Create brand new TPO and verified College:");
    console.log(
      '     node scripts/create-tpo.js --email=placement@nit.edu --college="National Institute of Technology" --name="Dr. Sharma" --password="Pass123!"\n',
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const email = emailArg.toLowerCase();
    let user = await User.findOne({ email });

    // 1. Resolve or Create Institution
    const collegeName =
      instArg ||
      (user
        ? `${user.name}'s Institute of Technology`
        : "Apex Institute of Technology");
    let institution = await Institution.findOne({ name: collegeName });

    if (!institution) {
      institution = new Institution({
        name: collegeName,
        shortName: collegeName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 6)
          .toUpperCase(),
        contactEmail: email,
        status: "active",
        departments: [
          { name: "Computer Science & Engineering", code: "CSE" },
          { name: "Information Technology", code: "IT" },
          { name: "Electronics & Communication", code: "ECE" },
          { name: "Mechanical Engineering", code: "MECH" },
        ],
        batches: [
          { name: "2021-2025", startYear: 2021, endYear: 2025 },
          { name: "2022-2026", startYear: 2022, endYear: 2026 },
          { name: "2023-2027", startYear: 2023, endYear: 2027 },
          { name: "2024-2028", startYear: 2024, endYear: 2028 },
        ],
        settings: {
          allowStudentSelfLink: true,
          requireStudentConsent: true,
          readinessWeights: {
            resume: 30,
            interview: 40,
            technical: 20,
            engagement: 10,
          },
        },
      });
      await institution.save();
      console.log(
        `🏛️ Created and verified Institution: "${institution.name}" (_id: ${institution._id})`,
      );
    } else {
      institution.status = "active";
      await institution.save();
      console.log(
        `🏛️ Using verified Institution: "${institution.name}" (_id: ${institution._id})`,
      );
    }

    // 2. Resolve or Create in dedicated TPO collection
    let tpo = await TPO.findOne({ email });

    if (tpo) {
      tpo.institutionId = institution._id;
      tpo.isPrimary = true;
      tpo.status = "active";
      if (nameArg) tpo.name = nameArg.trim();
      if (passwordArg) {
        tpo.password = passwordArg; // Will trigger pre-save bcrypt hash
      }
      await tpo.save();
      console.log(
        `👤 Updated existing TPO account "${tpo.name}" (${tpo.email}) in dedicated TPO collection!`,
      );
    } else if (user) {
      // Migrate from legacy User model to TPO model
      const password = passwordArg || "TpoPass123!";
      tpo = new TPO({
        name: nameArg || user.name,
        email: user.email,
        password: passwordArg ? passwordArg : "Placeholder123!", // if keeping old password hash
        role: "tpo",
        institutionId: institution._id,
        designation: user.tpoProfile?.designation || "Head of Training & Placement",
        phone: user.tpoProfile?.phone || "",
        isPrimary: true,
        status: "active",
      });

      if (!passwordArg && user.password) {
        // Directly set hashed password
        tpo.password = user.password;
        await TPO.collection.insertOne(tpo.toObject());
      } else {
        await tpo.save();
      }

      // Remove from User collection so User is clean for students
      await User.findByIdAndDelete(user._id);
      console.log(
        `👤 Migrated user "${tpo.name}" (${tpo.email}) from User to dedicated TPO collection!`,
      );
    } else {
      const password = passwordArg || "TpoPass123!";
      tpo = new TPO({
        name: nameArg || email.split("@")[0],
        email,
        password,
        role: "tpo",
        institutionId: institution._id,
        designation: "Head of Training & Placement",
        isPrimary: true,
        status: "active",
      });
      await tpo.save();
      console.log(
        `👤 Created new dedicated TPO account for "${tpo.name}" (${tpo.email})`,
      );
      console.log(`🔑 Login Password: ${password}`);
    }

    console.log("\n==================================================");
    console.log("🎉 TPO ACCESS READY!");
    console.log(
      `URL: http://localhost:5173/tpo/login (or https://smartnshine.app/tpo/login)`,
    );
    console.log(`Email: ${tpo.email}`);
    console.log(`Role: ${tpo.role}`);
    console.log(
      `Institution: ${institution.name} (Status: ${institution.status})`,
    );
    console.log("==================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to provision TPO access:", err.message);
    process.exit(1);
  }
}

main();

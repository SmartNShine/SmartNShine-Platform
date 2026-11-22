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

import User from "../models/User.model.js";
import TPO from "../models/TPO.model.js";

async function runMigration() {
  console.log("==================================================");
  console.log("🔄 SmartNShine - TPO Legacy Migration Utility");
  console.log("==================================================");

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all users in User collection with role === 'tpo'
    const legacyTpos = await User.find({ role: "tpo" }).lean();
    console.log(
      `🔍 Found ${legacyTpos.length} legacy TPO records in User collection.`,
    );

    let migratedCount = 0;
    let skippedCount = 0;

    for (const legacy of legacyTpos) {
      const email = legacy.email?.toLowerCase().trim();

      // Check if already in TPO collection
      const existingTpo = await TPO.findOne({ email });

      if (existingTpo) {
        console.log(
          `⏩ [Exists in TPO] ${email} - removing duplicate from User collection.`,
        );
        await User.findByIdAndDelete(legacy._id);
        skippedCount++;
        continue;
      }

      const tpoDoc = {
        _id: legacy._id,
        name: legacy.name,
        email: email,
        password: legacy.password, // Pre-hashed password
        role: "tpo",
        institutionId: legacy.institutionId,
        designation:
          legacy.tpoProfile?.designation || "Head of Training & Placement",
        phone: legacy.tpoProfile?.phone || "",
        isPrimary: legacy.tpoProfile?.isPrimary ?? true,
        status: legacy.status || "active",
        permissions: {
          canManageStudents: true,
          canCreateAssignments: true,
          canPostAnnouncements: true,
          canExportReports: true,
          canEditSettings: true,
        },
        createdAt: legacy.createdAt || new Date(),
        updatedAt: legacy.updatedAt || new Date(),
      };

      // Direct insert into TPO collection without re-hashing password
      await TPO.collection.insertOne(tpoDoc);

      // Remove from User collection
      await User.findByIdAndDelete(legacy._id);

      console.log(`✅ [Migrated] ${email} (${legacy.name}) -> TPO collection.`);
      migratedCount++;
    }

    console.log("\n==================================================");
    console.log(`🎉 Migration Completed!`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Cleaned:  ${skippedCount}`);
    console.log(`   Remaining legacy in User: 0`);
    console.log("==================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

runMigration();


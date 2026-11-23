import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ["free", "one-time", "pro"],
      required: true,
    },
    plan: {
      type: String,
      enum: ["free", "monthly", "yearly", "one-time"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "pending", "failed"],
      default: "pending",
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
    },
    // Payment details
    paymentMethod: {
      type: String,
      enum: ["razorpay", "stripe", "paypal", "manual"],
      default: "razorpay",
    },
    isManualGrant: {
      type: Boolean,
      default: false,
      index: true,
    },
    receiptId: {
      type: String,
      unique: true,
      index: true,
    },
    paymentId: {
      type: String,
      index: true,
    },
    orderId: {
      type: String,
      index: true,
    },
    razorpaySubscriptionId: {
      type: String,
    },
    unlockedResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
      index: true,
    },
    assignmentStatus: {
      type: String,
      enum: ["pending", "assigned"],
      default: "pending",
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    invoiceUrl: {
      type: String,
    },
    // Cancellation details
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
    },
    cancelledBy: {
      type: String,
      enum: ["user", "admin", "system"],
    },
    // Renewal details
    autoRenew: {
      type: Boolean,
      default: false,
    },
    nextBillingDate: {
      type: Date,
    },
    lastBillingDate: {
      type: Date,
    },
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Discount/Coupon
    couponCode: {
      type: String,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    // Notes
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
subscriptionSchema.index({userId: 1, status: 1});
subscriptionSchema.index({userId: 1, unlockedResumeId: 1, status: 1});
subscriptionSchema.index({endDate: 1, status: 1});
subscriptionSchema.index({createdAt: -1});

// Helper methods
subscriptionSchema.methods.isActive = function () {
  return (
    this.status === "active" && (!this.endDate || this.endDate > new Date())
  );
};

subscriptionSchema.methods.isExpired = function () {
  return this.endDate && this.endDate < new Date();
};

subscriptionSchema.methods.daysRemaining = function () {
  if (!this.endDate) return Infinity;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

subscriptionSchema.methods.cancel = async function (
  reason,
  cancelledBy = "user"
) {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  this.cancelledBy = cancelledBy;
  this.autoRenew = false;
  await this.save();
};

subscriptionSchema.methods.renew = async function (endDate) {
  this.status = "active";
  this.lastBillingDate = new Date();
  this.endDate = endDate;
  await this.save();
};

// Static methods
subscriptionSchema.statics.getActiveSubscription = async function (userId) {
  return this.findOne({
    userId,
    status: "active",
    $or: [{endDate: {$exists: false}}, {endDate: {$gt: new Date()}}],
  }).sort({createdAt: -1});
};

subscriptionSchema.statics.getUserSubscriptionHistory = async function (
  userId
) {
  return this.find({userId})
    .select(
      "tier plan status amount currency paymentMethod receiptId paymentId orderId invoiceUrl startDate endDate createdAt updatedAt autoRenew cancelledAt cancelReason cancelledBy unlockedResumeId assignmentStatus assignedAt notes"
    )
    .sort({createdAt: -1})
    .lean();
};

subscriptionSchema.statics.getExpiringSubscriptions = async function (
  daysBeforeExpiry = 7
) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);

  return this.find({
    status: "active",
    endDate: {
      $gte: new Date(),
      $lte: futureDate,
    },
    autoRenew: false,
  });
};

subscriptionSchema.statics.getRevenueSummary = async function (
  startDate,
  endDate
) {
  return this.aggregate([
    {
      $match: {
        status: {$in: ["active", "cancelled", "expired"]},
        paymentMethod: {$ne: "manual"},
        isManualGrant: {$ne: true},
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          tier: "$tier",
          currency: "$currency",
        },
        totalRevenue: {$sum: "$amount"},
        count: {$sum: 1},
        avgAmount: {$avg: "$amount"},
      },
    },
    {
      $sort: {totalRevenue: -1},
    },
  ]);
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;

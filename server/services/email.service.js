import nodemailer from "nodemailer";

// Create transporter
const createTransporter = () => {
  // Use environment variables for email configuration
  if (process.env.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
    });
  }

  // Default: Use SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const transporter = createTransporter();

    // Create reset URL (for frontend)
    const resetUrl = `${
      process.env.CLIENT_URL || (process.env.NODE_ENV === "production" ? "https://www.smartnshine.in" : "http://localhost:5173")
    }/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"SmartNShine Support" <${process.env.EMAIL_USER}>`,
      replyTo: "contact@smartnshine.in",
      to: email,
      subject: "Password Reset Request - SmartNShine",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
            .warning {
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>We received a request to reset your password for your SmartNShine account. Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #9333ea;"><a href="${resetUrl}">${resetUrl}</a></p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in <strong>1 hour</strong></li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>
              
              <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
              
              <p>Best regards,<br><strong>SmartNShine Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} SmartNShine. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent to:", email);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Send password change confirmation email
export const sendPasswordChangeConfirmation = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"SmartNShine Support" <${process.env.EMAIL_USER}>`,
      replyTo: "contact@smartnshine.in",
      to: email,
      subject: "Password Changed Successfully - SmartNShine",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
            .alert {
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Changed Successfully</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>This email confirms that your password was successfully changed.</p>
              
              <p><strong>Changed at:</strong> ${new Date().toLocaleString()}</p>
              
              <div class="alert">
                <strong>⚠️ Didn't make this change?</strong>
                <p>If you didn't change your password, please contact our support team immediately at contact@smartnshine.in</p>
              </div>
              
              <p>Best regards,<br><strong>SmartNShine Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} SmartNShine. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Password change confirmation sent to:", email);
    return true;
  } catch (error) {
    console.error("❌ Error sending confirmation email:", error);
    // Don't throw error - this is just a confirmation email
    return false;
  }
};

// Send payment confirmation email with receipt
export const sendPaymentConfirmationEmail = async (
  email,
  userName,
  paymentDetails
) => {
  try {
    const transporter = createTransporter();

    const {
      receiptId,
      tier,
      plan,
      amount,
      paymentId,
      orderId,
      transactionDate,
      startDate,
      endDate,
    } = paymentDetails;

    // Format dates
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // Get plan display name
    const getPlanName = (tier, plan) => {
      if (tier === "one-time") return "One-Time Plan (21 Days)";
      if (tier === "pro" && plan === "monthly") return "Pro Monthly";
      if (tier === "pro" && plan === "yearly") return "Pro Yearly";
      return `${tier} - ${plan}`;
    };

    const mailOptions = {
      from: `"SmartNShine" <${process.env.EMAIL_USER}>`,
      replyTo: "contact@smartnshine.in",
      to: email,
      subject: `Payment Successful - Receipt #${receiptId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 650px;
              margin: 20px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .success-icon {
              font-size: 60px;
              margin-bottom: 10px;
            }
            .content {
              padding: 40px 30px;
            }
            .receipt-box {
              background: #f9fafb;
              border: 2px dashed #e5e7eb;
              border-radius: 8px;
              padding: 25px;
              margin: 25px 0;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .receipt-id {
              font-size: 18px;
              font-weight: bold;
              color: #3b82f6;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .receipt-row:last-child {
              border-bottom: none;
            }
            .receipt-label {
              font-weight: 600;
              color: #6b7280;
            }
            .receipt-value {
              color: #111827;
              font-weight: 500;
            }
            .amount-row {
              background: #eff6ff;
              margin: 15px -10px;
              padding: 15px 10px;
              border-radius: 6px;
            }
            .amount-value {
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
            }
            .subscription-details {
              background: #f0fdf4;
              border-left: 4px solid #22c55e;
              padding: 20px;
              margin: 25px 0;
              border-radius: 6px;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
              text-align: center;
            }
            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
            }
            .info-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Payment Successful!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.95;">Thank you for your purchase</p>
            </div>
            
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>Your payment has been successfully processed. Here are your transaction details:</p>
              
              <div class="receipt-box">
                <div class="receipt-header">
                  <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">PAYMENT RECEIPT</div>
                  <div class="receipt-id">Receipt #${receiptId}</div>
                </div>
                
                <div class="receipt-row">
                  <span class="receipt-label">Date & Time:</span>
                  <span class="receipt-value">${formatDate(
                    transactionDate
                  )} ${new Date(transactionDate).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}</span>
                </div>
                
                <div class="receipt-row">
                  <span class="receipt-label">Plan:</span>
                  <span class="receipt-value">${getPlanName(tier, plan)}</span>
                </div>
                
                <div class="receipt-row">
                  <span class="receipt-label">Payment ID:</span>
                  <span class="receipt-value">${paymentId}</span>
                </div>
                
                <div class="receipt-row">
                  <span class="receipt-label">Order ID:</span>
                  <span class="receipt-value">${orderId}</span>
                </div>
                
                <div class="amount-row receipt-row">
                  <span class="receipt-label">Amount Paid:</span>
                  <span class="amount-value">₹${amount.toFixed(2)}</span>
                </div>
              </div>
              
              <div class="subscription-details">
                <h3 style="margin-top: 0; color: #22c55e;">🎉 Your Subscription is Active!</h3>
                <p style="margin: 10px 0;"><strong>Active From:</strong> ${formatDate(
                  startDate
                )}</p>
                <p style="margin: 10px 0;"><strong>Valid Until:</strong> ${formatDate(
                  endDate
                )}</p>
                <p style="margin: 10px 0; color: #6b7280; font-size: 14px;">
                  You now have full access to all premium features.
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="${
                  process.env.CLIENT_URL || (process.env.NODE_ENV === "production" ? "https://www.smartnshine.in" : "http://localhost:5173")
                }/dashboard" class="button">
                  Go to Dashboard
                </a>
              </div>
              
              <div class="info-box">
                <strong>💡 Important:</strong> Save this email for your records. You'll need the <strong>Payment ID</strong> if you need to request a refund within 24 hours.
              </div>
              
              <p style="margin-top: 30px;">If you have any questions or need assistance, please contact us at <strong>contact@smartnshine.in</strong></p>
              
              <p>Best regards,<br><strong>SmartNShine Team</strong></p>
            </div>
            
            <div class="footer">
              <p><strong>SmartNShine - AI Resume Builder</strong></p>
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} SmartNShine. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Payment confirmation email sent to:", email);
    return true;
  } catch (error) {
    console.error("❌ Error sending payment confirmation email:", error);
    // Don't throw error - payment was successful even if email fails
    return false;
  }
};

/**
 * Send service apology and resolution notification email
 */
export const sendServiceResolutionEmail = async ({
  email,
  userName = "User",
  feature = "AI Resume Scanner",
}) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"SmartNShine Support" <${process.env.EMAIL_USER}>`,
      replyTo: "contact@smartnshine.in",
      to: email,
      subject: `Update: ${feature} is Fully Operational - SmartNShine`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); color: #ffffff; padding: 36px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
            .badge { display: inline-block; padding: 4px 12px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399; border-radius: 999px; font-size: 12px; font-weight: 700; margin-bottom: 12px; }
            .content { padding: 32px 30px; }
            .greeting { font-size: 17px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
            .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0; }
            .card h3 { margin: 0 0 8px 0; color: #15803d; font-size: 16px; display: flex; align-items: center; gap: 8px; }
            .card p { margin: 0; color: #166534; font-size: 14px; }
            .btn-container { text-align: center; margin: 28px 0; }
            .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
            .note-box { background: #f8fafc; border-left: 4px solid #6366f1; padding: 14px; border-radius: 6px; font-size: 13px; color: #475569; margin: 20px 0; }
            .footer { text-align: center; padding: 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="badge">SERVICE UPDATE & RESOLUTION</div>
              <h1>AI Services Upgraded & Ready</h1>
            </div>
            <div class="content">
              <p class="greeting">Hello ${userName},</p>
              <p>We noticed you experienced a temporary issue while running an AI ATS Resume scan on SmartNShine recently. We sincerely apologize for any inconvenience this caused.</p>
              
              <div class="card">
                <h3>✅ Issue Resolved & Upgraded to GPT-4o</h3>
                <p>Our engineering team has resolved the underlying model routing issue and fully upgraded our core AI engine to OpenAI GPT-4o. The ATS Resume Scanner, Bullet Point Enhancer, and AI Mock Interviewer are now running at full capacity with enhanced speed and accuracy.</p>
              </div>

              <p>You can now log back into your account and run your resume scans and enhancements seamlessly.</p>

              <div class="btn-container">
                <a href="${process.env.CLIENT_URL || "https://www.smartnshine.in"}/ats-analyzer" class="button">Scan Your Resume Now &rarr;</a>
              </div>

              <div class="note-box">
                <strong>📩 Need Assistance?</strong><br>
                Our support team is always here for you. You can reach out directly via our Contact page or reply to this email, and our team will assist you right away.
              </div>

              <p style="margin-top: 24px;">Thank you for being part of SmartNShine.<br><strong>The SmartNShine Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SmartNShine. All rights reserved.</p>
              <p>Empowering professionals with AI-optimized ATS resumes & portfolios.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Service resolution email sent to:", email);
    return true;
  } catch (error) {
    console.error("❌ Error sending service resolution email:", error);
    return false;
  }
};

/**
 * Send customized branded template email from Admin panel
 */
export const sendCustomAdminTemplateEmail = async ({
  toEmail,
  userName = "Valued User",
  subject,
  badgeText = "SMARTNSHINE UPDATE",
  heading = "Important Update Regarding Your Account",
  bodyMessage = "",
  cardTitle = "",
  cardMessage = "",
  buttonText = "",
  buttonUrl = "",
  noteBox = "",
  themeAccent = "indigo",
  sendCopyAdmin = true,
}) => {
  try {
    const transporter = createTransporter();
    const clientUrl = process.env.CLIENT_URL || "https://www.smartnshine.in";

    // Dynamic variable replacements
    const formatVars = (str) =>
      (str || "")
        .replace(/{name}/g, userName || "User")
        .replace(/{email}/g, toEmail)
        .replace(/{app_url}/g, clientUrl);

    const formattedHeading = formatVars(heading);
    const formattedBadge = formatVars(badgeText);
    const formattedBody = formatVars(bodyMessage);
    const formattedCardTitle = formatVars(cardTitle);
    const formattedCardMessage = formatVars(cardMessage);
    const formattedNote = formatVars(noteBox);
    const formattedBtnText = formatVars(buttonText);
    const formattedBtnUrl = formatVars(buttonUrl);

    // Theme color palettes
    const themes = {
      indigo: {
        headerBg: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
        badgeBg: "rgba(99, 102, 241, 0.18)",
        badgeBorder: "#6366f1",
        badgeColor: "#a5b4fc",
        cardBg: "#f5f3ff",
        cardBorder: "#ddd6fe",
        cardTitleColor: "#4338ca",
        cardTextColor: "#3730a3",
        buttonBg: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
        buttonShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
        noteBorder: "#6366f1",
      },
      emerald: {
        headerBg: "linear-gradient(135deg, #022c22 0%, #064e3b 60%, #065f46 100%)",
        badgeBg: "rgba(16, 185, 129, 0.18)",
        badgeBorder: "#10b981",
        badgeColor: "#6ee7b7",
        cardBg: "#f0fdf4",
        cardBorder: "#bbf7d0",
        cardTitleColor: "#15803d",
        cardTextColor: "#166534",
        buttonBg: "linear-gradient(135deg, #059669 0%, #047857 100%)",
        buttonShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
        noteBorder: "#10b981",
      },
      blue: {
        headerBg: "linear-gradient(135deg, #082f49 0%, #0c4a6e 60%, #1e3a8a 100%)",
        badgeBg: "rgba(59, 130, 246, 0.18)",
        badgeBorder: "#3b82f6",
        badgeColor: "#93c5fd",
        cardBg: "#eff6ff",
        cardBorder: "#bfdbfe",
        cardTitleColor: "#1d4ed8",
        cardTextColor: "#1e40af",
        buttonBg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
        buttonShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
        noteBorder: "#3b82f6",
      },
      violet: {
        headerBg: "linear-gradient(135deg, #2e1065 0%, #3b0764 60%, #581c87 100%)",
        badgeBg: "rgba(168, 85, 247, 0.18)",
        badgeBorder: "#a855f7",
        badgeColor: "#d8b4fe",
        cardBg: "#faf5ff",
        cardBorder: "#e9d5ff",
        cardTitleColor: "#7e22ce",
        cardTextColor: "#6b21a8",
        buttonBg: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
        buttonShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
        noteBorder: "#a855f7",
      },
      amber: {
        headerBg: "linear-gradient(135deg, #1c1917 0%, #451a03 60%, #78350f 100%)",
        badgeBg: "rgba(245, 158, 11, 0.18)",
        badgeBorder: "#f59e0b",
        badgeColor: "#fcd34d",
        cardBg: "#fffbeb",
        cardBorder: "#fde68a",
        cardTitleColor: "#b45309",
        cardTextColor: "#92400e",
        buttonBg: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
        buttonShadow: "0 4px 14px rgba(217, 119, 6, 0.35)",
        noteBorder: "#f59e0b",
      },
      slate: {
        headerBg: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
        badgeBg: "rgba(148, 163, 184, 0.18)",
        badgeBorder: "#94a3b8",
        badgeColor: "#cbd5e1",
        cardBg: "#f8fafc",
        cardBorder: "#e2e8f0",
        cardTitleColor: "#334155",
        cardTextColor: "#475569",
        buttonBg: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
        buttonShadow: "0 4px 14px rgba(51, 65, 85, 0.35)",
        noteBorder: "#64748b",
      },
    };

    const theme = themes[themeAccent] || themes.indigo;

    // Format body paragraphs
    const bodyParagraphs = formattedBody
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p style="margin: 0 0 16px 0; line-height: 1.75; font-size: 15px; color: #334155;">${p.replace(/\n/g, "<br>")}</p>`)
      .join("");

    const mailOptions = {
      from: `"SmartNShine Support" <${process.env.EMAIL_USER}>`,
      replyTo: "contact@smartnshine.in",
      to: toEmail,
      bcc: sendCopyAdmin && process.env.EMAIL_USER !== toEmail ? process.env.EMAIL_USER : undefined,
      subject: formatVars(subject) || "Update from SmartNShine",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${formatVars(subject) || "SmartNShine Notification"}</title>
          <!--[if mso]>
          <style type="text/css">
            body, table, td, a { font-family: Arial, sans-serif !important; }
          </style>
          <![endif]-->
          <style>
            body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
            table { border-collapse: collapse; }
            a { text-decoration: none; }
            @media only screen and (max-width: 620px) {
              .wrapper { width: 100% !important; padding: 12px !important; }
              .content-box { padding: 24px 20px !important; }
              .header-box { padding: 30px 20px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 30px 10px; background-color: #f1f5f9;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center">
                <table class="wrapper" role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
                  
                  <!-- Brand Top Bar -->
                  <tr>
                    <td style="padding: 16px 28px; background: #090d16; border-bottom: 1px solid rgba(255,255,255,0.08);">
                      <table role="presentation" width="100%">
                        <tr>
                          <td>
                            <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; display: inline-flex; align-items: center;">
                              ⚡ Smart<span style="color: #38bdf8;">N</span>Shine
                            </span>
                          </td>
                          <td align="right">
                            <span style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">
                              Official Notice
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Header Banner -->
                  <tr>
                    <td class="header-box" style="background: ${theme.headerBg}; padding: 38px 32px; text-align: center; color: #ffffff;">
                      ${
                        formattedBadge
                          ? `
                        <div style="display: inline-block; padding: 5px 14px; background: ${theme.badgeBg}; border: 1px solid ${theme.badgeBorder}; color: ${theme.badgeColor}; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 14px;">
                          ${formattedBadge}
                        </div>
                      `
                          : ""
                      }
                      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.35; color: #ffffff;">
                        ${formattedHeading}
                      </h1>
                    </td>
                  </tr>

                  <!-- Main Content Area -->
                  <tr>
                    <td class="content-box" style="padding: 36px 32px; background: #ffffff;">
                      <p style="margin: 0 0 18px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                        Hello ${userName || "Valued User"},
                      </p>

                      <!-- Body Text -->
                      <div style="color: #334155; font-size: 15px; line-height: 1.75;">
                        ${bodyParagraphs}
                      </div>

                      <!-- Highlight Box (Optional) -->
                      ${
                        formattedCardTitle || formattedCardMessage
                          ? `
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${theme.cardBg}; border: 1px solid ${theme.cardBorder}; border-radius: 14px;">
                          <tr>
                            <td style="padding: 20px 22px;">
                              ${
                                formattedCardTitle
                                  ? `<h4 style="margin: 0 0 10px 0; color: ${theme.cardTitleColor}; font-size: 15px; font-weight: 700; line-height: 1.3;">${formattedCardTitle}</h4>`
                                  : ""
                              }
                              ${
                                formattedCardMessage
                                  ? `<div style="margin: 0; color: ${theme.cardTextColor}; font-size: 13.5px; line-height: 1.65; white-space: pre-line;">${formattedCardMessage}</div>`
                                  : ""
                              }
                            </td>
                          </tr>
                        </table>
                      `
                          : ""
                      }

                      <!-- Call to Action Button -->
                      ${
                        formattedBtnText && formattedBtnUrl
                          ? `
                        <div style="text-align: center; margin: 32px 0 24px 0;">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${formattedBtnUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="18%" stroke="f" fillcolor="${theme.badgeBorder}">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${formattedBtnText} &rarr;</center>
                          </v:roundrect>
                          <![endif]-->
                          <a href="${formattedBtnUrl}" target="_blank" style="display: inline-block; padding: 14px 34px; background: ${theme.buttonBg}; color: #ffffff !important; font-size: 15px; font-weight: 700; border-radius: 10px; text-decoration: none; box-shadow: ${theme.buttonShadow}; mso-hide: all; letter-spacing: 0.2px;">
                            ${formattedBtnText} &rarr;
                          </a>
                        </div>
                      `
                          : ""
                      }

                      <!-- Note Box (Optional) -->
                      ${
                        formattedNote
                          ? `
                        <div style="background: #f8fafc; border-left: 4px solid ${theme.noteBorder}; border-radius: 6px; padding: 14px 18px; margin: 24px 0 16px 0; font-size: 13px; color: #475569; line-height: 1.6;">
                          ${formattedNote}
                        </div>
                      `
                          : ""
                      }

                      <!-- Signoff -->
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 14px; color: #64748b; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #0f172a; font-size: 15px;">The SmartNShine Team</strong><br>
                        <span style="font-size: 12px; color: #94a3b8;">Empowering careers through modern ATS intelligence</span>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #475569;">
                        SmartNShine &bull; Career Accelerator & ATS Optimization Platform
                      </p>
                      <p style="margin: 0 0 10px 0; font-size: 11px; color: #94a3b8;">
                        You received this communication regarding your registered SmartNShine account (<a href="mailto:${toEmail}" style="color: #64748b; text-decoration: underline;">${toEmail}</a>).
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                        &copy; ${new Date().getFullYear()} SmartNShine. All rights reserved. &bull; <a href="${clientUrl}" style="color: #94a3b8; text-decoration: underline;">Visit Platform</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Admin email successfully sent to ${toEmail}. MessageId:`, info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Failed to send custom admin email:", error);
    throw new Error(error.message || "Failed to send email");
  }
};



import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const router = express.Router();

const createTransporter = () =>
  nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

// POST collaboration request
router.post("/submit", async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({
        error:
          "Email service is not configured. Set EMAIL_USER and EMAIL_PASSWORD in environment.",
      });
    }

    const transporter = createTransporter();

    const { name, email, institution, researchAreas, projectDetails } =
      req.body;

    // Validate required fields
    if (!name || !email || !institution || !researchAreas) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Email to admin/teacher
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.COLLABORATION_EMAIL || process.env.EMAIL_USER,
      subject: `New Collaboration Request from ${name}`,
      html: `
        <h2>New Collaboration Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Institution:</strong> ${institution}</p>
        <p><strong>Research Areas:</strong> ${researchAreas}</p>
        <p><strong>Project Details:</strong><br/>${projectDetails || "N/A"}</p>
      `,
    };

    // Email to user (confirmation)
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "We Received Your Collaboration Request",
      html: `
        <h2>Thank You for Your Interest!</h2>
        <p>Hi ${name},</p>
        <p>We have received your collaboration request. Our team will review your submission and get back to you as soon as possible.</p>
        <p><strong>Your Details:</strong></p>
        <ul>
          <li><strong>Research Areas:</strong> ${researchAreas}</li>
        </ul>
        <p>Best regards,<br/>ResearchSphere Team</p>
      `,
    };

    // Send emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions),
    ]);

    res.json({
      success: true,
      message: "Collaboration request submitted successfully",
    });
  } catch (error) {
    console.error("Collaboration submission error:", error);
    res.status(500).json({
      error: "Failed to submit collaboration request",
      ...(process.env.NODE_ENV === "development" && {
        detail: error?.message || "Unknown email transport error",
      }),
    });
  }
});

export default router;

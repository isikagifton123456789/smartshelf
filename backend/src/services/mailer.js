import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !port || !user || !pass || !from) {
    throw new Error("Missing SMTP configuration. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM");
  }

  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from,
  };
}

function getTransporter() {
  const config = getSmtpConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
}

export async function sendVerificationEmail({ to, name, verifyLink }) {
  const transporter = getTransporter();
  const { from } = getSmtpConfig();

  await transporter.sendMail({
    from,
    to,
    subject: "Verify your SmartShelf account",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2>Verify your email</h2>
        <p>Hi ${name || "there"},</p>
        <p>Thanks for signing up on SmartShelf. Please verify your email address to activate your account.</p>
        <p>
          <a href="${verifyLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
            Verify Email
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${verifyLink}">${verifyLink}</a></p>
      </div>
    `,
  });
}

export async function sendForgotPasswordEmail({ to, resetLink }) {
  const transporter = getTransporter();
  const { from } = getSmtpConfig();

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your SmartShelf password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2>Password reset request</h2>
        <p>We received a request to reset your SmartShelf password.</p>
        <p>This link expires in about 1 hour.</p>
        <p>
          <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
      </div>
    `,
  });
}

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || "no-reply@pdrightscheck.co.uk",
      pass: process.env.SMTP_PASS || "",
    },
    tls: {
      // Do not fail on invalid certs – often needed for shared hosting SMTP on cloud functions
      rejectUnauthorized: false,
    },
    // Pool connections to avoid opening too many during high traffic
    pool: true,
    // Add a timeout to prevent the function from hanging indefinitely
    connectionTimeout: 10000, // 10 seconds
  });

  try {
    const { pdfBase64, email, address } = await request.json();

    if (!pdfBase64 || !email || !address) {
      return NextResponse.json(
        { error: "Missing required fields: pdfBase64, email, address" },
        { status: 400 }
      );
    }

    // Sanitise the address for use in filename
    const safeAddress = address
      .split(",")[0]
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 60);

    const fileName = `PDRightCheck-Report-${safeAddress}.pdf`;

    // Build professional HTML email body
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#25423D;padding:32px 40px;text-align:center;">
              <h1 style="color:#F0ECE3;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">
                PD Rights Check
              </h1>
              <p style="color:#F0ECE3;opacity:0.8;margin:8px 0 0;font-size:13px;">
                Permitted Development Compliance Report
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#25423D;margin:0 0 16px;font-size:20px;">
                Your Report is Ready
              </h2>
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Thank you for your purchase. Please find your PD Rights Check report attached to this email.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F7F3;border-radius:6px;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">
                      Property Address
                    </p>
                    <p style="margin:0;font-size:15px;color:#25423D;font-weight:600;">
                      ${address}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 8px;">
                <strong>What's included:</strong>
              </p>
              <ul style="color:#555;font-size:14px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
                <li>Full PD Rights compliance assessment</li>
                <li>Planning constraints analysis</li>
                <li>Article 4 direction checks</li>
                <li>Conservation area status</li>
                <li>Professional recommendations</li>
              </ul>
              <p style="color:#888;font-size:13px;line-height:1.5;margin:0;">
                If you have any questions about your report, please reply to this email or contact us at
                <a href="mailto:no-reply@pdrightscheck.co.uk" style="color:#25423D;">no-reply@pdrightscheck.co.uk</a>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#F8F7F3;padding:24px 40px;text-align:center;border-top:1px solid #EEECE6;">
              <p style="color:#888;font-size:12px;margin:0 0 4px;">
                &copy; ${new Date().getFullYear()} PD Rights Check &mdash; pdrightscheck.co.uk
              </p>
              <p style="color:#aaa;font-size:11px;margin:0;">
                This is an automated email. Please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send the email with the PDF attached
    await transporter.sendMail({
      from: `"PD Rights Check" <${process.env.SMTP_USER || "no-reply@pdrightscheck.co.uk"}>`,
      to: email,
      subject: `Your PD Rights Check Report – ${address.split(",")[0].trim()}`,
      html: htmlBody,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(pdfBase64, "base64"),
          contentType: "application/pdf",
        },
      ],
    });

    console.log(`Report email sent successfully to ${email} for ${address}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to send report email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}

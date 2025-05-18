/**
 * Email templates for the front-office application
 */

interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

interface EmailTemplateParams {
  url: string;
  host: string;
  isNewClient?: boolean;
}

/**
 * Generate HTML for client login link email
 * @param link Login link URL
 * @param isNewClient Whether this is a new client or an existing one
 * @returns HTML string for the email
 */
function generateLoginLinkEmail(
  link: string,
  isNewClient: boolean = false,
): string {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            color: #333;
          }
          .cta-button-container {
            text-align: center;
            margin-top: 20px;
          }
          .cta-button {
            display: inline-block;
            background-color: #28a745;
            color: #ffffff !important;
            padding: 12px 25px;
            font-size: 16px;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
          }
          .cta-button:hover {
            background-color: #218838;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Welcome to MCW</h2>
            <p>${isNewClient ? "Your account has been created!" : "Here is your new login link"}</p>
          </div>

          <p>We've received a request to log in to your account. To proceed, simply click the button below. This link will expire in 24 hours.</p>

          <div class="cta-button-container">
            <a href="${link}" class="cta-button">Sign In to MCW</a>
          </div>

          <div class="footer">
            <p>If you didn't request this, please ignore this email.</p>
            <p>Thank you for using MCW!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates a complete email template including subject and text version
 */
export function createLoginEmail(params: EmailTemplateParams): EmailTemplate {
  const { url, isNewClient = false } = params;

  return {
    subject: isNewClient
      ? "Welcome to McNulty Counseling and Wellness - Activate Your Account"
      : "Sign in to McNulty Counseling and Wellness",
    text: `Welcome to MCW\n\n${
      isNewClient
        ? "Your account has been created!"
        : "Here is your new login link"
    }\n\nClick the following link to sign in:\n${url}\n\nIf you didn't request this, please ignore this email.\n\nThank you for using MCW!`,
    html: generateLoginLinkEmail(url, isNewClient),
  };
}

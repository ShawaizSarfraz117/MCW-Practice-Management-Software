/**
 * Email templates for the front-office application
 */

/**
 * Generate HTML for client login link email
 * @param link Login link URL
 * @param isNewClient Whether this is a new client or an existing one
 * @returns HTML string for the email
 */
export function generateLoginLinkEmail(
  link: string,
  isNewClient: boolean,
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

import {
  escapeHtml,
} from "../utils/emailHelpers.js";

const emailLayout = ({
  previewText,
  heading,
  body,
  actionText,
  actionUrl,
}) => {
  const button =
    actionText && actionUrl
      ? `
        <tr>
          <td style="padding-top: 24px;">
            <a
              href="${escapeHtml(actionUrl)}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background-color: #541A1A;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 700;
              "
            >
              ${escapeHtml(actionText)}
            </a>
          </td>
        </tr>
      `
      : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          ${escapeHtml(heading)}
        </title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
          font-family: Arial, Helvetica, sans-serif;
          color: #222222;
        "
      >
        <div
          style="
            display: none;
            max-height: 0;
            overflow: hidden;
          "
        >
          ${escapeHtml(previewText || heading)}
        </div>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="background-color: #f5f5f5;"
        >
          <tr>
            <td
              align="center"
              style="padding: 32px 16px;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                style="
                  max-width: 620px;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  border: 1px solid #e5e5e5;
                "
              >
                <tr>
                  <td
                    style="
                      padding: 22px 28px;
                      background-color: #541A1A;
                      color: #ffffff;
                      font-size: 20px;
                      font-weight: 700;
                    "
                  >
                    Weekly Report System
                  </td>
                </tr>

                <tr>
                  <td style="padding: 32px 28px;">
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                    >
                      <tr>
                        <td
                          style="
                            font-size: 25px;
                            line-height: 1.3;
                            font-weight: 700;
                            padding-bottom: 18px;
                          "
                        >
                          ${escapeHtml(heading)}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            font-size: 15px;
                            line-height: 1.7;
                            color: #444444;
                          "
                        >
                          ${body}
                        </td>
                      </tr>

                      ${button}
                    </table>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 18px 28px;
                      background-color: #fafafa;
                      color: #777777;
                      font-size: 12px;
                      line-height: 1.5;
                      border-top: 1px solid #eeeeee;
                    "
                  >
                    This is an automated message from
                    the Weekly Report System.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export default emailLayout;
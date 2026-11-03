import { BookingDetails } from '../types';

export const sendBookingEmail = async (details: BookingDetails): Promise<boolean> => {
  const url = "/api/send-booking-email";

  // Safely format schedule in 12-hour IST
  let scheduleIST = "N/A";
  try {
    if (details.date && details.time) {
      const parsedDate = new Date(`${details.date} ${details.time}`);
      if (!isNaN(parsedDate.getTime())) {
        scheduleIST = parsedDate.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } else {
        scheduleIST = `${details.date} ${details.time}`;
      }
    } else if (details.date) {
      scheduleIST = details.date;
    }
  } catch (e) {
    scheduleIST = `${details.date || ''} ${details.time || ''}`.trim() || 'N/A';
  }

  const phone = details.phone || 'N/A';
  const pickup = details.pickup || 'Not Provided';
  const drop = details.drop || 'Not Provided';
  const vehicleType = details.vehicleType || 'Not Selected';
  const tripType = details.tripType || 'Local';

  // Clean up addresses for safe URL sharing (replaces '&' with 'and' and '#' with 'No. ' to prevent parameter truncation in Telegram)
  const cleanPickup = pickup.replace(/&/g, 'and').replace(/#/g, 'No. ');
  const cleanDrop = drop.replace(/&/g, 'and').replace(/#/g, 'No. ');

  // Telegram message (clean & spaced)
  const tgRawMessage =
`*NEW BOOKING REQUEST*

*Customer:* Web Booking

*Phone:* ${phone}

*Pickup:*
${cleanPickup}
Maps: https://maps.google.com/?q=${encodeURIComponent(cleanPickup)}

*Drop:*
${cleanDrop}
Maps: ${details.drop ? `https://maps.google.com/?q=${encodeURIComponent(cleanDrop)}` : "N/A"}

*Vehicle:* ${vehicleType}
*Trip Type:* ${tripType}${tripType === "Local" ? ` (Package: ${details.localPackage || "N/A"})` : ""}

*Date:* ${details.date || "N/A"}
*Time:* ${details.time || "N/A"}

*Distance:* ${details.distance || "N/A"}


*Schedule (IST):* ${scheduleIST}

Trustyyellowcabs Booking System`
  ;

  // Telegram's HTTPS share endpoint requires both a URL and an optional text value.
  // URLSearchParams keeps the full booking message safely encoded for iOS and email clients.
const telegramShareUrl = new URL('https://t.me/share/url');
telegramShareUrl.searchParams.set('url', 'https://t.me/+pek2M40tUVkzMzQ1');
telegramShareUrl.searchParams.set('text', tgRawMessage);
const tgLink = telegramShareUrl.toString().replace(/&/g, '&amp;');

  // WhatsApp message
  const rawPhone = phone.replace(/\D/g, '');

  // Ensure India country code
  const phoneWithCountryCode = rawPhone.startsWith('91')
    ? rawPhone
    : `91${rawPhone}`;

const waMessage = encodeURIComponent(
`Thank you for choosing us 😊

Reliable rides • Transparent fares • Professional drivers

Customer Support
━━━━━━━━━━━━
+91 94888 34020
+91 88700 88020
+91 422-3596446
━━━━━━━━━━━━

Book your next ride instantly:
www.trustyyellowcabs.in

Need assistance? Call us anytime.

⚠️ Book direct. Avoid driver contact !`
);

  const waLink = `https://wa.me/${phoneWithCountryCode}?text=${waMessage}`;

  const isLead = details.isLead === true;
  const subjectPrefix = isLead ? "⚠️ ABANDONED LEAD: " : " NEW BOOKING: ";

  const emailContent = {
    sender: { name: "FastPointCab Booking", email: "fastpointcab@gmail.com" },
    to: [{ email: "fastpointcab@gmail.com", name: "FastPointCab Admin" }],

    subject: `${subjectPrefix}${phone} - ${pickup} [${details.estimatedFare || 'Quote'}]`,

    htmlContent: `
  <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden;">

    ${isLead ? `
    <div style="background-color: #fef2f2; padding: 12px; text-align: center; border-bottom: 1px solid #fee2e2;">
      <p style="margin: 0; color: #dc2626; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        ⚠️ System Alert: Abandoned Process
      </p>
    </div>
    ` : `
    <div style="background-color: #f0fdf4; padding: 12px; text-align: center; border-bottom: 1px solid #dcfce7;">
      <p style="margin: 0; color: #16a34a; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        ✅ Confirmed Web Booking
      </p>
    </div>
    `}

    <div style="padding: 30px;">

      <!-- Quote Box -->
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
          Estimated Quote
        </p>

        <h2 style="margin: 0; font-size: 32px; color: #0f172a;">
          ${details.estimatedFare || "Calculated on call"}
        </h2>

        <p style="margin: 5px 0 0 0; font-size: 14px; color: #0f172a;">
          Total distance: <strong>${details.distance || "Unknown"}</strong>
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse;">

        <!-- Customer -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Customer</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            Web Booking
          </td>
        </tr>

        <!-- Phone -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Phone</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            <a href="tel:${phone}">${phone}</a>
          </td>
        </tr>

        <!-- Pickup -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Pickup</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup)}" target="_blank">
              ${pickup}
            </a>
          </td>
        </tr>

        <!-- Drop -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Drop</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(drop)}" target="_blank">
              ${drop}
            </a>
          </td>
        </tr>

        <!-- Vehicle -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Vehicle Type</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            ${vehicleType}
          </td>
        </tr>

        <!-- Trip Type -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Trip Type</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            ${tripType}
            ${
              tripType === "Local"
                ? ` (Package: ${details.localPackage || "N/A"})`
                : ""
            }
          </td>
        </tr>

        <!-- Schedule -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Schedule (IST)</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            ${scheduleIST}
          </td>
        </tr>

      </table>

      <!-- Buttons -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-top: 30px;">
        <tr>
          <td width="50%" valign="top" style="width: 50%; padding: 0 5px 0 0;">
            <a href="${waLink}" target="_blank"
              style="display: block; box-sizing: border-box; width: 100%; min-height: 48px; padding: 14px 10px; background-color: #25D366; color: #ffffff; text-align: center; text-decoration: none; border-radius: 8px; font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; font-weight: bold; white-space: nowrap;">
              WhatsApp 
            </a>
          </td>
          <td width="50%" valign="top" style="width: 50%; padding: 0 0 0 5px;">
            <a href="${tgLink}" target="_blank"
              style="display: block; box-sizing: border-box; width: 100%; min-height: 48px; padding: 14px 10px; background-color: #0088CC; color: #ffffff; text-align: center; text-decoration: none; border-radius: 8px; font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; font-weight: bold; white-space: nowrap;">
              Telegram 
            </a>
          </td>
        </tr>
      </table>

    </div>

    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
      Sent from FastPointCab Booking System
    </div>

  </div>
`
  };

  // Execute request with retry mechanism (up to 2 retries) and keepalive: true
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        keepalive: true, // CRITICAL: Guarantees fetch request completes during page unload/tab switch
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ emailContent })
      });

      if (response.ok) {
        return true;
      }

      console.error(`Booking email request failed with status ${response.status}`);

      // If client error like 400 or 401, don't retry
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        break;
      }
    } catch (error) {
      console.error(`Network error sending booking email (attempt ${attempt}/${maxAttempts})`);
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }

  return false;
};

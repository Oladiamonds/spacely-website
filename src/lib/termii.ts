/**
 * Termii SMS client — Nigerian SMS gateway
 * Docs: https://developers.termii.com
 */

const TERMII_API_KEY = process.env.TERMII_API_KEY!;
const TERMII_BASE_URL = 'https://v3.api.termii.com/api';
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID ?? 'SpaceLY';

async function termiiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${TERMII_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: TERMII_API_KEY, ...body }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Termii error ${res.status}: ${data.message ?? JSON.stringify(data)}`,
    );
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// OTP (Phone Verification)
// ─────────────────────────────────────────────────────────────

export interface SendOtpResult {
  pinId: string;
  messageSid?: string;
}

/**
 * Send a numeric OTP to a Nigerian phone number.
 * Phone number must include country code: +2348012345678
 */
export async function sendOtp(phoneNumber: string): Promise<SendOtpResult> {
  const data = await termiiPost<{ pinId: string; smsStatus?: string }>(
    '/sms/otp/send',
    {
      to: phoneNumber,
      from: TERMII_SENDER_ID,
      message_type: 'NUMERIC',
      pin_attempts: 3,
      pin_time_to_live: 10, // minutes
      pin_length: 6,
      pin_placeholder: '< 1234 >',
      message_text: 'Your SpaceLY verification code is < 1234 >. Valid for 10 minutes. Do not share this code.',
      channel: 'dnd', // DND-compliant channel
    },
  );

  return { pinId: data.pinId };
}

export interface VerifyOtpResult {
  verified: boolean;
  msisdn?: string;
}

export async function verifyOtp(
  pinId: string,
  pin: string,
): Promise<VerifyOtpResult> {
  const data = await termiiPost<{ verified: string; msisdn?: string }>(
    '/sms/otp/verify',
    { pin_id: pinId, pin },
  );

  return {
    verified: data.verified === 'True',
    msisdn: data.msisdn,
  };
}

// ─────────────────────────────────────────────────────────────
// TRANSACTIONAL SMS
// ─────────────────────────────────────────────────────────────

async function sendSms(to: string, message: string): Promise<void> {
  await termiiPost('/sms/send', {
    to,
    from: TERMII_SENDER_ID,
    sms: message,
    type: 'plain',
    channel: 'dnd',
  });
}

/**
 * Booking confirmed — sent to artisan after payment clears.
 */
export async function sendBookingConfirmation(params: {
  phone: string;
  artisanName: string;
  spaceName: string;
  address: string;
  startTime: Date;
  endTime: Date;
  totalAmountNaira: number;
}): Promise<void> {
  const dateStr = params.startTime.toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeStr = `${params.startTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} - ${params.endTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`;

  const message = `Hi ${params.artisanName}, your SpaceLY booking is confirmed!\n\nSpace: ${params.spaceName}\nDate: ${dateStr}\nTime: ${timeStr}\nAddress: ${params.address}\nTotal paid: ₦${params.totalAmountNaira.toLocaleString('en-NG')}\n\nHave a productive session!`;

  await sendSms(params.phone, message);
}

/**
 * New booking alert — sent to space owner when a booking is confirmed.
 */
export async function sendOwnerBookingAlert(params: {
  phone: string;
  ownerName: string;
  spaceName: string;
  artisanName: string;
  startTime: Date;
  endTime: Date;
  payoutNaira: number;
}): Promise<void> {
  const dateStr = params.startTime.toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeStr = `${params.startTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} - ${params.endTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`;

  const message = `Hi ${params.ownerName}, you have a new booking on SpaceLY!\n\nSpace: ${params.spaceName}\nBooked by: ${params.artisanName}\nDate: ${dateStr}\nTime: ${timeStr}\nYour payout: ₦${params.payoutNaira.toLocaleString('en-NG')}\n\nLog in to manage your bookings.`;

  await sendSms(params.phone, message);
}

/**
 * Booking cancelled — notify artisan of refund.
 */
export async function sendCancellationNotice(params: {
  phone: string;
  artisanName: string;
  spaceName: string;
  refundNaira?: number;
}): Promise<void> {
  const refundLine = params.refundNaira
    ? `Your refund of ₦${params.refundNaira.toLocaleString('en-NG')} will be processed within 3-5 business days.`
    : 'Your booking has been cancelled.';

  const message = `Hi ${params.artisanName}, your booking at ${params.spaceName} has been cancelled. ${refundLine}\n\nQuestions? Reply to this message.`;

  await sendSms(params.phone, message);
}

/**
 * Payout notification — sent to owner when transfer lands.
 */
export async function sendPayoutNotification(params: {
  phone: string;
  ownerName: string;
  amountNaira: number;
}): Promise<void> {
  const message = `Hi ${params.ownerName}, your SpaceLY payout of ₦${params.amountNaira.toLocaleString('en-NG')} has been sent to your bank account. It should arrive within 24 hours.`;

  await sendSms(params.phone, message);
}

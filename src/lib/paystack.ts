import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

async function paystackFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Paystack error ${res.status}: ${data.message ?? 'Unknown error'}`,
    );
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────────────────────

export interface InitializeTransactionParams {
  email: string;
  amountKobo: number; // amount in kobo (Paystack uses kobo for NGN)
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  subaccount?: string; // Paystack subaccount code for split
  bearsFee?: boolean;  // If true, platform bears Paystack fees
}

export interface InitializeTransactionResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export async function initializeTransaction(
  params: InitializeTransactionParams,
): Promise<InitializeTransactionResult> {
  const body: Record<string, unknown> = {
    email: params.email,
    amount: params.amountKobo,
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata ?? {},
    currency: 'NGN',
  };

  if (params.subaccount) {
    body.subaccount = params.subaccount;
    // SpaceLY takes 15% commission — Paystack splits from the charge
    body.transaction_charge = 0; // we calculate split ourselves via subaccount %
    body.bearer = params.bearsFee ? 'account' : 'subaccount';
  }

  const data = await paystackFetch<{
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

export interface VerifyTransactionResult {
  status: 'success' | 'failed' | 'abandoned' | 'reversed';
  reference: string;
  amountKobo: number;
  paidAt: Date;
  metadata: Record<string, unknown>;
  customerEmail: string;
}

export async function verifyTransaction(
  reference: string,
): Promise<VerifyTransactionResult> {
  const data = await paystackFetch<{
    data: {
      status: string;
      reference: string;
      amount: number;
      paid_at: string;
      metadata: Record<string, unknown>;
      customer: { email: string };
    };
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);

  return {
    status: data.data.status as VerifyTransactionResult['status'],
    reference: data.data.reference,
    amountKobo: data.data.amount,
    paidAt: new Date(data.data.paid_at),
    metadata: data.data.metadata ?? {},
    customerEmail: data.data.customer.email,
  };
}

// ─────────────────────────────────────────────────────────────
// SUBACCOUNTS (Split Payments)
// ─────────────────────────────────────────────────────────────

export interface CreateSubaccountParams {
  businessName: string;
  settlementBank: string; // Bank code e.g. "057" for Zenith
  accountNumber: string;
  percentageCharge: number; // Owner's share e.g. 85 for 85%
  description?: string;
}

export interface SubaccountResult {
  subaccountCode: string;
  id: number;
}

export async function createSubaccount(
  params: CreateSubaccountParams,
): Promise<SubaccountResult> {
  const data = await paystackFetch<{
    data: { subaccount_code: string; id: number };
  }>('/subaccount', {
    method: 'POST',
    body: JSON.stringify({
      business_name: params.businessName,
      settlement_bank: params.settlementBank,
      account_number: params.accountNumber,
      percentage_charge: params.percentageCharge,
      description: params.description ?? '',
    }),
  });

  return {
    subaccountCode: data.data.subaccount_code,
    id: data.data.id,
  };
}

// ─────────────────────────────────────────────────────────────
// TRANSFERS (Payouts)
// ─────────────────────────────────────────────────────────────

export interface InitiateTransferParams {
  amountKobo: number;
  recipientCode: string;
  reference: string;
  reason?: string;
}

export async function initiateTransfer(
  params: InitiateTransferParams,
): Promise<{ transferCode: string; status: string }> {
  const data = await paystackFetch<{
    data: { transfer_code: string; status: string };
  }>('/transfer', {
    method: 'POST',
    body: JSON.stringify({
      source: 'balance',
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason ?? 'SpaceLY payout',
    }),
  });

  return {
    transferCode: data.data.transfer_code,
    status: data.data.status,
  };
}

export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
}): Promise<{ recipientCode: string }> {
  const data = await paystackFetch<{
    data: { recipient_code: string };
  }>('/transferrecipient', {
    method: 'POST',
    body: JSON.stringify({
      type: 'nuban',
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: 'NGN',
    }),
  });

  return { recipientCode: data.data.recipient_code };
}

// ─────────────────────────────────────────────────────────────
// WEBHOOK VERIFICATION
// ─────────────────────────────────────────────────────────────

/**
 * Verify a Paystack webhook signature.
 * Call this before processing any webhook event.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const expectedSig = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSig, 'hex'),
  );
}

// ─────────────────────────────────────────────────────────────
// BANKS (for owner onboarding)
// ─────────────────────────────────────────────────────────────

export interface Bank {
  name: string;
  code: string;
}

export async function listBanks(): Promise<Bank[]> {
  const data = await paystackFetch<{
    data: Array<{ name: string; code: string }>;
  }>('/bank?currency=NGN&country=nigeria');

  return data.data.map((b) => ({ name: b.name, code: b.code }));
}

export async function resolveAccountNumber(
  accountNumber: string,
  bankCode: string,
): Promise<{ accountName: string; accountNumber: string }> {
  const data = await paystackFetch<{
    data: { account_name: string; account_number: string };
  }>(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);

  return {
    accountName: data.data.account_name,
    accountNumber: data.data.account_number,
  };
}

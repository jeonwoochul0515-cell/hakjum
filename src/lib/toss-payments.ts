import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gmeYZ0Ad';

export async function requestBillingAuth(customerKey: string) {
  const tossPayments = await loadTossPayments(CLIENT_KEY);

  const payment = tossPayments.payment({ customerKey });

  await payment.requestBillingAuth({
    method: 'CARD',
    successUrl: `${window.location.origin}/subscription/success`,
    failUrl: `${window.location.origin}/subscription/fail`,
  });
}

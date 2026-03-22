import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gmeYZ0Ad';

export interface PaymentRequest {
  amount: number;
  orderId: string;
  orderName: string;
  customerKey: string;
}

export async function requestPayment(req: PaymentRequest) {
  const tossPayments = await loadTossPayments(CLIENT_KEY);
  const payment = tossPayments.payment({ customerKey: req.customerKey });

  await payment.requestPayment({
    method: 'CARD',
    amount: { currency: 'KRW', value: req.amount },
    orderId: req.orderId,
    orderName: req.orderName,
    successUrl: `${window.location.origin}/subscription/success`,
    failUrl: `${window.location.origin}/subscription/fail`,
  });
}

/** 결제위젯 키 발급 후 사용 — 현재는 미사용 */
export async function initWidgets(customerKey: string) {
  const tossPayments = await loadTossPayments(CLIENT_KEY);
  const widgets = tossPayments.widgets({ customerKey });
  return widgets;
}

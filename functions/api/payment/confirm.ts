interface Env {
  TOSS_SECRET_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const secretKey = context.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return new Response(
      JSON.stringify({ message: 'Toss secret key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { paymentKey?: string; orderId?: string; amount?: number };
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({ message: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { paymentKey, orderId, amount } = body;
  if (!paymentKey || !orderId || !amount) {
    return new Response(
      JSON.stringify({ message: 'paymentKey, orderId, and amount are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const VALID_AMOUNTS = [4900, 7900];
  if (!VALID_AMOUNTS.includes(amount)) {
    return new Response(
      JSON.stringify({ message: '유효하지 않은 결제 금액입니다.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const encoded = btoa(`${secretKey}:`);

    const response = await fetch(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encoded}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          message: data.message || '결제 확인에 실패했습니다.',
          code: data.code,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        paymentKey: data.paymentKey,
        orderId: data.orderId,
        status: data.status,
        approvedAt: data.approvedAt,
        totalAmount: data.totalAmount,
        method: data.method,
        cardCompany: data.card?.company,
        cardNumber: data.card?.number,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ message: '결제 확인 중 서버 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

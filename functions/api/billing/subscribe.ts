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

  let body: {
    billingKey?: string;
    customerKey?: string;
    amount?: number;
    orderId?: string;
    orderName?: string;
  };
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({ message: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { billingKey, customerKey, amount, orderId, orderName } = body;
  if (!billingKey || !customerKey || !amount || !orderId || !orderName) {
    return new Response(
      JSON.stringify({
        message: 'billingKey, customerKey, amount, orderId, and orderName are required',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const encoded = btoa(`${secretKey}:`);

    const response = await fetch(
      `https://api.tosspayments.com/v1/billing/${billingKey}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encoded}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerKey,
          amount,
          orderId,
          orderName,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          message: data.message || '결제에 실패했습니다.',
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
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        message: '결제 처리 중 서버 오류가 발생했습니다.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

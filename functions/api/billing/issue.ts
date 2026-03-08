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

  let body: { authKey?: string; customerKey?: string };
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({ message: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { authKey, customerKey } = body;
  if (!authKey || !customerKey) {
    return new Response(
      JSON.stringify({ message: 'authKey and customerKey are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const encoded = btoa(`${secretKey}:`);

    const response = await fetch(
      'https://api.tosspayments.com/v1/billing/authorizations/issue',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encoded}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authKey, customerKey }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          message: data.message || '빌링키 발급에 실패했습니다.',
          code: data.code,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        billingKey: data.billingKey,
        customerKey: data.customerKey,
        cardCompany: data.card?.cardCompany,
        cardNumber: data.card?.number,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        message: '빌링키 발급 중 서버 오류가 발생했습니다.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

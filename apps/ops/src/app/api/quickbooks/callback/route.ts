import { NextRequest, NextResponse } from 'next/server';
import { saveQbTokens } from '@/lib/quickbooks';

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  if (process.env.QUICKBOOKS_REDIRECT_URI) {
    try {
      return new URL(process.env.QUICKBOOKS_REDIRECT_URI).origin;
    } catch {
      // ignore
    }
  }
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const realmId = searchParams.get('realmId');
  const error = searchParams.get('error');

  if (error) {
    console.warn('[QuickBooks Callback] Access request denied by user:', error);
    const origin = getPublicOrigin(request);
    return NextResponse.redirect(`${origin}/?qb_error=${error}`);
  }

  if (!code || !realmId) {
    return new NextResponse('Authorization code exchange failed: missing auth code or realmId parameter.', { status: 400 });
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return new NextResponse('Missing QuickBooks env configurations in server variables.', { status: 500 });
  }

  try {
    console.log('[QuickBooks Callback] Exchanging authorization code for token keys...');
    
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[QuickBooks Token Exchange Error]:', errText);
      return new NextResponse(`Token exchange error: ${response.statusText}`, { status: 400 });
    }

    const data = await response.json();
    
    // Save tokens in Database
    await saveQbTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      realmId,
    });

    console.log('[QuickBooks Callback] Token exchange successful. Connected Realm ID:', realmId);

    // Determine public origin for redirect (handling Render reverse proxies where request.url is localhost:10000)
    const origin = getPublicOrigin(request);
    return NextResponse.redirect(`${origin}/?qb_connected=true`);
  } catch (err: any) {
    console.error('[QuickBooks Callback Exception]:', err);
    return new NextResponse(`Callback server error: ${err?.message || err}`, { status: 500 });
  }
}

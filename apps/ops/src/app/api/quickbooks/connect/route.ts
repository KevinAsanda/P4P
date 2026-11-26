import { NextRequest, NextResponse } from 'next/server';
import { getActiveRole, getAuthenticatedUserId } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const [role, userId] = await Promise.all([getActiveRole(), getAuthenticatedUserId()]);
  if (userId === 'unauthenticated' || (role !== 'admin' && role !== 'finance')) {
    return new NextResponse('Unauthorized: Admin or Finance clearance required.', { status: 403 });
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new NextResponse(
      'Missing QuickBooks configuration in operations environment: QUICKBOOKS_CLIENT_ID or QUICKBOOKS_REDIRECT_URI.',
      { status: 500 }
    );
  }

  // Intuit Sandbox OAuth2 Connection Details
  const oauthUrl = 'https://appcenter.intuit.com/connect/oauth2';
  const queryParams = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: redirectUri,
    state: 'p4p_ops_state_verification_token',
  });

  const authorizationUrl = `${oauthUrl}?${queryParams.toString()}`;
  return NextResponse.redirect(authorizationUrl);
}

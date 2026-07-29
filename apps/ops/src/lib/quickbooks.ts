import { prisma } from '@p4p/db';
import { decryptValue } from '@p4p/shared';

export interface QbTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp in ms
  realmId: string;
}

// Helper to retrieve tokens from PostgreSQL DB
export async function getQbTokens(): Promise<QbTokens | null> {
  try {
    const record = await prisma.quickBooksToken.findUnique({
      where: { id: 'active' },
    });
    if (!record) return null;
    return {
      accessToken: record.accessToken,
      refreshToken: record.refreshToken,
      expiresAt: Number(record.expiresAt),
      realmId: record.realmId,
    };
  } catch (error) {
    console.error('[QuickBooks] Error reading tokens from database:', error);
    return null;
  }
}

// Helper to save tokens to PostgreSQL DB
export async function saveQbTokens(tokens: QbTokens) {
  try {
    await prisma.quickBooksToken.upsert({
      where: { id: 'active' },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: BigInt(tokens.expiresAt),
        realmId: tokens.realmId,
      },
      create: {
        id: 'active',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: BigInt(tokens.expiresAt),
        realmId: tokens.realmId,
      },
    });
    console.log('[QuickBooks] Tokens successfully saved to database.');
  } catch (error) {
    console.error('[QuickBooks] Error saving tokens to database:', error);
  }
}

// Helper to clear tokens from PostgreSQL DB (disconnect)
export async function clearQbTokens() {
  try {
    await prisma.quickBooksToken.deleteMany();
    console.log('[QuickBooks] Tokens successfully cleared from database.');
  } catch (error) {
    console.error('[QuickBooks] Error clearing tokens from database:', error);
  }
}

// Check if QuickBooks is connected
export async function isQbConnected(): Promise<boolean> {
  const tokens = await getQbTokens();
  return !!tokens && !!tokens.refreshToken;
}

// Refresh OAuth2 Access Token using Refresh Token
export async function refreshQbTokens(): Promise<QbTokens> {
  const tokens = await getQbTokens();
  if (!tokens || !tokens.refreshToken) {
    throw new Error('QuickBooks is not connected. Re-authorize OAuth2.');
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing QUICKBOOKS_CLIENT_ID or QUICKBOOKS_CLIENT_SECRET env variables.');
  }

  console.log('[QuickBooks] Access token expired or expiring. Refreshing...');

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[QuickBooks Token Refresh Error]:', errText);
    throw new Error(`Failed to refresh QuickBooks token: ${response.statusText}`);
  }

  const data = await response.json();
  const refreshedTokens: QbTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    realmId: tokens.realmId, // Keep original realmId
  };

  await saveQbTokens(refreshedTokens);
  return refreshedTokens;
}

// Authenticated fetch wrapper for QuickBooks REST API (auto-handles token refreshes)
export async function qbRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  let tokens = await getQbTokens();
  if (!tokens) {
    throw new Error('QuickBooks is not connected. Re-authorize OAuth2.');
  }

  // Auto-refresh access token if it's expired or about to expire (within 60s)
  if (Date.now() + 60000 >= tokens.expiresAt) {
    try {
      tokens = await refreshQbTokens();
    } catch (err) {
      console.error('[QuickBooks API] Auto-refresh failed. Resetting config status...');
      throw new Error('QuickBooks authorization has expired. Please re-connect.');
    }
  }

  const isQbProd = process.env.QUICKBOOKS_ENVIRONMENT === 'production';
  const baseUrl = isQbProd
    ? 'https://quickbooks.api.intuit.com/v3/company'
    : 'https://sandbox-quickbooks.api.intuit.com/v3/company';
  const realmId = tokens.realmId;
  const url = `${baseUrl}/${realmId}/${endpoint}`;

  const defaultHeaders = {
    Authorization: `Bearer ${tokens.accessToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error(`[QuickBooks API Request Error] Endpoint: ${endpoint}`, {
      status: response.status,
      body: errBody,
    });
    
    // Catch token authorization rejection and retry once
    if (response.status === 401) {
      console.warn('[QuickBooks API] Received 401. Retrying token refresh once...');
      tokens = await refreshQbTokens();
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${tokens.accessToken}`,
          ...options.headers,
        },
      });
      if (retryResponse.ok) {
        return await retryResponse.json();
      }
    }
    
    throw new Error(`QuickBooks API Error: [${response.status}] ${response.statusText}`);
  }

  return await response.json();
}

// ---------------- QUICKBOOKS CRITICAL INTEGRATION HELPERS ----------------

/**
 * 1. Find or Create Customer record in QuickBooks by Email
 */
export async function getOrCreateQbCustomer(customer: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}): Promise<string> {
  const query = `select * from Customer where PrimaryEmailAddr.Address = '${customer.email}'`;
  const searchResult = await qbRequest(`query?query=${encodeURIComponent(query)}`);

  const qbCustomer = searchResult.QueryResponse?.Customer?.[0];
  if (qbCustomer) {
    console.log(`[QuickBooks] Matched existing customer: ${customer.email} (QB ID: ${qbCustomer.Id})`);
    return qbCustomer.Id;
  }

  // Create new customer in QB
  console.log(`[QuickBooks] Customer ${customer.email} not found. Enrolling new account...`);
  const createPayload = {
    FullyQualifiedName: `${customer.firstName} ${customer.lastName} (${customer.email})`,
    DisplayName: `${customer.firstName} ${customer.lastName}`,
    GivenName: customer.firstName,
    FamilyName: customer.lastName,
    PrimaryEmailAddr: {
      Address: customer.email,
    },
    PrimaryPhone: {
      FreeFormNumber: decryptValue(customer.phone) || '',
    },
  };

  const createResult = await qbRequest('customer', {
    method: 'POST',
    body: JSON.stringify(createPayload),
  });

  const newId = createResult.Customer?.Id;
  if (!newId) {
    throw new Error('QuickBooks customer creation failed to return reference ID.');
  }

  console.log(`[QuickBooks] Successfully registered customer with ID: ${newId}`);
  return newId;
}

/**
 * 2. Find or Create Product/Service Item in QuickBooks by SKU code.
 * Matches on SKU (matching QB SKU or Name).
 */
export async function getOrCreateQbItem(product: {
  itemName: string;
  sku: string;
  unitPrice: number;
}): Promise<string> {
  // Query by name or SKU
  const query = `select * from Item where Name = '${product.sku}' or SKU = '${product.sku}'`;
  const searchResult = await qbRequest(`query?query=${encodeURIComponent(query)}`);

  const qbItem = searchResult.QueryResponse?.Item?.[0];
  if (qbItem) {
    console.log(`[QuickBooks] Product matched by SKU: ${product.sku} (QB ID: ${qbItem.Id})`);
    return qbItem.Id;
  }

  // Register new product in QB (needs an Income Account in sandbox)
  console.log(`[QuickBooks] Product SKU ${product.sku} not found. Enrolling item details...`);

  // First, find the first active Sales/Revenue Account in QuickBooks to link the item's sales transactions
  const accountsQuery = "select * from Account where AccountType = 'Revenue' and Active = true";
  const accountsResult = await qbRequest(`query?query=${encodeURIComponent(accountsQuery)}`);
  
  const incomeAccount = accountsResult.QueryResponse?.Account?.[0];
  if (!incomeAccount) {
    throw new Error('Failed to find active Revenue/Income Account in QuickBooks Sandbox to link items.');
  }

  const createPayload = {
    Name: product.sku,
    Description: product.itemName,
    Active: true,
    Type: 'Service', // Non-Inventory or Service makes local testing simple
    UnitPrice: product.unitPrice,
    IncomeAccountRef: {
      value: incomeAccount.Id,
      name: incomeAccount.Name,
    },
    SKU: product.sku,
  };

  const createResult = await qbRequest('item', {
    method: 'POST',
    body: JSON.stringify(createPayload),
  });

  const newId = createResult.Item?.Id;
  if (!newId) {
    throw new Error(`QuickBooks Product Item enrollment failed for SKU ${product.sku}`);
  }

  console.log(`[QuickBooks] Enrolled SKU ${product.sku} under Item ID: ${newId}`);
  return newId;
}

/**
 * 3. Sync SalesOrder as Invoice to QuickBooks Online
 */
export async function syncOrderToQuickBooks(orderId: string) {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderLines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found in database.`);
    }

    if (order.customer) {
      order.customer.phone = decryptValue(order.customer.phone);
    }

    if (order.paymentStatus !== 'paid') {
      throw new Error(`Order ${orderId} is unpaid. Accounting invoices are synced for paid orders only.`);
    }

    console.log(`[QuickBooks] Initiating sync for paid order reference: #${orderId.slice(0, 8)}`);

    // Step A: Match/Create Parent customer in QuickBooks
    const qbCustomerId = await getOrCreateQbCustomer({
      firstName: order.customer.firstName,
      lastName: order.customer.lastName,
      email: order.customer.email,
      phone: order.customer.phone,
    });

    // Step B: Resolve line items to QuickBooks Item references
    const linesPayload = [];
    for (const line of order.orderLines) {
      const qbItemId = await getOrCreateQbItem({
        itemName: line.product.itemName,
        sku: line.product.sku,
        unitPrice: line.unitPriceAtSale.toNumber(),
      });

      linesPayload.push({
        Description: line.product.itemName,
        Amount: line.lineSubTotal.toNumber(),
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: {
            value: qbItemId,
          },
          Qty: line.quantityOrdered,
          UnitPrice: line.unitPriceAtSale.toNumber(),
        },
      });
    }

    // Step C: Compile Invoice Details
    const invoicePayload = {
      CustomerRef: {
        value: qbCustomerId,
      },
      Line: linesPayload,
      PrivateNote: `Prepped 4 Prep internal payment order reference: #${order.id}`,
      // Optionally mark as paid since we already collected the EFT/Card webhook payment
      Deposit: order.totalAmount.toNumber(), 
    };

    console.log('[QuickBooks] Sending Invoice POST payload...');
    const result = await qbRequest('invoice', {
      method: 'POST',
      body: JSON.stringify(invoicePayload),
    });

    const qbInvoiceId = result.Invoice?.Id;
    if (!qbInvoiceId) {
      throw new Error('QuickBooks Invoice creation response is missing Invoice ID reference.');
    }

    const docNumber = result.Invoice?.DocNumber || 'N/A';
    console.log(`[QuickBooks] Sync complete! Invoice ${qbInvoiceId} created (Doc #: ${docNumber})`);

    // Step D: Write Invoice references to SalesOrder table
    await prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        quickbooksInvoiceId: qbInvoiceId,
        quickbooksSyncStatus: 'synced',
      },
    });

    return { success: true, qbInvoiceId, docNumber };
  } catch (error: any) {
    console.error(`[QuickBooks] Sync failed for order ${orderId}:`, error);

    // Save failure status in database
    await prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        quickbooksSyncStatus: 'failed',
      },
    }).catch(() => {});

    throw error;
  }
}

/**
 * 4. Pull Invoice Details from QuickBooks to verify payment status matches
 */
export async function pullInvoiceStatus(orderId: string) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
  });

  if (!order || !order.quickbooksInvoiceId) {
    throw new Error(`Order ${orderId} does not have a linked QuickBooks Invoice ID.`);
  }

  const invoiceId = order.quickbooksInvoiceId;
  const result = await qbRequest(`invoice/${invoiceId}`);
  
  const qbInvoice = result.Invoice;
  if (!qbInvoice) {
    throw new Error(`QuickBooks invoice ${invoiceId} not found.`);
  }

  const qbTotal = qbInvoice.TotalAmt;
  const qbBalance = qbInvoice.Balance;
  const qbDocNumber = qbInvoice.DocNumber;
  
  console.log(`[QuickBooks] Pull verification for Invoice ${invoiceId} complete:`, {
    docNumber: qbDocNumber,
    total: qbTotal,
    balance: qbBalance,
  });

  return {
    qbInvoiceId: invoiceId,
    docNumber: qbDocNumber,
    total: qbTotal,
    balance: qbBalance,
    isFullyPaid: qbBalance === 0,
  };
}

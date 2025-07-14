const API_URL = "http://localhost:5000/api";

async function handleResponse(res: Response) {
  if (!res.ok) {
    let errorMessage = '';
    try {
      const data = await res.json();
      errorMessage = data.message || JSON.stringify(data);
    } catch {
      errorMessage = res.statusText;
    }
    throw new Error(`API Error (${res.status}): ${errorMessage}`);
  }
  return res.json();
}

// Validation helper functions
function validateString(value: any, fieldName: string): string {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  return value.trim();
}

function validateNumber(value: any, fieldName: string): number {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    throw new Error(`${fieldName} must be a valid positive number`);
  }
  return num;
}

function validateToken(token: any): string {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new Error('Valid authentication token is required');
  }
  return token.trim();
}

// Use username, not email!
export async function login(username: string, password: string) {
  const validUsername = validateString(username, 'Username');
  const validPassword = validateString(password, 'Password');
  
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      username: validUsername, 
      password: validPassword 
    }),
  });
  return handleResponse(res);
}

export async function register(username: string, password: string) {
  const validUsername = validateString(username, 'Username');
  const validPassword = validateString(password, 'Password');
  
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      username: validUsername, 
      password: validPassword 
    }),
  });
  return handleResponse(res);
}

export async function getPortfolio(token: string) {
  const validToken = validateToken(token);
  
  const res = await fetch(`${API_URL}/portfolio`, {
    headers: { Authorization: `Bearer ${validToken}` },
  });
  return handleResponse(res);
}

export async function addStock(token: string, symbol: string, shares: number, avgPrice: number) {
  const validToken = validateToken(token);
  const validSymbol = validateString(symbol, 'Symbol');
  const validShares = validateNumber(shares, 'Shares');
  const validAvgPrice = validateNumber(avgPrice, 'Average Price');
  
  const res = await fetch(`${API_URL}/portfolio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${validToken}`,
    },
    body: JSON.stringify({ 
      symbol: validSymbol.toUpperCase(), 
      shares: validShares, 
      avgPrice: validAvgPrice 
    }),
  });
  return handleResponse(res);
}

export async function deleteStock(token: string, id: number) {
  const validToken = validateToken(token);
  const validId = validateNumber(id, 'ID');
  
  const res = await fetch(`${API_URL}/portfolio/${validId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${validToken}` },
  });
  return handleResponse(res);
}

export async function getStockHistory(symbol: string, token: string) {
  const validToken = validateToken(token);
  const validSymbol = validateString(symbol, 'Symbol');
  
  const res = await fetch(`${API_URL}/stock-history?symbol=${encodeURIComponent(validSymbol.toUpperCase())}`, {
    headers: { Authorization: `Bearer ${validToken}` }
  });
  return handleResponse(res);
}

export async function searchStock(symbol: string, token: string) {
  const validToken = validateToken(token);
  const validSymbol = validateString(symbol, 'Symbol');
  
  const res = await fetch(`${API_URL}/search-stock?symbol=${encodeURIComponent(validSymbol.toUpperCase())}`, {
    headers: { Authorization: `Bearer ${validToken}` }
  });
  return handleResponse(res);
}

export async function getPopularStocks(token: string) {
  const validToken = validateToken(token);
  
  const res = await fetch(`${API_URL}/popular-stocks`, {
    headers: { Authorization: `Bearer ${validToken}` }
  });
  return handleResponse(res);
}
const API = import.meta.env.VITE_API_URL || 'https://edgelog.onrender.com/api';

const SUCCESS_URL     = 'https://traderascend.com/profile?checkout=success';
const CANCEL_URL      = 'https://traderascend.com/pricing?checkout=cancelled';
const PORTAL_RETURN   = 'https://traderascend.com/profile';

export async function createCheckoutSession(plan, billing, referralCode, token) {
  // BillingToggle uses 'annual'; backend expects 'yearly'
  const mappedBilling = billing === 'annual' ? 'yearly' : 'monthly';
  const body = {
    plan,
    billing: mappedBilling,
    successUrl: SUCCESS_URL,
    cancelUrl:  CANCEL_URL,
  };
  if (referralCode) body.referralCode = referralCode.trim().toUpperCase();

  const res = await fetch(`${API}/stripe/create-checkout-session`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to start checkout — please try again');
  window.location.href = data.url;
}

export async function createPortalSession(token) {
  const res = await fetch(`${API}/stripe/create-portal-session`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ returnUrl: PORTAL_RETURN }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to open billing portal — please try again');
  window.location.href = data.url;
}

export async function validateReferralCode(code, token) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API}/referrals/validate`, {
      method:  'POST',
      headers,
      body:    JSON.stringify({ code: code.trim().toUpperCase() }),
    });
    const data = await res.json();
    if (!res.ok) return { valid: false, error: "Couldn't validate code — please try again" };
    return data; // { valid, ownerFirstName }
  } catch {
    return { valid: false, error: "Couldn't validate code — please try again" };
  }
}

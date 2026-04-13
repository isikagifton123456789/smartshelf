const IDENTITY_TOOLKIT_BASE = "https://identitytoolkit.googleapis.com/v1";

function getApiKey() {
  const key = process.env.FIREBASE_WEB_API_KEY;
  if (!key) {
    throw new Error("Missing FIREBASE_WEB_API_KEY");
  }
  return key;
}

async function identityToolkitRequest(endpoint, payload) {
  const apiKey = getApiKey();
  const response = await fetch(`${IDENTITY_TOOLKIT_BASE}/${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || "Firebase Auth request failed";
    throw new Error(message);
  }

  return data;
}

export async function signUpWithEmailAndPassword(email, password) {
  return identityToolkitRequest("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });
}

export async function signInWithEmailAndPassword(email, password) {
  return identityToolkitRequest("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
}

export async function sendPasswordResetEmail(email) {
  return identityToolkitRequest("accounts:sendOobCode", {
    requestType: "PASSWORD_RESET",
    email,
  });
}

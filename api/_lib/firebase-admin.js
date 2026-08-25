import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const ADMIN_APP_NAME = "backup-server";
const BACKUP_PROJECT_ID = "backup-fcf14";

function readServiceAccount(environmentName, errorCode, expectedProjectId) {
  let serviceAccount;

  try {
    serviceAccount = JSON.parse(process.env[environmentName] || "");
  } catch {
    throw new Error(errorCode);
  }

  if (
    !serviceAccount?.project_id ||
    !serviceAccount?.client_email ||
    !serviceAccount?.private_key
  ) {
    throw new Error(errorCode);
  }
  if (expectedProjectId && serviceAccount.project_id !== expectedProjectId) {
    throw new Error(`${errorCode}_PROJECT_MISMATCH`);
  }

  return {
    ...serviceAccount,
    private_key: serviceAccount.private_key.replace(/\\n/g, "\n"),
  };
}

function getNamedAdminFirestore(
  appName,
  environmentName,
  errorCode,
  expectedProjectId
) {
  const existingApp = getApps().find((app) => app.name === appName);
  const app =
    existingApp ||
    initializeApp(
      {
        credential: cert(
          readServiceAccount(environmentName, errorCode, expectedProjectId)
        ),
      },
      appName
    );

  return getFirestore(app);
}

export function getAdminFirestore() {
  return getNamedAdminFirestore(
    ADMIN_APP_NAME,
    "BACKUP_FIREBASE_SERVICE_ACCOUNT",
    "BACKUP_FIREBASE_SERVICE_ACCOUNT_INVALID",
    BACKUP_PROJECT_ID
  );
}

export function getMinigameAdminFirestore() {
  return getAdminFirestore();
}

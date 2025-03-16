import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { db } from './db';
import crypto from 'crypto';

// Generate a secret key for 2FA
export function generateSecret(email: string): string {
  return authenticator.generateSecret();
}

// Generate a QR code for the 2FA setup
export async function generateQRCode(email: string, secret: string): Promise<string> {
  const serviceName = 'CRM System';
  const otpauth = authenticator.keyuri(email, serviceName, secret);
  return QRCode.toDataURL(otpauth);
}

// Verify a 2FA token
export function verifyToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

// Generate backup codes
export function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    // Generate a random 8-character code
    const code = crypto.randomBytes(4).toString('hex');
    codes.push(code);
  }
  return codes;
}

// Enable 2FA for a user
export async function enableTwoFactor(userId: string, secret: string): Promise<void> {
  const backupCodes = generateBackupCodes();
  
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      backupCodes: JSON.stringify(backupCodes),
    },
  });
}

// Disable 2FA for a user
export async function disableTwoFactor(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    },
  });
}

// Verify a backup code
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { backupCodes: true },
  });

  if (!user?.backupCodes) return false;

  const backupCodes = JSON.parse(user.backupCodes) as string[];
  const codeIndex = backupCodes.indexOf(code);

  if (codeIndex === -1) return false;

  // Remove the used backup code
  backupCodes.splice(codeIndex, 1);

  // Update the backup codes in the database
  await db.user.update({
    where: { id: userId },
    data: {
      backupCodes: JSON.stringify(backupCodes),
    },
  });

  return true;
} 
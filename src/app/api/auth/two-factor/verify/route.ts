import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, verifyBackupCode } from '@/lib/twoFactorAuth';

export async function POST(request: Request) {
  try {
    const { email, token, isBackupCode = false } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'User not found or 2FA not enabled' },
        { status: 404 }
      );
    }

    let isValid = false;

    if (isBackupCode) {
      // Verify backup code
      isValid = await verifyBackupCode(user.id, token);
    } else {
      // Verify 2FA token
      isValid = verifyToken(token, user.twoFactorSecret);
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA verification successful',
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 }
    );
  }
} 
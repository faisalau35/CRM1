import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { twoFactorEnabled: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      twoFactorEnabled: user.twoFactorEnabled || false,
    });
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return NextResponse.json(
      { error: 'Failed to check 2FA status' },
      { status: 500 }
    );
  }
} 
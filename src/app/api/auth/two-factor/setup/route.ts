import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateSecret, generateQRCode } from '@/lib/twoFactorAuth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a new secret
    const secret = generateSecret(user.email);
    
    // Generate a QR code
    const qrCode = await generateQRCode(user.email, secret);

    // Store the secret temporarily in the session or a temporary storage
    // In a real app, you might want to use a more secure temporary storage
    
    return NextResponse.json({
      secret,
      qrCode,
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to set up 2FA' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { secret, token } = await request.json();

    // Verify the token
    const { verifyToken, enableTwoFactor } = await import('@/lib/twoFactorAuth');
    
    if (!verifyToken(token, secret)) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Enable 2FA for the user
    await enableTwoFactor(session.user.id, secret);

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
} 
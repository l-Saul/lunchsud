import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

type SessionPayload = {
    userId: string;
    alaId: string;
};

export async function requireAdminSession(): Promise<SessionPayload> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
        throw new Error('UNAUTHORIZED');
    }

    if (!process.env.AUTH_SECRET) {
        throw new Error('AUTH_SECRET_NOT_SET');
    }

    try {
        return jwt.verify(
            token,
            process.env.AUTH_SECRET
        ) as SessionPayload;
    } catch {
        throw new Error('UNAUTHORIZED');
    }
}

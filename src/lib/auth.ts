import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Conteúdo do JWT de sessão do líder (igual ao que é assinado no /api/admin/login).
type SessionPayload = {
    userId: number;
    alaId: number;
};

// Lê e valida o cookie de sessão admin. Lança em vez de retornar null:
// quem chama usa try/catch para redirecionar ao login (páginas) ou responder erro (rotas).
export async function requireAdminSession(): Promise<SessionPayload> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    // Sem cookie = não autenticado.
    if (!token) {
        throw new Error('UNAUTHORIZED');
    }

    // Segredo de assinatura ausente = problema de configuração do ambiente.
    if (!process.env.AUTH_SECRET) {
        throw new Error('AUTH_SECRET_NOT_SET');
    }

    try {
        // Verifica assinatura/expiração e devolve o payload tipado.
        return jwt.verify(
            token,
            process.env.AUTH_SECRET
        ) as SessionPayload;
    } catch {
        // Token inválido ou expirado.
        throw new Error('UNAUTHORIZED');
    }
}

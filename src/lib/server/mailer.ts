/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
import 'server-only';
import nodemailer from 'nodemailer';

export type Email = {
    para: string;
    assunto: string;
    html: string;
    texto: string;
};

export type ResultadoEnvio = 'enviado' | 'falhou' | 'desligado';

export function emailsLigados() {
    return process.env.VERCEL_ENV === 'production' || Boolean(process.env.EMAIL_TESTE_PARA);
}

function destino(email: Email): Email | null {
    if (process.env.VERCEL_ENV === 'production') return email;
    const teste = process.env.EMAIL_TESTE_PARA;
    if (!teste) return null;
    return { ...email, para: teste, assunto: `[teste → ${email.para}] ${email.assunto}` };
}

export async function enviarEmails(emails: Email[]): Promise<ResultadoEnvio[]> {
    const usuario = process.env.GMAIL_USER;
    const senha = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
    const finais = emails.map(destino);

    if (!finais.some(Boolean)) return emails.map(() => 'desligado');
    if (!usuario || !senha) {
        console.error('[email] GMAIL_USER ou GMAIL_APP_PASSWORD não definidos');
        return emails.map(() => 'desligado');
    }

    const remetente = process.env.EMAIL_FROM || `"Almoço dos Missionários" <${usuario}>`;
    const transporte = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: usuario, pass: senha },
    });

    const resultados: ResultadoEnvio[] = [];
    try {
        for (const email of finais) {
            if (!email) {
                resultados.push('desligado');
                continue;
            }
            try {
                await transporte.sendMail({
                    from: remetente,
                    to: email.para,
                    subject: email.assunto,
                    html: email.html,
                    text: email.texto,
                });
                resultados.push('enviado');
            } catch (erro) {
                console.error('[email] falha no envio:', erro instanceof Error ? erro.message : erro);
                resultados.push('falhou');
            }
        }
    } finally {
        transporte.close();
    }
    return resultados;
}

export async function enviarEmail(email: Email) {
    const [resultado] = await enviarEmails([email]);
    return resultado;
}

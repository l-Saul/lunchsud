/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
import 'server-only';
import { supabaseServer } from '@/lib/supabase/service-role';
import { getDashboardRange, isPday, somarDias } from '@/lib/date';
import { PREFERENCIAS_PADRAO, TIPOS_AVISO, type PreferenciasEmail, type TipoAviso } from '@/lib/email-preferences';
import { emailsLigados, enviarEmail, enviarEmails, type Email } from '@/lib/server/mailer';
import {
    emailAcessoAprovado,
    emailDiaSemAlmoco,
    emailNovoAlmoco,
    emailPedidoAcesso,
    emailPedidoDeAla,
    emailProximoMes,
    emailSemana,
    type Almoco,
} from '@/lib/server/email-templates';

export type AlaAviso = { id: number; nome: string; slug: string; fuso_horario: string };

export type Destinatario = { id: string; email: string; preferencias: PreferenciasEmail };

export type AvisoPlanejado = {
    tipo: 'dia_sem_almoco' | 'proximo_mes' | 'semana';
    userId: string;
    referencia: string;
    email: Email;
};

type Inscricao = Partial<PreferenciasEmail> & { user_id: string; ala_id: number };

export const DIAS_ANTES_DIA_SEM_ALMOCO = 2;
const SEMANA = [1, 2, 3, 4, 5, 6];
const GUARDAR_ENVIOS_DIAS = 90;
const COLUNAS = TIPOS_AVISO.join(', ');

function comPadrao(linha: Partial<PreferenciasEmail> | null): PreferenciasEmail {
    if (!linha) return PREFERENCIAS_PADRAO;
    return Object.fromEntries(TIPOS_AVISO.map(tipo => [tipo, linha[tipo] === true])) as PreferenciasEmail;
}

export async function buscarPreferenciasEmail(userId: string, alaId: number) {
    const { data } = await supabaseServer
        .from('email_preferencia')
        .select(COLUNAS)
        .eq('user_id', userId)
        .eq('ala_id', alaId)
        .maybeSingle();
    return comPadrao(data as Partial<PreferenciasEmail> | null);
}

async function inscritos(filtro: { alaId?: number; tipo?: TipoAviso }): Promise<(Destinatario & { alaId: number })[]> {
    let consulta = supabaseServer.from('email_preferencia').select(`user_id, ala_id, ${COLUNAS}`);
    if (filtro.alaId !== undefined) consulta = consulta.eq('ala_id', filtro.alaId);
    if (filtro.tipo) consulta = consulta.eq(filtro.tipo, true);
    const { data, error } = await consulta;
    if (error) throw new Error('Falha ao ler as preferências de e-mail');

    const linhas = (data ?? []) as unknown as Inscricao[];
    if (!linhas.length) return [];

    const ids = [...new Set(linhas.map(l => l.user_id))];
    const [perfis, membros] = await Promise.all([
        supabaseServer.from('perfil').select('id, email, is_owner').in('id', ids),
        supabaseServer.from('ala_membro').select('user_id, ala_id').eq('status', 'aprovado').in('user_id', ids),
    ]);
    if (perfis.error || membros.error) throw new Error('Falha ao ler os líderes');

    const perfilPorId = new Map(perfis.data.map(p => [p.id as string, p]));
    const aprovados = new Set(membros.data.map(m => `${m.user_id}:${m.ala_id}`));
    return linhas.flatMap(l => {
        const perfil = perfilPorId.get(l.user_id);
        if (!perfil?.email) return [];
        if (!perfil.is_owner && !aprovados.has(`${l.user_id}:${l.ala_id}`)) return [];
        return [{ id: l.user_id, email: perfil.email as string, alaId: l.ala_id, preferencias: comPadrao(l) }];
    });
}

export function planejarAvisos(
    ala: AlaAviso,
    janela: { hoje: string; fim: string; mesSeguinte: string },
    almocos: Almoco[],
    destinatarios: Destinatario[]
): AvisoPlanejado[] {
    const { hoje, fim, mesSeguinte } = janela;
    const porData = new Map(almocos.map(a => [a.data, a]));
    const diaDoProximoMes = somarDias(`${mesSeguinte}-01`, -2);
    const avisos: AvisoPlanejado[] = [];

    for (const d of destinatarios) {
        const p = d.preferencias;

        if (p.proximo_mes && hoje === diaDoProximoMes) {
            avisos.push({
                tipo: 'proximo_mes',
                userId: d.id,
                referencia: mesSeguinte,
                email: emailProximoMes({
                    para: d.email,
                    ala,
                    mes: mesSeguinte,
                    almocos: almocos.filter(a => a.data.startsWith(mesSeguinte)),
                }),
            });
        }

        if (p.semana && isPday(hoje)) {
            const dias = SEMANA.map(n => {
                const data = somarDias(hoje, n);
                return { data, almoco: porData.get(data) };
            });
            avisos.push({
                tipo: 'semana',
                userId: d.id,
                referencia: hoje,
                email: emailSemana({ para: d.email, ala, dias }),
            });
        }

        if (p.dia_sem_almoco) {
            const alvo = somarDias(hoje, DIAS_ANTES_DIA_SEM_ALMOCO);
            if (!isPday(alvo) && alvo < fim && !porData.has(alvo)) {
                avisos.push({
                    tipo: 'dia_sem_almoco',
                    userId: d.id,
                    referencia: alvo,
                    email: emailDiaSemAlmoco({ para: d.email, ala, data: alvo }),
                });
            }
        }
    }
    return avisos;
}

export async function rodarAvisosDoDia() {
    const todos = (await inscritos({})).filter(d =>
        d.preferencias.dia_sem_almoco || d.preferencias.proximo_mes || d.preferencias.semana
    );
    const alaIds = [...new Set(todos.map(d => d.alaId))];

    const planejados: (AvisoPlanejado & { alaId: number })[] = [];
    if (alaIds.length) {
        const { data: alas, error } = await supabaseServer
            .from('ala')
            .select('id, nome, slug, fuso_horario')
            .in('id', alaIds);
        if (error) throw new Error('Falha ao carregar as alas');

        for (const ala of alas as AlaAviso[]) {
            const { hoje, fim, mesSeguinte } = getDashboardRange(ala.fuso_horario);
            const { data: almocos, error: erroAlmocos } = await supabaseServer
                .from('agendamento')
                .select('data::text, nome, telefone')
                .eq('ala_id', ala.id)
                .gt('data', hoje)
                .lt('data', fim)
                .order('data');
            if (erroAlmocos) {
                console.error('[avisos] falha ao ler os agendamentos da ala', ala.id);
                continue;
            }
            const destinatarios = todos.filter(d => d.alaId === ala.id);
            planejarAvisos(ala, { hoje, fim, mesSeguinte }, almocos as Almoco[], destinatarios)
                .forEach(aviso => planejados.push({ ...aviso, alaId: ala.id }));
        }
    }

    const producao = process.env.VERCEL_ENV === 'production';
    const aEnviar: (AvisoPlanejado & { envioId?: number })[] = [];
    for (const aviso of planejados) {
        if (!producao) {
            aEnviar.push(aviso);
            continue;
        }
        const { data: registro, error: erroRegistro } = await supabaseServer
            .from('email_envio')
            .upsert(
                { tipo: aviso.tipo, user_id: aviso.userId, ala_id: aviso.alaId, referencia: aviso.referencia },
                { onConflict: 'tipo,user_id,ala_id,referencia', ignoreDuplicates: true }
            )
            .select('id');
        if (erroRegistro) {
            console.error('[avisos] falha ao registrar o envio', aviso.tipo);
            continue;
        }
        if (registro?.length) aEnviar.push({ ...aviso, envioId: registro[0].id });
    }

    const resultados = await enviarEmails(aEnviar.map(a => a.email));
    const desfazer = aEnviar
        .filter((a, i) => a.envioId && resultados[i] !== 'enviado')
        .map(a => a.envioId as number);
    if (desfazer.length) await supabaseServer.from('email_envio').delete().in('id', desfazer);

    if (producao) {
        const limite = new Date(Date.now() - GUARDAR_ENVIOS_DIAS * 24 * 60 * 60 * 1000).toISOString();
        await supabaseServer.from('email_envio').delete().lt('enviado_em', limite);
    }

    const contar = (r: string) => resultados.filter(x => x === r).length;
    return {
        planejados: planejados.length,
        repetidos: planejados.length - aEnviar.length,
        enviados: contar('enviado'),
        falharam: contar('falhou'),
        desligados: contar('desligado'),
    };
}

export async function avisarNovoAlmoco(alaId: number, almoco: Almoco) {
    if (!emailsLigados()) return;
    try {
        const { data: ala } = await supabaseServer
            .from('ala')
            .select('nome, slug, fuso_horario')
            .eq('id', alaId)
            .maybeSingle();
        if (!ala) return;
        if (!almoco.data.startsWith(getDashboardRange(ala.fuso_horario).mesAtual)) return;

        const destinatarios = await inscritos({ alaId, tipo: 'novo_almoco' });
        if (!destinatarios.length) return;
        await enviarEmails(destinatarios.map(d => emailNovoAlmoco({ para: d.email, ala, almoco })));
    } catch (erro) {
        console.error('[avisos] novo almoço:', erro instanceof Error ? erro.message : erro);
    }
}

export async function avisarPedidoDeAcesso(alaId: number, solicitanteId: string) {
    if (!emailsLigados()) return;
    try {
        const [destinatarios, { data: ala }, { data: solicitante }] = await Promise.all([
            inscritos({ alaId, tipo: 'pedido_acesso' }),
            supabaseServer.from('ala').select('nome, slug').eq('id', alaId).maybeSingle(),
            supabaseServer.from('perfil').select('nome, email').eq('id', solicitanteId).maybeSingle(),
        ]);
        if (!ala) return;
        await enviarEmails(destinatarios
            .filter(d => d.id !== solicitanteId)
            .map(d => emailPedidoAcesso({
                para: d.email,
                ala,
                solicitante: { nome: solicitante?.nome ?? '', email: solicitante?.email ?? '' },
            })));
    } catch (erro) {
        console.error('[avisos] pedido de acesso:', erro instanceof Error ? erro.message : erro);
    }
}

export async function avisarAcessoAprovado(alaId: number, userId: string) {
    if (!emailsLigados()) return;
    try {
        const [{ data: perfil }, { data: ala }] = await Promise.all([
            supabaseServer.from('perfil').select('email').eq('id', userId).maybeSingle(),
            supabaseServer.from('ala').select('nome, slug').eq('id', alaId).maybeSingle(),
        ]);
        if (!perfil?.email || !ala) return;
        await enviarEmail(emailAcessoAprovado({ para: perfil.email, ala }));
    } catch (erro) {
        console.error('[avisos] acesso aprovado:', erro instanceof Error ? erro.message : erro);
    }
}

export async function avisarPedidoDeAla(alaId: number) {
    if (!emailsLigados()) return;
    try {
        const { data: ala } = await supabaseServer
            .from('ala')
            .select('nome, cidade, estado, pedido_por')
            .eq('id', alaId)
            .maybeSingle();
        if (!ala) return;
        const [{ data: donos }, { data: solicitante }] = await Promise.all([
            supabaseServer.from('perfil').select('email').eq('is_owner', true),
            ala.pedido_por
                ? supabaseServer.from('perfil').select('nome, email').eq('id', ala.pedido_por).maybeSingle()
                : Promise.resolve({ data: null }),
        ]);
        await enviarEmails((donos ?? [])
            .filter(d => d.email)
            .map(d => emailPedidoDeAla({
                para: d.email!,
                ala,
                solicitante: { nome: solicitante?.nome ?? '', email: solicitante?.email ?? '' },
            })));
    } catch (erro) {
        console.error('[avisos] pedido de nova ala:', erro instanceof Error ? erro.message : erro);
    }
}

/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { NoticeBar, type Aviso } from '@/components/NoticeBar';
import { siteUrl } from '@/lib/site-url';
import { DESCRICAO_DA_ALA, tituloDaAla } from '@/lib/share-texts';

type Props = { slug: string; nomeAla: string };

const botaoIcone =
    'flex min-h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-white shadow-md transition duration-100 hover:opacity-90 active:scale-[0.98] sm:min-h-13 sm:w-13 cursor-pointer';

function copiarComFallback(texto: string) {
    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    let ok = false;
    try {
        ok = document.execCommand('copy');
    } catch {
        ok = false;
    }
    campo.remove();
    return ok;
}

export function ShareLinkButtons({ slug, nomeAla }: Props) {
    const [aviso, setAviso] = useState<Aviso | null>(null);
    const [copiado, setCopiado] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);

    async function copiar() {
        const url = `${siteUrl()}/${slug}`;
        let ok = false;
        try {
            await navigator.clipboard.writeText(url);
            ok = true;
        } catch {
            ok = copiarComFallback(url);
        }
        clearTimeout(timer.current);
        if (ok) {
            setCopiado(true);
            setAviso({ tipo: 'sucesso', conteudo: 'Link copiado!' });
            timer.current = setTimeout(() => {
                setAviso(null);
                setCopiado(false);
            }, 3000);
        } else {
            setCopiado(false);
            setAviso({ tipo: 'erro', conteudo: `Não foi possível copiar. O link é: ${url}` });
        }
    }

    async function compartilhar() {
        const url = `${siteUrl()}/${slug}`;
        const titulo = tituloDaAla(nomeAla);
        const texto = DESCRICAO_DA_ALA;
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: titulo, text: texto, url });
                return;
            } catch (erro) {
                if (erro instanceof DOMException && erro.name === 'AbortError') return;
            }
        }
        window.open(
            `https://wa.me/?text=${encodeURIComponent(`${titulo}\n${texto}\n${url}`)}`,
            '_blank',
            'noopener,noreferrer'
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={copiar}
                aria-label="Copiar o link do calendário da ala"
                title="Copiar o link"
                className={botaoIcone}
            >
                {copiado ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                )}
            </button>
            <button
                type="button"
                onClick={compartilhar}
                aria-label="Compartilhar o link do calendário da ala"
                title="Compartilhar"
                className={botaoIcone}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
                </svg>
            </button>
            <NoticeBar aviso={aviso} onClose={aviso?.tipo === 'erro' ? () => setAviso(null) : undefined} />
        </>
    );
}

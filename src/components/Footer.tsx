/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import Image from 'next/image';

export function Footer() {
    return (
        <footer className="mt-16 w-full bg-primary text-white [--focus-color:var(--color-gold)] sm:mt-24">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-6 sm:px-6">
                <a
                    href="https://www.churchofjesuschrist.org/?lang=por"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Site oficial da Igreja (abre em outra aba)"
                    className="shrink-0 rounded-lg transition hover:opacity-85"
                >
                    <Image src="/christ-icon.png" alt="" width={200} height={296} className="h-20 w-auto sm:h-24" />
                </a>

                <p className="min-w-0 grow basis-40 text-right text-base text-white/75">
                    Desenvolvido por{' '}
                    <a
                        href="https://luishsaul.com.br/#contato"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-white underline-offset-4 transition hover:text-gold hover:underline"
                    >
                        Luis Henrique Engel Saul
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                            <path d="M15 3h6v6" />
                            <path d="M10 14 21 3" />
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </svg>
                        <span className="sr-only">(abre em outra aba)</span>
                    </a>
                </p>
            </div>
        </footer>
    );
}

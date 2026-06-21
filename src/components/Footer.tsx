// Rodapé global (renderizado no layout em todas as páginas):
//  1. aviso de que o site é independente/não oficial;
//  2. crédito do desenvolvedor — o nome (sublinhado, com ícone de link externo)
//     abre o portfólio em uma nova aba.
// O link externo usa rel="noopener noreferrer" por segurança (target="_blank").
export function Footer() {
    return (
        <footer className="mt-16 w-full border-t border-white/10 px-4 py-7 text-white sm:mt-24">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
                <p className="text-sm text-white/70">
                    Site independente, sem vínculo institucional ou oficial com a Igreja de
                    Jesus Cristo dos Santos dos Últimos Dias.
                </p>

                <p className="text-sm text-white/60">
                    Desenvolvido por{' '}
                    <a
                        href="https://luishsaul.com.br"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 underline underline-offset-4 transition hover:text-white"
                    >
                        Luis Henrique Engel Saul
                        {/* Ícone de link externo (indica que abre em outra página). */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M15 3h6v6" />
                            <path d="M10 14 21 3" />
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </svg>
                    </a>
                </p>
            </div>
        </footer>
    )
}

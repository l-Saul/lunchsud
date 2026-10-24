// Indicador de "estou trabalhando" dos botões. Usa a cor do texto do botão
// (branco no botão verde, rosa no botão de remover). Fica sempre ao lado de um
// verbo ("Confirmando…") — é o texto que diz o que está acontecendo, por isso o
// círculo é só decorativo para leitores de tela. Gira no CSS, sem JavaScript.
export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
        />
    );
}

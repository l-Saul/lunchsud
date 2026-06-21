// Rodapé global (renderizado no layout) com o aviso de site não oficial.
export function Footer() {
    return (
        <footer className="w-full border-t border-white/10 bg-primary px-4 py-6 text-white">
            <p className="mx-auto max-w-2xl text-center text-sm text-white/70">
                Site independente, sem vínculo institucional ou oficial com a Igreja de
                Jesus Cristo dos Santos dos Últimos Dias.
            </p>
        </footer>
    )
}

import Link from 'next/link'
import { Flor } from '@/components/Flor'

// 404 do site inteiro — na prática, link de ala digitado errado ou de uma ala
// que não existe mais. Em vez da tela padrão do Next (em inglês), leva à lista
// de alas da home, onde a pessoa acha a sua com um toque.
export default function NaoEncontrada() {
    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <section className="relative flex w-full max-w-md flex-col items-center gap-6 overflow-hidden rounded-3xl bg-background px-6 py-10 text-center shadow-2xl ring-1 ring-white/40 sm:px-10">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-secondary via-accent to-secondary" />
                <Flor size={26} />

                <h1 className="text-2xl font-semibold text-text">
                    Não encontramos essa página
                </h1>
                <p className="text-lg text-muted">
                    Confira o link que você recebeu ou escolha a sua ala na lista.
                </p>

                <Link
                    href="/"
                    className="flex min-h-13 w-full items-center justify-center rounded-xl bg-secondary px-4 text-lg font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-lg"
                >
                    Ver as alas
                </Link>
            </section>
        </main>
    )
}

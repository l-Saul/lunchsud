/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

export function Flower({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <g fill="#ed3a65">
                {[0, 72, 144, 216, 288].map(deg => (
                    <ellipse
                        key={deg}
                        cx="12"
                        cy="6.5"
                        rx="2.6"
                        ry="4.4"
                        transform={`rotate(${deg} 12 12)`}
                    />
                ))}
            </g>
            <circle cx="12" cy="12" r="2.8" fill="#ffb81c" />
        </svg>
    );
}

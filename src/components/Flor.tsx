// Florzinha decorativa (rosa) usada na imagem gerada e no painel.
// Cor #e0588f = --color-accent (mantida em hex aqui para renderizar no
// html-to-image, que captura estilos resolvidos).
export function Flor({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <g fill="#e0588f">
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
            <circle cx="12" cy="12" r="2.8" fill="#f6c453" />
        </svg>
    );
}

/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { nomeDoMes } from '@/lib/date';
import { ChoiceGroup } from '@/components/ChoiceGroup';

type Props = {
    meses: string[];
    ativo: string;
    onChange: (ym: string) => void;
    label: string;
};

export function MonthTabs({ meses, ativo, onChange, label }: Props) {
    return (
        <ChoiceGroup
            opcoes={meses.map(ym => ({ valor: ym, rotulo: nomeDoMes(ym) }))}
            ativo={ativo}
            onChange={onChange}
            label={label}
        />
    );
}

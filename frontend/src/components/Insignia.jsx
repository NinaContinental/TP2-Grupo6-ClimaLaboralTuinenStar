import { IconoAlerta, IconoCheck, IconoInfo } from './Icons';
import { ETIQUETA_NIVEL } from '../lib/riesgo';

// El nivel de riesgo nunca depende solo del color: lleva icono y texto.
const ICONO_NIVEL = {
  BAJO: IconoCheck,
  MEDIO: IconoInfo,
  ALTO: IconoAlerta
};

export function InsigniaRiesgo({ nivel }) {
  const Icono = ICONO_NIVEL[nivel] || IconoInfo;
  return (
    <span className={`insignia insignia-${String(nivel).toLowerCase()}`}>
      <Icono tamano={14} />
      {ETIQUETA_NIVEL[nivel] || nivel}
    </span>
  );
}

const ESTADOS = {
  ACTIVA: { texto: 'Activa', clase: 'activa' },
  CERRADA: { texto: 'Cerrada', clase: 'neutra' },
  ATENDIDA: { texto: 'Atendida', clase: 'neutra' }
};

export function InsigniaEstado({ estado }) {
  const e = ESTADOS[estado] || { texto: estado, clase: 'neutra' };
  return (
    <span className={`insignia insignia-${e.clase}`}>
      {estado === 'ATENDIDA' && <IconoCheck tamano={14} />}
      {e.texto}
    </span>
  );
}

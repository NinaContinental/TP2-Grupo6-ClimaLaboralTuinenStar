import { ETIQUETA_NIVEL, MAXIMO, ZONAS, nivelDe } from '../lib/riesgo';

/**
 * Escala 0-4 con las tres zonas de riesgo (bajo / medio / alto).
 *  - modo "marcador": una marca sobre la escala (alertas).
 *  - modo "barra": barra rellena desde 0 hasta el valor (dashboard).
 */
export default function EscalaRiesgo({ valor, modo = 'marcador', ejes = true }) {
  const v = Math.max(0, Math.min(MAXIMO, Number(valor) || 0));
  const porcentaje = (v / MAXIMO) * 100;
  const nivel = nivelDe(v);

  return (
    <div
      className={`escala escala-${modo}${ejes ? ' con-ejes' : ''}`}
      role="img"
      aria-label={`Promedio ${v.toFixed(1)} de ${MAXIMO}: ${ETIQUETA_NIVEL[nivel].toLowerCase()}`}
    >
      <div className="escala-pista">
        {ZONAS.map((z) => (
          <span
            key={z.nivel}
            className={`zona zona-${z.nivel.toLowerCase()}`}
            style={{
              left: `${(z.desde / MAXIMO) * 100}%`,
              width: `${((z.hasta - z.desde) / MAXIMO) * 100}%`
            }}
          />
        ))}
        {modo === 'barra' ? (
          <span className={`escala-relleno nivel-${nivel.toLowerCase()}`} style={{ width: `${porcentaje}%` }} />
        ) : (
          <span className={`escala-marcador nivel-${nivel.toLowerCase()}`} style={{ left: `${porcentaje}%` }} />
        )}
      </div>
      {ejes && <EjesEscala />}
    </div>
  );
}

export function EjesEscala() {
  return (
    <div className="escala-ejes" aria-hidden="true">
      {Array.from({ length: MAXIMO + 1 }).map((_, n) => (
        <span key={n} style={{ left: `${(n / MAXIMO) * 100}%` }}>{n}</span>
      ))}
    </div>
  );
}

import { IconoAlerta } from './Icons';

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

// Marcadores de carga con la forma de lo que va a aparecer.
export function Esqueleto({ filas = 3, alto = 84 }) {
  return (
    <div className="esqueletos">
      <span className="sr-only" role="status">Cargando…</span>
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="esqueleto" style={{ height: alto }} aria-hidden="true" />
      ))}
    </div>
  );
}

export function EstadoVacio({ icono, titulo, children }) {
  return (
    <div className="vacio">
      {icono}
      <h3>{titulo}</h3>
      <p>{children}</p>
    </div>
  );
}

export function MensajeError({ children, onReintentar }) {
  return (
    <div className="aviso aviso-error" role="alert">
      <IconoAlerta tamano={20} />
      <div>
        <p>{children}</p>
        {onReintentar && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onReintentar}>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

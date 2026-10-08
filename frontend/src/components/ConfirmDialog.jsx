import { useEffect, useId, useRef } from 'react';
import { Spinner } from './Estados';

/**
 * Dialogo de confirmacion basado en <dialog> nativo: atrapa el foco,
 * se cierra con Esc y tapa el resto de la pantalla.
 */
export default function ConfirmDialog({
  abierto,
  titulo,
  children,
  textoConfirmar = 'Confirmar',
  peligro = false,
  cargando = false,
  onConfirmar,
  onCancelar
}) {
  const ref = useRef(null);
  const idTitulo = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        if (!cargando) onCancelar();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !cargando) onCancelar();
      }}
    >
      <div className="dialogo-cuerpo">
        <h2 id={idTitulo}>{titulo}</h2>
        <div className="dialogo-texto">{children}</div>
        <div className="dialogo-acciones">
          <button type="button" className="btn btn-secondary" onClick={onCancelar} disabled={cargando}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn ${peligro ? 'btn-peligro' : 'btn-primary'}`}
            onClick={onConfirmar}
            disabled={cargando}
            aria-busy={cargando}
          >
            {cargando && <Spinner />}
            {textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}

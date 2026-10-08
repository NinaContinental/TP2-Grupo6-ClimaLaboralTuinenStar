import { Link } from 'react-router-dom';
import { IconoCheck } from '../components/Icons';
import useTitulo from '../lib/useTitulo';

export default function ConfirmacionEnvio() {
  useTitulo('Respuesta enviada');

  return (
    <section className="confirmacion panel">
      <div className="sello-check">
        <IconoCheck tamano={36} strokeWidth="2.4" />
      </div>
      <h1>Respuesta enviada</h1>
      <p>
        Gracias por participar. Tu respuesta se guardó con un token anónimo: nadie puede saber que fue tuya.
      </p>
      <Link to="/panel" className="btn btn-primary">
        Volver al inicio
      </Link>
    </section>
  );
}

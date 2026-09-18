import { Link } from 'react-router-dom';

export default function ConfirmacionEnvio() {
  return (
    <div className="tarjeta tarjeta-confirmacion">
      <div className="icono-check">✔</div>
      <h2>Respuesta enviada con exito!</h2>
      <p>
        Gracias por su participacion. Su respuesta fue almacenada de forma
        completamente anonima.
      </p>
      <Link to="/panel">
        <button>Volver al inicio</button>
      </Link>
    </div>
  );
}

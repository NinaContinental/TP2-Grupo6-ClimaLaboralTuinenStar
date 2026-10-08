import { useTema } from '../context/ThemeContext';
import { IconoLuna, IconoSol } from './Icons';

export default function BotonTema() {
  const { tema, alternar } = useTema();
  const oscuro = tema === 'oscuro';
  const texto = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <button type="button" className="btn-icono" onClick={alternar} aria-label={texto} title={texto}>
      {oscuro ? <IconoSol /> : <IconoLuna />}
    </button>
  );
}

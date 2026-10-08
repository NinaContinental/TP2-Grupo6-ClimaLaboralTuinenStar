import { useEffect } from 'react';

// Titulo de pestana por pagina: "Encuesta · Clima Laboral".
export default function useTitulo(titulo) {
  useEffect(() => {
    document.title = `${titulo} · Clima Laboral`;
  }, [titulo]);
}

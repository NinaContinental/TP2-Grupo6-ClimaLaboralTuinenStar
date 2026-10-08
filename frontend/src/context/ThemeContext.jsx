import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const TemaContext = createContext({ tema: 'claro', alternar: () => {} });

function temaInicial() {
  try {
    const guardado = localStorage.getItem('tema');
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;
  } catch (e) {
    /* sin acceso a localStorage: se usa la preferencia del sistema */
  }
  const oscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return oscuro ? 'oscuro' : 'claro';
}

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
  }, [tema]);

  // Solo se guarda cuando la persona elige: mientras no elija, se sigue al sistema.
  const alternar = useCallback(() => {
    setTema((actual) => {
      const nuevo = actual === 'claro' ? 'oscuro' : 'claro';
      try {
        localStorage.setItem('tema', nuevo);
      } catch (e) {
        /* se ignora */
      }
      return nuevo;
    });
  }, []);

  return <TemaContext.Provider value={{ tema, alternar }}>{children}</TemaContext.Provider>;
}

export function useTema() {
  return useContext(TemaContext);
}

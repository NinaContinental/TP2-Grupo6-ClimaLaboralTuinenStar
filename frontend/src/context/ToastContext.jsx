import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { IconoAlerta, IconoCheck } from '../components/Icons';

const ToastContext = createContext({ mostrar: () => {} });

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const contador = useRef(0);

  const mostrar = useCallback((mensaje, tipo = 'exito') => {
    const id = ++contador.current;
    setItems((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={`toast toast-${i.tipo}`}>
            {i.tipo === 'error' ? <IconoAlerta tamano={18} /> : <IconoCheck tamano={18} />}
            <span>{i.mensaje}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

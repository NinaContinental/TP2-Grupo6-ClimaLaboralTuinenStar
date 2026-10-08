import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const nombre = localStorage.getItem('nombre_completo');
    const rol = localStorage.getItem('rol');
    const token = localStorage.getItem('token');
    return token ? { nombre, rol, token } : null;
  });

  async function login(correo, contrasena) {
    const { data } = await api.post('/auth/login', { correo, contrasena });
    localStorage.setItem('token', data.token);
    localStorage.setItem('nombre_completo', data.nombre_completo);
    localStorage.setItem('rol', data.rol);
    setUsuario({ nombre: data.nombre_completo, rol: data.rol, token: data.token });
    return data;
  }

  function logout() {
    // Solo se borra la sesion; asi la preferencia de tema (modo claro/oscuro) se conserva.
    localStorage.removeItem('token');
    localStorage.removeItem('nombre_completo');
    localStorage.removeItem('rol');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

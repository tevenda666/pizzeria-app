import React, { useState } from 'react';
import CollabList from '../components/CollabList.jsx';
import { apiFetch, parseJsonSafe } from '../utils/api.js';

export default function CollabPage({ collab, setCollab, orders, onUpdate }) {
  const [creds, setCreds] = useState({ documento: '', password: '' });
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const login = async () => {
    setError('');
    try {
      const res = await apiFetch('/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento: creds.documento, password: creds.password })
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || 'Login inválido');
      setCollab({ documento: data.documento, nombre: data.nombre });
    } catch (err) {
      setError('Usuario o contraseña incorrecta');
    }
  };

  return (
    <section className="panel">
      {!collab && (
        <div className="login-wrapper">
          <div className="login-card">
            <div className="login-left">
              <div className="avatar">
                <span role="img" aria-label="usuario">👤</span>
              </div>
              <h3>Acceso Colaboradores</h3>
              <p>Organiza pedidos y cocina con un solo panel.</p>
            </div>
            <div className="login-form">
              <label>Documento</label>
              <input
                className="search"
                placeholder="999999999"
                value={creds.documento}
                onChange={(e) => setCreds({ ...creds, documento: e.target.value })}
              />
              <label>Contraseña</label>
              <div className="password-field">
                <input
                  className="search"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={creds.password}
                  onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                />
                <button
                  type="button"
                  className="toggle-eye"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              <button
                className="btn primary"
                onClick={login}
              >
                Entrar
              </button>
              {error && <p className="login-error">{error}</p>}
            </div>
          </div>
        </div>
      )}
      {collab && (
        <>
          <div className="collab-bar">
            <p className="collab-user">Usuario: {collab.nombre || collab.documento || 'colaborador'}</p>
            <button className="btn logout" onClick={() => setCollab(null)}>Salir</button>
          </div>
          <CollabList orders={orders} onUpdate={onUpdate} />
        </>
      )}
    </section>
  );
}

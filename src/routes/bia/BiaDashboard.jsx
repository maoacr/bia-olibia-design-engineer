import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBrand } from '../../shared/useBrand.js';
import { useScrolled } from '../../shared/useScrolled.js';
import { ThemeToggle } from '../../shared/theme.jsx';
import { useDocumentTitle } from '../../shared/useDocumentTitle.js';
import { useBiaData } from './useBiaData.js';
import { Cargando, Error } from './Estados.jsx';
import Veredicto from './Veredicto.jsx';
import Sedes from './Sedes.jsx';
import Perfil from './Perfil.jsx';
import Evidencia from './Evidencia.jsx';
import Paso from './Paso.jsx';
import Dialogo from './Dialogo.jsx';

/**
 * LA PAGINA DE BIA.
 *
 * Una sola pagina y cuatro preguntas, en orden. A diferencia de Olibia,
 * aca no hay menu lateral ni filtros combinables: la persona que entra es
 * dueña de tres cafeterias, no experta en energia, y tiene pocos minutos.
 * Un indice de secciones para alguien que ya sabe lo que busca es ruido.
 *
 * El orden es el argumento. Primero el veredicto (la tarifa no cambio),
 * despues donde (una sede), despues cuando (la madrugada) y por ultimo
 * que hacer. Cada bloque se apoya en el anterior y ninguno hace falta
 * antes que el de arriba.
 */
export default function BiaDashboard() {
  useBrand('bia');
  useDocumentTitle('Bia · Consumo energético · Prueba Design Engineer');

  const { status, report, error, recargar } = useBiaData();
  const sentinel = useScrolled();

  const [sedeId, setSedeId] = useState(null);
  const [pedido, setPedido] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Antes de que elija, la sede que se muestra es la del problema: nadie
  // llega aqui para estudiar la que no paso nada.
  const sede = report ? (report.sedes.find(item => item.id === sedeId) ?? report.mainSede) : null;

  // La sede a la que hay que pedirle un diagnostico: la que concentra el
  // aumento. No es la que se este mirando en este momento, y por eso el
  // paso final la nombra siempre.
  const diagnostico = report ? report.mainSede : null;

  return (
    <>
      <div ref={sentinel} className="top-sentinel" aria-hidden="true" />
      <header className="top">
        <div className="top__inner">
          <h1 className="brand">Bia</h1>
          <div className="top-actions">
            <Link className="top__enlace" to="/olibia">
              Ver Olobia
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="shell">
        <main className="bia">
          {status === 'cargando' && <Cargando />}

          {status === 'error' && <Error mensaje={error} onReintentar={() => recargar()} />}

          {status === 'listo' && sede && (
            <>
              <Veredicto report={report} />
              <Sedes report={report} selected={sede.id} onSelect={setSedeId} />
              <Perfil sede={sede} />
              <Evidencia sede={sede} />
              <Paso
                sede={sede}
                diagnostico={diagnostico}
                enviado={enviado}
                onPedir={() => setPedido(true)}
              />
            </>
          )}

          <footer className="foot">
            <p>
              Datos ficticios para el ejercicio de diseño · Sin conexión a sistemas de Bia/Olibia
            </p>
            <p>
              Desarrollado con <span aria-hidden="true">💚</span>
              <span className="sr-only">amor</span> por{' '}
              <a href="https://linkedin.com/in/maoacr" target="_blank" rel="noopener noreferrer">
                @maoacr
              </a>
            </p>
            <p className="bia__estados">
              <button type="button" className="bia__estados-boton" onClick={() => recargar(true)}>
                Ver el estado de error
              </button>
            </p>
          </footer>
        </main>
      </div>

      {pedido && diagnostico && (
        <Dialogo
          sede={diagnostico}
          onConfirmar={() => {
            setEnviado(true);
            setPedido(false);
          }}
          onClose={() => setPedido(false)}
        />
      )}
    </>
  );
}

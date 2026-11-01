/**
 * Marco — cuanto hay sobre la mesa.
 *
 * No es un sexto bloque: es el denominador que los cinco descomponen.
 * "Donde me meto?" corta este total por responsable, "De donde viene el
 * valor?" lo corta por canal, y Origin incluso lo calculaba para sacar sus
 * porcentajes sin mostrarlo nunca. La pagina venia repartiendo un total que
 * no declaraba.
 *
 * Por eso va antes de los bloques y NO dentro de una tarjeta: enmarca la
 * lectura, no compite con ella. Una linea al pie lo separa de lo que
 * encabeza, y su titulo es una etiqueta estructural —chica, en mayusculas—
 * para no sonar como una sexta pregunta.
 *
 * SU CIFRA MANDA, y durante un tiempo no lo hizo. Estaba a 24-30px contra
 * los 36-52px del monto en juego de "Vamos a llegar?": el denominador de la
 * pagina entera era el numero mas chico de la pagina. El argumento escrito
 * era que dos cifras del mismo tamaño —una subconjunto de la otra, sin nada
 * que lo diga— se leen como una contradiccion. El argumento es sobre la
 * IGUALDAD y se aplico al reves: achicandola, lo que se leia era que la
 * parte vale mas que el todo. Agrandandola, la pertenencia se lee sola.
 *
 * El resto del peso sale de la estructura y no de una tarjeta: la cifra se
 * queda sola en su renglon, la unidad y el recuento bajan a una linea de pie
 * y la variacion se corre al otro extremo. Tres niveles de lectura en vez de
 * una frase corrida de punta a punta.
 *
 * LA VARIACION SI LLEVA COLOR DE SEÑAL, y durante un tiempo sostuve lo
 * contrario. El argumento escrito era que el pipeline crezca no es bueno ni
 * malo por si mismo: puede ser mas demanda o puede ser que no se cierra
 * nada. La segunda mitad de esa frase es justo lo que "Que se esta cayendo?"
 * contesta, con nombre y apellido, trescientos pixeles mas abajo. Estaba
 * protegiendo contra una ambiguedad que la pagina ya resuelve en otro lado,
 * y el precio era dejar el dato en el gris mas tenue de la escala.
 *
 * Verde cuando sube, rojo cuando baja. Los dos pares se midieron contra el
 * fondo de la pagina —la banda no tiene superficie propia— y nadie los
 * estaba midiendo ahi hasta ahora.
 *
 * VA A LA DERECHA, enfrentada a la cifra. Lo intente antes y lo descarte
 * porque, siendo una linea gris de 14px, quedaba a 900px de la cifra
 * leyendose como un dato suelto. Siendo un bloque de dos lineas con color y
 * peso propios deja de ser el pie de la cifra y pasa a ser el segundo dato
 * de la banda: ahi enfrentarlos equilibra, y repite el reparto que ya hace
 * el renglon de arriba entre la etiqueta y el selector de periodo.
 *
 * ALCANCE: periodo completo, sin filtrar. Encabeza cinco bloques que tampoco
 * responden a los filtros, y un numero que se mueve sobre cinco que no se
 * mueven enseña una relacion que no existe. El total de la vista filtrada lo
 * dice la lista, abajo, junto a los controles que lo mueven.
 *
 * La banda decia ademas "equipo completo, no cambia con los filtros". Hacia
 * falta mientras los filtros vivian en un panel propio a media pagina, que
 * parecia gobernarla entera; ahora viven dentro de la lista que recortan y el
 * alcance se lee por contencion. Sin ese texto el renglon queda con la
 * etiqueta en un extremo y el control en el otro, que es la misma forma que
 * tiene la cabecera de la lista: titulo a la izquierda, herramientas a la
 * derecha.
 *
 * Y AQUI SE ELIGE EL PERIODO. Estaba en una tira suelta arriba de esta banda,
 * junto a un boton de exportar CSV que no filtra nada. Dos controles sin
 * relacion entre si, en una franja sin titulo, encima del bloque que de
 * verdad hablaba del periodo: esta banda, que ya escribia su etiqueta
 * —"Octubre 2026"— como texto muerto.
 *
 * Asi que el texto se volvio el control. El periodo es lo unico global de la
 * pagina y se opera donde se declara, con la cifra que gobierna justo debajo:
 * cambiarlo mueve el numero que se esta mirando, en el mismo golpe de vista.
 * La cabecera del sitio no era el lugar —lleva solo la marca, a proposito, y
 * de su alto de 44px depende --header-height.
 */

import React from 'react';
import { PERIOD_IDS, periods } from './data.js';

const money = value => `$${value} M`;

/** Concordancia de numero, para no escribir "1 oportunidades". */
const plural = (count, singular, many) => `${count} ${count === 1 ? singular : many}`;

const sumValue = opportunities => opportunities.reduce((sum, o) => sum + o.value, 0);

export default function Pipeline({ period, periodId, onChangePeriod, previous, opportunities }) {
  const total = sumValue(opportunities);

  // Sin mes previo no hay variacion que mostrar: septiembre es el mas antiguo
  // que tenemos. La ausencia de comparacion no es una variacion de cero.
  const before = previous ? sumValue(previous.opportunities) : null;
  const delta = before === null ? null : total - before;

  // Un mes previo en cero tampoco da porcentaje: dividir por cero da
  // Infinity. El monto absoluto se sigue diciendo.
  const percent = before ? Math.round((delta / before) * 100) : null;

  // El año sobra cuando se nombra el mes de al lado. Se quita usando el que
  // el periodo declara, no cortando la cadena a ciegas: si el formato de la
  // etiqueta cambia, esto degrada a la etiqueta completa en vez de romperse.
  const beforeName = previous ? previous.label.replace(` ${previous.year}`, '') : '';

  const sign = delta > 0 ? '+' : '−';

  return (
    <section className="pipeline" aria-labelledby="pipeline-title">
      <header className="pipeline__head">
        <h2 className="pipeline__title" id="pipeline-title">
          Pipeline abierto
        </h2>
        {/* Sin etiqueta a la vista: el desplegable muestra "Octubre 2026", que
            es exactamente lo que una etiqueta "Periodo" iba a decir al lado.
            El nombre existe para quien no lo ve dibujado. */}
        <select
          className="pipeline__period"
          aria-label="Periodo"
          value={periodId}
          onChange={e => onChangePeriod(e.target.value)}
        >
          {PERIOD_IDS.map(id => (
            <option key={id} value={id}>
              {periods[id].label}
            </option>
          ))}
        </select>
      </header>

      <div className="pipeline__figures">
        <div className="pipeline__total">
          <p className="pipeline__figure">
            <strong>{money(total)}</strong>
          </p>
          {/* La unidad y el recuento al pie: son la letra chica de la cifra,
              no competidores suyos. */}
          <p className="pipeline__unit">
            COP mensuales en{' '}
            <strong>
              {plural(opportunities.length, 'oportunidad abierta', 'oportunidades abiertas')}
            </strong>
          </p>
        </div>

        {delta !== null && (
          <p
            className={`pipeline__delta pipeline__delta--${delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}`}
          >
            {delta === 0 ? (
              <span className="pipeline__against">Sin variación contra {beforeName}</span>
            ) : (
              <>
                <span className="pipeline__change">
                  <span className="pipeline__arrow" aria-hidden="true">
                    {delta > 0 ? '↑' : '↓'}
                  </span>
                  <strong>
                    {sign}
                    {money(Math.abs(delta))}
                  </strong>
                </span>
                <span className="pipeline__against">
                  {percent !== null && `${sign}${Math.abs(percent)} % `}vs {beforeName}
                </span>
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}

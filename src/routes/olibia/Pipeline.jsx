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
 * Su cifra es deliberadamente mas chica que la de "Vamos a llegar?". Alla
 * el monto en juego es la respuesta a una pregunta; aca es el total del que
 * ese monto es una porcion. Dos cifras del mismo tamaño, una subconjunto de
 * la otra y sin nada que lo diga, se leen como una contradiccion: en
 * septiembre serian $238 M arriba de $0 M en juego.
 *
 * La variacion contra el mes previo va SIN color de señal. Que el pipeline
 * crezca no es bueno ni malo por si mismo —puede ser mas demanda o puede ser
 * que no se cierra nada— y el acento esta reservado para lo que si pide una
 * decision. La flecha da la direccion; el juicio no es nuestro.
 *
 * ALCANCE: periodo completo, sin filtrar. Encabeza cinco bloques que tampoco
 * responden a los filtros, y un numero que se mueve sobre cinco que no se
 * mueven enseña una relacion que no existe. El total de la vista filtrada lo
 * dice el resumen, abajo, junto a los controles que lo mueven.
 */

import React from 'react';

const money = value => `$${value} M`;

/** Concordancia de numero, para no escribir "1 oportunidades". */
const plural = (count, singular, many) => `${count} ${count === 1 ? singular : many}`;

const sumValue = opportunities => opportunities.reduce((sum, o) => sum + o.value, 0);

export default function Pipeline({ period, previous, opportunities }) {
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
        <p className="pipeline__scope">
          {period.label} · equipo completo, no cambia con los filtros
        </p>
      </header>

      <div className="pipeline__figures">
        <p className="pipeline__figure">
          <strong>{money(total)}</strong>
          <span>
            COP / mes en{' '}
            {plural(opportunities.length, 'oportunidad abierta', 'oportunidades abiertas')}
          </span>
        </p>

        {delta !== null && (
          <p className="pipeline__delta">
            {delta === 0 ? (
              `Sin variación contra ${beforeName}`
            ) : (
              <>
                <span className="pipeline__arrow" aria-hidden="true">
                  {delta > 0 ? '↑' : '↓'}
                </span>
                {sign}
                {money(Math.abs(delta))}
                {percent !== null && ` (${sign}${Math.abs(percent)} %)`} vs {beforeName}
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}

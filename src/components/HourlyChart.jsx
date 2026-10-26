import {
  caminhoArea,
  caminhoSuave,
  descreverTempo,
  formatarHora,
  formatarTemperatura,
  pontosDoGrafico,
} from "../lib/weather.js";
import WeatherIcon from "./WeatherIcon.jsx";

const LARGURA = 720;
const ALTURA = 190;
const MARGEM = 28;

export default function HourlyChart({ horaria, unidade }) {
  const { pontos, minimo, maximo } = pontosDoGrafico(horaria.temperaturas, {
    largura: LARGURA,
    altura: ALTURA,
    margem: MARGEM,
  });

  if (!pontos.length) {
    return (
      <section className="card hourly-card" aria-labelledby="titulo-horas">
        <h2 id="titulo-horas">Próximas 24 horas</h2>
        <p className="empty">Sem dados horários para este local.</p>
      </section>
    );
  }

  const linha = caminhoSuave(pontos);
  const area = caminhoArea(pontos, ALTURA, MARGEM);
  const base = ALTURA - MARGEM;

  return (
    <section className="card hourly-card" aria-labelledby="titulo-horas">
      <div className="section-head">
        <div>
          <h2 id="titulo-horas">Próximas 24 horas</h2>
          <p>Variação de temperatura hora a hora.</p>
        </div>
        <p className="range">
          <span>mín. {formatarTemperatura(minimo, unidade)}</span>
          <span>máx. {formatarTemperatura(maximo, unidade)}</span>
        </p>
      </div>

      <figure className="chart">
        <figcaption className="sr-only">
          Gráfico de temperatura das próximas 24 horas, de {formatarTemperatura(minimo, unidade)} a{" "}
          {formatarTemperatura(maximo, unidade)}. A lista abaixo repete os valores em texto.
        </figcaption>

        <div className="chart-scroll">
          <svg
            viewBox={`0 0 ${LARGURA} ${ALTURA}`}
            className="chart-svg"
            role="presentation"
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="gradiente-temperatura" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map((fracao) => (
              <line
                key={fracao}
                x1={MARGEM}
                x2={LARGURA - MARGEM}
                y1={MARGEM + fracao * (base - MARGEM)}
                y2={MARGEM + fracao * (base - MARGEM)}
                className="chart-grid"
              />
            ))}

            <path d={area} fill="url(#gradiente-temperatura)" />
            <path d={linha} className="chart-line" />

            {pontos.map((ponto, indice) =>
              indice % 4 === 0 ? (
                <circle key={ponto.x} cx={ponto.x} cy={ponto.y} r="3.5" className="chart-dot" />
              ) : null
            )}
          </svg>
        </div>

        <div className="hours-scroll">
          <ul className="hours" aria-label="Temperaturas hora a hora">
            {horaria.horas.map((hora, indice) => (
              <li key={hora} className="hour">
                <span className="hour-time">{formatarHora(hora)}</span>
                <WeatherIcon codigo={horaria.codigos[indice]} tamanho={28} />
                <span className="hour-temp">
                  {formatarTemperatura(horaria.temperaturas[indice], unidade)}
                </span>
                <span className="hour-rain">
                  {Number.isFinite(horaria.chuva[indice]) ? `${horaria.chuva[indice]}%` : "—"}
                </span>
                <span className="sr-only">{descreverTempo(horaria.codigos[indice]).rotulo}</span>
              </li>
            ))}
          </ul>
        </div>
      </figure>
    </section>
  );
}

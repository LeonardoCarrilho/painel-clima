import { descreverTempo, formatarData, formatarTemperatura } from "../lib/weather.js";
import WeatherIcon from "./WeatherIcon.jsx";

export default function ForecastTable({ diaria, unidade }) {
  return (
    <section className="card forecast-card" aria-labelledby="titulo-sete-dias">
      <div className="section-head">
        <div>
          <h2 id="titulo-sete-dias">Próximos 7 dias</h2>
          <p>Máximas, mínimas e chance de chuva.</p>
        </div>
      </div>

      <div className="table-wrap" role="region" aria-label="Previsão detalhada dos próximos sete dias" tabIndex={0}>
        <table className="forecast-table">
          <caption className="sr-only">
            Previsão dos próximos sete dias, com condição, temperatura mínima, máxima e chance de
            chuva.
          </caption>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              <th scope="col">Condição</th>
              <th scope="col">Mín.</th>
              <th scope="col">Máx.</th>
              <th scope="col">Chuva</th>
            </tr>
          </thead>
          <tbody>
            {diaria.map((dia, indice) => (
              <tr key={dia.data}>
                <th scope="row">
                  <span className="day-name">
                    {indice === 0 ? "Hoje" : formatarData(dia.data, { weekday: "short" })}
                  </span>
                  <span className="day-date">
                    {formatarData(dia.data, { day: "2-digit", month: "2-digit" })}
                  </span>
                </th>
                <td>
                  <span className="condition-cell">
                    <WeatherIcon codigo={dia.codigo} tamanho={30} />
                    {descreverTempo(dia.codigo).rotulo}
                  </span>
                </td>
                <td className="numeric">{formatarTemperatura(dia.minima, unidade)}</td>
                <td className="numeric strong">{formatarTemperatura(dia.maxima, unidade)}</td>
                <td className="numeric">{Number.isFinite(dia.chuva) ? `${dia.chuva}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

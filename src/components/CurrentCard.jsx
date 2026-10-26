import {
  descreverTempo,
  direcaoVento,
  formatarHora,
  formatarTemperatura,
  formatarVento,
  nomeDoLugar,
} from "../lib/weather.js";
import WeatherIcon from "./WeatherIcon.jsx";

export default function CurrentCard({ dados, unidade, favorito, onFavoritar }) {
  const { lugar, atual } = dados;
  const condicao = descreverTempo(atual.codigo);
  const nascer = dados.diaria?.[0]?.nascer;
  const por = dados.diaria?.[0]?.por;

  return (
    <article className="card current-card" aria-labelledby="titulo-atual">
      <div className="current-head">
        <div>
          <p className="eyebrow">Agora</p>
          <h2 id="titulo-atual">{nomeDoLugar(lugar)}</h2>
          <p className="current-place">
            {[lugar.admin1 && lugar.nome !== lugar.admin1 ? lugar.admin1 : null, lugar.pais]
              .filter(Boolean)
              .join(" · ") || "Coordenadas selecionadas"}
          </p>
        </div>

        <button
          type="button"
          className="favorite-button"
          onClick={onFavoritar}
          aria-pressed={favorito}
          aria-label={
            favorito
              ? `Remover ${nomeDoLugar(lugar)} dos favoritos`
              : `Salvar ${nomeDoLugar(lugar)} nos favoritos`
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill={favorito ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 4.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 10.2l5.4-.8L12 4.5Z" />
          </svg>
          {favorito ? "Salvo" : "Salvar"}
        </button>
      </div>

      <div className="current-main">
        <WeatherIcon codigo={atual.codigo} tamanho={116} className="current-icon" />

        <div className="current-temp">
          <p className="temperature" aria-label={`${Math.round(atual.temperatura)} graus`}>
            {formatarTemperatura(atual.temperatura, unidade)}
          </p>
          <p className="condition">{condicao.rotulo}</p>
          <p className="feels">
            Sensação de {formatarTemperatura(atual.aparente, unidade)} · {atual.dia ? "dia" : "noite"}
          </p>
        </div>
      </div>

      <dl className="stats">
        <div>
          <dt>Umidade</dt>
          <dd>{Number.isFinite(atual.umidade) ? `${Math.round(atual.umidade)}%` : "—"}</dd>
        </div>
        <div>
          <dt>Vento</dt>
          <dd>
            {formatarVento(atual.vento)} {direcaoVento(atual.direcao)}
          </dd>
        </div>
        <div>
          <dt>Chuva agora</dt>
          <dd>{Number.isFinite(atual.precipitacao) ? `${atual.precipitacao} mm` : "—"}</dd>
        </div>
        <div>
          <dt>Sol</dt>
          <dd>
            {formatarHora(nascer)} — {formatarHora(por)}
          </dd>
        </div>
      </dl>

      <p className="current-footnote">
        Observado às {formatarHora(dados.atualizadoEm)} · dados da Open-Meteo
      </p>
    </article>
  );
}

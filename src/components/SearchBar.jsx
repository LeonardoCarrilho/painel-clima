import { nomeDoLugar } from "../lib/weather.js";
import { chaveDoLugar } from "../lib/storage.js";

export default function SearchBar({
  termo,
  onTermoChange,
  onSubmit,
  buscando,
  sugestoes,
  onEscolher,
  onGeolocalizar,
  localizando,
  erro,
  favoritos,
  lugarAtual,
  onRemoverFavorito,
}) {
  const chaveAtual = lugarAtual ? chaveDoLugar(lugarAtual) : "";

  return (
    <section className="card search-card" aria-labelledby="titulo-busca">
      <div className="section-head">
        <div>
          <h2 id="titulo-busca">Onde você está?</h2>
          <p>Busque uma cidade ou use a sua localização atual.</p>
        </div>
      </div>

      <form className="search-form" role="search" onSubmit={onSubmit}>
        <label htmlFor="cidade">Cidade</label>
        <div className="search-row">
          <input
            id="cidade"
            name="cidade"
            type="search"
            autoComplete="off"
            placeholder="São Paulo, Lisboa, Tóquio…"
            value={termo}
            onChange={(evento) => onTermoChange(evento.target.value)}
            aria-describedby="busca-ajuda"
          />
          <button className="btn btn-primary" type="submit" disabled={buscando}>
            {buscando ? "Buscando…" : "Buscar"}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={onGeolocalizar}
            disabled={localizando}
            aria-label="Usar minha localização atual"
          >
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3.4" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            {localizando ? "Localizando…" : "Minha localização"}
          </button>
        </div>
        <small id="busca-ajuda">
          A busca usa a base da Open-Meteo e não precisa de cadastro. A previsão é atualizada a cada
          consulta.
        </small>
      </form>

      {erro ? (
        <p className="field-error" role="alert">
          {erro}
        </p>
      ) : null}

      {sugestoes.length > 0 ? (
        <div className="suggestions">
          <h3>Resultados</h3>
          <ul>
            {sugestoes.map((lugar) => (
              <li key={lugar.id ?? chaveDoLugar(lugar)}>
                <button type="button" onClick={() => onEscolher(lugar)}>
                  <span className="suggestion-name">{lugar.nome}</span>
                  <span className="suggestion-meta">
                    {[lugar.admin1, lugar.pais].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="favorites">
        <div className="favorites-head">
          <h3>Favoritos</h3>
          <span>{favoritos.length} de 6</span>
        </div>

        {favoritos.length === 0 ? (
          <p className="empty-inline">
            Nenhuma cidade salva. Use <strong>Salvar</strong> no cartão do clima para criar atalhos.
          </p>
        ) : (
          <ul className="favorite-list">
            {favoritos.map((lugar) => {
              const ativo = chaveDoLugar(lugar) === chaveAtual;
              return (
                <li key={chaveDoLugar(lugar)} className={ativo ? "active" : ""}>
                  <button
                    type="button"
                    className="favorite-pick"
                    onClick={() => onEscolher(lugar)}
                    aria-current={ativo ? "true" : undefined}
                  >
                    {nomeDoLugar(lugar)}
                  </button>
                  <button
                    type="button"
                    className="favorite-remove"
                    onClick={() => onRemoverFavorito(lugar)}
                    aria-label={`Remover ${nomeDoLugar(lugar)} dos favoritos`}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

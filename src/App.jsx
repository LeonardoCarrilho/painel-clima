import { useEffect, useRef, useState } from "react";
import { buscarCidades, buscarPrevisao } from "./api/openMeteo.js";
import CurrentCard from "./components/CurrentCard.jsx";
import ForecastTable from "./components/ForecastTable.jsx";
import HourlyChart from "./components/HourlyChart.jsx";
import SearchBar from "./components/SearchBar.jsx";
import UnitToggle from "./components/UnitToggle.jsx";
import { CIDADES_PADRAO, formatarHora } from "./lib/weather.js";
import {
  alternarFavorito,
  chaveDoLugar,
  lerCache,
  lerFavoritos,
  lerUltimoLugar,
  lerUnidade,
  salvarCache,
  salvarFavoritos,
  salvarUltimoLugar,
  salvarUnidade,
} from "./lib/storage.js";

export default function App() {
  const [unidade, setUnidade] = useState("C");
  const [favoritos, setFavoritos] = useState([]);
  const [dados, setDados] = useState(null);
  const [consulta, setConsulta] = useState(null);
  const [status, setStatus] = useState("iniciando");
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [termo, setTermo] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState(null);
  const [localizando, setLocalizando] = useState(false);
  const sequencia = useRef(0);

  /* Preferências e última previsão salvas ---------------------------------- */
  useEffect(() => {
    setUnidade(lerUnidade());
    setFavoritos(lerFavoritos());

    const cache = lerCache();
    if (cache?.dados) setDados(cache.dados);

    const lugarInicial = lerUltimoLugar() ?? cache?.dados?.lugar ?? CIDADES_PADRAO;
    sequencia.current += 1;
    setConsulta({ lugar: lugarInicial, id: sequencia.current });
  }, []);

  /* Busca da previsão a cada consulta ------------------------------------- */
  useEffect(() => {
    if (!consulta) return undefined;

    const controlador = new AbortController();
    setStatus("carregando");
    setErro(null);

    buscarPrevisao(consulta.lugar, { sinal: controlador.signal })
      .then((previsao) => {
        if (controlador.signal.aborted) return;
        setDados(previsao);
        setStatus("pronto");
        setAviso(null);
        salvarCache(previsao);
        salvarUltimoLugar(previsao.lugar);
      })
      .catch((falha) => {
        if (controlador.signal.aborted) return;

        const cache = lerCache();
        const mesmaCidade =
          cache?.dados?.lugar &&
          chaveDoLugar(cache.dados.lugar) === chaveDoLugar(consulta.lugar);

        if (mesmaCidade) {
          setDados(cache.dados);
          setStatus("pronto");
          setAviso("Sem conexão com a Open-Meteo: exibindo a última previsão salva neste navegador.");
        } else {
          setStatus("erro");
          setErro(falha.message);
        }
      });

    return () => controlador.abort();
  }, [consulta]);

  /* Ações ------------------------------------------------------------------ */

  function irPara(lugar) {
    sequencia.current += 1;
    setConsulta({ lugar, id: sequencia.current });
    setSugestoes([]);
    setTermo("");
    setErroBusca(null);
  }

  async function buscar(evento) {
    evento.preventDefault();
    const termoLimpo = termo.trim();

    if (termoLimpo.length < 2) {
      setErroBusca("Digite pelo menos 2 letras para buscar uma cidade.");
      return;
    }

    setBuscando(true);
    setErroBusca(null);
    setSugestoes([]);

    try {
      const cidades = await buscarCidades(termoLimpo);

      if (!cidades.length) {
        setErroBusca(`Nenhuma cidade encontrada para “${termoLimpo}”. Tente outro nome.`);
      } else if (cidades.length === 1) {
        irPara(cidades[0]);
      } else {
        setSugestoes(cidades);
      }
    } catch (falha) {
      setErroBusca(falha.message);
    } finally {
      setBuscando(false);
    }
  }

  function geolocalizar() {
    if (!navigator.geolocation) {
      setErroBusca("Seu navegador não oferece localização. Busque a cidade pelo nome.");
      return;
    }

    setLocalizando(true);
    setErroBusca(null);

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setLocalizando(false);
        irPara({
          nome: "Minha localização",
          admin1: "",
          pais: "",
          latitude: Number(posicao.coords.latitude.toFixed(4)),
          longitude: Number(posicao.coords.longitude.toFixed(4)),
          timezone: "auto",
        });
      },
      () => {
        setLocalizando(false);
        setErroBusca(
          "Não foi possível obter sua localização. Verifique a permissão do navegador ou busque pelo nome."
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 }
    );
  }

  function favoritar() {
    if (!dados?.lugar) return;

    const lista = alternarFavorito(favoritos, dados.lugar);
    const adicionou = lista.length > favoritos.length;

    setFavoritos(lista);
    salvarFavoritos(lista);
    setMensagem(
      adicionou
        ? `${dados.lugar.nome} salvo nos favoritos.`
        : `${dados.lugar.nome} removido dos favoritos.`
    );
  }

  function removerFavorito(lugar) {
    const lista = favoritos.filter(
      (item) => chaveDoLugar(item) !== chaveDoLugar(lugar)
    );
    setFavoritos(lista);
    salvarFavoritos(lista);
    setMensagem(`${lugar.nome} removido dos favoritos.`);
  }

  function trocarUnidade(nova) {
    setUnidade(nova);
    salvarUnidade(nova);
    setMensagem(`Temperaturas em graus ${nova === "C" ? "Celsius" : "Fahrenheit"}.`);
  }

  function atualizar() {
    const lugar = dados?.lugar ?? consulta?.lugar ?? CIDADES_PADRAO;
    sequencia.current += 1;
    setConsulta({ lugar, id: sequencia.current });
  }

  const favoritoAtual = Boolean(
    dados?.lugar && favoritos.some((item) => chaveDoLugar(item) === chaveDoLugar(dados.lugar))
  );
  const carregando = status === "carregando" || status === "iniciando";

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className="site-header">
        <div className="wrap header-inner">
          <a className="brand" href="./" aria-label="Painel Clima — início">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="13" cy="13" r="4.4" />
                <path d="M13 4v2.4M13 19.6V22M4 13h2.4M19.6 13H22M6.6 6.6l1.7 1.7M17.7 17.7l1.7 1.7M19.4 6.6l-1.7 1.7M8.3 17.7l-1.7 1.7" />
                <path d="M17 25h8a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-9.9 1.4A3 3 0 0 0 17 25Z" />
              </svg>
            </span>
            <span className="brand-text">
              <strong>Painel Clima</strong>
              <small>previsão sem excesso</small>
            </span>
          </a>

          <div className="header-actions">
            <UnitToggle unidade={unidade} onChange={trocarUnidade} />
            <button
              type="button"
              className="btn btn-small btn-ghost refresh"
              onClick={atualizar}
              disabled={carregando}
              data-carregando={carregando}
              aria-label="Atualizar previsão"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 3v6h-6" />
              </svg>
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      <main id="conteudo">
        <section className="wrap hero">
          <p className="eyebrow">Open-Meteo · sem chave de API</p>
          <h1>O clima da sua rotina em uma tela.</h1>
          <p className="hero-lead">
            Temperatura agora, próximas 24 horas e sete dias de previsão — com favoritos,
            Celsius ou Fahrenheit e um cache que segura a última consulta quando a internet cai.
          </p>
          {dados?.atualizadoEm ? (
            <p className="hero-meta">
              Atualizado às {formatarHora(dados.atualizadoEm)}
              <span aria-hidden="true"> · </span>
              <a href="https://open-meteo.com/" rel="noopener">
                fonte Open-Meteo
              </a>
            </p>
          ) : null}
        </section>

        <div className="wrap stack">
          <SearchBar
            termo={termo}
            onTermoChange={setTermo}
            onSubmit={buscar}
            buscando={buscando}
            sugestoes={sugestoes}
            onEscolher={irPara}
            onGeolocalizar={geolocalizar}
            localizando={localizando}
            erro={erroBusca}
            favoritos={favoritos}
            lugarAtual={dados?.lugar}
            onRemoverFavorito={removerFavorito}
          />

          {aviso ? (
            <p className="notice" role="status">
              {aviso}
            </p>
          ) : null}

          {status === "erro" && !dados ? (
            <div className="card error-card" role="alert">
              <h2>Não foi possível carregar a previsão</h2>
              <p>{erro ?? "Tente novamente em instantes."}</p>
              <button type="button" className="btn btn-primary" onClick={atualizar}>
                Tentar novamente
              </button>
            </div>
          ) : null}

          {!dados && carregando ? (
            <div className="skeleton-grid" aria-busy="true" aria-label="Carregando previsão">
              <div className="card skeleton skeleton-main" />
              <div className="card skeleton skeleton-chart" />
            </div>
          ) : null}

          {dados ? (
            <>
              <CurrentCard
                dados={dados}
                unidade={unidade}
                favorito={favoritoAtual}
                onFavoritar={favoritar}
              />

              <HourlyChart horaria={dados.horaria} unidade={unidade} />

              <ForecastTable diaria={dados.diaria} unidade={unidade} />
            </>
          ) : null}

          <section className="about" aria-labelledby="titulo-sobre">
            <h2 id="titulo-sobre">Como este painel funciona</h2>
            <div className="about-grid">
              <article>
                <h3>Dados abertos</h3>
                <p>
                  Geocodificação e previsão vêm da Open-Meteo, que é pública e não exige chave. O
                  navegador conversa direto com a API, sem back-end intermediário.
                </p>
              </article>
              <article>
                <h3>Cache consciente</h3>
                <p>
                  A última previsão fica salva por 30 minutos. Se a API falhar, o painel mostra o
                  dado salvo com um aviso — nunca finge que é uma leitura ao vivo.
                </p>
              </article>
              <article>
                <h3>Acessível por padrão</h3>
                <p>
                  Tabela com cabeçalhos, lista de horários em texto, foco visível, contraste alto e
                  respeito a <code>prefers-reduced-motion</code>.
                </p>
              </article>
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <p>
            Feito por{" "}
            <a href="https://github.com/LeonardoCarrilho" rel="noopener">
              Leonardo Carrilho
            </a>{" "}
            · React, Vite e Open-Meteo.
          </p>
          <p className="muted">Previsão informativa; não substitui alertas oficiais da Defesa Civil.</p>
        </div>
      </footer>

      <p className="sr-only" role="status" aria-live="polite">
        {mensagem}
      </p>
    </>
  );
}

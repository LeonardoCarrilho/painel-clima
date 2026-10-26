import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "vitest";

import CurrentCard from "../src/components/CurrentCard.jsx";
import ForecastTable from "../src/components/ForecastTable.jsx";
import HourlyChart from "../src/components/HourlyChart.jsx";
import SearchBar from "../src/components/SearchBar.jsx";
import WeatherIcon from "../src/components/WeatherIcon.jsx";
import { criarDadosNormalizados } from "./helpers.js";

const dados = criarDadosNormalizados();

describe("CurrentCard", () => {
  it("mostra cidade, temperatura e condição em Celsius", () => {
    const html = renderToStaticMarkup(
      <CurrentCard dados={dados} unidade="C" favorito={false} onFavoritar={() => {}} />
    );

    assert.match(html, /São Paulo/);
    assert.match(html, /26°/);
    assert.match(html, /Parcialmente nublado/);
    assert.match(html, /Sensação de 27°/);
    assert.match(html, /64%/);
    assert.match(html, /SE/);
    assert.match(html, /05h/);
    assert.match(html, /Salvar/);
    assert.match(html, /aria-pressed="false"/);
  });

  it("converte para Fahrenheit e reflete o estado de favorito", () => {
    const html = renderToStaticMarkup(
      <CurrentCard dados={dados} unidade="F" favorito onFavoritar={() => {}} />
    );

    assert.match(html, /80°/);
    assert.match(html, /aria-pressed="true"/);
    assert.match(html, /Salvo/);
    assert.match(html, /Remover São Paulo dos favoritos/);
  });
});

describe("ForecastTable", () => {
  it("renderiza sete linhas com cabeçalhos acessíveis", () => {
    const html = renderToStaticMarkup(<ForecastTable diaria={dados.diaria} unidade="C" />);

    assert.equal((html.match(/scope="row"/g) ?? []).length, 7);
    assert.match(html, /<caption class="sr-only">/);
    assert.match(html, /scope="col"/);
    assert.match(html, /Hoje/);
    assert.match(html, /26\/10/);
    assert.match(html, /Mín\./);
    assert.match(html, /Máx\./);
    assert.match(html, /Chuva/);
  });

  it("exibe a condição de cada dia", () => {
    const html = renderToStaticMarkup(<ForecastTable diaria={dados.diaria} unidade="F" />);
    assert.match(html, /Céu limpo/);
    assert.match(html, /Pancadas de chuva fracas/);
    assert.match(html, /Tempestade/);
  });
});

describe("HourlyChart", () => {
  it("desenha a linha e repete os dados em lista textual", () => {
    const html = renderToStaticMarkup(
      <HourlyChart horaria={dados.horaria} unidade="C" />
    );

    assert.equal((html.match(/class="hour"/g) ?? []).length, 24);
    assert.match(html, /Próximas 24 horas/);
    assert.match(html, /mín\./);
    assert.match(html, /máx\./);
    assert.match(html, /14h/);
    assert.match(html, /aria-label="Temperaturas hora a hora"/);
    assert.match(html, /class="chart-line"/);
    assert.ok(html.includes('aria-hidden="true"'));
  });

  it("mostra estado vazio quando não há horas", () => {
    const html = renderToStaticMarkup(
      <HourlyChart
        horaria={{ horas: [], temperaturas: [], chuva: [], codigos: [] }}
        unidade="C"
      />
    );

    assert.match(html, /Sem dados horários/);
  });
});

describe("SearchBar", () => {
  const lugar = {
    nome: "São Paulo",
    admin1: "SP",
    pais: "Brasil",
    latitude: -23.5475,
    longitude: -46.6361,
  };

  it("lista sugestões e favoritos com estado ativo", () => {
    const html = renderToStaticMarkup(
      <SearchBar
        termo="São"
        onTermoChange={() => {}}
        onSubmit={() => {}}
        buscando={false}
        sugestoes={[lugar]}
        onEscolher={() => {}}
        onGeolocalizar={() => {}}
        localizando={false}
        erro={null}
        favoritos={[lugar, { ...lugar, nome: "Lisboa", latitude: 38.7, longitude: -9.1 }]}
        lugarAtual={lugar}
        onRemoverFavorito={() => {}}
      />
    );

    assert.match(html, /Resultados/);
    assert.match(html, /aria-current="true"/);
    assert.match(html, /São Paulo, SP/);
    assert.match(html, /Lisboa/);
    assert.match(html, /aria-label="Remover São Paulo, SP dos favoritos"/);
    assert.match(html, /Minha localização/);
  });

  it("mostra erro e estado vazio de favoritos", () => {
    const html = renderToStaticMarkup(
      <SearchBar
        termo=""
        onTermoChange={() => {}}
        onSubmit={() => {}}
        buscando
        sugestoes={[]}
        onEscolher={() => {}}
        onGeolocalizar={() => {}}
        localizando={false}
        erro="Nenhuma cidade encontrada."
        favoritos={[]}
        lugarAtual={null}
        onRemoverFavorito={() => {}}
      />
    );

    assert.match(html, /role="alert"/);
    assert.match(html, /Nenhuma cidade encontrada/);
    assert.match(html, /Nenhuma cidade salva/);
    assert.match(html, /Buscando…/);
  });
});

describe("WeatherIcon", () => {
  it("expõe o grupo visual e fica oculto para leitores de tela", () => {
    const html = renderToStaticMarkup(<WeatherIcon codigo={61} />);
    assert.match(html, /data-grupo="rain"/);
    assert.match(html, /aria-hidden="true"/);
  });
});

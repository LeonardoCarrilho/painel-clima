import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { buscarCidades, buscarPrevisao } from "../src/api/openMeteo.js";
import { criarRespostaApi } from "./helpers.js";

function fetchFalso(json, { ok = true, status = 200, erro = null } = {}) {
  const chamadas = [];

  const implementacao = async (url, opcoes) => {
    chamadas.push({ url, opcoes });
    if (erro) throw erro;
    return { ok, status, json: async () => json };
  };

  return { implementacao, chamadas };
}

describe("buscarCidades", () => {
  it("monta a URL codificada e normaliza os resultados", async () => {
    const { implementacao, chamadas } = fetchFalso({
      results: [
        {
          id: 3448439,
          name: "São Paulo",
          admin1: "São Paulo",
          country: "Brasil",
          latitude: -23.5475,
          longitude: -46.6361,
          timezone: "America/Sao_Paulo",
        },
        {
          id: 1,
          name: "Sem coordenadas",
          latitude: null,
          longitude: null,
        },
      ],
    });

    const cidades = await buscarCidades("São Paulo", { fetchImpl: implementacao });

    assert.equal(cidades.length, 1);
    assert.deepEqual(cidades[0], {
      id: 3448439,
      nome: "São Paulo",
      admin1: "São Paulo",
      pais: "Brasil",
      latitude: -23.5475,
      longitude: -46.6361,
      timezone: "America/Sao_Paulo",
    });

    assert.match(chamadas[0].url, /name=S%C3%A3o%20Paulo/);
    assert.match(chamadas[0].url, /count=5/);
    assert.match(chamadas[0].url, /language=pt/);
  });

  it("devolve lista vazia quando a API não encontra nada", async () => {
    const { implementacao } = fetchFalso({});
    assert.deepEqual(await buscarCidades("Xyzabc", { fetchImpl: implementacao }), []);
  });

  it("exige pelo menos duas letras", async () => {
    await assert.rejects(() => buscarCidades("a"), /pelo menos 2 letras/);
    await assert.rejects(() => buscarCidades("   "), /pelo menos 2 letras/);
  });

  it("converte falha de HTTP e de rede em mensagem amigável", async () => {
    const http = fetchFalso({}, { ok: false, status: 503 });
    await assert.rejects(
      () => buscarCidades("Lisboa", { fetchImpl: http.implementacao }),
      /Não foi possível buscar cidades/
    );

    const rede = fetchFalso({}, { erro: new TypeError("Failed to fetch") });
    await assert.rejects(
      () => buscarCidades("Lisboa", { fetchImpl: rede.implementacao }),
      /Não foi possível buscar cidades/
    );
  });
});

describe("buscarPrevisao", () => {
  it("normaliza atual, 24 horas e 7 dias", async () => {
    const { implementacao, chamadas } = fetchFalso(criarRespostaApi());

    const previsao = await buscarPrevisao(
      {
        nome: "São Paulo",
        admin1: "São Paulo",
        pais: "Brasil",
        latitude: -23.5475,
        longitude: -46.6361,
      },
      { fetchImpl: implementacao }
    );

    assert.equal(previsao.atual.temperatura, 26.4);
    assert.equal(previsao.atual.codigo, 2);
    assert.equal(previsao.atual.dia, true);
    assert.equal(previsao.atual.umidade, 64);
    assert.equal(previsao.horaria.horas.length, 24);
    assert.equal(previsao.horaria.horas[0], "2026-10-26T14:00");    assert.equal(previsao.horaria.temperaturas.length, 24);
    assert.equal(previsao.diaria.length, 7);
    assert.equal(previsao.diaria[0].data, "2026-10-26");
    assert.equal(previsao.diaria[0].nascer, "2026-10-26T05:32");
    assert.equal(previsao.lugar.nome, "São Paulo");
    assert.equal(previsao.atualizadoEm, "2026-10-26T14:30");

    const url = chamadas[0].url;
    assert.match(url, /latitude=-23.5475/);
    assert.match(url, /longitude=-46.6361/);
    assert.match(url, /forecast_days=7/);
    assert.match(url, /timezone=auto/);
    assert.match(url, /current=temperature_2m/);
  });

  it("usa o lugar padrão quando só recebe coordenadas", async () => {
    const { implementacao } = fetchFalso(criarRespostaApi());
    const previsao = await buscarPrevisao({ latitude: -23.5, longitude: -46.6 }, {
      fetchImpl: implementacao,
    });

    assert.equal(previsao.lugar.nome, "São Paulo");
  });

  it("recusa coordenadas inválidas", async () => {
    await assert.rejects(
      () => buscarPrevisao({ latitude: "x", longitude: "y" }),
      /Coordenadas inválidas/
    );
  });

  it("recusa resposta incompleta", async () => {
    const { implementacao } = fetchFalso({ current: null });
    await assert.rejects(
      () => buscarPrevisao({ latitude: 1, longitude: 2 }, { fetchImpl: implementacao }),
      /incompleta/
    );
  });

  it("converte falha de rede em mensagem amigável", async () => {
    const { implementacao } = fetchFalso({}, { erro: new TypeError("offline") });
    await assert.rejects(
      () => buscarPrevisao({ latitude: 1, longitude: 2 }, { fetchImpl: implementacao }),
      /Não foi possível carregar a previsão/
    );
  });
});

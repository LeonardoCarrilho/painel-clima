import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  CHAVES,
  LIMITE_FAVORITOS,
  VALIDADE_CACHE_MS,
  alternarFavorito,
  cacheValido,
  chaveDoLugar,
  lerCache,
  lerFavoritos,
  lerJson,
  lerUltimoLugar,
  lerUnidade,
  lugarValido,
  obterArmazenamento,
  salvarCache,
  salvarFavoritos,
  salvarJson,
  salvarUltimoLugar,
  salvarUnidade,
} from "../src/lib/storage.js";

class Memoria {
  constructor() {
    this.mapa = new Map();
  }

  getItem(chave) {
    return this.mapa.has(chave) ? this.mapa.get(chave) : null;
  }

  setItem(chave, valor) {
    this.mapa.set(chave, String(valor));
  }

  removeItem(chave) {
    this.mapa.delete(chave);
  }
}

class Bloqueado extends Memoria {
  getItem() {
    throw new Error("acesso negado");
  }

  setItem() {
    throw new Error("cota excedida");
  }
}

const lugar = (nome, latitude, longitude) => ({
  nome,
  admin1: "SP",
  pais: "Brasil",
  latitude,
  longitude,
});

describe("JSON no armazenamento", () => {
  it("salva, lê e devolve o padrão quando a chave não existe", () => {
    const armazenamento = new Memoria();

    assert.equal(lerJson("nao-existe", "padrão", armazenamento), "padrão");
    assert.equal(salvarJson("chave", { a: 1 }, armazenamento), true);
    assert.deepEqual(lerJson("chave", null, armazenamento), { a: 1 });
  });

  it("tolera JSON corrompido e armazenamento que lança erro", () => {
    const armazenamento = new Memoria();
    armazenamento.setItem("quebrado", "{não é json");

    assert.equal(lerJson("quebrado", [], armazenamento) instanceof Array, true);
    assert.deepEqual(lerJson("quebrado", [], new Bloqueado()), []);
    assert.equal(salvarJson("chave", 1, new Bloqueado()), false);
  });

  it("funciona sem localStorage", () => {
    const disponivel = obterArmazenamento();
    assert.ok(disponivel === null || typeof disponivel.getItem === "function");
    assert.equal(lerJson(CHAVES.unidade, "C", null), "C");
    assert.equal(lerUnidade(null), "C");
    assert.equal(salvarUnidade("F", null), false);
  });
});

describe("unidade", () => {
  it("persiste C e F e normaliza valores desconhecidos", () => {
    const armazenamento = new Memoria();

    assert.equal(lerUnidade(armazenamento), "C");
    assert.equal(salvarUnidade("F", armazenamento), true);
    assert.equal(lerUnidade(armazenamento), "F");

    salvarJson(CHAVES.unidade, "Kelvin", armazenamento);
    assert.equal(lerUnidade(armazenamento), "C");
  });
});

describe("favoritos", () => {
  it("valida o formato de um lugar", () => {
    assert.equal(lugarValido(lugar("São Paulo", -23.5, -46.6)), true);
    assert.equal(lugarValido({ nome: "Sem coordenadas" }), false);
    assert.equal(lugarValido({ latitude: 1, longitude: 2 }), false);
    assert.equal(lugarValido(null), false);
  });

  it("usa coordenadas como chave estável", () => {
    assert.equal(chaveDoLugar(lugar("A", -23.54751, -46.63611)), "-23.548,-46.636");
    assert.equal(chaveDoLugar(null), "");
  });

  it("adiciona, remove e não muta a lista original", () => {
    const original = [lugar("São Paulo", -23.5, -46.6)];
    const comLisboa = alternarFavorito(original, lugar("Lisboa", 38.7, -9.1));

    assert.equal(original.length, 1);
    assert.equal(comLisboa.length, 2);
    assert.equal(comLisboa[0].nome, "Lisboa");

    const semLisboa = alternarFavorito(comLisboa, lugar("Lisboa", 38.7, -9.1));
    assert.deepEqual(
      semLisboa.map((item) => item.nome),
      ["São Paulo"]
    );
  });

  it("ignora lugar inválido e limita a seis itens", () => {
    const base = [lugar("A", 1, 1)];

    assert.deepEqual(alternarFavorito(base, null), base);

    const muitos = Array.from({ length: 10 }, (_, indice) => lugar(`C${indice}`, indice, indice));
    const armazenamento = new Memoria();

    assert.equal(salvarFavoritos(muitos, armazenamento), true);
    assert.equal(lerFavoritos(armazenamento).length, LIMITE_FAVORITOS);
  });

  it("descarta itens corrompidos ao ler", () => {
    const armazenamento = new Memoria();
    salvarJson(CHAVES.favoritos, [lugar("Boa", 1, 2), { nome: "Ruim" }, "texto"], armazenamento);

    assert.deepEqual(
      lerFavoritos(armazenamento).map((item) => item.nome),
      ["Boa"]
    );
  });

  it("lê lista vazia quando o valor não é array", () => {
    const armazenamento = new Memoria();
    salvarJson(CHAVES.favoritos, { nome: "x" }, armazenamento);
    assert.deepEqual(lerFavoritos(armazenamento), []);
  });
});

describe("último lugar", () => {
  it("persiste apenas lugares válidos", () => {
    const armazenamento = new Memoria();

    assert.equal(lerUltimoLugar(armazenamento), null);
    assert.equal(salvarUltimoLugar({ nome: "Inválido" }, armazenamento), false);
    assert.equal(salvarUltimoLugar(lugar("Recife", -8.05, -34.9), armazenamento), true);
    assert.equal(lerUltimoLugar(armazenamento).nome, "Recife");
  });
});

describe("cache", () => {
  const agora = 1_800_000_000_000;

  it("considera válido apenas dentro de 30 minutos", () => {
    assert.equal(cacheValido(agora, agora), true);
    assert.equal(cacheValido(agora - VALIDADE_CACHE_MS + 1, agora), true);
    assert.equal(cacheValido(agora - VALIDADE_CACHE_MS, agora), false);
    assert.equal(cacheValido(agora + 1000, agora), false);
    assert.equal(cacheValido("ontem", agora), false);
  });

  it("salva e recupera a previsão com o horário do registro", () => {
    const armazenamento = new Memoria();
    const dados = { lugar: lugar("São Paulo", -23.5, -46.6), atual: { temperatura: 25 } };

    assert.equal(salvarCache(dados, armazenamento, agora), true);

    const cache = lerCache(armazenamento, agora + 5 * 60_000);
    assert.equal(cache.dados.atual.temperatura, 25);
    assert.equal(cache.salvoEm, agora);

    assert.equal(lerCache(armazenamento, agora + 60 * 60_000), null);
  });

  it("ignora cache inexistente ou corrompido", () => {
    const armazenamento = new Memoria();

    assert.equal(lerCache(armazenamento, agora), null);

    salvarJson(CHAVES.cache, { salvoEm: agora, dados: null }, armazenamento);
    assert.equal(lerCache(armazenamento, agora), null);

    salvarJson(CHAVES.cache, "texto", armazenamento);
    assert.equal(lerCache(armazenamento, agora), null);
  });
});

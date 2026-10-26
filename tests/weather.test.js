import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  caminhoArea,
  caminhoSuave,
  converterTemperatura,
  descreverTempo,
  direcaoVento,
  formatarData,
  formatarHora,
  formatarTemperatura,
  formatarVento,
  grupoTempo,
  nomeDoLugar,
  pontosDoGrafico,
  proximasHoras,
} from "../src/lib/weather.js";

describe("descrição do tempo", () => {
  it("traduz códigos WMO conhecidos", () => {
    assert.equal(descreverTempo(0).rotulo, "Céu limpo");
    assert.equal(descreverTempo(2).rotulo, "Parcialmente nublado");
    assert.equal(descreverTempo(95).rotulo, "Tempestade");
    assert.equal(grupoTempo(61), "rain");
    assert.equal(grupoTempo(71), "snow");
  });

  it("tem fallback para códigos desconhecidos", () => {
    const desconhecido = descreverTempo(1234);
    assert.equal(descreverTempo(undefined).rotulo, "Condição desconhecida");
    assert.equal(descreverTempo("texto").grupo, "cloudy");
    assert.equal(descreverTempo(1234), desconhecido);
  });
});

describe("temperatura", () => {
  it("converte entre Celsius e Fahrenheit", () => {
    assert.equal(converterTemperatura(0, "C", "F"), 32);
    assert.equal(converterTemperatura(100, "C", "F"), 212);
    assert.equal(converterTemperatura(32, "F", "C"), 0);
    assert.equal(converterTemperatura(25, "C", "C"), 25);
  });

  it("devolve NaN para valores inválidos", () => {
    assert.ok(Number.isNaN(converterTemperatura("abc")));
    assert.ok(Number.isNaN(converterTemperatura(null)));
  });

  it("formata arredondando e respeitando a unidade", () => {
    assert.equal(formatarTemperatura(26.4, "C"), "26°");
    assert.equal(formatarTemperatura(26.4, "F"), "80°");
    assert.equal(formatarTemperatura("x"), "—");
  });

  it("formata vento com precisão adequada", () => {
    assert.equal(formatarVento(12.34), "12 km/h");
    assert.equal(formatarVento(3.47), "3,5 km/h");
    assert.equal(formatarVento(null), "—");
  });
});

describe("direção do vento", () => {
  it("mapeia graus para a rosa dos ventos em português", () => {
    assert.equal(direcaoVento(0), "N");
    assert.equal(direcaoVento(45), "NE");
    assert.equal(direcaoVento(90), "L");
    assert.equal(direcaoVento(135), "SE");
    assert.equal(direcaoVento(180), "S");
    assert.equal(direcaoVento(225), "SO");
    assert.equal(direcaoVento(270), "O");
    assert.equal(direcaoVento(315), "NO");
  });

  it("normaliza valores negativos e acima de 360", () => {
    assert.equal(direcaoVento(360), "N");
    assert.equal(direcaoVento(-90), "O");
    assert.equal(direcaoVento(450), "L");
    assert.equal(direcaoVento("abc"), "—");
  });
});

describe("datas", () => {
  it("formata sem deslocamento de fuso", () => {
    assert.equal(formatarData("2026-10-26", { day: "2-digit", month: "2-digit" }), "26/10");
    assert.equal(formatarData("2026-10-26", { weekday: "short" }).replace(".", ""), "seg");
    assert.equal(formatarData("", { day: "2-digit" }), "—");
  });

  it("formata a hora local", () => {
    assert.equal(formatarHora("2026-10-26T14:00"), "14h");
    assert.equal(formatarHora("2026-10-26T05:00"), "05h");
    assert.equal(formatarHora("2026-01-01T23:00"), "23h");
    assert.equal(formatarHora("ruim"), "—");
    assert.equal(formatarHora(null), "—");
  });
});

describe("nome do lugar", () => {
  it("junta cidade e estado, ignorando vazios", () => {
    assert.equal(nomeDoLugar({ nome: "São Paulo", admin1: "SP" }), "São Paulo, SP");
    assert.equal(nomeDoLugar({ nome: "São Paulo", admin1: "São Paulo" }), "São Paulo");
    assert.equal(nomeDoLugar({ nome: "Lisboa" }), "Lisboa");
    assert.equal(nomeDoLugar(null), "Local desconhecido");
  });
});

describe("próximas horas", () => {
  const horaria = {
    horas: ["2026-10-26T12:00", "2026-10-26T13:00", "2026-10-26T14:00", "2026-10-26T15:00"],
    temperaturas: [20, 21, 22, 23],
    chuva: [10, 20, 30, 40],
    codigos: [0, 1, 2, 3],
  };

  it("começa na hora atual e mantém as séries alinhadas", () => {
    const recorte = proximasHoras(horaria, "2026-10-26T14:00", 2);
    assert.deepEqual(recorte.horas, ["2026-10-26T14:00", "2026-10-26T15:00"]);
    assert.deepEqual(recorte.temperaturas, [22, 23]);
    assert.deepEqual(recorte.chuva, [30, 40]);
    assert.deepEqual(recorte.codigos, [2, 3]);
  });

  it("usa o início quando a hora não existe na série", () => {
    const recorte = proximasHoras(horaria, "2020-01-01T00:00", 3);
    assert.equal(recorte.horas.length, 3);
    assert.equal(recorte.horas[0], "2026-10-26T12:00");
  });

  it("alinha quando a hora atual tem minutos", () => {
    const recorte = proximasHoras(horaria, "2026-10-26T14:30", 2);
    assert.deepEqual(recorte.horas, ["2026-10-26T14:00", "2026-10-26T15:00"]);
    assert.deepEqual(recorte.temperaturas, [22, 23]);
  });

  it("não quebra com dados ausentes", () => {
    assert.deepEqual(proximasHoras(null, null), {
      horas: [],
      temperaturas: [],
      chuva: [],
      codigos: [],
    });
  });
});

describe("geometria do gráfico", () => {
  it("distribui os pontos nas margens e no topo/fundo", () => {
    const { pontos, minimo, maximo } = pontosDoGrafico([10, 20, 30], {
      largura: 100,
      altura: 100,
      margem: 10,
    });

    assert.equal(minimo, 10);
    assert.equal(maximo, 30);
    assert.equal(pontos.length, 3);
    assert.deepEqual(pontos[0], { x: 10, y: 90, valor: 10 });
    assert.deepEqual(pontos[1], { x: 50, y: 50, valor: 20 });
    assert.deepEqual(pontos[2], { x: 90, y: 10, valor: 30 });
  });

  it("trata temperaturas iguais e listas vazias", () => {
    const { pontos } = pontosDoGrafico([20, 20]);
    assert.ok(pontos.every((ponto) => Number.isFinite(ponto.y)));

    assert.deepEqual(pontosDoGrafico([]), { pontos: [], minimo: 0, maximo: 0 });
    assert.deepEqual(pontosDoGrafico(["x", null]), { pontos: [], minimo: 0, maximo: 0 });
  });

  it("constrói um caminho suave com uma curva por segmento", () => {
    const { pontos } = pontosDoGrafico([10, 15, 12, 20]);
    const caminho = caminhoSuave(pontos);

    assert.ok(caminho.startsWith("M "));
    assert.equal((caminho.match(/C /g) ?? []).length, 3);
    assert.equal(caminhoSuave([]), "");
    assert.equal(caminhoSuave([{ x: 1, y: 2 }]), "M 1 2");
  });

  it("fecha a área na base do gráfico", () => {
    const { pontos } = pontosDoGrafico([10, 20], { largura: 100, altura: 100, margem: 10 });
    const area = caminhoArea(pontos, 100, 10);

    assert.ok(area.endsWith("L 10 90 Z"));
    assert.equal(caminhoArea([]), "");
  });
});

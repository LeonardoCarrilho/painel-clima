/**
 * Regras puras de clima: descrição dos códigos WMO, conversão de unidades,
 * direção do vento, formatação de datas e geometria do gráfico.
 *
 * Nada aqui toca no DOM ou em `fetch`, o que permite testar tudo no Node.
 */

export const CIDADES_PADRAO = {
  nome: "São Paulo",
  admin1: "São Paulo",
  pais: "Brasil",
  latitude: -23.5475,
  longitude: -46.6361,
  timezone: "America/Sao_Paulo",
};

const DESCRICOES = {
  0: { rotulo: "Céu limpo", grupo: "clear" },
  1: { rotulo: "Predomínio de sol", grupo: "partly" },
  2: { rotulo: "Parcialmente nublado", grupo: "partly" },
  3: { rotulo: "Nublado", grupo: "cloudy" },
  45: { rotulo: "Neblina", grupo: "fog" },
  48: { rotulo: "Neblina com geada", grupo: "fog" },
  51: { rotulo: "Garoa fraca", grupo: "drizzle" },
  53: { rotulo: "Garoa moderada", grupo: "drizzle" },
  55: { rotulo: "Garoa intensa", grupo: "drizzle" },
  56: { rotulo: "Garoa congelante fraca", grupo: "drizzle" },
  57: { rotulo: "Garoa congelante intensa", grupo: "drizzle" },
  61: { rotulo: "Chuva fraca", grupo: "rain" },
  63: { rotulo: "Chuva moderada", grupo: "rain" },
  65: { rotulo: "Chuva forte", grupo: "rain" },
  66: { rotulo: "Chuva congelante fraca", grupo: "rain" },
  67: { rotulo: "Chuva congelante forte", grupo: "rain" },
  71: { rotulo: "Neve fraca", grupo: "snow" },
  73: { rotulo: "Neve moderada", grupo: "snow" },
  75: { rotulo: "Neve forte", grupo: "snow" },
  77: { rotulo: "Grãos de neve", grupo: "snow" },
  80: { rotulo: "Pancadas de chuva fracas", grupo: "rain" },
  81: { rotulo: "Pancadas de chuva moderadas", grupo: "rain" },
  82: { rotulo: "Pancadas de chuva fortes", grupo: "rain" },
  85: { rotulo: "Pancadas de neve fracas", grupo: "snow" },
  86: { rotulo: "Pancadas de neve fortes", grupo: "snow" },
  95: { rotulo: "Tempestade", grupo: "storm" },
  96: { rotulo: "Tempestade com granizo", grupo: "storm" },
  99: { rotulo: "Tempestade forte com granizo", grupo: "storm" },
};

/** Descreve um código WMO, com fallback seguro. */
const DESCONHECIDO = { rotulo: "Condição desconhecida", grupo: "cloudy" };

export function descreverTempo(codigo) {
  return DESCRICOES[Number(codigo)] ?? DESCONHECIDO;
}

/** Grupo visual usado pelo ícone (clear, partly, cloudy, fog, drizzle, rain, snow, storm). */
export function grupoTempo(codigo) {
  return descreverTempo(codigo).grupo;
}

/** Converte entre Celsius e Fahrenheit. */
export function converterTemperatura(valor, de = "C", para = "C") {
  if (valor === null || valor === undefined || valor === "") return Number.NaN;

  const numero = Number(valor);
  if (!Number.isFinite(numero)) return Number.NaN;
  if (de === para) return numero;
  return de === "C" ? (numero * 9) / 5 + 32 : ((numero - 32) * 5) / 9;
}

/** Formata "22" como "22°" (ou "72°" em Fahrenheit). */
export function formatarTemperatura(valor, unidade = "C") {
  const convertida = converterTemperatura(valor, "C", unidade);
  if (!Number.isFinite(convertida)) return "—";
  return `${Math.round(convertida)}°`;
}

/** Velocidade do vento com uma casa quando necessário. */
export function formatarVento(kmh, unidade = "km/h") {
  if (kmh === null || kmh === undefined || kmh === "") return "—";

  const numero = Number(kmh);
  if (!Number.isFinite(numero)) return "—";
  const valor = numero >= 10 ? Math.round(numero) : Math.round(numero * 10) / 10;
  return `${valor.toLocaleString("pt-BR")} ${unidade}`;
}

const DIRECOES = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];

/** Converte graus (0 = norte) na rosa dos ventos de 8 pontos em português. */
export function direcaoVento(graus) {
  const numero = Number(graus);
  if (!Number.isFinite(numero)) return "—";
  const normalizado = ((numero % 360) + 360) % 360;
  return DIRECOES[Math.round(normalizado / 45) % 8];
}

/** Data ISO (AAAA-MM-DD) em texto curto, sem deslocamento de fuso. */
export function formatarData(iso, opcoes = { weekday: "short", day: "2-digit" }) {
  if (!iso) return "—";
  const data = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(data.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", opcoes).format(data);
}

/**
 * Hora "2026-10-26T14:00" como "14h".
 *
 * A Open-Meteo devolve horários no fuso do lugar consultado, então lemos a
 * hora direto do texto: converter para `Date` aplicaria o fuso do navegador e
 * mostraria a hora errada ao consultar outra cidade.
 */
export function formatarHora(iso) {
  if (!iso) return "—";
  const hora = String(iso).slice(11, 13);
  return /^\d{2}$/.test(hora) ? `${hora}h` : "—";
}

/** Nome legível de um lugar: "São Paulo, SP". */
export function nomeDoLugar(lugar) {
  if (!lugar) return "Local desconhecido";
  const estado = lugar.admin1 && lugar.admin1 !== lugar.nome ? lugar.admin1 : null;
  const partes = [lugar.nome, estado].filter(Boolean);
  return partes.join(", ");
}

/** Recorta as próximas `quantidade` horas a partir da hora atual informada. */
export function proximasHoras(horaria, horaAtual, quantidade = 24) {
  const horas = horaria?.horas ?? [];
  const temperaturas = horaria?.temperaturas ?? [];
  const chuva = horaria?.chuva ?? [];
  const codigos = horaria?.codigos ?? [];

  // A previsão horária vem em horas cheias, mas `current.time` pode ter
  // minutos (ex.: 14:15). Comparamos apenas até a hora para achar o índice.
  const alvo = String(horaAtual ?? "").slice(0, 13);
  let indice = alvo
    ? horas.findIndex((hora) => String(hora).slice(0, 13) === alvo)
    : -1;

  if (alvo && indice < 0) {
    indice = horas.findIndex((hora) => String(hora) >= alvo);
  }

  const inicio = Math.max(0, indice);
  const fim = Math.min(horas.length, inicio + quantidade);

  return {
    horas: horas.slice(inicio, fim),
    temperaturas: temperaturas.slice(inicio, fim),
    chuva: chuva.slice(inicio, fim),
    codigos: codigos.slice(inicio, fim),
  };
}

/**
 * Converte temperaturas em coordenadas SVG.
 * Valores iguais (ou lista vazia) não quebram a divisão por zero.
 */
export function pontosDoGrafico(valores, { largura = 720, altura = 180, margem = 26 } = {}) {
  const numeros = (valores ?? [])
    .filter((valor) => valor !== null && valor !== undefined && valor !== "")
    .map(Number)
    .filter((valor) => Number.isFinite(valor));

  if (!numeros.length) return { pontos: [], minimo: 0, maximo: 0 };

  const minimo = Math.min(...numeros);
  const maximo = Math.max(...numeros);
  const amplitude = maximo - minimo || 1;
  const util = largura - margem * 2;
  const passo = numeros.length > 1 ? util / (numeros.length - 1) : 0;

  return {
    minimo,
    maximo,
    pontos: numeros.map((valor, indice) => ({
      x: Number((margem + indice * passo).toFixed(2)),
      y: Number(
        (altura - margem - ((valor - minimo) / amplitude) * (altura - margem * 2)).toFixed(2)
      ),
      valor,
    })),
  };
}

/** Caminho SVG suavizado (Catmull-Rom convertido em curvas cúbicas). */
export function caminhoSuave(pontos) {
  if (!pontos?.length) return "";
  if (pontos.length === 1) return `M ${pontos[0].x} ${pontos[0].y}`;

  let caminho = `M ${pontos[0].x} ${pontos[0].y}`;

  for (let indice = 0; indice < pontos.length - 1; indice += 1) {
    const anterior = pontos[indice - 1] ?? pontos[indice];
    const atual = pontos[indice];
    const proximo = pontos[indice + 1];
    const depois = pontos[indice + 2] ?? proximo;

    const controle1x = atual.x + (proximo.x - anterior.x) / 6;
    const controle1y = atual.y + (proximo.y - anterior.y) / 6;
    const controle2x = proximo.x - (depois.x - atual.x) / 6;
    const controle2y = proximo.y - (depois.y - atual.y) / 6;

    caminho += ` C ${controle1x.toFixed(2)} ${controle1y.toFixed(2)}, ${controle2x.toFixed(
      2
    )} ${controle2y.toFixed(2)}, ${proximo.x} ${proximo.y}`;
  }

  return caminho;
}

/** Área fechada sob a linha, para o preenchimento do gráfico. */
export function caminhoArea(pontos, altura = 180, margem = 26) {
  if (!pontos?.length) return "";
  const base = altura - margem;
  const fim = pontos.at(-1).x;
  return `${caminhoSuave(pontos)} L ${fim} ${base} L ${pontos[0].x} ${base} Z`;
}

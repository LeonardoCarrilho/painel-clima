/**
 * Cliente da Open-Meteo (https://open-meteo.com), que não exige chave.
 *
 * - Geocoding: https://geocoding-api.open-meteo.com/v1/search
 * - Previsão:  https://api.open-meteo.com/v1/forecast
 *
 * As funções recebem `fetchImpl` para que os testes usem um fetch falso.
 */

import { CIDADES_PADRAO, proximasHoras } from "../lib/weather.js";

const URL_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search";
const URL_PREVISAO = "https://api.open-meteo.com/v1/forecast";

const CAMPOS_ATUAIS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "is_day",
  "precipitation",
  "weather_code",
  "wind_speed_10m",
  "wind_direction_10m",
].join(",");

const CAMPOS_HORARIOS = ["temperature_2m", "precipitation_probability", "weather_code"].join(",");

const CAMPOS_DIARIOS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
  "sunrise",
  "sunset",
].join(",");

async function obterJson(url, { fetchImpl = fetch, sinal } = {}) {
  const resposta = await fetchImpl(url, { signal: sinal, headers: { accept: "application/json" } });

  if (!resposta.ok) {
    throw new Error(`A Open-Meteo respondeu com HTTP ${resposta.status}.`);
  }

  return resposta.json();
}

/** Busca cidades pelo nome. Devolve no máximo 5 resultados normalizados. */
export async function buscarCidades(nome, opcoes = {}) {
  const termo = String(nome ?? "").trim();

  if (termo.length < 2) {
    throw new Error("Digite pelo menos 2 letras para buscar uma cidade.");
  }

  const url = `${URL_GEOCODING}?name=${encodeURIComponent(
    termo
  )}&count=5&language=pt&format=json`;

  let json;
  try {
    json = await obterJson(url, opcoes);
  } catch (erro) {
    if (erro.name === "AbortError") throw erro;
    throw new Error("Não foi possível buscar cidades agora. Tente novamente.");
  }

  const resultados = Array.isArray(json?.results) ? json.results : [];

  return resultados
    .filter(
      (item) =>
        typeof item?.name === "string" &&
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude)
    )
    .map((item) => ({
      id: item.id ?? `${item.latitude},${item.longitude}`,
      nome: item.name,
      admin1: item.admin1 ?? "",
      pais: item.country ?? "",
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone ?? "auto",
    }));
}

/** Previsão completa para um lugar (formato já normalizado para a interface). */
export async function buscarPrevisao(lugar, opcoes = {}) {
  const local = {
    ...CIDADES_PADRAO,
    ...lugar,
  };

  if (!Number.isFinite(Number(local.latitude)) || !Number.isFinite(Number(local.longitude))) {
    throw new Error("Coordenadas inválidas para consultar a previsão.");
  }

  const parametros = new URLSearchParams({
    latitude: String(local.latitude),
    longitude: String(local.longitude),
    current: CAMPOS_ATUAIS,
    hourly: CAMPOS_HORARIOS,
    daily: CAMPOS_DIARIOS,
    timezone: "auto",
    forecast_days: "7",
  });

  let json;
  try {
    json = await obterJson(`${URL_PREVISAO}?${parametros}`, opcoes);
  } catch (erro) {
    if (erro.name === "AbortError") throw erro;
    throw new Error("Não foi possível carregar a previsão. Verifique a conexão.");
  }

  if (!json?.current || !Array.isArray(json?.hourly?.time) || !Array.isArray(json?.daily?.time)) {
    throw new Error("A previsão recebida está incompleta.");
  }

  const horaria = proximasHoras(
    {
      horas: json.hourly.time,
      temperaturas: json.hourly.temperature_2m,
      chuva: json.hourly.precipitation_probability,
      codigos: json.hourly.weather_code,
    },
    json.current.time
  );

  const diaria = json.daily.time.map((data, indice) => ({
    data,
    codigo: json.daily.weather_code?.[indice] ?? 0,
    maxima: json.daily.temperature_2m_max?.[indice] ?? null,
    minima: json.daily.temperature_2m_min?.[indice] ?? null,
    chuva: json.daily.precipitation_probability_max?.[indice] ?? 0,
    nascer: json.daily.sunrise?.[indice] ?? null,
    por: json.daily.sunset?.[indice] ?? null,
  }));

  return {
    lugar: {
      nome: local.nome,
      admin1: local.admin1 ?? "",
      pais: local.pais ?? "",
      latitude: Number(local.latitude),
      longitude: Number(local.longitude),
      timezone: json.timezone ?? local.timezone,
    },
    atual: {
      hora: json.current.time,
      temperatura: json.current.temperature_2m,
      aparente: json.current.apparent_temperature,
      umidade: json.current.relative_humidity_2m,
      precipitacao: json.current.precipitation,
      codigo: json.current.weather_code,
      vento: json.current.wind_speed_10m,
      direcao: json.current.wind_direction_10m,
      dia: json.current.is_day === 1,
    },
    horaria,
    diaria: diaria.slice(0, 7),
    atualizadoEm: json.current.time,
  };
}

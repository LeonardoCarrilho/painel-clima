const doisDigitos = (numero) => String(numero).padStart(2, "0");

function isoLocal(data) {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(
    data.getDate()
  )}T${doisDigitos(data.getHours())}:00`;
}

/** Resposta crua da Open-Meteo, com 48 horas e 7 dias. */
export function criarRespostaApi() {
  const inicio = new Date(2026, 9, 26, 0, 0, 0);

  const horas = Array.from({ length: 48 }, (_, indice) => {
    const data = new Date(inicio);
    data.setHours(data.getHours() + indice);
    return isoLocal(data);
  });

  const dias = Array.from({ length: 7 }, (_, indice) => {
    const data = new Date(2026, 9, 26 + indice, 12, 0, 0);
    return {
      data: `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(
        data.getDate()
      )}`,
      codigo: [0, 2, 61, 3, 80, 95, 1][indice],
    };
  });

  return {
    latitude: -23.55,
    longitude: -46.63,
    timezone: "America/Sao_Paulo",
    current: {
      // A API devolve minutos no horário atual, mas a série horária é cheia.
      time: "2026-10-26T14:30",
      temperature_2m: 26.4,
      relative_humidity_2m: 64,
      apparent_temperature: 27.1,
      is_day: 1,
      precipitation: 0,
      weather_code: 2,
      wind_speed_10m: 12.3,
      wind_direction_10m: 135,
    },
    hourly: {
      time: horas,
      temperature_2m: horas.map((_, indice) => 18 + indice * 0.35),
      precipitation_probability: horas.map((_, indice) => (indice * 7) % 100),
      weather_code: horas.map((_, indice) => (indice % 5 === 0 ? 61 : 2)),
    },
    daily: {
      time: dias.map((dia) => dia.data),
      weather_code: dias.map((dia) => dia.codigo),
      temperature_2m_max: dias.map((_, indice) => 24 + indice),
      temperature_2m_min: dias.map((_, indice) => 15 + indice * 0.5),
      precipitation_probability_max: dias.map((_, indice) => 20 + indice * 10),
      sunrise: dias.map((dia) => `${dia.data}T05:32`),
      sunset: dias.map((dia) => `${dia.data}T18:41`),
    },
  };
}

/** Objeto já normalizado, usado nos testes de componentes. */
export function criarDadosNormalizados() {
  const temperaturas = Array.from({ length: 24 }, (_, indice) => 20 + indice * 0.4);

  const horas = Array.from({ length: 24 }, (_, indice) => {
    const data = new Date(2026, 9, 26, 14, 0, 0);
    data.setHours(data.getHours() + indice);
    return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(
      data.getDate()
    )}T${doisDigitos(data.getHours())}:00`;
  });

  const diaria = Array.from({ length: 7 }, (_, indice) => {
    const data = new Date(2026, 9, 26, 12, 0, 0);
    data.setDate(data.getDate() + indice);

    return {
      data: `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(
        data.getDate()
      )}`,
      codigo: [0, 2, 61, 3, 80, 95, 1][indice],
      maxima: 24 + indice,
      minima: 15 + indice,
      chuva: 20 + indice * 10,
      nascer: "2026-10-26T05:32",
      por: "2026-10-26T18:41",
    };
  });

  return {
    lugar: {
      nome: "São Paulo",
      admin1: "São Paulo",
      pais: "Brasil",
      latitude: -23.5475,
      longitude: -46.6361,
      timezone: "America/Sao_Paulo",
    },
    atual: {
      hora: "2026-10-26T14:00",
      temperatura: 26.4,
      aparente: 27.1,
      umidade: 64,
      precipitacao: 0,
      codigo: 2,
      vento: 12.3,
      direcao: 135,
      dia: true,
    },
    horaria: {
      horas,
      temperaturas,
      chuva: temperaturas.map((_, indice) => (indice * 5) % 100),
      codigos: temperaturas.map((_, indice) => (indice % 4 === 0 ? 61 : 2)),
    },
    diaria,
    atualizadoEm: "2026-10-26T14:00",
  };
}

/**
 * Persistência local com chaves versionadas e tolerância a falhas.
 * O armazenamento é injetável para permitir testes sem navegador.
 */

export const CHAVES = {
  unidade: "painel-clima:unidade:v1",
  favoritos: "painel-clima:favoritos:v1",
  cache: "painel-clima:cache:v1",
  ultimoLugar: "painel-clima:ultimo-lugar:v1",
};

export const LIMITE_FAVORITOS = 6;
export const VALIDADE_CACHE_MS = 30 * 60 * 1000;

/** `localStorage` quando disponível; `null` em SSR, testes ou modo restrito. */
export function obterArmazenamento() {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function lerJson(chave, padrao, armazenamento = obterArmazenamento()) {
  if (!armazenamento) return padrao;
  try {
    const bruto = armazenamento.getItem(chave);
    return bruto === null ? padrao : JSON.parse(bruto);
  } catch {
    return padrao;
  }
}

export function salvarJson(chave, valor, armazenamento = obterArmazenamento()) {
  if (!armazenamento) return false;
  try {
    armazenamento.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function removerChave(chave, armazenamento = obterArmazenamento()) {
  if (!armazenamento) return false;
  try {
    armazenamento.removeItem(chave);
    return true;
  } catch {
    return false;
  }
}

/** Chave estável por coordenada (3 casas ≈ 100 m), independente do nome. */
export function chaveDoLugar(lugar) {
  if (!lugar) return "";
  return `${Number(lugar.latitude).toFixed(3)},${Number(lugar.longitude).toFixed(3)}`;
}

/** Garante que um objeto vindo do storage tem o formato mínimo de lugar. */
export function lugarValido(lugar) {
  return Boolean(
    lugar &&
      typeof lugar.nome === "string" &&
      Number.isFinite(Number(lugar.latitude)) &&
      Number.isFinite(Number(lugar.longitude))
  );
}

export function lerUnidade(armazenamento = obterArmazenamento()) {
  const valor = lerJson(CHAVES.unidade, "C", armazenamento);
  return valor === "F" ? "F" : "C";
}

export function salvarUnidade(unidade, armazenamento = obterArmazenamento()) {
  return salvarJson(CHAVES.unidade, unidade === "F" ? "F" : "C", armazenamento);
}

export function lerFavoritos(armazenamento = obterArmazenamento()) {
  const lista = lerJson(CHAVES.favoritos, [], armazenamento);
  if (!Array.isArray(lista)) return [];
  return lista.filter(lugarValido).slice(0, LIMITE_FAVORITOS);
}

export function salvarFavoritos(lista, armazenamento = obterArmazenamento()) {
  return salvarJson(
    CHAVES.favoritos,
    (lista ?? []).filter(lugarValido).slice(0, LIMITE_FAVORITOS),
    armazenamento
  );
}

/**
 * Adiciona ou remove um lugar da lista, sem duplicar coordenadas.
 * Devolve uma nova lista (não muta a original).
 */
export function alternarFavorito(lista, lugar) {
  const atuais = (lista ?? []).filter(lugarValido);
  if (!lugarValido(lugar)) return atuais;

  const chave = chaveDoLugar(lugar);
  const existe = atuais.some((item) => chaveDoLugar(item) === chave);

  if (existe) {
    return atuais.filter((item) => chaveDoLugar(item) !== chave);
  }

  return [lugar, ...atuais].slice(0, LIMITE_FAVORITOS);
}

export function lerUltimoLugar(armazenamento = obterArmazenamento()) {
  const lugar = lerJson(CHAVES.ultimoLugar, null, armazenamento);
  return lugarValido(lugar) ? lugar : null;
}

export function salvarUltimoLugar(lugar, armazenamento = obterArmazenamento()) {
  return lugarValido(lugar) ? salvarJson(CHAVES.ultimoLugar, lugar, armazenamento) : false;
}

/** Cache só é considerado válido dentro de 30 minutos. */
export function cacheValido(salvoEm, agora = Date.now()) {
  const instante = Number(salvoEm);
  if (!Number.isFinite(instante)) return false;
  const idade = agora - instante;
  return idade >= 0 && idade < VALIDADE_CACHE_MS;
}

export function lerCache(armazenamento = obterArmazenamento(), agora = Date.now()) {
  const cache = lerJson(CHAVES.cache, null, armazenamento);
  if (!cache || !cacheValido(cache.salvoEm, agora) || !cache.dados) return null;
  return cache;
}

export function salvarCache(dados, armazenamento = obterArmazenamento(), agora = Date.now()) {
  return salvarJson(CHAVES.cache, { salvoEm: agora, dados }, armazenamento);
}

import { grupoTempo } from "../lib/weather.js";

const SOL = (
  <>
    <circle cx="24" cy="24" r="7.5" />
    <path d="M24 4v4M24 40v4M4 24h4M40 24h4M9.9 9.9l2.8 2.8M35.3 35.3l2.8 2.8M38.1 9.9l-2.8 2.8M12.7 35.3l-2.8 2.8" />
  </>
);

const NUVEM = <path d="M14 32h20a7 7 0 0 0 .6-14A10 10 0 0 0 15 20a6 6 0 0 0-1 12Z" />;

const GOTAS = (
  <>
    <path d="M18 37l-1.5 5M26 37l-1.5 5M34 37l-1.5 5" />
  </>
);

const FLOCOS = (
  <>
    <path d="M18 38v6M15.5 40l5 2M20.5 40l-5 2M30 38v6M27.5 40l5 2M32.5 40l-5 2" />
  </>
);

/** Ícone vetorial da condição, baseado no grupo do código WMO. */
export default function WeatherIcon({ codigo, tamanho = 48, className = "" }) {
  const grupo = grupoTempo(codigo);

  return (
    <svg
      className={`weather-icon ${className}`.trim()}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-grupo={grupo}
    >
      {grupo === "clear" && SOL}
      {grupo === "partly" && (
        <>
          <circle cx="31" cy="17" r="5.5" />
          <path d="M31 5v3M31 26v0M20 17h3M41 17h3M23.2 9.2l2.1 2.1M38.8 21.8l2.1 2.1M38.8 12.2l-2.1 2.1" />
          {NUVEM}
        </>
      )}
      {grupo === "cloudy" && (
        <>
          <path d="M10 22h21a5.5 5.5 0 0 0 .4-11A8 8 0 0 0 17 13a4.5 4.5 0 0 0-7 9Z" />
          {NUVEM}
        </>
      )}
      {grupo === "fog" && (
        <>
          {NUVEM}
          <path d="M12 39h24M16 44h18" />
        </>
      )}
      {grupo === "drizzle" && (
        <>
          {NUVEM}
          <path d="M18 37l-1 4M26 37l-1 4M34 37l-1 4" />
        </>
      )}
      {grupo === "rain" && (
        <>
          {NUVEM}
          {GOTAS}
        </>
      )}
      {grupo === "snow" && (
        <>
          {NUVEM}
          {FLOCOS}
        </>
      )}
      {grupo === "storm" && (
        <>
          {NUVEM}
          <path d="M25 34l-5 8h7l-3 6 9-10h-6l3-4" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

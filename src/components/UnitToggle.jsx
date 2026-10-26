export default function UnitToggle({ unidade, onChange }) {
  return (
    <div className="unit-toggle" role="group" aria-label="Unidade de temperatura">
      {["C", "F"].map((valor) => (
        <button
          key={valor}
          type="button"
          onClick={() => onChange(valor)}
          aria-pressed={unidade === valor}
          aria-label={valor === "C" ? "Celsius" : "Fahrenheit"}
        >
          °{valor}
        </button>
      ))}
    </div>
  );
}

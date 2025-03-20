import React from "react";

function NumberControl({ label, value, onChange, min, max }) {
  return (
    <div className="number-control">
      <span>{label}:</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      />
    </div>
  );
}

export default NumberControl;

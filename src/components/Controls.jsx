import React from "react";

function Controls({ buttons }) {
  return (
    <div className="controls-container">
      <div className="controls">
        {buttons.map((button, index) => (
          <button
            key={index}
            onClick={button.action}
            disabled={button.disabled}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Controls;

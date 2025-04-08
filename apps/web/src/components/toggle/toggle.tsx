import { useState } from 'react';
import './toggle.styles.css';

interface ToggleProps {
  initialState?: boolean;
  onChange?: (isOn: boolean) => void;
  label?: string;
}

export const Toggle = ({ initialState = false, onChange, label }: ToggleProps) => {
  const [isOn, setIsOn] = useState(initialState);

  const handleToggle = () => {
    const newState = !isOn;
    setIsOn(newState);
    if (onChange) {
      onChange(newState);
    }
  };

  return (
    <div className="toggle-button-cover">
      {label && <span className="toggle-label">{label}</span>}
      <div className="button r" id="button-3">
        <input
          type="checkbox"
          className="checkbox"
          checked={isOn}
          onChange={handleToggle}
        />
        <div className="knobs"></div>
        <div className="layer"></div>
      </div>
    </div>
  );
};

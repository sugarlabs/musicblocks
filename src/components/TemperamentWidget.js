import React, { useState, useEffect } from 'react';
import { getTemperamentNotes } from '../utils/temperamentUtils';

const TemperamentWidget = () => {
  const [temperamentNotes, setTemperamentNotes] = useState([]);
  const [currentTemperament, setCurrentTemperament] = useState('12EDO');

  useEffect(() => {
    const notes = getTemperamentNotes(currentTemperament);
    setTemperamentNotes(notes);
  }, [currentTemperament]);

  const handleTemperamentChange = (temperament) => {
    setCurrentTemperament(temperament);
  };

  return (
    <div>
      <select value={currentTemperament} onChange={(e) => handleTemperamentChange(e.target.value)}>
        <option value='12EDO'>12EDO</option>
        <option value='justIntonation'>Just Intonation</option>
        <option value='pythagorean'>Pythagorean</option>
      </select>
      <ul>
        {temperamentNotes.map((note, index) => (
          <li key={index}>{note}</li>
        ))}
      </ul>
    </div>
  );
};

export default TemperamentWidget;
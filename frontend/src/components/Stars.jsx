import { useState } from "react";

export default function Stars({ value=0, onChange=()=>{} }) {
  const [hover, setHover] = useState(0);
  const S = [1,2,3,4,5];
  return (
    <div>
      {S.map(n => (
        <span
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ cursor: "pointer", fontSize: 20, marginRight: 4 }}
          title={`${n} star${n>1?'s':''}`}
        >
          {(hover || value) >= n ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

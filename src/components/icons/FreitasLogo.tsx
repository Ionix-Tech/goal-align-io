export const FreitasLogo = ({ className = "h-12 w-12" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Seção Magenta (0-120°) */}
      {[0, 15, 30, 45, 60, 75, 90, 105, 120].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <circle
            key={`magenta-${i}`}
            cx={50 + 40 * Math.cos(rad - Math.PI / 2)}
            cy={50 + 40 * Math.sin(rad - Math.PI / 2)}
            r="3"
            fill="#E91E63"
            opacity={1 - i * 0.08}
          />
        );
      })}
      
      {/* Seção Laranja (120-240°) */}
      {[120, 135, 150, 165, 180, 195, 210, 225, 240].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <circle
            key={`orange-${i}`}
            cx={50 + 40 * Math.cos(rad - Math.PI / 2)}
            cy={50 + 40 * Math.sin(rad - Math.PI / 2)}
            r="3"
            fill="#FF6F00"
            opacity={1 - i * 0.08}
          />
        );
      })}
      
      {/* Seção Amarelo (240-360°) */}
      {[240, 255, 270, 285, 300, 315, 330, 345, 360].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <circle
            key={`yellow-${i}`}
            cx={50 + 40 * Math.cos(rad - Math.PI / 2)}
            cy={50 + 40 * Math.sin(rad - Math.PI / 2)}
            r="3"
            fill="#FFC107"
            opacity={1 - i * 0.08}
          />
        );
      })}
    </svg>
  );
};

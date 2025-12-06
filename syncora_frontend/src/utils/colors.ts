// src/utils/colors.ts
export function getConsistentBgColor(id: string, opacity: number = 0.25): string {
  const colors = [
    [255, 99, 132],   
    [54, 162, 235],   
    [255, 206, 86],   
    [75, 192, 192],   
    [153, 102, 255],  
    [255, 159, 64],   
    [100, 181, 246],  
    [174, 213, 129],  
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  const color = colors[Math.abs(hash) % colors.length];
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
}

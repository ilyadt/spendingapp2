
export function randomSoftRGB(): number {
  const rand = () => Math.floor(100 + Math.random() * 120); // 100–219

  const r = rand();
  const g = rand();
  const b = rand();

  return (r << 16) | (g << 8) | b;
}

export function colorFromReceiptId(rId: number): number {
  return rId & 0xff_ff_ff
}


export const genRandInt = () => Math.floor(Math.random() * 1e15)

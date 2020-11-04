
export default function step(from, to, step) {
  const diff = to - from;
  const count = Math.ceil(diff / step);
  let curr = from;
  let result = []
  for (let i = 0; i <= count; i++) {
    result.push(curr);
    curr += step
  }

  return result;
}
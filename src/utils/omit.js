export function omit(obj, keys = []) {
  keys.forEach((k) => {
    delete obj[k];
  });

  return obj;
}

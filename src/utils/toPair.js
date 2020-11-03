const toPair = (points) => {
  let result = [];
  let pair = [];
  points.forEach((p, i) => {
    pair.push(parseInt(p, 10));
    if (i % 2 === 1) {
      result.push(pair);
      pair = [];
    }
  });

  return result;
};

export default toPair;

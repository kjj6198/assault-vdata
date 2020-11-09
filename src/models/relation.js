export default class Relation {
  constructor(data) {
    const keywords = ["年份", "年齡層"];
    const res = {};

    data.forEach((d) => {
      const result = {};
      Object.keys(d).forEach((key) => {
        if (!keywords.includes(key)) {
          result[key] = parseInt(d[key].replace(",", ""), 10);
        }
      });

      Object.assign(res, {
        [d["年齡層"]]: result,
      });
    });

    this.data = res;
  }

  getTotalFor(relationship) {
    let sum = 0;

    Object.keys(this.data).forEach((k) => (sum += this.data[k][relationship]));

    return sum;
  }

  getProbabilityFor(name) {
    let totalSum = 0;
    let targetSum = 0;

    Object.keys(this.data).forEach((k) => {
      totalSum += this.data[k]["總計"];
      targetSum += this.data[k][name];
    });

    return targetSum / totalSum;
  }

  // return
  // [relation, number]
  getRanking() {
    const relations = [
      "配偶",
      "前配偶",
      "直系親屬",
      "旁系親屬",
      "家人的朋友",
      "未婚夫/妻",
      "男/女朋友",
      "前男/女朋友",
      "普通朋友",
      "同事",
      "同學",
      "網友",
      "客戶關係",
      "上司/下屬",
      "師生關係",
      "鄰居",
      "不認識",
    ];

    const ranking = {};
    relations.forEach((relation) => (ranking[relation] = 0));

    Object.keys(this.data).forEach((k) => {
      const data = this.data[k];

      relations.forEach((relation) => {
        ranking[relation] += data[relation];
      });
    });

    return Object.keys(ranking)
      .map((relation) => {
        return [relation, ranking[relation]];
      })
      .sort((a, b) => b[1] - a[1]);
  }
}

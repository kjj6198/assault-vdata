<script>
  import omit from "lodash/omit";
  import ByPlaceChart from "./ByPlaceChart.svelte";
  import CaseByCityChart from "./CaseByCityChart.svelte";
  import place from "./place";
  import PlaceChart from "./PlaceChart.svelte";
  import RelationshipChart from "./RelationshipChart.svelte";
  import Section from "./Section.svelte";
  import SexualCaseMap from "./SexualCaseMap.svelte";
  import YearSwitch from "./YearSwitch.svelte";
  let currentYear = 2018;

  $: data = place.find((p) => p["年份"] === currentYear.toString());
</script>

<style>
  .container {
    position: relative;
    max-width: 1080px;
    width: 90%;
    margin: 0 auto;
  }

  .block {
    display: inline-block;
    width: 30px;
    height: 30px;
  }
</style>

<main class="App">
  <Section
    title="台灣性侵害事件統計"
    description="台灣有多少性侵害案件，其中又有哪些驚人的數據？我們一起來看看統計資料！"
    num={1}>
    <ByPlaceChart />
  </Section>

  <Section
    title="受害者年齡與兩造關係統計"
    description="接下來來看看，性侵案件的年齡分佈與被害、加害者的關係統計"
    num={2}>
    <RelationshipChart />
    <p>
      從統計圖可發現，被害與加害者關係主要來自於男女朋友，其次為同學、網友，再來是直系與旁系血親。
    </p>
    <p>
      從圖中還可以發現，被害族群年齡大多集中在 12 ~ 18 歲，其次為 18 ~ 24
      歲，適逢求學期與青春期。
    </p>
  </Section>

  <Section
    title="性侵害案件與台灣各大縣市分佈"
    description="將性侵害案件用縣市作劃分，觀察性侵害案件的多寡。點擊地圖中的縣市區域查看詳細的性侵害案件統計。顏色越深代表案件數越多。"
    num={3}>
    <SexualCaseMap />
    <p>
      從圖表上可發現，性侵害案件大多集中在直轄市，包含新北市、台中市、台南市、高雄市，其中以新北市居第一，下圖的統計圖表可查看更多。
    </p>
  </Section>

  <Section num={4} title="縣市分析" description="Test">
    <CaseByCityChart />
  </Section>
</main>

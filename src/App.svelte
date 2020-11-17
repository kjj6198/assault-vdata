<script>
  import BackgroundImage from "./BackgroundImage.svelte";
  import ByPlaceChart from "./ByPlaceChart.svelte";
  import RelationshipChart from "./RelationshipChart.svelte";
  import Section from "./Section.svelte";
  import SexualCaseMap from "./SexualCaseMap.svelte";
</script>

<style>
  .hero {
    position: relative;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .bannerTitle {
    color: var(--main);
    text-shadow: 3px 3px 0 0 var(--white);
  }

  .wrapper {
    margin-bottom: 4rem;
  }
</style>

<main>
  <div class="wrapper">
    <BackgroundImage height="600px" imageURL="/background.jpg">
      <div class="hero">
        <h1 class="bannerTitle">台灣性侵害事件統計</h1>
      </div>
    </BackgroundImage>
  </div>

  <Section
    title="性侵害發生地點"
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
</main>

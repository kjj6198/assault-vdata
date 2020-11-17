<script>
  export let caption;
  export let data;
  export let headers = [];

  const formatter = Intl.NumberFormat("zh-Hans");
</script>

<style>
  table {
    color: var(--mainText);
    font-size: 20px;
    width: 100%;
    table-layout: fixed;
    font-family: Oswald, "PingFang TC";
    border-collapse: collapse;
    margin: 50px 0;
  }

  thead th {
    border-bottom: 2px dotted var(--em2);
  }
  thead th:not(:last-child) {
    border-right: 2px dotted var(--em2);
  }

  td.number,
  th.number {
    text-align: right;
  }

  thead th,
  tbody td {
    padding: 12px 30px;
  }

  tbody td:not(:last-child) {
    border-right: 2px dotted var(--em2);
  }

  .align-right {
    text-align: right;
  }

  .align-left {
    text-align: left;
  }

  .align-center {
    text-align: center;
  }

  .ranking {
    text-align: center;
  }

  .no {
    display: inline-block;
    font-size: 15px;
    width: 30px;
    height: 30px;
    line-height: 30px;
    border-radius: 50%;
    color: var(--white);
    background-color: var(--em3);
  }

  @media screen and (max-width: 960px) {
    table {
      font-size: 14px;
    }
    thead th,
    tbody td {
      padding: 5px 5px;
    }

    .no {
      font-size: 12px;
      line-height: 20px;
      width: 20px;
      height: 20px;
    }
  }
</style>

<table>
  <caption>{caption}</caption>
  <thead>
    <tr>
      <th class="ranking" width="10%">排名</th>
      {#each headers as config}
        <th width={config.width} class="align-{config.align || 'left'}">
          {config.name}
        </th>
      {/each}
    </tr>
  </thead>

  <tbody>
    {#each data as d, i}
      <tr>
        <td class="ranking"><span class="no">{i + 1}</span></td>
        {#each headers as config}
          <td class="align-{config.align || 'left'}">
            {#if config.accessor}
              {#if config.type === 'number'}
                <span
                  class="number">{formatter.format(config.accessor(d))}</span>
              {:else}{config.accessor(d)}{/if}
            {:else if config.component}
              <svelte:component this={config.component} data={d} />
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

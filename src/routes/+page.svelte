<script>
  import { OrderByHashStore } from '$houdini';
  import { onMount } from 'svelte';

  let houdiniData = $state()
  let directData = $state()
  let loading = $state()
  let error = $state()

  // Create Houdini store instance
  const store = new OrderByHashStore();

  // Fetch with both methods for comparison
  async function fetchBothMethods() {
    loading = true;
    error = null;

    try {
      // 1. Fetch with Houdini
      const houdiniResult = await store.fetch({
        variables: { req: { orderHash: "abc123def456" } }
      });
      houdiniData = houdiniResult.data;

      // 2. Fetch directly with GraphQL (bypass Houdini cache)
      const directResult = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetOrder {
              orderByHash(req: { orderHash: "abc123def456" }) {
                order {
                  orderItems {
                    id
                    name
                    optionSets {
                      id
                      name
                      selectedOption {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          `
        })
      });

      const directJson = await directResult.json();
      directData = directJson.data;

    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchBothMethods();
  });

  // Extract just the selectedOptions for comparison
  function getSelectedOptions(data) {
    if (!data?.orderByHash?.order?.orderItems) return [];

    return data.orderByHash.order.orderItems.map((item, index) => ({
      itemName: item.name,
      itemIndex: index + 1,
      selectedOption: item.optionSets[0]?.selectedOption
    }));
  }

  // Derived values that update automatically when data changes
  let houdiniOptions = $derived(houdiniData ? getSelectedOptions(houdiniData) : []);
  let directOptions = $derived(directData ? getSelectedOptions(directData) : []);
</script>

<svelte:head>
  <title>Houdini Duplication Bug Reproduction</title>
</svelte:head>

<div class="page">
  <div class="controls">
    <button on:click={fetchBothMethods} disabled={loading}>
      {#if loading}
        Loading...
      {:else}
        Fetch Data
      {/if}
    </button>
  </div>

  {#if error}
    <div class="error">
      <h3>❌ Error:</h3>
      <p>{error}</p>
    </div>
  {/if}

  {#if houdiniData && directData}
    <div class="comparison">
      <div class="comparison-grid">

        <!-- Direct Fetch (Expected) -->
        <div class="method-result expected">
          <h3>✅ Direct Fetch (Expected)</h3>
          <p class="method-desc">Raw GraphQL response without Houdini cache</p>

          {#each directOptions as item}
            <div class="item-card">
              <div class="item-header">{item.itemName}</div>
              <div class="item-option">
                <strong>Egg Option:</strong> {item.selectedOption?.name || 'None'}
              </div>
            </div>
          {/each}
        </div>

        <!-- Houdini Fetch (Actual) -->
        <div class="method-result actual">
          <h3>🐛 Houdini Fetch (Actual)</h3>
          <p class="method-desc">Same query through Houdini cache</p>

          {#each houdiniOptions as item}
            <div class="item-card">
              <div class="item-header">{item.itemName}</div>
              <div class="item-option">
                <strong>Egg Option:</strong> {item.selectedOption?.name || 'None'}
              </div>
            </div>
          {/each}
        </div>

      </div>

      <!-- Bug Status -->
      <div class="bug-status">
        {#if directOptions.length >= 2 && houdiniOptions.length >= 2}
          {#if directOptions[0].selectedOption?.name !== houdiniOptions[0].selectedOption?.name}
            <div class="status-bug">
              <h4>🚨 BUG DETECTED</h4>
              <p>Item 1 should be "{directOptions[0].selectedOption?.name}" but Houdini shows "{houdiniOptions[0].selectedOption?.name}"</p>
            </div>
          {:else}
            <div class="status-ok">
              <h4>✅ NO BUG DETECTED</h4>
              <p>Both methods return the same data</p>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .page {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .controls {
    text-align: center;
    margin: 20px 0;
  }

  button {
    background: #007acc;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
  }

  button:hover {
    background: #005a99;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .error {
    background: #ffebee;
    border: 1px solid #f44336;
    color: #c62828;
    padding: 15px;
    border-radius: 8px;
    margin: 20px 0;
  }

  .comparison {
    margin-top: 30px;
  }

  .comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 30px;
  }

  .method-result {
    padding: 20px;
    border-radius: 12px;
    border: 2px solid;
  }

  .method-result.expected {
    background: #f0f9ff;
    border-color: #0ea5e9;
  }

  .method-result.actual {
    background: #fef7f7;
    border-color: #ef4444;
  }

  .method-result h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
  }

  .method-desc {
    font-size: 14px;
    color: #666;
    margin: 0 0 20px 0;
  }

  .item-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .item-header {
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 8px;
    color: #1f2937;
  }

  .item-option {
    color: #374151;
    font-size: 14px;
  }

  .bug-status {
    text-align: center;
    padding: 20px;
    border-radius: 12px;
  }

  .status-bug {
    background: #fef2f2;
    border: 2px solid #ef4444;
    color: #991b1b;
  }

  .status-ok {
    background: #f0fdf4;
    border: 2px solid #22c55e;
    color: #166534;
  }

  .status-bug h4, .status-ok h4 {
    margin: 0 0 12px 0;
    font-size: 18px;
  }

  .status-bug p, .status-ok p {
    margin: 6px 0;
    font-size: 14px;
  }

  @media (max-width: 768px) {
    .comparison-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }
</style>

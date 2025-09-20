<script>
  import { OrderByHashStore } from '$houdini';
  import { onMount } from 'svelte';

  let houdiniData = $state()
  let directData = $state()
  let loading = $state()
  let error = $state()
  let showRawData = $state(false)


  // Create Houdini store instance
  const store = new OrderByHashStore();

  // Fetch with both methods for comparison
  async function fetchBothMethods() {
    loading = true;
    error = null;

    try {
      // 1. Fetch with Houdini
      const houdiniResult = await store.fetch({
        variables: { req: { orderHash: "B6BF97C8" } }
      });
      houdiniData = houdiniResult.data;

      // 2. Fetch directly with GraphQL (bypass Houdini cache)
      const directResult = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetOrder {
              orderByHash(req: { orderHash: "B6BF97C8" }) {
                order {
                  orderItems {
                    id
                    name
                    description
                    optionSets {
                      id
                      name
                      selectedOption {
                        id
                        name
                        price
                        posReferenceId
                        posSource
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
    <h1>🐛 Houdini Cache Duplication Bug</h1>
    <p class="description">
      Same <code>optionSet.id</code> with different <code>selectedOption</code> values causes cache collision.
    </p>

    <div class="controls">
      <button onclick={fetchBothMethods} disabled={loading}>
        {#if loading}
          Loading...
        {:else}
          Fetch Order Data
        {/if}
      </button>
      <button onclick={() => showRawData = !showRawData} class="toggle-raw">
        {showRawData ? 'Hide' : 'Show'} Raw Data
      </button>
    </div>

    {#if error}
      <div class="error">
        <h3>❌ Connection Error</h3>
        <p>{error}</p>
        <div class="error-help">
          <p><strong>💡 Make sure to start the mock server first:</strong></p>
          <code>npm run mock-server</code>
        </div>
      </div>
    {/if}

    {#if houdiniData && directData}
      <div class="comparison">
        <div class="comparison-grid">
          <!-- Direct Fetch (Expected) -->
          <div class="method-result expected">
            <div class="method-header">
              <h3>✅ Direct GraphQL</h3>
              <span class="method-label">Correct Data</span>
            </div>
            <p class="method-desc">Raw GraphQL response - shows the actual different values</p>

            {#each directOptions as item, index}
              <div class="item-card">
                <div class="item-header">
                  <span class="item-number">{index + 1}</span>
                  <strong>{item.itemName}</strong>
                </div>
                <div class="option-display">
                  <div class="option-set-info">
                    <div class="option-set-name">Egg Temperature</div>
                    <div class="option-set-id">ID: 4200d056-0a65-42a5-ad93-a0d11bb975ad</div>
                  </div>
                  <div class="selected-option">
                    <div class="option-label">Selected Option:</div>
                    <div class="option-value correct">{item.selectedOption?.name || 'None'}</div>
                    <div class="option-id">ID: {item.selectedOption?.id || 'N/A'}</div>
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <!-- Houdini Fetch (Bug) -->
          <div class="method-result actual">
            <div class="method-header">
              <h3>🐛 Houdini Cache</h3>
              <span class="method-label bug">Incorrect Data</span>
            </div>
            <p class="method-desc">Same query through Houdini cache - shows the duplication bug</p>

            {#each houdiniOptions as item, index}
              <div class="item-card">
                <div class="item-header">
                  <span class="item-number">{index + 1}</span>
                  <strong>{item.itemName}</strong>
                </div>
                <div class="option-display">
                  <div class="option-set-info">
                    <div class="option-set-name">Egg Temperature</div>
                    <div class="option-set-id">ID: 4200d056-0a65-42a5-ad93-a0d11bb975ad</div>
                  </div>
                  <div class="selected-option">
                    <div class="option-label">Selected Option:</div>
                    <div class="option-value incorrect">{item.selectedOption?.name || 'None'}</div>
                    <div class="option-id">ID: {item.selectedOption?.id || 'N/A'}</div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Bug Detection -->
        <div class="bug-detection">
          {#if directOptions.length >= 2 && houdiniOptions.length >= 2}
            {#if directOptions[0].selectedOption?.name !== houdiniOptions[0].selectedOption?.name}
              <div class="bug-alert">
                <div class="alert-icon">🚨</div>
                <div class="alert-content">
                  <h4>CACHE COLLISION DETECTED!</h4>
                  <div class="bug-comparison">
                    <div class="comparison-item">
                      <strong>Expected (Item 1):</strong>
                      <span class="expected-value">"{directOptions[0].selectedOption?.name}"</span>
                    </div>
                    <div class="comparison-item">
                      <strong>Houdini Shows:</strong>
                      <span class="actual-value">"{houdiniOptions[0].selectedOption?.name}"</span>
                    </div>
                  </div>
                  <p class="bug-explanation">
                    <strong>Root Cause:</strong> Same optionSet ID with different selectedOption values causes Houdini to overwrite the first value with the second in cache.
                  </p>
                </div>
              </div>
            {:else}
              <div class="no-bug">
                <div class="alert-icon">✅</div>
                <div class="alert-content">
                  <h4>No Cache Collision</h4>
                  <p>Both methods return identical data.</p>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </div>

      <!-- Raw Data Viewer -->
      {#if showRawData && houdiniData && directData}
        <div class="raw-data-section">
          <h3>📊 Raw API Data</h3>
          <p class="raw-data-desc">Compare the raw JSON responses to see the duplication bug in the data structure itself</p>

          <div class="raw-data-grid">
            <div class="raw-data-card">
              <div class="raw-data-header">
                <h4>✅ Direct GraphQL Response</h4>
                <span class="raw-data-label">Correct Data</span>
              </div>
              <div class="json-viewer">
                <pre>{JSON.stringify(directData, null, 2)}</pre>
              </div>
            </div>

            <div class="raw-data-card">
              <div class="raw-data-header">
                <h4>🐛 Houdini Response</h4>
                <span class="raw-data-label bug">Buggy Data</span>
              </div>
              <div class="json-viewer">
                <pre>{JSON.stringify(houdiniData, null, 2)}</pre>
              </div>
            </div>
          </div>

          <div class="raw-data-instructions">
            <h4>🔍 What to Look For:</h4>
            <ul>
              <li><strong>Item 1 optionSet[0].selectedOption.name</strong> should be different from</li>
              <li><strong>Item 2 optionSet[0].selectedOption.name</strong> but they're the same due to cache collision</li>
            </ul>
          </div>
        </div>
      {/if}
    {/if}
  </div>

<style>
  .page {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  h1 {
    text-align: center;
    margin-bottom: 10px;
    color: #1f2937;
  }

  .description {
    text-align: center;
    color: #6b7280;
    margin-bottom: 30px;
  }

  .description code {
    background: #e5e7eb;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }

  .controls {
    text-align: center;
    margin: 30px 0;
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
    margin: 0 5px;
  }

  button:hover {
    background: #005a99;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .toggle-raw {
    background: #6b7280;
  }

  .toggle-raw:hover {
    background: #4b5563;
  }

  .error {
    background: #fef2f2;
    border: 2px solid #fecaca;
    color: #991b1b;
    padding: 20px;
    border-radius: 12px;
    margin: 20px 0;
  }

  .error h3 {
    margin: 0 0 10px 0;
    font-size: 1.2rem;
  }

  .error-help {
    background: #fff;
    padding: 15px;
    border-radius: 8px;
    margin-top: 15px;
    border-left: 3px solid #f59e0b;
  }

  .error-help code {
    background: #f3f4f6;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
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
    .header h1 {
      font-size: 2rem;
    }

    .comparison-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .bug-alert, .no-bug {
      flex-direction: column;
      text-align: center;
    }

    .table-row {
      flex-direction: column;
    }

    .table-cell:first-child {
      background: transparent;
      font-weight: normal;
    }
  }

  .raw-data-section {
    margin-top: 40px;
    background: #f8fafc;
    border-radius: 16px;
    padding: 30px;
    border: 2px solid #e5e7eb;
  }

  .raw-data-section h3 {
    margin: 0 0 10px 0;
    font-size: 1.5rem;
    color: #1f2937;
    text-align: center;
  }

  .raw-data-desc {
    text-align: center;
    color: #6b7280;
    font-size: 1rem;
    margin: 0 0 30px 0;
  }

  .raw-data-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 30px;
  }

  .raw-data-card {
    background: white;
    border-radius: 12px;
    border: 2px solid #e5e7eb;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .raw-data-header {
    padding: 15px 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .raw-data-header h4 {
    margin: 0;
    font-size: 1.1rem;
    color: #1f2937;
  }

  .raw-data-label {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .raw-data-card:first-child .raw-data-label {
    background: #22c55e;
    color: white;
  }

  .raw-data-card:last-child .raw-data-label {
    background: #ef4444;
    color: white;
  }

  .json-viewer {
    max-height: 400px;
    overflow-y: auto;
    background: #1f2937;
    color: #e5e7eb;
  }

  .json-viewer pre {
    margin: 0;
    padding: 20px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .raw-data-instructions {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border-left: 4px solid #3b82f6;
  }

  .raw-data-instructions h4 {
    margin: 0 0 15px 0;
    font-size: 1.1rem;
    color: #1f2937;
  }

  .raw-data-instructions ul {
    margin: 0;
    padding-left: 20px;
    color: #374151;
  }

  .raw-data-instructions li {
    margin: 8px 0;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    .raw-data-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .json-viewer {
      max-height: 300px;
    }

    .json-viewer pre {
      font-size: 10px;
      padding: 15px;
    }
  }
</style>

<script>
  import { OrderByHashStore } from '$houdini';
  import { onMount } from 'svelte';

  let orderData = null;
  let loading = false;
  let error = null;

  // Create store instance
  const store = new OrderByHashStore();

  // Fetch order data using Houdini store
  async function fetchOrderData() {
    loading = true;
    error = null;

    try {
      const result = await store.fetch({
        variables: { req: { orderHash: "test_hash_456" } }
      });

      orderData = result.data;
      console.log('📦 Order data fetched:', orderData);

    } catch (err) {
      console.error('❌ Error fetching order data:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchOrderData();
  });

  // Helper function to check for duplications
  function findDuplications(data) {
    if (!data?.orderByHash?.order?.orderItems) return [];

    const seenOptions = new Map();
    const duplications = [];

    data.orderByHash.order.orderItems.forEach((item, itemIndex) => {
      item.optionSets?.forEach((optionSet, setIndex) => {
        if (optionSet.selectedOption) {
          const optionId = optionSet.selectedOption.id;

          if (seenOptions.has(optionId)) {
            const previous = seenOptions.get(optionId);
            duplications.push({
              optionId,
              optionName: optionSet.selectedOption.name,
              first: previous,
              duplicate: {
                itemName: item.name,
                itemIndex,
                optionSetName: optionSet.name,
                setIndex
              }
            });
          } else {
            seenOptions.set(optionId, {
              itemName: item.name,
              itemIndex,
              optionSetName: optionSet.name,
              setIndex
            });
          }
        }
      });
    });

    return duplications;
  }

  $: duplications = orderData ? findDuplications(orderData) : [];
</script>

<svelte:head>
  <title>Houdini Duplication Bug Reproduction</title>
</svelte:head>

<div class="page">
  <div class="header">
    <h1>🔍 Houdini selectedOption Duplication Bug</h1>
    <p>This page demonstrates the cache collision issue in nested GraphQL fragments.</p>
  </div>

  <div class="controls">
    <button on:click={fetchOrderData} disabled={loading}>
      {#if loading}
        Loading...
      {:else}
        Fetch Order Data
      {/if}
    </button>
  </div>

  {#if error}
    <div class="error">
      <h3>❌ Error:</h3>
      <p>{error}</p>
    </div>
  {/if}

  {#if orderData}
    <div class="results">
      <div class="bug-demo">
        <h2>🐛 Bug Demonstration</h2>
        <p><strong>Order ID:</strong> {orderData.orderByHash.order.id}</p>
        <p><strong>Status:</strong> {orderData.orderByHash.order.status}</p>
        <p><strong>Items:</strong> {orderData.orderByHash.order.orderItems.length}</p>

        {#if duplications.length > 0}
          <div class="warning">
            <h3>⚠️ DUPLICATION DETECTED!</h3>
            <p>The same option ID appears in multiple contexts, causing cache collision.</p>
          </div>
        {:else}
          <div class="success">
            <h3>✅ No Duplications Found</h3>
            <p>All option IDs are unique across contexts.</p>
          </div>
        {/if}
      </div>

      <div class="order-details">
        <h3>📦 Order Items</h3>
        {#each orderData.orderByHash.order.orderItems as item, itemIndex}
          <div class="order-item">
            <h4>{item.name} (Item {itemIndex + 1})</h4>
            <p><strong>Price:</strong> ${item.price / 100}</p>
            <p><strong>Quantity:</strong> {item.quantity}</p>

            <div class="option-sets">
              <h5>🎛️ Option Sets ({item.optionSets.length})</h5>
              {#each item.optionSets as optionSet, setIndex}
                <div class="option-set">
                  <strong>{optionSet.name}</strong>
                  {#if optionSet.selectedOption}
                    <div class="selected-option">
                      <strong>Selected:</strong> {optionSet.selectedOption.name}
                      <br>
                      <strong>ID:</strong> <code>{optionSet.selectedOption.id}</code>
                      <br>
                      <strong>Price:</strong> ${optionSet.selectedOption.price / 100}
                      <br>
                      <strong>POS Ref:</strong> {optionSet.selectedOption.posReferenceId}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      {#if duplications.length > 0}
        <div class="duplication-analysis">
          <h3>🔍 Duplication Analysis</h3>
          <div class="analysis-table">
            {#each duplications as dup, index}
              <div class="duplication-item">
                <h4>Duplication #{index + 1}: <code>{dup.optionId}</code></h4>
                <div class="occurrence">
                  <strong>First Occurrence:</strong>
                  <p>Item: {dup.first.itemName} (index {dup.first.itemIndex})</p>
                  <p>Option Set: {dup.first.optionSetName} (index {dup.first.setIndex})</p>
                </div>
                <div class="occurrence">
                  <strong>Duplicate Occurrence:</strong>
                  <p>Item: {dup.duplicate.itemName} (index {dup.duplicate.itemIndex})</p>
                  <p>Option Set: {dup.duplicate.optionSetName} (index {dup.duplicate.setIndex})</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="debug-info">
        <h3>🐛 Debug Information</h3>
        <p><strong>Raw Data Structure:</strong></p>
        <pre>{JSON.stringify(orderData, null, 2)}</pre>
      </div>
    </div>
  {/if}
</div>

<style>
  .page {
    padding: 20px;
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
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
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
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
    border-radius: 5px;
    margin: 20px 0;
  }

  .results {
    margin-top: 30px;
  }

  .order-details {
    margin: 30px 0;
  }

  .option-sets {
    margin-top: 10px;
  }

  .duplication-analysis {
    margin: 30px 0;
    padding: 20px;
    background: #fff3e0;
    border-radius: 5px;
    border-left: 4px solid #ff9800;
  }

  .analysis-table {
    display: grid;
    gap: 15px;
  }

  .duplication-item {
    background: white;
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #ddd;
  }

  .occurrence {
    margin: 10px 0;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 3px;
  }

  .occurrence strong {
    color: #333;
  }
</style>
<script>
  import '../app.css';
</script>

<div class="container">
  <header>
    <h1>🔍 Houdini selectedOption Duplication Bug Reproduction</h1>
    <p>This SvelteKit app demonstrates the cache collision issue in nested GraphQL fragments.</p>
  </header>

  <main>
    <slot />
  </main>

  <footer>
    <p><small>Built with SvelteKit + Houdini for bug reproduction</small></p>
  </footer>
</div>
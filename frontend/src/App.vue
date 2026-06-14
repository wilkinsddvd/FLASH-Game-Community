<template>
  <main class="container">
    <h1>FLASH Game Community</h1>
    <nav>
      <RouterLink to="/display">Display</RouterLink>
      <RouterLink to="/guide">Guide</RouterLink>
      <RouterLink to="/developer">Developer</RouterLink>
      <RouterLink to="/forum">Forum</RouterLink>
      <RouterLink to="/admin">Admin</RouterLink>
    </nav>
    <RouterView />
  </main>
</template>

<template>
  <div class="account">
    <aside class="side">
      <h3>My Account</h3>
      <nav class="nav">
        <RouterLink to="/account/profile">Profile</RouterLink>
        <RouterLink to="/account/security">Security</RouterLink>
        <RouterLink to="/account/invoices">Invoices</RouterLink>
      </nav>
    </aside>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.account {
  min-height: 100vh;
  background: var(--bg-main);
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  padding: 24px;
}
.side {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 16px;
}
.nav {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}
.content {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 24px;
}
</style>

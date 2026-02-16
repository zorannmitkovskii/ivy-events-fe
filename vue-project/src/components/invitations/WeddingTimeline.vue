<template>
  <div class="header">
    <h2>About the Wedding</h2>

    <p class="subtitle">
      To give you an idea of what the big day will be like, here is a brief guide
      to what you can expect at our wedding.
    </p>

    <div class="timeline">
      <span>10:00h Reception</span>
      <span>12:15h Ceremony</span>
      <span>13:30h Aperitif & co.</span>
      <span>15:00h Gran banquet</span>
      <span>16:45h Don’t let the party stop!</span>
    </div>
  </div>
</template>

<style scoped>
.header h2 {
  font-size: 28px;
  margin-bottom: 10px;
}

.subtitle {
  max-width: 700px;
  margin: 0 auto 25px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 15px;
  margin-top: 15px;
}
</style>

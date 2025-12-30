<template>
  <section class="what-includes container py-5">
    <h2 class="text-center mb-4 fw-bold">What includes?</h2>
    <p class="text-center mb-5">
      <span class="fw-bold text-danger">🎉 ALL included – The most complete platform!</span>
      Take advantage of the magic of web invitations and everything we have prepared for you.
    </p>

    <div class="row g-4">
      <div
        v-for="item in features"
        :key="item.title"
        class="col-12 col-sm-6 col-md-4 col-lg-3 d-flex"
      >
        <div class="feature-card p-3">
          <div class="icon mb-3">
            <i :class="item.icon"></i>
          </div>
          <h5 class="fw-semibold mb-2">{{ item.title }}</h5>
          <p class="text-muted small">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "WhatIncludes",
  data() {
    return {
      features: [
        {
          icon: "bi bi-send",
          title: "Unlimited sends",
          desc: "Send your web invitation to all your guests at any time. From anywhere in the world."
        },
        {
          icon: "bi bi-clock-history",
          title: "Countdown",
          desc: "Displays a dynamic countdown in real time based on the exact date and time."
        },
        {
          icon: "bi bi-music-note-beamed",
          title: "Background music",
          desc: "Choose a song from our list or upload your favorite track."
        },
        {
          icon: "bi bi-geo-alt",
          title: "Locations & maps",
          desc: "Interactive Google Maps with the exact event locations."
        },
        {
          icon: "bi bi-play-circle",
          title: "Songs playlist",
          desc: "Guests can suggest songs for the event celebration."
        },
        {
          icon: "bi bi-gift",
          title: "Gifts and lists",
          desc: "Allow attendees to give gifts, use codes, or make transfers."
        },
        {
          icon: "bi bi-camera",
          title: "Photo album",
          desc: "Add multiple photos in different parts of your invitation."
        },
        {
          icon: "bi bi-people",
          title: "Confirm attendance",
          desc: "RSVP system, customizable forms, family invites, and more."
        },
        {
          icon: "bi bi-share",
          title: "Multichannel sending",
          desc: "Share your link via WhatsApp, SMS, email, and social media."
        },
        {
          icon: "bi bi-vector-pen",
          title: "Design editor",
          desc: "Customize colors, images, fonts, texts, and decorations."
        },
        {
          icon: "bi bi-lock",
          title: "Management panel",
          desc: "Manage and download all event information from your private dashboard."
        },
        {
          icon: "bi bi-instagram",
          title: "Social networks",
          desc: "Add custom buttons linking to your social media."
        },
        {
          icon: "bi bi-shirt",
          title: "Dress code",
          desc: "Inform guests about the appropriate dress code."
        },
        {
          icon: "bi bi-translate",
          title: "Multilanguage",
          desc: "Select your preferred language with automatic translation."
        },
        {
          icon: "bi bi-info-circle",
          title: "Notes and tips",
          desc: "Add additional information such as accommodation or transport."
        },
        {
          icon: "bi bi-phone",
          title: "Private advisor",
          desc: "Professional support available for FreshEvent users."
        },
        {
          icon: "bi bi-globe2",
          title: "Customizable link",
          desc: "Create your own unique URL for your event."
        },
        {
          icon: "bi bi-laptop",
          title: "Responsive design",
          desc: "Fluid and professional user experience for all devices."
        }
      ]
    };
  }
};
</script>

<style scoped>
.what-includes .feature-card {
  background: #ffffff;
  border-radius: 12px;
  transition: 0.3s ease;
}

.what-includes .feature-card:hover {
  background: #f7f9fc;
  transform: translateY(-4px);
}

.icon i {
  font-size: 32px;
  color: #3b82f6; /* Blue like screenshot */
}
</style>

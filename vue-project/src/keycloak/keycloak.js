import Keycloak from "keycloak-js";

// Determine Keycloak base URL:
// - In Docker (docker-compose), Keycloak is published on host port 8181
// - In plain local dev, it might run on 8080
const host = window.location.hostname || "localhost";
const defaultPort = window.location.port === "8180" ? "8080" : "8080"; // if app is on 8180, use 8181 for Keycloak
const keycloakBase = `http://${host}:${defaultPort}`;
console.log(`Keycloak base URL: ${keycloakBase}`);
const keycloak = new Keycloak({
  url: keycloakBase,
  realm: "event-app",
  clientId: "eventsFE",
});

keycloak
  .init({
    onLoad: "check-sso",
    silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
  })
  .then((authenticated) => {
    if (authenticated) {
      console.log("User is logged in");
    } else {
      console.log("User is not logged in");
    }
  });

export default keycloak;

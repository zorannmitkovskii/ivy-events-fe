// This file is served statically and variables are injected at container startup via envsubst
// Do not commit secrets here. Values will be replaced in docker/entrypoint.sh
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}"
};

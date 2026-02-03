export function createDemoEvent(payload) {
  return {
    id: `demo_${Date.now()}`,
    ...payload
  };
}

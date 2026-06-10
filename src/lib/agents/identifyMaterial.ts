export async function identifyMaterial() {
  return {
    match: null,
    confidence: 0,
    candidates: [],
    note: "Agent temporairement neutralisé en local."
  };
}

export default identifyMaterial;

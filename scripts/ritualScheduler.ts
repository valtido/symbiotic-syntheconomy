  console.log("⏳ Ritual '" + metadata.name + "' scheduled in " + delayMs + "ms...");
  await new Promise(resolve => setTimeout(resolve, delayMs));
  console.log("✅ Ritual '" + metadata.name + "' started at " + new Date().toISOString());

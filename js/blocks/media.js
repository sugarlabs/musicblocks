function isSupportedMediaType(file) {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type.startsWith("image/") || name.endsWith(".gif")) {
    console.log("✅ Image or GIF file accepted:", name);
    return true;
  }

  console.log("❌ Unsupported media type:", type);
  return false;
}

// Example usage
// isSupportedMediaType({ name: "cat.gif", type: "image/gif" });

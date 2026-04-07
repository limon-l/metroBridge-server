const User = require("../models/User");

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractMentionTokens = (text = "") => {
  const regex = /@([a-zA-Z0-9._-]{2,50})/g;
  const tokens = new Set();
  let match = regex.exec(text);

  while (match) {
    tokens.add(String(match[1] || "").toLowerCase());
    match = regex.exec(text);
  }

  return Array.from(tokens);
};

const findMentionRecipients = async ({ tokens = [], actorId }) => {
  if (!tokens.length) return [];

  const orConditions = tokens.flatMap((token) => {
    const safeToken = escapeRegex(token);
    return [
      { email: { $regex: `^${safeToken}@`, $options: "i" } },
      { fullName: { $regex: `(^|\\s)${safeToken}(\\s|$)`, $options: "i" } },
    ];
  });

  const users = await User.find({
    isActive: true,
    $or: orConditions,
  }).select("_id");

  const actorString = actorId?.toString();
  return users
    .map((user) => user._id.toString())
    .filter((userId) => userId !== actorString);
};

module.exports = {
  extractMentionTokens,
  findMentionRecipients,
};

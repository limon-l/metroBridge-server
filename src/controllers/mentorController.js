const User = require("../models/User");
const { asyncHandler, pickPagination } = require("../utils/helpers");

const listMentors = asyncHandler(async (req, res) => {
  const { query, department, expertise } = req.query;
  const { limit, skip, page } = pickPagination(req.query);

  const filter = {
    role: "mentor",
    isActive: true,
  };

  if (department && department !== "All") {
    filter.department = department;
  }

  if (query) {
    filter.fullName = { $regex: query, $options: "i" };
  }

  if (expertise && expertise !== "All") {
    filter.expertise = { $elemMatch: { $regex: expertise, $options: "i" } };
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("fullName email department expertise rating bio")
      .sort({ rating: -1, fullName: 1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return res.status(200).json({
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

module.exports = {
  listMentors,
};

const Document = require("../models/Document");
const { asyncHandler, pickPagination } = require("../utils/helpers");

const listDocuments = asyncHandler(async (req, res) => {
  const { limit, skip, page } = pickPagination(req.query);

  const filter = {};
  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.q) {
    filter.title = { $regex: req.query.q, $options: "i" };
  }

  const [items, total] = await Promise.all([
    Document.find(filter)
      .populate("uploadedBy", "fullName role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Document.countDocuments(filter),
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

const createDocument = asyncHandler(async (req, res) => {
  const { title, description, category, fileUrl } = req.body;

  const document = await Document.create({
    title,
    description,
    category,
    fileUrl,
    uploadedBy: req.user._id,
  });

  await document.populate("uploadedBy", "fullName role");

  return res.status(201).json({ data: document });
});

const incrementDownload = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.documentId);
  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  document.downloads += 1;
  await document.save();

  return res.status(200).json({ data: document });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.documentId);
  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  const isOwner = document.uploadedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await document.deleteOne();
  return res.status(200).json({ message: "Document deleted" });
});

module.exports = {
  listDocuments,
  createDocument,
  incrementDownload,
  deleteDocument,
};

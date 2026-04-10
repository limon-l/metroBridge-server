const ConnectionRequest = require("../models/ConnectionRequest");
const MemberReport = require("../models/MemberReport");
const User = require("../models/User");
const { asyncHandler } = require("../utils/helpers");

const buildReportPriority = (reason = "") => {
  const text = String(reason).toLowerCase();
  if (/(hate|threat|abuse|harass|violence|scam)/.test(text)) return "high";
  if (/(spam|fake|offensive|inappropriate)/.test(text)) return "medium";
  return "low";
};

const getMemberDirectory = asyncHandler(async (req, res) => {
  const { q, role } = req.query;

  const userFilter = {
    _id: { $ne: req.user._id },
    approvalStatus: "approved",
    isActive: true,
    role: { $in: ["student", "mentor"] },
  };

  if (role && ["student", "mentor"].includes(role)) {
    userFilter.role = role;
  }

  if (q) {
    userFilter.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { universityId: { $regex: q, $options: "i" } },
      { department: { $regex: q, $options: "i" } },
    ];
  }

  const members = await User.find(userFilter)
    .select("fullName email role department universityId bio")
    .sort({ fullName: 1 })
    .lean();

  const requests = await ConnectionRequest.find({
    $or: [
      {
        requester: req.user._id,
        recipient: { $in: members.map((m) => m._id) },
      },
      {
        recipient: req.user._id,
        requester: { $in: members.map((m) => m._id) },
      },
    ],
  }).lean();

  const relationMap = new Map();
  requests.forEach((item) => {
    const otherId = String(
      String(item.requester) === String(req.user._id)
        ? item.recipient
        : item.requester,
    );

    if (item.status === "approved") {
      relationMap.set(otherId, { type: "connected", requestId: item._id });
      return;
    }

    if (item.status === "pending") {
      const type =
        String(item.requester) === String(req.user._id)
          ? "pending_sent"
          : "pending_received";
      relationMap.set(otherId, { type, requestId: item._id });
      return;
    }

    relationMap.set(otherId, { type: "none", requestId: null });
  });

  const data = members.map((member) => {
    const relation = relationMap.get(String(member._id)) || {
      type: "none",
      requestId: null,
    };

    return {
      ...member,
      relationship: relation.type,
      requestId: relation.requestId,
    };
  });

  return res.status(200).json({ data });
});

const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;

  if (String(recipientId) === String(req.user._id)) {
    return res
      .status(400)
      .json({ message: "You cannot connect with yourself." });
  }

  const recipient = await User.findById(recipientId).select(
    "_id role isActive approvalStatus",
  );
  if (
    !recipient ||
    !recipient.isActive ||
    recipient.approvalStatus !== "approved"
  ) {
    return res.status(404).json({ message: "Recipient not found." });
  }

  if (!["student", "mentor"].includes(recipient.role)) {
    return res
      .status(400)
      .json({ message: "Cannot send request to this user." });
  }

  const existing = await ConnectionRequest.findOne({
    $or: [
      { requester: req.user._id, recipient: recipientId },
      { requester: recipientId, recipient: req.user._id },
    ],
  });

  if (existing) {
    if (existing.status === "approved") {
      return res.status(409).json({ message: "You are already connected." });
    }

    if (existing.status === "pending") {
      return res
        .status(409)
        .json({ message: "A pending request already exists." });
    }
  }

  const request = await ConnectionRequest.create({
    requester: req.user._id,
    recipient: recipientId,
    status: "pending",
  });

  return res.status(201).json({
    message: "Connection request sent.",
    data: request,
  });
});

const listConnectionRequests = asyncHandler(async (req, res) => {
  const { type = "all", status } = req.query;

  const filter = {};
  if (type === "incoming") {
    filter.recipient = req.user._id;
  } else if (type === "sent") {
    filter.requester = req.user._id;
  } else {
    filter.$or = [{ requester: req.user._id }, { recipient: req.user._id }];
  }

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    filter.status = status;
  }

  const requests = await ConnectionRequest.find(filter)
    .populate("requester", "fullName email role department universityId")
    .populate("recipient", "fullName email role department universityId")
    .sort({ createdAt: -1 });

  return res.status(200).json({ data: requests });
});

const respondToConnectionRequest = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const request = await ConnectionRequest.findById(req.params.requestId);

  if (!request) {
    return res.status(404).json({ message: "Connection request not found." });
  }

  if (String(request.recipient) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only recipient can respond." });
  }

  if (request.status !== "pending") {
    return res.status(400).json({ message: "Request already processed." });
  }

  request.status = action === "approve" ? "approved" : "rejected";
  request.respondedAt = new Date();
  await request.save();

  return res.status(200).json({
    message:
      request.status === "approved"
        ? "Connection request approved."
        : "Connection request rejected.",
    data: request,
  });
});

const cancelConnectionRequest = asyncHandler(async (req, res) => {
  const request = await ConnectionRequest.findById(req.params.requestId);

  if (!request) {
    return res.status(404).json({ message: "Connection request not found." });
  }

  if (String(request.requester) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only requester can cancel." });
  }

  if (request.status !== "pending") {
    return res
      .status(400)
      .json({ message: "Only pending requests can be cancelled." });
  }

  await request.deleteOne();

  return res.status(200).json({
    message: "Connection request cancelled.",
    data: { requestId: req.params.requestId },
  });
});

const getMemberProfile = asyncHandler(async (req, res) => {
  const member = await User.findById(req.params.memberId)
    .select(
      "fullName email role department batch universityId projects thesis jobDetails educationDetails bio expertise approvalStatus isActive",
    )
    .lean();

  if (
    !member ||
    !member.isActive ||
    member.approvalStatus === "banned" ||
    !["student", "mentor"].includes(member.role)
  ) {
    return res.status(404).json({ message: "Member not found." });
  }

  const relation = await ConnectionRequest.findOne({
    $or: [
      { requester: req.user._id, recipient: req.params.memberId },
      { requester: req.params.memberId, recipient: req.user._id },
    ],
  }).lean();

  let relationship = "none";
  if (relation) {
    if (relation.status === "approved") {
      relationship = "connected";
    } else if (relation.status === "pending") {
      relationship =
        String(relation.requester) === String(req.user._id)
          ? "pending_sent"
          : "pending_received";
    }
  }

  return res.status(200).json({
    data: {
      ...member,
      relationship,
      connectionId: relation?._id || null,
    },
  });
});

const disconnectMember = asyncHandler(async (req, res) => {
  const relation = await ConnectionRequest.findOne({
    status: "approved",
    $or: [
      { requester: req.user._id, recipient: req.params.memberId },
      { requester: req.params.memberId, recipient: req.user._id },
    ],
  });

  if (!relation) {
    return res.status(404).json({ message: "No active connection found." });
  }

  await relation.deleteOne();
  return res.status(200).json({ message: "Disconnected successfully." });
});

const reportMember = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (String(req.params.memberId) === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot report yourself." });
  }

  await MemberReport.findOneAndUpdate(
    { reporter: req.user._id, reportedUser: req.params.memberId },
    {
      reporter: req.user._id,
      reportedUser: req.params.memberId,
      reason,
      status: "pending",
      adminDecision: "none",
      reviewedBy: null,
      reviewedAt: null,
      adminNote: "",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return res.status(200).json({
    message: "Report submitted. Thank you for helping keep the community safe.",
  });
});

const listMemberReports = asyncHandler(async (req, res) => {
  const { status, q, limit = 50 } = req.query;

  const filter = {};
  if (
    status &&
    ["pending", "reviewing", "resolved", "rejected"].includes(status)
  ) {
    filter.status = status;
  }

  if (q) {
    filter.reason = { $regex: q, $options: "i" };
  }

  const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const reports = await MemberReport.find(filter)
    .populate("reporter", "fullName email role")
    .populate("reportedUser", "fullName email role approvalStatus isActive")
    .populate("reviewedBy", "fullName")
    .sort({ createdAt: -1 })
    .limit(cappedLimit)
    .lean();

  const summary = {
    pending: 0,
    reviewing: 0,
    resolved: 0,
    rejected: 0,
    highPriority: 0,
  };

  reports.forEach((item) => {
    if (summary[item.status] !== undefined) {
      summary[item.status] += 1;
    }

    if (buildReportPriority(item.reason) === "high") {
      summary.highPriority += 1;
    }
  });

  return res.status(200).json({
    data: reports.map((item) => ({
      ...item,
      priority: buildReportPriority(item.reason),
    })),
    meta: {
      summary,
      count: reports.length,
    },
  });
});

const reviewMemberReport = asyncHandler(async (req, res) => {
  const { action, note = "" } = req.body;
  const report = await MemberReport.findById(req.params.reportId);

  if (!report) {
    return res.status(404).json({ message: "Report not found." });
  }

  if (action === "review") {
    report.status = "reviewing";
    report.adminDecision = "none";
  } else if (action === "approve") {
    report.status = "resolved";
    report.adminDecision = "approve";
  } else if (action === "reject") {
    report.status = "rejected";
    report.adminDecision = "reject";
  } else if (action === "ban") {
    report.status = "resolved";
    report.adminDecision = "ban";

    const reportedUser = await User.findById(report.reportedUser);
    if (reportedUser) {
      reportedUser.approvalStatus = "banned";
      reportedUser.isActive = false;
      await reportedUser.save();
    }
  }

  report.adminNote = note;
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();
  await report.save();

  const updated = await MemberReport.findById(report._id)
    .populate("reporter", "fullName email role")
    .populate("reportedUser", "fullName email role approvalStatus isActive")
    .populate("reviewedBy", "fullName")
    .lean();

  return res.status(200).json({
    message: "Report updated successfully.",
    data: {
      ...updated,
      priority: buildReportPriority(updated.reason),
    },
  });
});

module.exports = {
  getMemberDirectory,
  sendConnectionRequest,
  listConnectionRequests,
  respondToConnectionRequest,
  cancelConnectionRequest,
  getMemberProfile,
  disconnectMember,
  reportMember,
  listMemberReports,
  reviewMemberReport,
};

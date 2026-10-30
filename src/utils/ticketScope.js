function ticketScope(user) {
  if (user.role === "admin") return {};
  if (user.role === "agent") return { $or: [{ owner: user._id }, { assignedTo: user._id }] };
  return { owner: user._id };
}
module.exports = ticketScope;

import Issue from "../models/Issue.js";
import User from "../models/User.js";

const ESCALATION_SLA_HOURS = 24; // deadline given at each new escalation level

/**
 * Finds every open, overdue issue and bumps it one level up the
 * authority's reportsTo chain. Call this on a timer (see index.js).
 */
export async function runEscalationSweep() {
  const overdue = await Issue.find({
    slaDeadline: { $lt: new Date() },
    escalationLevel: { $lt: 3 },
    status: { $nin: ["Resolved", "Verified"] },
  });

  let escalatedCount = 0;

  for (const issue of overdue) {
    const currentAuthority = issue.assignedAuthorityId
      ? await User.findById(issue.assignedAuthorityId).select("reportsTo")
      : null;

    const nextAuthorityId = currentAuthority?.reportsTo || null;

    // No one further up the chain is registered — leave it flagged
    // as overdue rather than silently stalling escalation.
    if (!nextAuthorityId) continue;

    issue.escalationHistory.push({
      level: issue.escalationLevel + 1,
      authorityId: nextAuthorityId,
    });
    issue.assignedAuthorityId = nextAuthorityId;
    issue.escalationLevel += 1;
    issue.slaDeadline = new Date(Date.now() + ESCALATION_SLA_HOURS * 60 * 60 * 1000);

    await issue.save();
    escalatedCount += 1;
  }

  return { checked: overdue.length, escalated: escalatedCount };
}
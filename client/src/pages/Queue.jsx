import Heading from "../components/Heading";
import IssueTable from "../components/IssueTable";

export default function Queue({ issues, open }) {
  return (
    <>
      <Heading title="Prioritized issue queue" sub="AI-ranked for impact, urgency and community reach." action={<div className="flex flex-wrap gap-2"><button className="ghost">All issues</button><button className="ghost">Critical</button></div>} />
      <div className="card"><IssueTable issues={[...issues].sort((a, b) => b.priorityScore - a.priorityScore)} controls open={open} /></div>
    </>
  );
}
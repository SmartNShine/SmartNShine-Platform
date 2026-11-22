import { ExecutiveStudioStage } from "./ExecutiveStudioStage";

export const InterviewStep = ({ user, ...props }) => (
  <ExecutiveStudioStage {...props} userName={user?.name || "Candidate"} />
);

export default InterviewStep;

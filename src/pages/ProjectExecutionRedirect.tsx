import { Navigate, useParams, useLocation } from "react-router-dom";

/**
 * Redirect component for legacy /project-execution/:projectId routes
 * Redirects to the canonical /management/:projectId route while preserving query parameters
 */
const ProjectExecutionRedirect = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  
  // Preserve query string (e.g., ?tab=indicators)
  const targetPath = `/management/${projectId}${location.search}`;
  
  return <Navigate to={targetPath} replace />;
};

export default ProjectExecutionRedirect;

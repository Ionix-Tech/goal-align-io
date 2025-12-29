import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProjectDetail from "./ProjectDetail";

/**
 * Entry router for /projects/:id
 * Decides whether to redirect to A3 wizard or show ProjectDetail
 */
const ProjectEntry = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showProjectDetail, setShowProjectDetail] = useState(false);

  useEffect(() => {
    const checkProjectType = async () => {
      if (!id) {
        setShowProjectDetail(true);
        setLoading(false);
        return;
      }

      try {
        const { data: project, error } = await supabase
          .from("projects")
          .select("initiative_type, status")
          .eq("id", id)
          .single();

        if (error || !project) {
          // If project not found, show ProjectDetail (it will handle the error)
          setShowProjectDetail(true);
          setLoading(false);
          return;
        }

        // If it's a project in draft status, redirect to A3 wizard
        if (project.initiative_type === "project" && project.status === "draft") {
          navigate(`/projects/${id}/a3`, { replace: true });
          return;
        }

        // Otherwise, show ProjectDetail (ideas, review, approved, etc.)
        setShowProjectDetail(true);
        setLoading(false);
      } catch (err) {
        console.error("Error checking project type:", err);
        setShowProjectDetail(true);
        setLoading(false);
      }
    };

    checkProjectType();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showProjectDetail) {
    return <ProjectDetail />;
  }

  return null;
};

export default ProjectEntry;

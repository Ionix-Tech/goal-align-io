import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProjectDetail from "./ProjectDetail";
import { A3ReviewView } from "@/components/a3-review/A3ReviewView";

/**
 * Entry router for /projects/:id
 * Decides whether to redirect to A3 wizard, show A3ReviewView, or show ProjectDetail
 */
const ProjectEntry = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'detail' | 'a3-review' | null>(null);

  useEffect(() => {
    const checkProjectType = async () => {
      if (!id) {
        setViewType('detail');
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
          setViewType('detail');
          setLoading(false);
          return;
        }

        // If it's a project in draft status, redirect to A3 wizard
        if (project.initiative_type === "project" && project.status === "draft") {
          navigate(`/projects/${id}/a3`, { replace: true });
          return;
        }

        // If it's a project in review or approved status, show A3ReviewView
        if (project.initiative_type === "project" && (project.status === "review" || project.status === "approved")) {
          setViewType('a3-review');
          setLoading(false);
          return;
        }

        // Otherwise, show ProjectDetail (ideas, archived, etc.)
        setViewType('detail');
        setLoading(false);
      } catch (err) {
        console.error("Error checking project type:", err);
        setViewType('detail');
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

  if (viewType === 'a3-review') {
    return <A3ReviewView />;
  }

  if (viewType === 'detail') {
    return <ProjectDetail />;
  }

  return null;
};

export default ProjectEntry;

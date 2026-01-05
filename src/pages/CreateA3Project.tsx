import { useParams } from "react-router-dom";
import { A3Wizard } from "@/components/a3-wizard/A3Wizard";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProjectDetails } from "@/hooks/useProjectDetails";

const CreateA3Project = () => {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProjectDetails(id || null);
  
  const breadcrumbLabel = id && project?.name 
    ? project.name 
    : "Novo Projeto A3";

  return (
    <AppLayout
      customBreadcrumbs={[
        { label: "Priorização", href: "/prioritization" },
        { label: breadcrumbLabel }
      ]}
    >
      <A3Wizard />
    </AppLayout>
  );
};

export default CreateA3Project;
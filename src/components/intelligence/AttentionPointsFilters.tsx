import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheses } from "@/hooks/useTheses";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";

interface AttentionPointsFiltersProps {
  selectedThesis: string;
  selectedProject: string;
  selectedAssignee: string;
  onThesisChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
}

const AttentionPointsFilters = ({
  selectedThesis,
  selectedProject,
  selectedAssignee,
  onThesisChange,
  onProjectChange,
  onAssigneeChange,
}: AttentionPointsFiltersProps) => {
  const { data: theses } = useTheses();
  const { data: projects } = useProjects();
  const { data: teamMembers } = useTeamMembers();

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <Select value={selectedThesis} onValueChange={onThesisChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Todos os Objetivos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Objetivos</SelectItem>
          {theses?.map((thesis) => (
            <SelectItem key={thesis.id} value={thesis.id}>
              {thesis.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedProject} onValueChange={onProjectChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Todos os Projetos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Projetos</SelectItem>
          {projects?.all?.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedAssignee} onValueChange={onAssigneeChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Todos os Responsáveis" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Responsáveis</SelectItem>
          {teamMembers?.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AttentionPointsFilters;

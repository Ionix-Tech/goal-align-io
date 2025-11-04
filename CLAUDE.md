# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

COMPASS is a project management and portfolio application built with React, TypeScript, Vite, and Supabase. It manages project workflows through different status stages (idea → draft → review → approved → archived) with role-based access control.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on http://localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development environment
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite with SWC plugin
- **UI Framework**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Drag & Drop**: @dnd-kit
- **Forms**: React Hook Form with Zod validation

## Architecture

### Routing Structure

The application uses React Router with protected routes:

- `/` - Landing page (Index)
- `/auth` - Authentication page
- `/quick-idea` - Quick project idea submission
- `/create-project` - Full project creation form
- `/projects/:id/structure` - Project structuring (uses CreateProject with mode="structure")
- `/prioritization` - Project prioritization view
- `/portfolio` - Portfolio dashboard
- `/theses` - Strategic theses management
- `/management` - Project management (Kanban board)
- `/intelligence` - Intelligence/analytics dashboard

All routes except `/` and `/auth` are wrapped with `ProtectedRoute` and `AppLayout` components.

### Authentication & Authorization

**Authentication**: Managed via Supabase Auth with email/password
- Custom hook: `useAuth()` in `src/hooks/useAuth.ts`
- Session persistence in localStorage
- Auto-refresh tokens enabled

**Role-Based Access Control**: Three roles defined in the database
- `ceo` - CEO/executive access
- `pmo_manager` - PMO manager access
- `project_member` - Project team member access

Custom hook: `useUserRole()` in `src/hooks/useUserRole.ts`

### Database Schema (Supabase)

**Core Tables**:
- `profiles` - User profiles with full_name, email, avatar_url
- `user_roles` - Role assignments (app_role enum)
- `projects` - Main projects table with status workflow
- `project_members` - Project team assignments
- `project_comments` - Comments on projects
- `project_edit_log` - Audit trail of project changes
- `project_indicators` - KPIs with current and target states
- `project_milestones` - Project milestones with completion tracking
- `notifications` - User notifications system

**Project Status Workflow** (enum: project_status):
- `idea` - Initial idea submission
- `draft` - Being detailed/structured
- `review` - Submitted for review
- `approved` - Approved by CEO
- `archived` - Archived/cancelled

**Strategic Pillars** (enum: strategic_pillar):
- `operational_efficiency`
- `sales_expansion`
- `new_business`

**Database Functions**:
- `has_role(_role, _user_id)` - Check if user has specific role
- `user_has_project_access(_project_id, _user_id)` - Verify project access

### Key Hooks

**Data Fetching**:
- `useProjects(filters)` - Fetch projects with optional filters (status, strategic_pillar, assigned_to, search). Returns `{ all, byStatus }` grouped by status.
- `useProjectDetails(projectId)` - Fetch single project with all relations
- `useNotifications()` - Fetch user notifications

**State & Actions**:
- `useProjectTransitions()` - Handle project status transitions with validation
  - `canTransition(fromStatus, toStatus, project)` - Validates if transition is allowed
  - `transition({ projectId, newStatus, comment })` - Performs status change

### Component Structure

**Layout**:
- `AppLayout` - Main application layout with sidebar and header
- `AppSidebar` - Navigation sidebar using shadcn/ui sidebar component
- `ProtectedRoute` - Authentication guard wrapper

**Project Components** (src/components/projects/):
- `KanbanBoard` - Drag-and-drop board using @dnd-kit
- `KanbanColumn` - Individual status columns
- `KanbanCard` - Project card display
- `SortableKanbanCard` - Draggable wrapper for KanbanCard
- `ProjectDrawer` - Side panel for project details
- `ProjectFilters` - Filter controls for projects
- `ProjectStatusBadge` - Status visualization
- `ProjectComments` - Comments section

**Notifications**:
- `NotificationBell` - Bell icon with unread count in header

### Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key

### Path Aliases

TypeScript path alias configured in vite.config.ts and tsconfig.json:
- `@/` maps to `./src/`

Example: `import { supabase } from '@/integrations/supabase/client'`

### Database Migrations

Migrations are located in `supabase/migrations/` and are timestamped. Apply them in order when setting up a new environment or use Supabase CLI to sync.

## Project Workflow Logic

**Status Transitions**: Transitions are role-based and validated through `useProjectTransitions()`:
- PMO managers can move projects from idea → draft → review
- CEOs can approve (review → approved) or archive projects
- Projects require indicators and milestones before certain transitions

**Kanban Drag & Drop**: Projects can be dragged between status columns. The `KanbanBoard` component:
1. Validates transitions using `canTransition()`
2. Shows error toast if transition not allowed
3. Updates database via `transition()` mutation
4. Optimistically updates UI via React Query

**Notifications**: Generated on key actions (status changes, assignments, comments) and displayed via `NotificationBell` component.

## Code Conventions

- **TypeScript**: Strict mode enabled, use explicit types
- **Database Types**: Auto-generated types in `src/integrations/supabase/types.ts` - DO NOT edit manually
- **Styling**: Use Tailwind utility classes, shadcn/ui components follow established patterns
- **State**: Prefer React Query for server state, local useState for UI state
- **Forms**: Use React Hook Form + Zod for validation

## Common Development Patterns

**Fetching Projects**:
```typescript
import { useProjects } from '@/hooks/useProjects';

const { data, isLoading } = useProjects({
  status: ['review', 'approved'],
  search: 'keyword'
});

// Access: data.all or data.byStatus.review
```

**Checking User Role**:
```typescript
import { useUserRole } from '@/hooks/useUserRole';

const { role, loading } = useUserRole();

if (role === 'ceo') {
  // CEO-specific logic
}
```

**Transitioning Project Status**:
```typescript
import { useProjectTransitions } from '@/hooks/useProjectTransitions';

const { canTransition, transition } = useProjectTransitions();

const validation = canTransition(currentStatus, newStatus, project);
if (validation.allowed) {
  transition({ projectId, newStatus, comment: 'Optional comment' });
}
```

## Important Notes

- **Route Order**: Custom routes MUST be defined before the catch-all `*` route in App.tsx
- **Auth State**: The `useAuth()` hook sets up the auth listener before checking session to avoid race conditions
- **Supabase Client**: Single instance exported from `src/integrations/supabase/client.ts`
- **shadcn/ui**: Components are copied into `src/components/ui/` and can be customized
- **Lovable Integration**: Project is managed via Lovable platform; changes can be made locally or via Lovable UI

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      milestone_date_history: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          milestone_id: string
          new_date: string | null
          old_date: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          milestone_id: string
          new_date?: string | null
          old_date?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          milestone_id?: string
          new_date?: string | null
          old_date?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_date_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_date_history_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          project_id: string | null
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          project_id?: string | null
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          project_id?: string | null
          read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          project_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          project_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          project_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_edit_log: {
        Row: {
          edited_at: string | null
          edited_by: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          project_id: string
        }
        Insert: {
          edited_at?: string | null
          edited_by: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id: string
        }
        Update: {
          edited_at?: string | null
          edited_by?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_edit_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_health_status: {
        Row: {
          health_status: string
          id: string
          project_id: string
          reason: string | null
          reported_at: string
          reported_by: string
          resolved_at: string | null
        }
        Insert: {
          health_status: string
          id?: string
          project_id: string
          reason?: string | null
          reported_at?: string
          reported_by: string
          resolved_at?: string | null
        }
        Update: {
          health_status?: string
          id?: string
          project_id?: string
          reason?: string | null
          reported_at?: string
          reported_by?: string
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_health_status_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_health_status_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_indicator_updates: {
        Row: {
          created_at: string
          id: string
          indicator_id: string
          measured_value: string
          measurement_date: string
          notes: string | null
          progress_percentage: number
          updated_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          indicator_id: string
          measured_value: string
          measurement_date: string
          notes?: string | null
          progress_percentage?: number
          updated_by: string
        }
        Update: {
          created_at?: string
          id?: string
          indicator_id?: string
          measured_value?: string
          measurement_date?: string
          notes?: string | null
          progress_percentage?: number
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_indicator_updates_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "project_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_indicator_updates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_indicators: {
        Row: {
          created_at: string | null
          current_state: string
          id: string
          name: string
          project_id: string
          target_state: string
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          current_state: string
          id?: string
          name?: string
          project_id: string
          target_state: string
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          current_state?: string
          id?: string
          name?: string
          project_id?: string
          target_state?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_indicators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          added_at: string | null
          added_by: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestone_updates: {
        Row: {
          id: string
          is_critical: boolean
          milestone_id: string
          notes: string | null
          progress_percentage: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          id?: string
          is_critical?: boolean
          milestone_id: string
          notes?: string | null
          progress_percentage: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          id?: string
          is_critical?: boolean
          milestone_id?: string
          notes?: string | null
          progress_percentage?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestone_updates_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestone_updates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          milestone_type: Database["public"]["Enums"]["milestone_type"] | null
          project_id: string
          target_date: string
          title: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_type?: Database["public"]["Enums"]["milestone_type"] | null
          project_id: string
          target_date: string
          title: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_type?: Database["public"]["Enums"]["milestone_type"] | null
          project_id?: string
          target_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_requirements: {
        Row: {
          code: string
          created_at: string
          current_value: number | null
          description: string
          display_order: number
          id: string
          indicator_name: string | null
          project_id: string
          target_value: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_value?: number | null
          description: string
          display_order?: number
          id?: string
          indicator_name?: string | null
          project_id: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_value?: number | null
          description?: string
          display_order?: number
          id?: string
          indicator_name?: string | null
          project_id?: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_situations: {
        Row: {
          created_at: string
          created_by: string
          current_problem: string
          display_order: number
          id: string
          project_id: string
          target_goal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_problem: string
          display_order?: number
          id?: string
          project_id: string
          target_goal: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_problem?: string
          display_order?: number
          id?: string
          project_id?: string
          target_goal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_situations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_situations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_source_ideas: {
        Row: {
          added_at: string
          added_by: string
          id: string
          idea_id: string
          notes: string | null
          project_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          id?: string
          idea_id: string
          notes?: string | null
          project_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          id?: string
          idea_id?: string
          notes?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_source_ideas_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_source_ideas_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_source_ideas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_strategic_kpis: {
        Row: {
          created_at: string | null
          id: string
          kpi_id: string
          kpi_name: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kpi_id: string
          kpi_name: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kpi_id?: string
          kpi_name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_strategic_kpis_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "thesis_kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_strategic_kpis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          indicator_id: string | null
          link_url: string | null
          milestone_id: string | null
          priority: string
          project_id: string
          start_date: string | null
          status: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          indicator_id?: string | null
          link_url?: string | null
          milestone_id?: string | null
          priority?: string
          project_id: string
          start_date?: string | null
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          indicator_id?: string | null
          link_url?: string | null
          milestone_id?: string | null
          priority?: string
          project_id?: string
          start_date?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "project_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_weekly_updates: {
        Row: {
          challenges: string | null
          health_status: string
          id: string
          key_metrics: Json | null
          next_steps: string | null
          progress_summary: string
          project_id: string
          submitted_at: string
          submitted_by: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          challenges?: string | null
          health_status: string
          id?: string
          key_metrics?: Json | null
          next_steps?: string | null
          progress_summary: string
          project_id: string
          submitted_at?: string
          submitted_by: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          challenges?: string | null
          health_status?: string
          id?: string
          key_metrics?: Json | null
          next_steps?: string | null
          progress_summary?: string
          project_id?: string
          submitted_at?: string
          submitted_by?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_weekly_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_weekly_updates_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_why_links: {
        Row: {
          created_at: string
          id: string
          label: string | null
          project_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          project_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          project_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_why_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          category: Database["public"]["Enums"]["project_category"] | null
          context: string | null
          created_at: string | null
          created_by: string
          current_situation_description: string | null
          current_step: number | null
          description: string | null
          how: string | null
          how_much: string | null
          id: string
          initiative_type: Database["public"]["Enums"]["initiative_type"]
          name: string
          objective: string | null
          requirements: string | null
          source_idea_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          strategic_indicator: string | null
          strategic_pillar:
            | Database["public"]["Enums"]["strategic_pillar"]
            | null
          submitted_for_review_at: string | null
          target_situation_description: string | null
          thesis_id: string | null
          updated_at: string | null
          what: string | null
          when_end: string | null
          when_start: string | null
          where_location: string | null
          who: string | null
          why: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["project_category"] | null
          context?: string | null
          created_at?: string | null
          created_by: string
          current_situation_description?: string | null
          current_step?: number | null
          description?: string | null
          how?: string | null
          how_much?: string | null
          id?: string
          initiative_type?: Database["public"]["Enums"]["initiative_type"]
          name: string
          objective?: string | null
          requirements?: string | null
          source_idea_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          strategic_indicator?: string | null
          strategic_pillar?:
            | Database["public"]["Enums"]["strategic_pillar"]
            | null
          submitted_for_review_at?: string | null
          target_situation_description?: string | null
          thesis_id?: string | null
          updated_at?: string | null
          what?: string | null
          when_end?: string | null
          when_start?: string | null
          where_location?: string | null
          who?: string | null
          why?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["project_category"] | null
          context?: string | null
          created_at?: string | null
          created_by?: string
          current_situation_description?: string | null
          current_step?: number | null
          description?: string | null
          how?: string | null
          how_much?: string | null
          id?: string
          initiative_type?: Database["public"]["Enums"]["initiative_type"]
          name?: string
          objective?: string | null
          requirements?: string | null
          source_idea_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          strategic_indicator?: string | null
          strategic_pillar?:
            | Database["public"]["Enums"]["strategic_pillar"]
            | null
          submitted_for_review_at?: string | null
          target_situation_description?: string | null
          thesis_id?: string | null
          updated_at?: string | null
          what?: string | null
          when_end?: string | null
          when_start?: string | null
          where_location?: string | null
          who?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_source_idea_id_fkey"
            columns: ["source_idea_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_thesis_id_fkey"
            columns: ["thesis_id"]
            isOneToOne: false
            referencedRelation: "strategic_theses"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_indicator_links: {
        Row: {
          created_at: string
          id: string
          indicator_id: string
          requirement_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          indicator_id: string
          requirement_id: string
        }
        Update: {
          created_at?: string
          id?: string
          indicator_id?: string
          requirement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirement_indicator_links_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "project_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_indicator_links_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "project_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_task_links: {
        Row: {
          created_at: string
          id: string
          requirement_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requirement_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requirement_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirement_task_links_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "project_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_task_links_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      situation_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          situation_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          situation_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          situation_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "situation_attachments_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "project_situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situation_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      situation_indicators: {
        Row: {
          created_at: string
          current_value: number
          display_order: number
          id: string
          name: string
          situation_id: string
          target_value: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value: number
          display_order?: number
          id?: string
          name: string
          situation_id: string
          target_value: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          display_order?: number
          id?: string
          name?: string
          situation_id?: string
          target_value?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "situation_indicators_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "project_situations"
            referencedColumns: ["id"]
          },
        ]
      }
      situation_tasks: {
        Row: {
          created_at: string
          id: string
          situation_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          situation_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          situation_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "situation_tasks_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "project_situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situation_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_pillars: {
        Row: {
          color_class: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          pillar_type: Database["public"]["Enums"]["pillar_type"]
        }
        Insert: {
          color_class?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pillar_type: Database["public"]["Enums"]["pillar_type"]
        }
        Update: {
          color_class?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pillar_type?: Database["public"]["Enums"]["pillar_type"]
        }
        Relationships: []
      }
      strategic_theses: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          is_archived: boolean | null
          name: string
          objective: string
          period_end: string
          period_start: string
          pillar_id: string | null
          thesis_type: Database["public"]["Enums"]["thesis_type"]
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          name: string
          objective: string
          period_end: string
          period_start: string
          pillar_id?: string | null
          thesis_type: Database["public"]["Enums"]["thesis_type"]
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          name?: string
          objective?: string
          period_end?: string
          period_start?: string
          pillar_id?: string | null
          thesis_type?: Database["public"]["Enums"]["thesis_type"]
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategic_theses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_theses_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "strategic_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      task_date_history: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_date: string | null
          old_date: string | null
          reason: string | null
          task_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          new_date?: string | null
          old_date?: string | null
          reason?: string | null
          task_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_date?: string | null
          old_date?: string | null
          reason?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_date_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_date_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_indicator_links: {
        Row: {
          created_at: string | null
          id: string
          indicator_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          indicator_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          indicator_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_indicator_links_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "project_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_indicator_links_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_status_history: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          task_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          task_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_status_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      thesis_kpi_measurements: {
        Row: {
          created_at: string
          id: string
          kpi_id: string
          measured_by: string
          measured_value: number
          measurement_date: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kpi_id: string
          measured_by: string
          measured_value: number
          measurement_date: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kpi_id?: string
          measured_by?: string
          measured_value?: number
          measurement_date?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thesis_kpi_measurements_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "thesis_kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thesis_kpi_measurements_measured_by_fkey"
            columns: ["measured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      thesis_kpis: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          target_value: number
          thesis_id: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          target_value: number
          thesis_id: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          target_value?: number
          thesis_id?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thesis_kpis_thesis_id_fkey"
            columns: ["thesis_id"]
            isOneToOne: false
            referencedRelation: "strategic_theses"
            referencedColumns: ["id"]
          },
        ]
      }
      thesis_template_fields: {
        Row: {
          created_at: string | null
          display_order: number | null
          field_key: string
          field_label: string
          field_type: string
          field_value: string | null
          id: string
          options: Json | null
          thesis_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          field_key: string
          field_label: string
          field_type: string
          field_value?: string | null
          id?: string
          options?: Json | null
          thesis_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          field_key?: string
          field_label?: string
          field_type?: string
          field_value?: string | null
          id?: string
          options?: Json | null
          thesis_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thesis_template_fields_thesis_id_fkey"
            columns: ["thesis_id"]
            isOneToOne: false
            referencedRelation: "strategic_theses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_project_access: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "ceo" | "pmo_manager" | "project_member"
      initiative_type: "idea" | "project" | "action_plan"
      milestone_type: "decolagem" | "voo" | "escala"
      pillar_type: "corpo" | "alma" | "mente"
      project_category:
        | "productivity"
        | "safety"
        | "customer"
        | "market"
        | "culture_team"
        | "diretoria"
        | "gestao_pessoas"
        | "administrativo"
        | "comercial"
        | "industrial"
        | "qualidade"
        | "engenharia"
        | "logistica"
        | "compras"
        | "ti"
        | "financeiro"
        | "administrativo_financas"
        | "operacoes"
        | "centro_inteligencia"
        | "business_design"
      project_status:
        | "idea"
        | "draft"
        | "review"
        | "approved"
        | "archived"
        | "completed"
      strategic_pillar:
        | "operational_efficiency"
        | "sales_expansion"
        | "new_business"
      thesis_type:
        | "operational_efficiency"
        | "sales_expansion"
        | "new_business"
        | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ceo", "pmo_manager", "project_member"],
      initiative_type: ["idea", "project", "action_plan"],
      milestone_type: ["decolagem", "voo", "escala"],
      pillar_type: ["corpo", "alma", "mente"],
      project_category: [
        "productivity",
        "safety",
        "customer",
        "market",
        "culture_team",
        "diretoria",
        "gestao_pessoas",
        "administrativo",
        "comercial",
        "industrial",
        "qualidade",
        "engenharia",
        "logistica",
        "compras",
        "ti",
        "financeiro",
        "administrativo_financas",
        "operacoes",
        "centro_inteligencia",
        "business_design",
      ],
      project_status: [
        "idea",
        "draft",
        "review",
        "approved",
        "archived",
        "completed",
      ],
      strategic_pillar: [
        "operational_efficiency",
        "sales_expansion",
        "new_business",
      ],
      thesis_type: [
        "operational_efficiency",
        "sales_expansion",
        "new_business",
        "custom",
      ],
    },
  },
} as const

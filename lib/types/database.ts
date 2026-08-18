export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string;
          end_time: string;
          grade_level_id: string;
          id: string;
          start_time: string;
          status: Database["public"]["Enums"]["booking_status"];
          student_id: string;
          subject_id: string;
          topic: string;
          topic_category: Database["public"]["Enums"]["topic_category"];
          tutor_id: string;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          grade_level_id: string;
          id?: string;
          start_time: string;
          status?: Database["public"]["Enums"]["booking_status"];
          student_id: string;
          subject_id: string;
          topic: string;
          topic_category: Database["public"]["Enums"]["topic_category"];
          tutor_id: string;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          grade_level_id?: string;
          id?: string;
          start_time?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          student_id?: string;
          subject_id?: string;
          topic?: string;
          topic_category?: Database["public"]["Enums"]["topic_category"];
          tutor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_grade_level_id_fkey";
            columns: ["grade_level_id"];
            isOneToOne: false;
            referencedRelation: "grade_levels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "bookings_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "tutor_profiles";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "bookings_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "tutor_public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      grade_levels: {
        Row: {
          category: Database["public"]["Enums"]["grade_category"];
          created_at: string;
          id: string;
          is_active: boolean;
          label: string;
          sort_order: number;
        };
        Insert: {
          category: Database["public"]["Enums"]["grade_category"];
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label: string;
          sort_order?: number;
        };
        Update: {
          category?: Database["public"]["Enums"]["grade_category"];
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["account_status"];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          role: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["account_status"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["account_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          created_at: string;
          grade_level_id: string | null;
          guardian_consent: boolean;
          guardian_consent_at: string | null;
          guardian_email: string | null;
          guardian_name: string | null;
          profile_id: string;
          school: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          grade_level_id?: string | null;
          guardian_consent?: boolean;
          guardian_consent_at?: string | null;
          guardian_email?: string | null;
          guardian_name?: string | null;
          profile_id: string;
          school?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          grade_level_id?: string | null;
          guardian_consent?: boolean;
          guardian_consent_at?: string | null;
          guardian_email?: string | null;
          guardian_name?: string | null;
          profile_id?: string;
          school?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_grade_level_id_fkey";
            columns: ["grade_level_id"];
            isOneToOne: false;
            referencedRelation: "grade_levels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          category: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          label: string;
          sort_order: number;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label: string;
          sort_order?: number;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      tutor_availability: {
        Row: {
          created_at: string;
          end_time: string;
          id: string;
          start_time: string;
          tutor_id: string;
          weekday: number;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          id?: string;
          start_time: string;
          tutor_id: string;
          weekday: number;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          id?: string;
          start_time?: string;
          tutor_id?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tutor_availability_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "tutor_profiles";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "tutor_availability_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "tutor_public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tutor_availability_exceptions: {
        Row: {
          created_at: string;
          exception_date: string;
          id: string;
          reason: string | null;
          tutor_id: string;
        };
        Insert: {
          created_at?: string;
          exception_date: string;
          id?: string;
          reason?: string | null;
          tutor_id: string;
        };
        Update: {
          created_at?: string;
          exception_date?: string;
          id?: string;
          reason?: string | null;
          tutor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tutor_availability_exceptions_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "tutor_profiles";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "tutor_availability_exceptions_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "tutor_public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tutor_grade_levels: {
        Row: {
          created_at: string;
          grade_level_id: string;
          tutor_id: string;
        };
        Insert: {
          created_at?: string;
          grade_level_id: string;
          tutor_id: string;
        };
        Update: {
          created_at?: string;
          grade_level_id?: string;
          tutor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tutor_grade_levels_grade_level_id_fkey";
            columns: ["grade_level_id"];
            isOneToOne: false;
            referencedRelation: "grade_levels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tutor_grade_levels_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "tutor_profiles";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "tutor_grade_levels_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "tutor_public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tutor_profiles: {
        Row: {
          application_status: Database["public"]["Enums"]["tutor_application_status"];
          application_submitted_at: string | null;
          bio: string | null;
          created_at: string;
          date_of_birth: string | null;
          education_status: string | null;
          languages: string[];
          motivation: string | null;
          phone: string | null;
          photo_url: string | null;
          prior_experience: string | null;
          profile_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          teaching_style_tags: string[];
          updated_at: string;
        };
        Insert: {
          application_status?: Database["public"]["Enums"]["tutor_application_status"];
          application_submitted_at?: string | null;
          bio?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          education_status?: string | null;
          languages?: string[];
          motivation?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          prior_experience?: string | null;
          profile_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          teaching_style_tags?: string[];
          updated_at?: string;
        };
        Update: {
          application_status?: Database["public"]["Enums"]["tutor_application_status"];
          application_submitted_at?: string | null;
          bio?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          education_status?: string | null;
          languages?: string[];
          motivation?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          prior_experience?: string | null;
          profile_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          teaching_style_tags?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tutor_profiles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tutor_profiles_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tutor_subjects: {
        Row: {
          created_at: string;
          subject_id: string;
          tutor_id: string;
        };
        Insert: {
          created_at?: string;
          subject_id: string;
          tutor_id: string;
        };
        Update: {
          created_at?: string;
          subject_id?: string;
          tutor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tutor_subjects_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tutor_subjects_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "tutor_profiles";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "tutor_subjects_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "tutor_public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      tutor_public_profiles: {
        Row: {
          bio: string | null;
          first_name: string | null;
          grade_level_ids: string[] | null;
          grade_level_labels: string[] | null;
          id: string | null;
          languages: string[] | null;
          last_initial: string | null;
          photo_url: string | null;
          subject_ids: string[] | null;
          subject_labels: string[] | null;
          teaching_style_tags: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "tutor_profiles_profile_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      book_tutor_session: {
        Args: {
          p_grade_level_id: string;
          p_start_time: string;
          p_subject_id: string;
          p_topic: string;
          p_topic_category: Database["public"]["Enums"]["topic_category"];
          p_tutor_id: string;
        };
        Returns: {
          created_at: string;
          end_time: string;
          grade_level_id: string;
          id: string;
          start_time: string;
          status: Database["public"]["Enums"]["booking_status"];
          student_id: string;
          subject_id: string;
          topic: string;
          topic_category: Database["public"]["Enums"]["topic_category"];
          tutor_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "bookings";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      complete_onboarding: {
        Args: {
          p_first_name: string;
          p_last_name: string;
          p_role: Database["public"]["Enums"]["user_role"];
          p_timezone: string;
        };
        Returns: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["account_status"];
          timezone: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_tutor_available_slots: {
        Args: {
          p_range_end: string;
          p_range_start: string;
          p_tutor_id: string;
        };
        Returns: {
          slot_end: string;
          slot_start: string;
        }[];
      };
      get_tutor_public_available_slots: {
        Args: {
          p_range_end: string;
          p_range_start: string;
          p_tutor_id: string;
        };
        Returns: {
          slot_end: string;
          slot_start: string;
        }[];
      };
      submit_tutor_application: {
        Args: {
          p_bio: string;
          p_date_of_birth: string;
          p_education_status: string;
          p_grade_level_ids: string[];
          p_languages: string[];
          p_motivation: string;
          p_phone: string;
          p_photo_url: string;
          p_prior_experience: string;
          p_subject_ids: string[];
          p_teaching_style_tags: string[];
        };
        Returns: {
          application_status: Database["public"]["Enums"]["tutor_application_status"];
          application_submitted_at: string | null;
          bio: string | null;
          created_at: string;
          date_of_birth: string | null;
          education_status: string | null;
          languages: string[];
          motivation: string | null;
          phone: string | null;
          photo_url: string | null;
          prior_experience: string | null;
          profile_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          teaching_style_tags: string[];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "tutor_profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      account_status: "active" | "suspended" | "deactivated";
      booking_status: "confirmed" | "completed" | "no_show" | "canceled";
      grade_category: "elementary" | "middle" | "high";
      topic_category:
        | "homework"
        | "classwork"
        | "general_improvement"
        | "upcoming_test"
        | "organization_curriculum"
        | "other";
      tutor_application_status:
        | "pending"
        | "approved"
        | "rejected"
        | "inactive"
        | "suspended";
      user_role: "student" | "tutor" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["active", "suspended", "deactivated"],
      booking_status: ["confirmed", "completed", "no_show", "canceled"],
      grade_category: ["elementary", "middle", "high"],
      topic_category: [
        "homework",
        "classwork",
        "general_improvement",
        "upcoming_test",
        "organization_curriculum",
        "other",
      ],
      tutor_application_status: [
        "pending",
        "approved",
        "rejected",
        "inactive",
        "suspended",
      ],
      user_role: ["student", "tutor", "admin"],
    },
  },
} as const;

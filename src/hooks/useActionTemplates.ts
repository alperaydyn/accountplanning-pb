import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActionTemplateField {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'currency' | 'date' | 'select';
  field_options: string[] | null;
  display_order: number;
  is_required: boolean;
}

export interface ActionTemplate {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  display_order: number;
  fields: ActionTemplateField[];
}

export const useActionTemplates = (productId?: string) => {
  return useQuery({
    queryKey: ['action-templates', productId],
    queryFn: async () => {
      // Build query based on whether we have a productId filter
      let query = supabase
        .from('action_templates')
        .select(`
          id,
          product_id,
          name,
          description,
          display_order
        `)
        .order('display_order', { ascending: true });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data: templates, error: templatesError } = await query;

      if (templatesError) throw templatesError;
      if (!templates || templates.length === 0) return [];

      // Fetch all fields for these templates
      const templateIds = templates.map(t => t.id);
      const { data: fields, error: fieldsError } = await supabase
        .from('action_template_fields')
        .select('*')
        .in('action_template_id', templateIds)
        .order('display_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      // Group fields by template
      const fieldsByTemplate = (fields || []).reduce((acc, field) => {
        if (!acc[field.action_template_id]) {
          acc[field.action_template_id] = [];
        }
        acc[field.action_template_id].push({
          id: field.id,
          field_name: field.field_name,
          field_type: field.field_type as ActionTemplateField['field_type'],
          field_options: field.field_options,
          display_order: field.display_order,
          is_required: field.is_required,
        });
        return acc;
      }, {} as Record<string, ActionTemplateField[]>);

      // Combine templates with their fields
      return templates.map(template => ({
        ...template,
        fields: fieldsByTemplate[template.id] || [],
      })) as ActionTemplate[];
    },
    enabled: true,
  });
};

export const useAllActionTemplates = () => {
  return useQuery({
    queryKey: ['action-templates-all'],
    queryFn: async () => {
      const { data: templates, error: templatesError } = await supabase
        .from('action_templates')
        .select(`
          id,
          product_id,
          name,
          description,
          display_order
        `)
        .order('display_order', { ascending: true });

      if (templatesError) throw templatesError;
      if (!templates || templates.length === 0) return [];

      // Fetch all fields
      const { data: fields, error: fieldsError } = await supabase
        .from('action_template_fields')
        .select('*')
        .order('display_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      // Group fields by template
      const fieldsByTemplate = (fields || []).reduce((acc, field) => {
        if (!acc[field.action_template_id]) {
          acc[field.action_template_id] = [];
        }
        acc[field.action_template_id].push({
          id: field.id,
          field_name: field.field_name,
          field_type: field.field_type as ActionTemplateField['field_type'],
          field_options: field.field_options,
          display_order: field.display_order,
          is_required: field.is_required,
        });
        return acc;
      }, {} as Record<string, ActionTemplateField[]>);

      // Combine templates with their fields
      return templates.map(template => ({
        ...template,
        fields: fieldsByTemplate[template.id] || [],
      })) as ActionTemplate[];
    },
  });
};

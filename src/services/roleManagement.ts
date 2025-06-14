
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type UserRoleInsert = Database['public']['Tables']['user_roles']['Insert'];

export interface RoleAssignmentResult {
  success: boolean;
  error?: Error;
  roleId?: string;
}

export const assignUserRole = async (
  userId: string,
  role: AppRole,
  organizationId?: string
): Promise<RoleAssignmentResult> => {
  try {
    // Validate role constraints
    if (role === 'SUPER_ADMIN' && organizationId) {
      throw new Error('SUPER_ADMIN role cannot be assigned to a specific organization');
    }
    
    if (role !== 'SUPER_ADMIN' && !organizationId) {
      throw new Error('Non-SUPER_ADMIN roles must be assigned to a specific organization');
    }

    const roleData: UserRoleInsert = {
      user_id: userId,
      role: role,
      organization_id: role === 'SUPER_ADMIN' ? null : organizationId
    };

    const { data, error } = await supabase
      .from('user_roles')
      .insert(roleData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, roleId: data.id };
  } catch (error) {
    console.error('Error assigning user role:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

export const removeUserRole = async (
  userId: string,
  role: AppRole,
  organizationId?: string
): Promise<RoleAssignmentResult> => {
  try {
    let query = supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (role === 'SUPER_ADMIN') {
      query = query.is('organization_id', null);
    } else {
      query = query.eq('organization_id', organizationId);
    }

    const { error } = await query;

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing user role:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

export const getUserRoles = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true, roles: data || [] };
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)),
      roles: []
    };
  }
};

export const getOrganizationUsers = async (organizationId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        profiles (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return { success: true, users: data || [] };
  } catch (error) {
    console.error('Error fetching organization users:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)),
      users: []
    };
  }
};

export const promoteToOrganizationAdmin = async (
  userId: string,
  organizationId: string
): Promise<RoleAssignmentResult> => {
  try {
    // Remove existing roles in this organization first
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    // Assign ORGANIZATION_ADMIN role
    return await assignUserRole(userId, 'ORGANIZATION_ADMIN', organizationId);
  } catch (error) {
    console.error('Error promoting to organization admin:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

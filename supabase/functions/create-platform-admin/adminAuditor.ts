
// Audit log writing
export async function logAuditEvent(supabase: any, { user_id, email, role, environment, created_by, ip_address, correlation_id }: any) {
  await supabase.from('audit_logs').insert({
    user_id,
    action: 'PLATFORM_ADMIN_CREATED',
    resource_type: 'USER_ROLE',
    resource_id: user_id,
    details: { email, role, environment, created_by, correlation_id },
    ip_address,
  });
}

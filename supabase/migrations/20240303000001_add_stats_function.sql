-- Create optimized stats aggregation function
-- This function calculates registration statistics in a single query
-- instead of fetching all data and filtering on the client side

CREATE OR REPLACE FUNCTION get_registration_stats()
RETURNS TABLE(
  total BIGINT,
  pending BIGINT,
  approved BIGINT,
  rejected BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as total,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'pending') as pending,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'approved') as approved,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND status = 'rejected') as rejected
  FROM registrations;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_registration_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_registration_stats() TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION get_registration_stats() IS 'Returns aggregated statistics for registration records, filtering out soft-deleted records';

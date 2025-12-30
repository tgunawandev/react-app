/**
 * Status utility functions
 * Handles snake_case to Title Case conversion for display
 */

/**
 * Convert snake_case status to Title Case for display
 * @param status - Status value in snake_case (e.g., "in_progress", "not_started")
 * @returns Formatted status text (e.g., "In Progress", "Not Started")
 */
export function formatStatus(status: string | undefined | null): string {
  if (!status) return ''

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

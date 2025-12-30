
export interface UnplannedVisitReason{
	name: string
	creation: string
	modified: string
	owner: string
	modified_by: string
	docstatus: 0 | 1 | 2
	parent?: string
	parentfield?: string
	parenttype?: string
	idx?: number
	/**	Reason : Data	*/
	reason: string
	/**	Description : Small Text - Optional description or example for this reason	*/
	description?: string
	/**	Active : Check	*/
	is_active?: 0 | 1
	/**	Display Order : Int - Lower numbers appear first in dropdown	*/
	display_order?: number
}

export interface Competitor{
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
	/**	Competitor Name : Data	*/
	competitor_name: string
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Description : Small Text	*/
	description?: string
	/**	Logo : Attach Image	*/
	logo?: string
}
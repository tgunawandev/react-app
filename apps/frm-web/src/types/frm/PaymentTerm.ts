
export interface PaymentTerm{
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
	/**	Term Name : Data	*/
	term_name: string
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Odoo ID : Int	*/
	odoo_id?: number
}
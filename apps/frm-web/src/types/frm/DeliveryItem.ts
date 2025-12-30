
export interface DeliveryItem{
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
	/**	Product : Link - Item	*/
	product?: string
	/**	Description : Text	*/
	description?: string
	/**	Demand : Float	*/
	demand?: number
	/**	Done : Float	*/
	quantity_done?: number
	/**	UOM : Link - Unit of Measure	*/
	uom?: string
	/**	Odoo ID : Int	*/
	odoo_id?: number
}
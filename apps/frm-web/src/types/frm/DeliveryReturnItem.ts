
export interface DeliveryReturnItem{
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
	product: string
	/**	Description : Text	*/
	description?: string
	/**	Quantity : Float	*/
	quantity: number
	/**	UOM : Data	*/
	uom?: string
	/**	Odoo Move ID : Int	*/
	odoo_id?: number
}
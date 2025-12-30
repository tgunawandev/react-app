
export interface InvoiceItem{
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
	/**	Quantity : Float	*/
	quantity?: number
	/**	UOM : Link - Unit of Measure	*/
	uom?: string
	/**	Unit Price : Currency	*/
	price_unit?: number
	/**	Subtotal : Currency	*/
	price_subtotal?: number
	/**	Taxes : Data	*/
	tax_ids?: string
	/**	Odoo ID : Int	*/
	odoo_id?: number
}
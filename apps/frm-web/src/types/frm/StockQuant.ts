
export interface StockQuant{
	name: number
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
	/**	Product Name : Data	*/
	product_name?: string
	/**	Location : Data	*/
	location?: string
	/**	Quantity : Float	*/
	quantity?: number
	/**	Reserved Quantity : Float	*/
	reserved_quantity?: number
	/**	Available Quantity : Float	*/
	available_quantity?: number
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
}
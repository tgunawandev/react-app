
export interface StockOnHand {
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
	/**	Location : Data	*/
	location?: string
	/**	Warehouse : Data	*/
	warehouse?: string
	/**	Quantity : Float	*/
	quantity?: number
	/**	Reserved : Float	*/
	reserved_quantity?: number
	/**	Available : Float	*/
	available_quantity?: number
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Sync Status : Data	*/
	odoo_sync_status?: string
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
}
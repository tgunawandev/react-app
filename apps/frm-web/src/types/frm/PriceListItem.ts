
export interface PriceListItem{
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
	/**	Pricelist : Link - Pricelist	*/
	pricelist: string
	/**	Item : Link - Item	*/
	item: string
	/**	Customer : Link - Customer - Customer-specific pricing (optional)	*/
	customer?: string
	/**	Fixed Price : Currency	*/
	fixed_price?: number
	/**	Min Quantity : Float	*/
	min_quantity?: number
	/**	Compute Price : Select	*/
	compute_price?: "fixed" | "percentage" | "formula"
	/**	Discount % : Float	*/
	percent_price?: number
	/**	Valid From : Datetime	*/
	date_start?: string
	/**	Valid Until : Datetime	*/
	date_end?: string
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Odoo Pricelist ID : Int - Odoo parent pricelist ID	*/
	odoo_pricelist_id?: number
	/**	Odoo Sync Status : Select	*/
	odoo_sync_status?: "Not Synced" | "Synced from Odoo" | "Updated from Odoo" | "Sync Error"
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
}
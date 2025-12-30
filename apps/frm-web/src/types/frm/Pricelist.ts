
export interface Pricelist{
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
	/**	Pricelist Name : Data	*/
	pricelist_name: string
	/**	Currency : Data	*/
	currency?: string
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Selling : Check	*/
	selling?: 0 | 1
	/**	Buying : Check	*/
	buying?: 0 | 1
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Odoo Sync Status : Select	*/
	odoo_sync_status?: "Not Synced" | "Synced from Odoo" | "Updated from Odoo" | "Sync Error"
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
}
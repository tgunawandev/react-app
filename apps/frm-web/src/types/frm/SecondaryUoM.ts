
export interface SecondaryUoM{
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
	/**	UoM Name : Data	*/
	uom_name: string
	/**	Code : Data	*/
	code: string
	/**	Conversion Factor : Float - How many base units are in one secondary unit (e.g., 24 = 1 CTN contains 24 Pieces)	*/
	factor: number
	/**	Base Unit of Measure : Data - Base unit (e.g., Pieces, Units)	*/
	base_uom?: string
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Odoo Base UoM ID : Int - Odoo uom.uom ID for the base unit	*/
	odoo_uom_id?: number
	/**	Sync Status : Data	*/
	odoo_sync_status?: string
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
}
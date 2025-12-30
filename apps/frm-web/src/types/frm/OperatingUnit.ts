
export interface OperatingUnit{
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
	/**	Operating Unit Name : Data	*/
	operating_unit_name: string
	/**	Code : Data	*/
	code?: string
	/**	Partner/Company : Data	*/
	partner?: string
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Default Warehouse : Data - Default warehouse name in Odoo for this operating unit (e.g., WH-JKT, WH-SBY)	*/
	default_warehouse?: string
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
}
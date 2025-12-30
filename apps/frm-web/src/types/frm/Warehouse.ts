
export interface Warehouse{
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
	/**	Warehouse Name : Data	*/
	warehouse_name: string
	/**	Code : Data	*/
	code?: string
	/**	Type : Select - Type of warehouse location	*/
	warehouse_type?: "main_wh" | "dc" | "transit" | "return"
	/**	Company : Data	*/
	company?: string
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Address : Small Text	*/
	address?: string
	/**	City : Data	*/
	city?: string
	/**	Latitude : Float	*/
	latitude?: number
	/**	Longitude : Float	*/
	longitude?: number
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Odoo Location Path : Data - Full location path from Odoo (e.g., WH/Stock/DC Jakarta)	*/
	odoo_location_path?: string
}
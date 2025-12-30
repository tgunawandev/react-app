
export interface Customer{
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
	/**	Customer Code : Data	*/
	customer_code: string
	/**	Customer Name : Data	*/
	customer_name: string
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Default Price List : Data	*/
	default_price_list?: string
	/**	Street : Data	*/
	street?: string
	/**	City : Data	*/
	city?: string
	/**	Phone : Data	*/
	phone?: string
	/**	Mobile : Data	*/
	mobile?: string
	/**	Email : Data	*/
	email?: string
	/**	Latitude : Float	*/
	gps_latitude?: number
	/**	Longitude : Float	*/
	gps_longitude?: number
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Odoo Name : Data - Partner name from Odoo	*/
	odoo_name?: string
	/**	Odoo State : Data - Partner state from Odoo (Active/Archived)	*/
	odoo_state?: string
	/**	Sync Status : Data	*/
	odoo_sync_status?: string
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
	/**	Customer Reference : Data - Reference code from Odoo (res.partner.ref)	*/
	customer_ref?: string
}

export interface Item{
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
	/**	Item Code : Data	*/
	item_code: string
	/**	Item Name : Data	*/
	item_name: string
	/**	Barcode : Data	*/
	barcode?: string
	/**	Category : Link - Product Category	*/
	product_category?: string
	/**	Unit of Measure : Link - Unit of Measure	*/
	uom?: string
	/**	Secondary UoM : Data - Secondary unit of measure for sales (e.g. CTN, BOX)	*/
	secondary_uom?: string
	/**	Secondary UoM Factor : Float - Conversion factor (e.g. 24 = 1 Secondary Unit contains 24 Primary Units)	*/
	secondary_uom_factor?: number
	/**	Description : Text Editor	*/
	description?: string
	/**	Sales Description : Text Editor	*/
	description_sale?: string
	/**	Product Image : Attach Image	*/
	image_1920?: string
	/**	Image URL : Data - Auto-generated image URL for API	*/
	image_url?: string
	/**	SFA Classification : Select	*/
	sfa_classification?: "" | "Fast Moving" | "Slow Moving" | "New Launch" | "Promotional"
	/**	Field Priority : Select	*/
	field_priority?: "" | "High" | "Medium" | "Low"
	/**	Promotional Eligible : Check	*/
	promotional_eligible?: 0 | 1
	/**	List Price : Currency	*/
	list_price?: number
	/**	Cost Price : Currency	*/
	standard_price?: number
	/**	Can be Sold : Check	*/
	sale_ok?: 0 | 1
	/**	Can be Purchased : Check	*/
	purchase_ok?: 0 | 1
	/**	Quantity On Hand : Float	*/
	qty_available?: number
	/**	Forecast Quantity : Float	*/
	virtual_available?: number
	/**	Quantity On Hand (Secondary UoM) : Float - Stock quantity in secondary unit of measure	*/
	secondary_qty_available?: number
	/**	Incoming : Float	*/
	incoming_qty?: number
	/**	Outgoing : Float	*/
	outgoing_qty?: number
	/**	Weight : Float	*/
	weight?: number
	/**	Volume : Float	*/
	volume?: number
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Odoo Name : Data - Product code or name from Odoo	*/
	odoo_name?: string
	/**	Odoo State : Data - Product state from Odoo (Active/Inactive)	*/
	odoo_state?: string
	/**	Template ID : Int	*/
	odoo_template_id?: number
	/**	Odoo Secondary UoM ID : Int	*/
	odoo_secondary_uom_id?: number
	/**	Sync Status : Data	*/
	odoo_sync_status?: string
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
}

export interface UnitofMeasure{
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
	/**	UOM Name : Data	*/
	uom_name: string
	/**	Category : Data	*/
	category?: string
	/**	Type : Select	*/
	uom_type?: "Reference" | "Smaller" | "Bigger"
	/**	Ratio : Float	*/
	ratio?: number
	/**	Rounding Precision : Float	*/
	rounding?: number
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Sync Status : Data	*/
	odoo_sync_status?: string
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
}
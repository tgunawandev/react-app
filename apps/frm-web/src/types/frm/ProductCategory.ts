
export interface ProductCategory{
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
	/**	Category Name : Data	*/
	category_name: string
	/**	Parent Category : Link - Product Category	*/
	parent_category?: string
	/**	Is Group : Check	*/
	is_group?: 0 | 1
	/**	Complete Name : Data	*/
	complete_name?: string
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Parent ID : Int	*/
	parent_id?: number
	/**	Sync Status : Data	*/
	odoo_sync_status?: string
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
	/**	Left : Int	*/
	lft?: number
	/**	Right : Int	*/
	rgt?: number
	/**	Old Parent : Link - Product Category	*/
	old_parent?: string
	/**	Parent Product Category : Link - Product Category	*/
	parent_product_category?: string
}
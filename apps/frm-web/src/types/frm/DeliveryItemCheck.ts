
export interface DeliveryItemCheck{
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
	/**	Delivery Order : Link - Delivery Order	*/
	delivery_order: string
	/**	Delivery Item Reference : Data - Reference to the specific delivery item line	*/
	delivery_item?: string
	/**	Delivery Assignment : Link - Delivery Assignment	*/
	delivery_assignment?: string
	/**	Product : Link - Item	*/
	product: string
	/**	Product Name : Data	*/
	product_name?: string
	/**	Expected Qty : Float	*/
	expected_qty: number
	/**	UOM : Link - Unit of Measure	*/
	expected_uom?: string
	/**	Verified Qty : Float	*/
	verified_qty?: number
	/**	Damaged Qty : Float - Quantity found damaged during check	*/
	damaged_qty?: number
	/**	Missing Qty : Float - Quantity missing or not found	*/
	missing_qty?: number
	/**	Check Type : Select	*/
	check_type: "loading" | "delivery" | "return"
	/**	Status : Select	*/
	check_status?: "pending" | "verified" | "partial" | "damaged" | "missing" | "rejected"
	/**	Checked By : Link - User	*/
	checked_by?: string
	/**	Checked At : Datetime	*/
	checked_at?: string
	/**	Notes : Small Text	*/
	notes?: string
	/**	Damage Description : Small Text - Describe any damage found	*/
	damage_description?: string
	/**	Damage Photos : Attach Image - Attach photos of damaged items	*/
	damage_photos?: string
}
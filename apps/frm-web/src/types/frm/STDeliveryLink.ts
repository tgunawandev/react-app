
export interface STDeliveryLink{
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
	/**	Customer : Data	*/
	customer_name?: string
	/**	Items : Int - Number of items for this delivery	*/
	item_count?: number
	/**	Status : Select	*/
	delivery_status?: "pending" | "ready" | "dispatched"
}
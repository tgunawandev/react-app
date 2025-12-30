
export interface RouteCustomer{
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
	/**	Customer : Link - Customer	*/
	customer: string
	/**	Customer Name : Data	*/
	customer_name?: string
	/**	City : Data	*/
	city?: string
	/**	Priority : Int - Delivery priority within route (1 = first)	*/
	priority?: number
}
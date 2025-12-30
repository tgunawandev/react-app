
export interface SalesOrderItem{
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
	/**	Item : Link - Item	*/
	item_code: string
	/**	Item Name : Data	*/
	item_name?: string
	/**	Quantity : Float	*/
	qty: number
	/**	UOM (Base) : Data	*/
	uom?: string
	/**	Qty (CTN) : Float - Quantity in secondary UOM (cartons/boxes)	*/
	secondary_qty?: number
	/**	UOM (Secondary) : Data	*/
	secondary_uom?: string
	/**	Rate : Currency - Price per secondary UOM if available, otherwise per base UOM	*/
	rate: number
	/**	Discount % : Percent	*/
	discount?: number
	/**	Amount : Currency	*/
	amount?: number
}

export interface StockTransferItem{
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
	/**	Product : Link - Item	*/
	product: string
	/**	Product Name : Data	*/
	product_name?: string
	/**	Quantity : Float	*/
	quantity: number
	/**	Qty Loaded : Float - Quantity verified during loading check	*/
	quantity_loaded?: number
	/**	Qty Received : Float - Quantity received at destination DC	*/
	quantity_received?: number
	/**	UOM : Link - Unit of Measure	*/
	uom?: string
	/**	Delivery Order : Link - Delivery Order - The delivery order this item is part of	*/
	delivery_order?: string
	/**	Customer : Data - Customer name for this delivery	*/
	delivery_customer?: string
	/**	Odoo ID : Int	*/
	odoo_id?: number
}
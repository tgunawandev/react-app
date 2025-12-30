import { RouteCustomer } from './RouteCustomer'

export interface DeliveryRoute{
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
	/**	Route Name : Data	*/
	route_name: string
	/**	Route Code : Data	*/
	route_code?: string
	/**	Route Type : Select - direct: WH → Customer, via_dc: WH → DC → Customer	*/
	route_type: "direct" | "via_dc"
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Operating Unit : Link - Operating Unit	*/
	operating_unit?: string
	/**	Source Warehouse : Link - Warehouse - Main warehouse where goods originate	*/
	source_warehouse: string
	/**	DC Warehouse : Link - Warehouse - Distribution Center for via_dc routes	*/
	dc_warehouse?: string
	/**	Hub Driver : Link - User - Default hub driver for WH → DC transfers	*/
	hub_driver?: string
	/**	Hub Driver Name : Data	*/
	hub_driver_name?: string
	/**	Delivery Driver : Link - User - Default delivery driver for this route	*/
	delivery_driver?: string
	/**	Delivery Driver Name : Data	*/
	delivery_driver_name?: string
	/**	Monday : Check	*/
	delivery_monday?: 0 | 1
	/**	Tuesday : Check	*/
	delivery_tuesday?: 0 | 1
	/**	Wednesday : Check	*/
	delivery_wednesday?: 0 | 1
	/**	Thursday : Check	*/
	delivery_thursday?: 0 | 1
	/**	Friday : Check	*/
	delivery_friday?: 0 | 1
	/**	Saturday : Check	*/
	delivery_saturday?: 0 | 1
	/**	Sunday : Check	*/
	delivery_sunday?: 0 | 1
	/**	Customers : Table - Route Customer	*/
	customers?: RouteCustomer[]
	/**	Notes : Small Text	*/
	notes?: string
}
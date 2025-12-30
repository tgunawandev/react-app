import { SalesOrderItem } from './SalesOrderItem'

export interface SalesOrder{
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
	/**	Series : Select	*/
	naming_series: "SO-.YYYY.-" | "SO-SFA-.YYYY.-"
	/**	Customer : Link - Customer	*/
	customer: string
	/**	Customer Name : Data	*/
	customer_name?: string
	/**	Order Date : Date	*/
	order_date: string
	/**	Sales Visit : Link - Sales Visit	*/
	sales_visit?: string
	/**	Sales Team : Link - Sales Team	*/
	sales_team?: string
	/**	Operating Unit : Link - Operating Unit	*/
	operating_unit?: string
	/**	Warehouse : Data - Odoo warehouse name	*/
	warehouse?: string
	/**	Status : Select	*/
	status: "Draft" | "Submitted" | "Synced to Odoo" | "Sync Failed" | "Cancelled"
	/**	Shipping Address : Data - Delivery address from Odoo	*/
	partner_shipping_id?: string
	/**	Pricelist : Data - Pricelist name from Odoo	*/
	pricelist?: string
	/**	Commitment Date : Date - Delivery commitment date	*/
	commitment_date?: string
	/**	Validity Date : Date - Quotation validity date	*/
	validity_date?: string
	/**	Odoo State : Select - State from Odoo sale.order	*/
	state?: "draft" | "sent" | "sale" | "done" | "cancel"
	/**	Invoice Status : Select	*/
	invoice_status?: "no" | "to invoice" | "invoiced"
	/**	Delivery Status : Select	*/
	delivery_status?: "no" | "to deliver" | "partially delivered" | "fully delivered"
	/**	Invoice Count : Int - Number of invoices created	*/
	invoice_count?: number
	/**	Delivery Count : Int - Number of deliveries created	*/
	delivery_count?: number
	/**	Items : Table - Sales Order Item	*/
	items?: SalesOrderItem[]
	/**	Total Quantity : Float	*/
	total_qty?: number
	/**	Include Tax (PPN 11%) : Check - Include PPN 11% tax in order total	*/
	include_tax?: 0 | 1
	/**	Amount Untaxed : Currency	*/
	amount_untaxed?: number
	/**	Tax Amount : Currency	*/
	amount_tax?: number
	/**	Total Amount : Currency	*/
	amount_total?: number
	/**	Odoo Sale Order ID : Int	*/
	odoo_id?: number
	/**	Odoo SO Number : Data - Original Odoo sales order number (e.g. S103468)	*/
	odoo_name?: string
	/**	Client Order Reference : Data - UUID reference from mobile app	*/
	client_order_ref?: string
	/**	Sync Status : Select	*/
	odoo_sync_status?: "Not Synced" | "Pending Sync" | "Synced to Odoo" | "Sync Error"
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
	/**	Sync Error Message : Text	*/
	sync_error_message?: string
	/**	Check-in Latitude : Float	*/
	check_in_latitude?: number
	/**	Check-in Longitude : Float	*/
	check_in_longitude?: number
	/**	Photo Evidence : Attach Image	*/
	photo_evidence?: string
	/**	SR Signature : Signature	*/
	sr_signature?: any
}
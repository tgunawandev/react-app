import { DeliveryReturnItem } from './DeliveryReturnItem'
import { DeliveryReturnPhoto } from './DeliveryReturnPhoto'

export interface DeliveryReturn{
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
	naming_series: "RET-.YYYY.-" | "RET-SFA-.YYYY.-"
	/**	Customer : Link - Customer	*/
	customer: string
	/**	Customer Name : Data	*/
	customer_name?: string
	/**	Return Date : Date	*/
	return_date: string
	/**	Original Delivery : Link - Delivery Order	*/
	delivery_order?: string
	/**	Sales Order : Link - Sales Order	*/
	sales_order?: string
	/**	Return Reason : Select	*/
	reason?: "Damaged" | "Defective" | "Expired" | "Wrong Product" | "Customer Dissatisfaction" | "Other"
	/**	State : Select	*/
	state?: "Draft" | "Submitted" | "In Transit" | "Received" | "Cancelled"
	/**	Notes : Text	*/
	notes?: string
	/**	Items : Table - Delivery Return Item	*/
	items?: DeliveryReturnItem[]
	/**	Photos : Table - Delivery Return Photo	*/
	photos?: DeliveryReturnPhoto[]
	/**	Odoo Return Picking ID : Int	*/
	odoo_id?: number
	/**	Odoo Return Number : Data - Odoo return picking number	*/
	odoo_name?: string
	/**	Odoo State : Data - Odoo picking state (draft/waiting/confirmed/done/cancel)	*/
	odoo_state?: string
	/**	Sync Status : Select	*/
	odoo_sync_status?: "Not Synced" | "Pending Sync" | "Synced to Odoo" | "Synced from Odoo" | "Sync Error"
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
	/**	Sync Error Message : Text	*/
	sync_error_message?: string
}